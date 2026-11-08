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
 $r=create_payment_request($db,['reference'=>'OG-TEST-A','amount'=>24950,'expedition'=>'Volcán de Fuego','route'=>'Private two-person cabin','payment_type'=>'Deposit','expires'=>time()+86400],'test');
 $request=find_payment($db,$r['token'],'test');$q=$db->prepare('UPDATE requests SET paid=1,refunded=5000 WHERE id=?');$q->execute([$request['id']]);
 $details=portal_details($db,$booking,'test');portal_check($details['balance']===29950,'Portal accounts for actual receipts and refunds.');portal_check(!array_key_exists('payment_token',$details),'Private checkout credentials are never returned in booking data.');
 portal_check(portal_details($db,$booking,'live')['received']===0,'Sandbox receipts never count as live payments.');
 echo "Customer isolation, owner access, approval status, and balance tests passed.\n";
} finally {$q=null;$db=null;foreach(glob($dir.'/*') as $f)unlink($f);rmdir($dir);}
