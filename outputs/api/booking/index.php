<?php
declare(strict_types=1);
ini_set('display_errors','0');
require __DIR__.'/portal.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
function answer(int $status,array $data): never {http_response_code($status);echo json_encode($data,JSON_UNESCAPED_SLASHES);exit;}
try {
 if(($_SERVER['HTTPS']??'')!=='on' && ($_SERVER['SERVER_PORT']??'')!=443) answer(400,['error'=>'Use the HTTPS website.']);
 $directory=payment_directory().'/sessions';if(!is_dir($directory)) mkdir($directory,0700,true);
 ini_set('session.use_strict_mode','1');ini_set('session.gc_maxlifetime','28800');session_save_path($directory);
 session_name('outland_account');session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>true,'httponly'=>true,'samesite'=>'Lax']);session_start();
 if(($_SESSION['last']??time())<time()-28800) $_SESSION=[];$_SESSION['last']=time();
 $_SESSION['csrf']??=bin2hex(random_bytes(32));$csrf=$_SESSION['csrf'];
 $db=portal_db();$config=payment_config();$mode=$config['mode']??'live';$action=basename(parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH));
 $q=$db->prepare('SELECT id,email,name FROM customers WHERE id=?');$q->execute([$_SESSION['user']??'']);$user=$q->fetch(PDO::FETCH_ASSOC)?:null;
 if($_SERVER['REQUEST_METHOD']==='GET' && $action==='session') answer(200,['csrf'=>$csrf,'user'=>$user,'team'=>$user?portal_admin($user):false,'catalog'=>expedition_catalog(),'configured'=>payments_enabled($config)]);
 if($_SERVER['REQUEST_METHOD']!=='POST') answer(405,['error'=>'Use the customer account page.']);
 if(!in_array($_SERVER['HTTP_ORIGIN']??'',['https://outlandguides.com','https://www.outlandguides.com'],true)||!hash_equals($csrf,$_SERVER['HTTP_X_CSRF_TOKEN']??'')) answer(403,['error'=>'Please reload the page and try again.']);
 $raw=file_get_contents('php://input',false,null,0,8193);if(strlen($raw)>8192) answer(413,['error'=>'Request too large.']);
 $data=json_decode($raw,true,16,JSON_THROW_ON_ERROR);if(!is_array($data)) throw new InvalidArgumentException('Invalid request.');
 portal_limit($db,'ip:'.($_SERVER['REMOTE_ADDR']??''),90,60);
 if($action==='send-code') {
  $email=strtolower(trim($data['email']??''));if(!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($email)>254) throw new InvalidArgumentException('Enter a valid email address.');
  portal_limit($db,'email:'.$email,3,3600);portal_limit($db,'mail-ip:'.($_SERVER['REMOTE_ADDR']??''),10,3600);
  $code=(string)random_int(10000000,99999999);$digest=hash_hmac('sha256',$email.':'.$code,portal_key());
  $q=$db->prepare('INSERT INTO login_codes(email,digest,expires,attempts) VALUES (?,?,?,0) ON CONFLICT(email) DO UPDATE SET digest=excluded.digest,expires=excluded.expires,attempts=0');$q->execute([$email,$digest,time()+600]);
  $sent=mail($email,'Your Outland Guides sign-in code',"Your sign-in code is: ".$code."\n\nIt expires in 10 minutes. If you did not request this, you can ignore this email.\n\nOutland Guides",['From'=>'Outland Guides <info@outlandguides.com>','Content-Type'=>'text/plain; charset=UTF-8'],'-finfo@outlandguides.com');
  if(!$sent) throw new RuntimeException('Mail transport unavailable');answer(200,['message'=>'Check your email for an eight-digit code. It expires in 10 minutes.']);
 }
 if($action==='verify-code') {
  $email=strtolower(trim($data['email']??''));$code=$data['code']??'';
  $db->exec('BEGIN IMMEDIATE');$q=$db->prepare('SELECT * FROM login_codes WHERE email=?');$q->execute([$email]);$record=$q->fetch(PDO::FETCH_ASSOC);$q->closeCursor();
  if(!$record||$record['expires']<time()||$record['attempts']>=5||!is_string($code)||!preg_match('/^\d{8}$/D',$code)||!hash_equals($record['digest'],hash_hmac('sha256',$email.':'.$code,portal_key()))) {
   $q=$db->prepare('UPDATE login_codes SET attempts=attempts+1 WHERE email=?');$q->execute([$email]);$db->exec('COMMIT');throw new InvalidArgumentException('That code is invalid or expired.');
  }
  $q=$db->prepare('DELETE FROM login_codes WHERE email=?');$q->execute([$email]);
  $q=$db->prepare('INSERT OR IGNORE INTO customers(id,email,name) VALUES (?,?,?)');$q->execute([bin2hex(random_bytes(16)),$email,'']);
  $q=$db->prepare('SELECT id FROM customers WHERE email=?');$q->execute([$email]);$id=$q->fetchColumn();$q->closeCursor();$db->exec('COMMIT');session_regenerate_id(true);$_SESSION['user']=$id;answer(200,['signed_in'=>true]);
 }
 if(!$user) answer(401,['error'=>'Please sign in to your account.']);
 if($action==='logout') {$_SESSION=[];session_regenerate_id(true);answer(200,['signed_out'=>true]);}
 if($action==='quote') answer(200,['quote'=>quote_expedition($data)]);
 if($action==='create') {
  portal_limit($db,'booking:'.$user['id'],12,3600);$quote=quote_expedition($data);$date=$data['start_date']??'';
  $parsed=DateTimeImmutable::createFromFormat('!Y-m-d',$date);if(!$parsed||$parsed->format('Y-m-d')!==$date||$date<gmdate('Y-m-d')||$date>gmdate('Y-m-d',time()+3*365*86400)) throw new InvalidArgumentException('Choose a valid future start date within three years.');
  $name=trim($data['name']??'');if(mb_strlen($name)<2||mb_strlen($name)>100) throw new InvalidArgumentException('Enter your full name.');
  $id=bin2hex(random_bytes(16));$reference='OG-'.gmdate('Y').'-'.strtoupper(bin2hex(random_bytes(4)));
  $q=$db->prepare('INSERT INTO bookings(id,reference,owner,quote,start_date,created) VALUES (?,?,?,?,?,?)');$q->execute([$id,$reference,$user['id'],json_encode($quote),$date,time()]);
  $q=$db->prepare('UPDATE customers SET name=? WHERE id=?');$q->execute([$name,$user['id']]);answer(200,['booking_id'=>$id]);
 }
 if($action==='list') {
  $team=portal_admin($user);$q=$db->prepare('SELECT b.*,c.email,c.name FROM bookings b JOIN customers c ON c.id=b.owner '.($team?'':'WHERE b.owner=? ').'ORDER BY b.created DESC LIMIT 200');$q->execute($team?[]:[$user['id']]);
  $rows=$q->fetchAll(PDO::FETCH_ASSOC);answer(200,['bookings'=>array_map(fn($b)=>portal_details($db,$b,$mode),$rows)]);
 }
 $booking=portal_booking($db,(string)($data['booking_id']??''),$user);
 if($action==='message') {
  portal_limit($db,'message:'.$user['id'],15,60);$body=trim($data['body']??'');if($body===''||mb_strlen($body)>4000) throw new InvalidArgumentException('Write a message of up to 4,000 characters.');
  $q=$db->prepare('INSERT INTO messages(id,booking,sender,team,body,created) VALUES (?,?,?,?,?,?)');$q->execute([bin2hex(random_bytes(16)),$booking['id'],$user['id'],portal_admin($user)?1:0,$body,time()]);answer(200,['sent'=>true]);
 }
 if($action==='confirm') {
  if(!portal_admin($user)) answer(403,['error'=>'Owner access required.']);
  $q=$db->prepare('UPDATE bookings SET status="confirmed" WHERE id=? AND status="requested"');$q->execute([$booking['id']]);answer(200,['confirmed'=>true]);
 }
 if($action==='verify-payment') {
  $q=$db->prepare('SELECT * FROM requests WHERE reference=? AND mode=? AND session_id=?');$q->execute([$booking['reference'],$mode,$data['session_id']??'']);$r=$q->fetch(PDO::FETCH_ASSOC);
  if(!$r) throw new InvalidArgumentException('Payment not found for this booking.');$s=stripe_request($config,'checkout/sessions/'.rawurlencode($r['session_id']));record_paid($db,$s,$r);answer(200,['paid'=>$s['payment_status']==='paid']);
 }
 if($action==='checkout') {
  if(!payments_enabled($config)) throw new InvalidArgumentException('Payments are not currently available.');
  $db->exec('BEGIN IMMEDIATE');$booking=portal_booking($db,$booking['id'],$user);
  if($booking['status']!=='confirmed') throw new InvalidArgumentException('Your requested dates must be confirmed by Outland before payment.');
  $details=portal_details($db,$booking,$mode);$received=array_sum(array_column($details['payments'],'amount'));$refunded=array_sum(array_column($details['payments'],'refunded'));
  if($refunded>0) throw new InvalidArgumentException('This booking has a refund. Please contact Outland to review it before making another payment.');
  $type=$data['payment_type']??'deposit';$amount=booking_payment_amount($details['quote']['total_amount'],$received,$refunded,$type);
  $token=$booking['payment_token'];
  if($token){
   $previous=find_payment($db,$token,$mode);
   if(!$previous['paid']&&$previous['session_id']) {
    $s=stripe_request($config,'checkout/sessions/'.rawurlencode($previous['session_id']));record_paid($db,$s,$previous);
    if($s['payment_status']==='paid') {$db->exec('COMMIT');throw new InvalidArgumentException('Payment received. Refresh your booking before paying again.');}
    if($previous['amount']!==$amount || $previous['payment_type']!==['deposit'=>'Deposit','balance'=>'Remaining balance','full'=>'Full payment'][$type]) {
     if($s['status']==='open') stripe_request($config,'checkout/sessions/'.rawurlencode($s['id']).'/expire',[]);$token=null;
    }
   }
   if($previous['paid']||$previous['expires']<time()+1800||$previous['amount']!==$amount) $token=null;
  }
  if(!$token) {
   $r=create_payment_request($db,['reference'=>$booking['reference'],'amount'=>$amount,'expedition'=>$details['quote']['expedition'],'route'=>$details['quote']['option'],'payment_type'=>['deposit'=>'Deposit','balance'=>'Remaining balance','full'=>'Full payment'][$type],'email'=>$user['email'],'expires'=>time()+7*86400],$mode);$token=$r['token'];
   $q=$db->prepare('UPDATE bookings SET payment_token=? WHERE id=?');$q->execute([$token,$booking['id']]);
  }
  $db->exec('COMMIT');session_write_close();
  $curl=curl_init('https://outlandguides.com/api/stripe/checkout');curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>json_encode(['token'=>$token]),CURLOPT_HTTPHEADER=>['Content-Type: application/json','Origin: https://outlandguides.com'],CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>40]);$body=curl_exec($curl);$code=curl_getinfo($curl,CURLINFO_RESPONSE_CODE);curl_close($curl);$result=json_decode($body?:'{}',true);
  if($code!==200) throw new InvalidArgumentException($result['error']??'Checkout could not open. Please contact Outland Guides.');answer(200,['url'=>$result['url']]);
 }
 answer(404,['error'=>'Not found.']);
} catch(InvalidArgumentException|JsonException $e) {
 if(isset($db)){try{$db->exec('ROLLBACK');}catch(Throwable $ignored){}}answer(400,['error'=>$e instanceof JsonException?'Invalid request.':$e->getMessage()]);
} catch(Throwable $e) {if(isset($db)){try{$db->exec('ROLLBACK');}catch(Throwable $ignored){}}error_log('Outland portal: '.get_class($e));answer(503,['error'=>'This request could not be completed. Please contact info@outlandguides.com.']);}
