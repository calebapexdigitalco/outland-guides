<?php
declare(strict_types=1);
function booking_check(bool $value,string $message): void { if(!$value) throw new RuntimeException($message); }
$quote=quote_expedition(['option_id'=>'machame-6','travelers'=>2,'amount'=>1]);
booking_check($quote['total_amount']===399800 && $quote['deposit_amount']===199900,'Use the entire group price and ignore browser-supplied amounts.');
$larger=quote_expedition(['option_id'=>'machame-6','travelers'=>6]);
booking_check(quote_expedition(['option_id'=>'fuego-private','travelers'=>2])['total_amount']===49900,'Private Fuego cabin costs $499 for both travelers together.');
booking_check(quote_expedition(['option_id'=>'fuego-shared','travelers'=>5])['total_amount']===100000,'Shared Fuego cabin is $200 per traveler.');
booking_check(quote_expedition(['option_id'=>'fuego-shared','travelers'=>1])['total_amount']===20000,'One traveler can book a place in a shared cabin.');
foreach ([['fuego-shared',6],['fuego-shared',15],['fuego-shared',16],['fuego-private',1],['fuego-private',3],['fuego-private',16]] as [$option,$count]) {
    try { quote_expedition(['option_id'=>$option,'travelers'=>$count]); throw new LogicException('Cabin capacity was not enforced.'); } catch(InvalidArgumentException $expected) {}
}
foreach ([2=>[1999,2199,2049,2249],3=>[1979,2179,2029,2229],4=>[1949,2149,1999,2199],5=>[1799,1999,1849,2049],6=>[1699,1899,1749,1949],9=>[1699,1899,1749,1949]] as $count=>$prices) {
 foreach(array_keys(array_slice(expedition_catalog(),0,4)) as $i=>$option) booking_check(quote_expedition(['option_id'=>$option,'travelers'=>$count])['total_amount']===$prices[$i]*100*$count,'Every group tier matches the supplied table.');
}
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

foreach ([2=>[1899,1999],3=>[1879,1989],4=>[1849,1979],5=>[1749,1969],6=>[1749,1899],12=>[1749,1899]] as $count=>$prices) {
 foreach(['marangu-5','marangu-6'] as $i=>$id) booking_check(quote_expedition(['option_id'=>$id,'travelers'=>$count])['total_amount']===$prices[$i]*100*$count,'Marangu group pricing matches the customer table.');
}
