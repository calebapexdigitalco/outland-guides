<?php
declare(strict_types=1);
$dir=sys_get_temp_dir().'/outland-portal-test-'.bin2hex(random_bytes(10));mkdir($dir,0700);putenv('OUTLAND_PAYMENT_DIRECTORY='.$dir);
function portal_check(bool $ok,string $message): void {if(!$ok) throw new RuntimeException($message);}
try {
 $db=portal_db();$a=['id'=>'customer-a','email'=>'a@example.com'];$b=['id'=>'customer-b','email'=>'b@example.com'];
 $q=$db->prepare('INSERT INTO customers(id,email,name) VALUES (?,?,?)');$q->execute([$a['id'],$a['email'],'A']);$q->execute([$b['id'],$b['email'],'B']);
 $quote=quote_expedition(['option_id'=>'fuego-private','travelers'=>2]);
 $q=$db->prepare('INSERT INTO bookings(id,reference,owner,quote,start_date,status,created) VALUES (?,?,?,?,?,?,?)');$q->execute(['booking-a','OG-TEST-A',$a['id'],json_encode($quote),'2027-05-01','requested',time()]);
 $booking=portal_booking($db,'booking-a',$a);portal_check($booking['status']==='requested','Bookings require owner confirmation before payment.');
 try{portal_booking($db,'booking-a',$b);throw new LogicException('Another customer can read this booking.');}catch(InvalidArgumentException $expected){}
 file_put_contents($dir.'/portal.json',json_encode(['owners'=>[$b['email']]]));portal_check(portal_admin($b),'Only configured verified-email owners get team access.');portal_check(!portal_admin($a),'Customers cannot make themselves owners.');
 portal_check(portal_booking($db,'booking-a',$b)['owner']===$a['id'],'Owners can review customer bookings.');
 portal_profile($db,$a,['name'=>'  Mountain Guest  ','email'=>'attacker@example.com','id'=>$b['id']]);
 $customer=$db->query('SELECT * FROM customers WHERE id="customer-a"')->fetch(PDO::FETCH_ASSOC);
 portal_check($customer['name']==='Mountain Guest' && $customer['email']===$a['email'],'Profile updates cannot change the verified email or another customer.');
 portal_check($db->query('SELECT name FROM customers WHERE id="customer-b"')->fetchColumn()==='B','Profile updates only affect the signed-in customer.');
 foreach([['name'=>' '],['name'=>str_repeat('x',101)],['name'=>[]]] as $invalid){try{portal_profile($db,$a,$invalid);throw new LogicException('Invalid profile accepted.');}catch(InvalidArgumentException $expected){}}
 try{portal_remove_booking($db,$booking,$b);throw new LogicException('Another customer can remove this trip.');}catch(InvalidArgumentException $expected){}
 portal_remove_booking($db,$booking,$a);$removed=portal_booking($db,'booking-a',$a);
 portal_check($removed['status']==='withdrawn' && $removed['removed_at']>0,'Removing an unpaid request withdraws the date request.');
 portal_check(count(portal_bookings($db,$a,false))===0 && count(portal_bookings($db,$a,true))===1,'Removed bookings are hidden but recoverable by their customer.');
 portal_check(count(portal_bookings($db,$b,true))===1,'The team can still review removed requests.');
 portal_remove_booking($db,$removed,$a,true);$booking=portal_booking($db,'booking-a',$a);
 portal_check($booking['status']==='requested' && !$booking['removed_at'],'Restoring a request requires fresh date confirmation.');
 $r=create_payment_request($db,['reference'=>'OG-TEST-A','amount'=>24950,'expedition'=>'Volcán de Fuego','route'=>'Private two-person cabin','payment_type'=>'Deposit','expires'=>time()+86400],'test');
 $request=find_payment($db,$r['token'],'test');$q=$db->prepare('UPDATE requests SET paid=1,refunded=5000 WHERE id=?');$q->execute([$request['id']]);
 $details=portal_details($db,$booking,'test');portal_check($details['balance']===29950,'Portal accounts for actual receipts and refunds.');portal_check(!array_key_exists('payment_token',$details),'Private checkout credentials are never returned in booking data.');
 portal_check(portal_details($db,$booking,'live')['received']===0,'Sandbox receipts never count as live payments.');
 $db->exec('UPDATE bookings SET status="confirmed" WHERE id="booking-a"');$booking=portal_booking($db,'booking-a',$a);portal_remove_booking($db,$booking,$a);$removed=portal_booking($db,'booking-a',$a);
 portal_check($removed['status']==='confirmed','Hiding a confirmed trip does not cancel the booking.');
 portal_check(portal_details($db,$removed,'test')['balance']===29950,'Removing a trip preserves payments and refund records.');
 portal_remove_booking($db,$removed,$a,true);portal_check(portal_booking($db,'booking-a',$a)['status']==='confirmed','Restoring a confirmed trip preserves its confirmation.');
 file_put_contents($dir.'/portal.json',json_encode(['owners'=>[]]));portal_check(count(portal_bookings($db,$b,true))===0,'Removed-trip listing never bypasses customer isolation.');
 echo "Customer isolation, profile updates, removal/restoration, owner access, and balance tests passed.\n";
} finally {$q=null;$db=null;foreach(glob($dir.'/*') as $f)unlink($f);rmdir($dir);}
