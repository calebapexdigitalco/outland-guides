<?php
declare(strict_types=1);

// Only these clean addresses can read the HTML stored outside public_html.
// REQUEST_URI remains the guest's original address after an internal rewrite.
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$slug = trim(is_string($path) ? $path : '', '/');
$pages = [
    '' => 'index.html', 'about' => 'about.html', 'contact' => 'contact.html',
    'faq' => 'faq.html', 'gear-help' => 'gear-help.html',
    'kilimanjaro' => 'kilimanjaro.html', 'safari' => 'safari.html',
    'volcan-de-fuego' => 'volcan-de-fuego.html', 'payments' => 'payments.html',
    'account' => 'account.html', 'privacy-terms' => 'privacy-terms.html',
];
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-cache');
if (!isset($pages[$slug])) {
    http_response_code(404);
    header('X-Robots-Tag: noindex');
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page Not Found | Outland Guides</title></head><body style="margin:0;background:#1a1a1a;color:#f5eee4;font:18px/1.6 system-ui;padding:12vh 8vw"><h1>That trail ends here.</h1><p>This address is not available. Use our clean page addresses to plan your expedition.</p><a style="color:#df986d" href="/">Return to Outland Guides</a></body></html>';
    exit;
}
if (in_array($slug, ['account', 'payments'], true)) header('X-Robots-Tag: noindex, follow');
$file = dirname(__DIR__) . '/private/outland-pages/' . $pages[$slug];
if (!is_file($file)) {
    http_response_code(503);
    header('Retry-After: 60');
    header('X-Robots-Tag: noindex');
    echo 'Outland Guides is briefly updating this page. Please try again shortly.';
    exit;
}
readfile($file);
