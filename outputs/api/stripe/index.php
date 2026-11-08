<?php
declare(strict_types=1);
ini_set('display_errors', '0');
require __DIR__ . '/lib.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
function reply(int $status, array $data): never {
    http_response_code($status); echo json_encode($data, JSON_UNESCAPED_SLASHES); exit;
}
try {
    $action = basename(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
    $method = $_SERVER['REQUEST_METHOD'];
    $config = payment_config();
    if ($action === 'config' && $method === 'GET') reply(200, ['configured' => payments_enabled($config), 'mode' => $config['mode'] ?? 'live', 'currency' => 'usd']);
    if ($method !== 'POST') reply(405, ['error' => 'Use the payment page to continue.']);
    if (!payments_enabled($config)) reply(503, ['error' => 'Online payments are being connected. Contact Outland Guides for help with your booking.']);
    if (($_SERVER['HTTPS'] ?? '') !== 'on' && ($_SERVER['SERVER_PORT'] ?? '') != 443) reply(400, ['error' => 'Use the secure HTTPS payment page.']);
    $raw = file_get_contents('php://input', false, null, 0, 262145);
    if (strlen($raw) > 262144) reply(413, ['error' => 'Request too large.']);
    $db = payment_db();
    if ($action === 'webhook') {
        if (!webhook_verified($raw, $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '', $config['webhook_secret'])) reply(400, ['error' => 'Invalid signature.']);
        $event = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
        if (($event['livemode'] ?? null) !== ($config['mode'] === 'live')) reply(400, ['error' => 'Invalid payment mode.']);
        if (!preg_match('/^evt_[A-Za-z0-9]+$/D', $event['id'] ?? '')) reply(400, ['error' => 'Invalid event.']);
        $db->exec('BEGIN IMMEDIATE');
        $query = $db->prepare('INSERT OR IGNORE INTO events(id,received) VALUES (?,?)'); $query->execute([$event['id'], time()]);
        $newEvent=$query->rowCount();
        if($newEvent && ($event['type']??'')==='charge.refunded') {
            $charge=$event['data']['object']??[];
            if(is_int($charge['amount_refunded']??null) && $charge['amount_refunded']>=0) {
                $update=$db->prepare('UPDATE requests SET refunded=MAX(refunded,?) WHERE payment_intent=? AND mode=? AND amount>=? AND paid=1');
                $update->execute([$charge['amount_refunded'],$charge['payment_intent']??'', $config['mode'],$charge['amount_refunded']]);
            }
        }
        if ($newEvent && in_array($event['type'] ?? '', ['checkout.session.completed','checkout.session.async_payment_succeeded'], true)) {
            $session = $event['data']['object'] ?? [];
            $query = $db->prepare('SELECT * FROM requests WHERE id = ?'); $query->execute([$session['metadata']['request_id'] ?? '']);
            $request = $query->fetch(PDO::FETCH_ASSOC);
            if ($request) record_paid($db, $session, $request);
        }
        $db->exec('COMMIT'); reply(200, ['received' => true]);
    }
    if (!in_array($action, ['request','checkout','status'], true)) reply(404, ['error' => 'Not found.']);
    if (!in_array($_SERVER['HTTP_ORIGIN'] ?? '', ['https://outlandguides.com','https://www.outlandguides.com'], true)) reply(403, ['error' => 'Open the Outland Guides payment page to continue.']);
    if (strlen($raw) > 4096) reply(413, ['error' => 'Request too large.']);
    $bucket = hash_hmac('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . ':' . intdiv(time(), 60), $config['webhook_secret']);
    $query = $db->prepare('INSERT INTO rate_limits(bucket,count) VALUES (?,1) ON CONFLICT(bucket) DO UPDATE SET count = count + 1 RETURNING count');
    $query->execute([$bucket]); $attempts = $query->fetchColumn(); $query->closeCursor();
    if ($attempts > 60) reply(429, ['error' => 'Please wait a minute before trying again.']);
    if (random_int(1,100) === 1) $db->exec('DELETE FROM rate_limits WHERE rowid < (SELECT MAX(rowid) - 10000 FROM rate_limits)');
    $data = json_decode($raw, true, 8, JSON_THROW_ON_ERROR);
    $request = find_payment($db, $data['token'] ?? '', $config['mode']);
    if ($action === 'status') {
        if (!$request['session_id'] || ($data['session_id'] ?? '') !== $request['session_id']) reply(400, ['error' => 'Payment could not be matched to this link.']);
        $session = stripe_request($config, 'checkout/sessions/' . rawurlencode($request['session_id']));
        record_paid($db, $session, $request);
        reply(200, ['paid' => $session['payment_status'] === 'paid', 'payment' => public_payment($request)]);
    }
    if (!$request['paid'] && $request['expires'] < time()) reply(410, ['error' => 'This payment link has expired. Contact Outland Guides for a new link.']);
    if ($action === 'request') reply(200, ['payment' => public_payment($request)]);
    // Serialize checkout creation per request. Repeated clicks reuse the same open session.
    $db->exec('BEGIN IMMEDIATE');
    $request = find_payment($db, $data['token'], $config['mode']);
    if ($request['paid']) { $db->exec('COMMIT'); reply(409, ['error' => 'This payment has already been received.']); }
    if ($request['expires'] < time() + 1800) { $db->exec('COMMIT'); reply(410, ['error' => 'This link is expiring soon. Contact Outland Guides to renew it.']); }
    if ($request['session_id']) {
        $session = stripe_request($config, 'checkout/sessions/' . rawurlencode($request['session_id']));
        verify_session($session, $request);
        if ($session['payment_status'] === 'paid') { record_paid($db,$session,$request); $db->exec('COMMIT'); reply(409,['error' => 'This payment has already been received.']); }
        if ($session['status'] === 'open') { $db->exec('COMMIT'); reply(200, ['url' => $session['url']]); }
        if ($session['status'] !== 'expired') { $db->exec('COMMIT'); reply(409, ['error' => 'This payment is processing. Contact Outland Guides before paying again.']); }
    }
    if (!$request['attempt_expires'] || (int)$request['attempt_expires'] <= time() || $request['session_id']) {
        $query = $db->prepare('UPDATE requests SET generation = generation + 1, attempt_expires = ?, session_id = NULL WHERE id = ?');
        $query->execute([min((int)$request['expires'], time()+3600), $request['id']]);
        // Save the attempt before contacting Stripe, so a network retry has exactly the same parameters.
        $db->exec('COMMIT'); $db->exec('BEGIN IMMEDIATE');
        $request = find_payment($db, $data['token'], $config['mode']);
        if ($request['paid']) { $db->exec('COMMIT'); reply(409, ['error' => 'This payment has already been received.']); }
        if ($request['session_id']) {
            $session = stripe_request($config,'checkout/sessions/'.rawurlencode($request['session_id']));
            verify_session($session,$request);
            if ($session['payment_status']==='paid') { record_paid($db,$session,$request); $db->exec('COMMIT'); reply(409,['error'=>'This payment has already been received.']); }
            if ($session['status']==='open') { $db->exec('COMMIT'); reply(200,['url'=>$session['url']]); }
            throw new RuntimeException('Checkout is processing.');
        }
    }
    $generation = (int)$request['generation'];
    $fragment = '#payment=' . $data['token'];
    $success='https://outlandguides.com/payments?session_id={CHECKOUT_SESSION_ID}'.$fragment;
    $cancel='https://outlandguides.com/payments?cancelled=1'.$fragment;
    if($db->query("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='bookings'")->fetchColumn()) {
        $lookup=$db->prepare('SELECT id FROM bookings WHERE reference=?');$lookup->execute([$request['reference']]);$bookingId=$lookup->fetchColumn();$lookup->closeCursor();
        if($bookingId){$success='https://outlandguides.com/account?booking='.$bookingId.'&session_id={CHECKOUT_SESSION_ID}';$cancel='https://outlandguides.com/account?booking='.$bookingId.'&cancelled=1';}
    }
    $session = stripe_request($config, 'checkout/sessions', [
        'mode' => 'payment', 'allowed_payment_method_types' => ['card'],
        'success_url' => $success,
        'cancel_url' => $cancel,
        'expires_at' => (int)$request['attempt_expires'],
        'client_reference_id' => $request['reference'],
        ...($request['email'] !== '' ? ['customer_email' => $request['email']] : []),
        'line_items' => [['quantity' => 1, 'price_data' => ['currency' => 'usd', 'unit_amount' => (int)$request['amount'],
            'product_data' => ['name' => ($config['mode'] === 'test' ? 'TEST: ' : '') . $request['expedition'] . ' — ' . $request['payment_type'],
                'description' => $request['reference'] . ($request['route'] ? ' · ' . $request['route'] : '')]]]],
        'metadata' => ['integration' => 'outland-payments','request_id' => $request['id']],
        'payment_intent_data' => ['metadata' => ['booking_reference' => $request['reference'],'payment_request' => $request['id']]],
    ], 'outland-' . $request['id'] . '-' . $generation);
    if (!str_starts_with($session['url'] ?? '', 'https://checkout.stripe.com/')) throw new RuntimeException('Invalid checkout response.');
    $query = $db->prepare('UPDATE requests SET session_id = ?, generation = ? WHERE id = ?');
    $query->execute([$session['id'], $generation, $request['id']]);
    $db->exec('COMMIT'); reply(200, ['url' => $session['url']]);
} catch (InvalidArgumentException | JsonException $error) {
    reply(400, ['error' => $error instanceof InvalidArgumentException ? $error->getMessage() : 'Invalid request.']);
} catch (Throwable $error) {
    if (isset($db)) { try { $db->exec('ROLLBACK'); } catch (Throwable $ignored) {} }
    error_log('Outland payment request failed: ' . get_class($error));
    reply(503, ['error' => 'We could not confirm this payment request. Please contact Outland Guides before trying again.']);
}
