<?php
declare(strict_types=1);
require_once dirname(__DIR__).'/stripe/lib.php';
require_once __DIR__.'/catalog.php';
function portal_db(): PDO {
    $db=payment_db();
    $db->exec('CREATE TABLE IF NOT EXISTS customers(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL DEFAULT "");
      CREATE TABLE IF NOT EXISTS login_codes(email TEXT PRIMARY KEY,digest TEXT NOT NULL,expires INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS portal_limits(bucket TEXT PRIMARY KEY,count INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY,reference TEXT UNIQUE NOT NULL,owner TEXT NOT NULL,quote TEXT NOT NULL,start_date TEXT NOT NULL,status TEXT NOT NULL DEFAULT "requested",created INTEGER NOT NULL,payment_token TEXT);
      CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,booking TEXT NOT NULL,sender TEXT NOT NULL,team INTEGER NOT NULL,body TEXT NOT NULL,created INTEGER NOT NULL);');
    $columns=$db->query('PRAGMA table_info(requests)')->fetchAll(PDO::FETCH_COLUMN,1);
    if(!in_array('refunded',$columns,true)) $db->exec('ALTER TABLE requests ADD COLUMN refunded INTEGER NOT NULL DEFAULT 0');
    $columns=$db->query('PRAGMA table_info(bookings)')->fetchAll(PDO::FETCH_COLUMN,1);
    if(!in_array('removed_at',$columns,true)) $db->exec('ALTER TABLE bookings ADD COLUMN removed_at INTEGER NOT NULL DEFAULT 0');
    return $db;
}
function portal_key(): string {
    $path=payment_directory().'/portal.key';
    if(!is_file($path)) { $handle=fopen($path,'x'); if($handle){chmod($path,0600);fwrite($handle,bin2hex(random_bytes(32)));fclose($handle);} }
    return trim(file_get_contents($path));
}
function portal_admin(array $user): bool {
    $file=payment_directory().'/portal.json';
    $settings=is_file($file)?json_decode(file_get_contents($file),true):[];
    return in_array(strtolower($user['email']),$settings['owners']??[],true);
}
function portal_limit(PDO $db,string $scope,int $maximum,int $seconds): void {
    $key=hash_hmac('sha256',$scope.':'.intdiv(time(),$seconds),portal_key());
    $q=$db->prepare('INSERT INTO portal_limits(bucket,count) VALUES (?,1) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count');
    $q->execute([$key]);$count=$q->fetchColumn();$q->closeCursor();
    if($count>$maximum) throw new InvalidArgumentException('Too many attempts. Please wait before trying again.');
}
function portal_booking(PDO $db,string $id,array $user): array {
    $q=$db->prepare('SELECT * FROM bookings WHERE id=?');$q->execute([$id]);$b=$q->fetch(PDO::FETCH_ASSOC);
    if(!$b || ($b['owner']!==$user['id']&&!portal_admin($user))) throw new InvalidArgumentException('Booking not found.');
    return $b;
}
function portal_profile(PDO $db,array $user,array $input): void {
    $name=$input['name']??null;
    if(!is_string($name)||mb_strlen(trim($name))<2||mb_strlen(trim($name))>100) throw new InvalidArgumentException('Enter a name between 2 and 100 characters.');
    $q=$db->prepare('UPDATE customers SET name=? WHERE id=?');$q->execute([trim($name),$user['id']]);
}
function portal_bookings(PDO $db,array $user,bool $includeRemoved): array {
    $team=portal_admin($user);$conditions=[];$values=[];
    if(!$team){$conditions[]='b.owner=?';$values[]=$user['id'];}
    if(!$includeRemoved)$conditions[]='b.removed_at=0';
    $q=$db->prepare('SELECT b.*,c.email,c.name FROM bookings b JOIN customers c ON c.id=b.owner '.($conditions?'WHERE '.implode(' AND ',$conditions).' ':'').'ORDER BY b.created DESC,b.id DESC LIMIT 200');
    $q->execute($values);return $q->fetchAll(PDO::FETCH_ASSOC);
}
function portal_remove_booking(PDO $db,array $booking,array $user,bool $restore=false): void {
    // Removing a trip never deletes payment records or cancels a confirmed expedition.
    if($booking['owner']!==$user['id']) throw new InvalidArgumentException('Only the booking customer can remove or restore this trip.');
    if($restore){
        $q=$db->prepare('UPDATE bookings SET removed_at=0,status=CASE WHEN status="withdrawn" THEN "requested" ELSE status END WHERE id=?');$q->execute([$booking['id']]);return;
    }
    $q=$db->prepare('SELECT COUNT(*) FROM requests WHERE reference=? AND paid=1');$q->execute([$booking['reference']]);$hasPayment=(int)$q->fetchColumn()>0;$q->closeCursor();
    $status=$booking['status']==='requested'&&!$hasPayment?'withdrawn':$booking['status'];
    $q=$db->prepare('UPDATE bookings SET removed_at=?,status=? WHERE id=?');$q->execute([time(),$status,$booking['id']]);
}
function portal_details(PDO $db,array $b,string $mode): array {
    $b['quote']=json_decode($b['quote'],true);
    $q=$db->prepare('SELECT payment_type,amount,refunded,paid,paid_at FROM requests WHERE reference=? AND mode=? AND paid=1 ORDER BY paid_at');
    $q->execute([$b['reference'],$mode]);$b['payments']=$q->fetchAll(PDO::FETCH_ASSOC);
    $b['received']=array_sum(array_column($b['payments'],'amount'))-array_sum(array_column($b['payments'],'refunded'));
    $b['balance']=max(0,$b['quote']['total_amount']-$b['received']);unset($b['payment_token']);
    $q=$db->prepare('SELECT m.body,m.team,m.created,c.name FROM messages m JOIN customers c ON c.id=m.sender WHERE booking=? ORDER BY m.created,m.id');
    $q->execute([$b['id']]);$b['messages']=$q->fetchAll(PDO::FETCH_ASSOC);
    return $b;
}
