<?php
declare(strict_types=1);
function booking_check(bool $value,string $message): void { if(!$value) throw new RuntimeException($message); }
$quote=quote_expedition(['option_id'=>'machame-6','travelers'=>2,'amount'=>1]);
booking_check($quote['total_amount']===399800 && $quote['deposit_amount']===199900,'Use the entire group price and ignore browser-supplied amounts.');
$larger=quote_expedition(['option_id'=>'machame-6','travelers'=>6]);
booking_check($larger['total_amount']===1019400,'Group discount applies to the whole group, never to one traveler pretending to book six.');
$package=quote_expedition(['option_id'=>'lemosho-7','travelers'=>3,'safari_addon'=>'safari-4','lodging_nights'=>2]);
booking_check($package['total_amount']===(222900+199900+5000)*3,'Safari and lodging prices match the supplied per-person tiers.');
foreach ([['option_id'=>'fuego','travelers'=>2],['option_id'=>'machame-6','travelers'=>1],['option_id'=>'machame-6','travelers'=>2.5],['option_id'=>'safari-3','travelers'=>2,'safari_addon'=>'safari-4']] as $invalid) {
    try { quote_expedition($invalid); throw new LogicException('Unapproved quote accepted.'); } catch(InvalidArgumentException $expected) {}
}
booking_check(booking_payment_amount(400000,0,0,'deposit')===200000,'First deposit is 50%.');
booking_check(booking_payment_amount(400000,200000,0,'balance')===200000,'Balance subtracts recorded payments.');
booking_check(booking_payment_amount(400000,200000,50000,'balance')===250000,'Refunds are accounted for in outstanding balances.');
booking_check(booking_payment_amount(400001,0,0,'deposit')===200001,'Deposit rounds up consistently to cents.');
foreach ([[400000,200000,0,'deposit'],[400000,400000,0,'balance'],[400000,0,0,'balance'],[400000,200000,0,'full']] as $invalid) {
    try { booking_payment_amount(...$invalid); throw new LogicException('Invalid payment option accepted.'); } catch(InvalidArgumentException $expected) {}
}
echo "Booking price and balance tests passed.\n";
