<?php
declare(strict_types=1);
// Run over authenticated SSH after upload, using SiteGround's local Site Tools socket.
// This clears cached copies only; it never removes website files or customer data.
if(PHP_SAPI!=='cli') { http_response_code(404); exit; }
$socket='/chroot/tmp/site-tools.sock';
if(!file_exists($socket)) { fwrite(STDERR,"SiteGround cache socket unavailable.\n");exit(1); }
$connection=stream_socket_client('unix://'.$socket,$errno,$error,5);
if(!$connection) { fwrite(STDERR,"SiteGround cache connection unavailable.\n");exit(1); }
stream_set_timeout($connection,20);
$request=['api'=>'domain-all','cmd'=>'update','settings'=>['json'=>1],
    'params'=>['flush_cache'=>'1','id'=>'outlandguides.com','path'=>'/(.*)']];
fwrite($connection,json_encode($request,JSON_FORCE_OBJECT)."\n");
$reply=fgets($connection,32768);fclose($connection);
$result=json_decode($reply?:'',true);
if(!is_array($result)||isset($result['err_code'])) { fwrite(STDERR,"SiteGround did not confirm the cache purge.\n");exit(1); }
echo "SiteGround cached website copies cleared.\n";
