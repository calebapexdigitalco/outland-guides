<?php
declare(strict_types=1);
// Run with the library already loaded, using an isolated temporary database.
function check(bool $value, string $description): void {
    if (!$value) throw new RuntimeException('FAILED: ' . $description);
}
$directory = sys_get_temp_dir() . '/outland-payment-test-' . bin2hex(random_bytes(10));
mkdir($directory, 0700); putenv('OUTLAND_PAYMENT_DIRECTORY=' . $directory);
try {
    check(!payments_enabled([]), 'Unconfigured payments are disabled');
    $db = payment_db();
    $data = ['reference'=>'TEST-BOOKING','expedition'=>'Mount Kilimanjaro','route'=>'Machame 7-Day',
        'payment_type'=>'Deposit','amount'=>109950,'expires'=>time()+86400];
    $created = create_payment_request($db,$data,'test');
    $request = find_payment($db,$created['token'],'test');
    check((int)$request['amount']===109950, 'Approved amount is stored as integer cents');
    check(!str_contains(json_encode(public_payment($request)), $created['token']), 'Payment code is not returned in booking details');
    foreach (['live','invalid'] as $mode) {
        try { find_payment($db,$created['token'],$mode); throw new RuntimeException('Mode access allowed'); }
        catch (InvalidArgumentException $expected) {}
    }
    foreach ([0, -50, 10.5, 10000001] as $invalidAmount) {
        try { create_payment_request($db,array_replace($data,['amount'=>$invalidAmount]),'test'); throw new RuntimeException('Invalid amount accepted'); }
        catch (InvalidArgumentException $expected) {}
    }
    $request['session_id']='cs_test_example';
    $session=['id'=>'cs_test_example','metadata'=>['integration'=>'outland-payments','request_id'=>$request['id']],
        'livemode'=>false,'mode'=>'payment','amount_total'=>109950,'currency'=>'usd','payment_status'=>'unpaid'];
    verify_session($session,$request);
    record_paid($db,$session,$request);
    check((int)find_payment($db,$created['token'],'test')['paid']===0, 'Unpaid session is never marked paid');
    foreach ([['amount_total'=>10],['livemode'=>true],['currency'=>'eur'],['id'=>'cs_test_other'],['metadata'=>[]]] as $tamper) {
        try { verify_session(array_replace($session,$tamper),$request); throw new LogicException('Tampered session accepted'); }
        catch (RuntimeException $expected) {}
    }
    $session['payment_status']='paid'; $session['payment_intent']='pi_test_example';
    record_paid($db,$session,$request); record_paid($db,$session,$request);
    check((int)find_payment($db,$created['token'],'test')['paid']===1, 'Repeated paid confirmations are idempotent');
    $body='{"id":"evt_example"}'; $now=time(); $secret='whsec_test_fixture';
    $signature=hash_hmac('sha256',$now.'.'.$body,$secret);
    check(webhook_verified($body,'t='.$now.',v1=wrong,v1='.$signature,$secret,$now), 'Valid rotating webhook signature accepted');
    check(!webhook_verified($body.' ','t='.$now.',v1='.$signature,$secret,$now), 'Changed payload rejected');
    check(!webhook_verified($body,'t='.$now.',v1='.$signature,$secret,$now+301), 'Replayed expired webhook rejected');
    check(!webhook_verified($body,'v1='.$signature,$secret,$now), 'Missing timestamp rejected');
    echo "Payment security tests passed: approved amounts, private access, mode isolation, session matching, paid status, webhook authentication.\n";
} finally {
    $db=null;
    foreach (glob($directory.'/*') as $file) unlink($file);
    rmdir($directory);
}
