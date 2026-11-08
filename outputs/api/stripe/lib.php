<?php
declare(strict_types=1);

// Credentials and payment records live outside public_html and outside Git.
function payment_directory(): string {
    return PHP_SAPI === 'cli' && getenv('OUTLAND_PAYMENT_DIRECTORY')
        ? getenv('OUTLAND_PAYMENT_DIRECTORY') : dirname(__DIR__, 3) . '/private/outland-payments';
}
function payment_config(): array {
    $file = payment_directory() . '/config.json';
    return is_file($file) ? (json_decode(file_get_contents($file), true, 16, JSON_THROW_ON_ERROR) ?: []) : [];
}
function payments_enabled(array $config): bool {
    $mode = $config['mode'] ?? '';
    return ($config['enabled'] ?? false) === true
        && in_array($mode, ['test', 'live'], true)
        && preg_match('/^(?:sk|rk)_' . $mode . '_[A-Za-z0-9]+$/', $config['secret'] ?? '') === 1
        && str_starts_with($config['webhook_secret'] ?? '', 'whsec_');
}
function payment_db(): PDO {
    $directory = payment_directory();
    if (!is_dir($directory)) throw new RuntimeException('Payments are not configured.');
    $db = new PDO('sqlite:' . $directory . '/payments.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout=15000; PRAGMA journal_mode=WAL;');
    $db->exec('CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, reference TEXT NOT NULL,
        expedition TEXT NOT NULL, route TEXT NOT NULL, payment_type TEXT NOT NULL,
        amount INTEGER NOT NULL CHECK(amount >= 50), currency TEXT NOT NULL,
        email TEXT NOT NULL, mode TEXT NOT NULL, expires INTEGER NOT NULL,
        session_id TEXT UNIQUE, generation INTEGER NOT NULL DEFAULT 0, attempt_expires INTEGER,
        paid INTEGER NOT NULL DEFAULT 0, paid_at INTEGER, payment_intent TEXT);
        CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, received INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS rate_limits (bucket TEXT PRIMARY KEY, count INTEGER NOT NULL);');
    chmod($directory . '/payments.sqlite', 0600);
    if(!in_array('refunded',$db->query('PRAGMA table_info(requests)')->fetchAll(PDO::FETCH_COLUMN,1),true)) $db->exec('ALTER TABLE requests ADD COLUMN refunded INTEGER NOT NULL DEFAULT 0');
    return $db;
}
function stripe_request(array $config, string $resource, ?array $parameters = null, ?string $key = null): array {
    $curl = curl_init('https://api.stripe.com/v1/' . $resource);
    $headers = ['Authorization: Bearer ' . $config['secret'], 'Stripe-Version: 2026-10-28.endive'];
    if ($key !== null) $headers[] = 'Idempotency-Key: ' . $key;
    if ($parameters !== null) {
        $headers[] = 'Content-Type: application/x-www-form-urlencoded';
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($parameters));
    }
    curl_setopt_array($curl, [CURLOPT_HTTPHEADER => $headers, CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_TIMEOUT => 25, CURLOPT_PROTOCOLS => CURLPROTO_HTTPS]);
    $body = curl_exec($curl);
    $code = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    // Never pass Stripe error bodies (which can contain private data) to guests or logs.
    if ($body === false || $code < 200 || $code >= 300) throw new RuntimeException('Stripe is temporarily unavailable. Please contact Outland Guides before retrying.');
    $data = json_decode($body, true, 64, JSON_THROW_ON_ERROR);
    if (isset($data['livemode']) && $data['livemode'] !== ($config['mode'] === 'live')) throw new RuntimeException('Payment mode does not match.');
    return $data;
}
function find_payment(PDO $db, string $token, string $mode): array {
    if (!preg_match('/^[a-f0-9]{64}$/D', $token)) throw new InvalidArgumentException('Use the private payment link or code provided by Outland Guides.');
    $query = $db->prepare('SELECT * FROM requests WHERE token_hash = ? AND mode = ?');
    $query->execute([hash('sha256', $token), $mode]);
    $request = $query->fetch(PDO::FETCH_ASSOC);
    if (!$request) throw new InvalidArgumentException('Payment link not found. Please contact Outland Guides for your link.');
    return $request;
}
function public_payment(array $request): array {
    return array_intersect_key($request, array_flip(['reference', 'expedition', 'route', 'payment_type', 'amount', 'currency', 'expires', 'mode', 'paid']));
}
function verify_session(array $session, array $request): void {
    if (($session['metadata']['integration'] ?? '') !== 'outland-payments'
        || ($session['metadata']['request_id'] ?? '') !== $request['id']
        || ($session['id'] ?? '') !== $request['session_id']
        || ($session['mode'] ?? '') !== 'payment'
        || ($session['livemode'] ?? null) !== ($request['mode'] === 'live')
        || ($session['amount_total'] ?? null) !== (int)$request['amount']
        || ($session['currency'] ?? '') !== $request['currency']) {
        throw new RuntimeException('Payment could not be matched to this booking.');
    }
}
function record_paid(PDO $db, array $session, array $request): void {
    verify_session($session, $request);
    if (($session['payment_status'] ?? '') !== 'paid') return;
    $query = $db->prepare('UPDATE requests SET paid = 1, paid_at = COALESCE(paid_at, ?), payment_intent = ? WHERE id = ?');
    $query->execute([time(), $session['payment_intent'] ?? '', $request['id']]);
}
function webhook_verified(string $body, string $signature, string $secret, ?int $now = null): bool {
    $timestamp = null; $signatures = [];
    foreach (explode(',', $signature) as $part) {
        [$name, $value] = array_pad(explode('=', trim($part), 2), 2, '');
        if ($name === 't' && ctype_digit($value)) $timestamp = (int)$value;
        if ($name === 'v1') $signatures[] = $value;
    }
    if ($timestamp === null || abs(($now ?? time()) - $timestamp) > 300) return false;
    $expected = hash_hmac('sha256', $timestamp . '.' . $body, $secret);
    foreach ($signatures as $candidate) if (hash_equals($expected, $candidate)) return true;
    return false;
}
function create_payment_request(PDO $db, array $data, string $mode): array {
    $expeditions = ['Mount Kilimanjaro', 'Wildlife Safari', 'Volcán de Fuego', 'Mount Kilimanjaro + Wildlife Safari Add-On', 'Custom / Private Expedition'];
    $types = ['Deposit', 'Remaining balance', 'Full payment'];
    $routes = ['', 'Machame 6-Day', 'Machame 7-Day', 'Lemosho 6-Day', 'Lemosho 7-Day', 'Shared five-person cabin', 'Private two-person cabin', '3-Day Ngorongoro Safari', '4-Day Serengeti Safari'];
    if (!in_array($data['expedition'] ?? '', $expeditions, true)
        || !in_array($data['payment_type'] ?? '', $types, true)
        || !in_array($data['route'] ?? '', $routes, true)
        || !in_array($mode, ['test', 'live'], true)
        || !is_int($data['amount'] ?? null) || $data['amount'] < 50 || $data['amount'] > 10000000
        || !preg_match('/^[A-Za-z0-9][A-Za-z0-9 ._-]{2,79}$/D', $data['reference'] ?? '')
        || (isset($data['email']) && $data['email'] !== '' && !filter_var($data['email'], FILTER_VALIDATE_EMAIL))
        || !is_int($data['expires'] ?? null) || $data['expires'] < time() + 1800) {
        throw new InvalidArgumentException('Provide a valid booking, agreed USD amount, payment type, and expiry.');
    }
    $token = bin2hex(random_bytes(32)); $id = bin2hex(random_bytes(16));
    $query = $db->prepare('INSERT INTO requests (id,token_hash,reference,expedition,route,payment_type,amount,currency,email,mode,expires) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    $query->execute([$id,hash('sha256',$token),$data['reference'],$data['expedition'],$data['route'] ?? '',$data['payment_type'],$data['amount'],'usd',$data['email'] ?? '',$mode,$data['expires']]);
    return ['id' => $id, 'token' => $token, 'url' => 'https://outlandguides.com/payments#payment=' . $token];
}
