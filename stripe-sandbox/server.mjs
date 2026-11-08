import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,randomUUID} from 'node:crypto';

const folder=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(folder,'../outputs');
const privateFolder=path.join(process.env.LOCALAPPDATA||process.env.TMPDIR||folder,'OutlandGuides');
const configFile=path.join(privateFolder,'stripe-sandbox.json');
const port=4184,base='http://localhost:'+port;
const setupToken=randomBytes(32).toString('hex');
const origins=new Set([base,'http://localhost:4183','http://127.0.0.1:4183','http://127.0.0.1:4184']);
const payments={'Deposit':1000,'Remaining balance':2000,'Full payment':3000};
const expeditions=['Mount Kilimanjaro','Wildlife Safari','Volcán de Fuego','Custom / Private Expedition'];
const routes=['Machame 6-Day','Machame 7-Day','Lemosho 6-Day','Lemosho 7-Day'];
let secret='',setupOpen=true;
try{secret=JSON.parse(await readFile(configFile,'utf8')).secret||''}catch{}
if(!/^(sk|rk)_test_/.test(secret))secret='';
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>8192)throw Error('Request too large.')}return JSON.parse(text||'{}')}
async function stripe(resource,options={}){
  if(!secret)throw Error('Stripe sandbox is not connected yet. Complete the private setup first.');
  const response=await fetch('https://api.stripe.com/v1/'+resource,{...options,headers:{Authorization:'Bearer '+secret,'Stripe-Version':'2026-10-28.endive',...options.headers},signal:AbortSignal.timeout(25000)});
  const data=await response.json();
  if(!response.ok){
    const safe=value=>String(value||'').replace(/[^a-zA-Z0-9_.\[\]-]/g,'').slice(0,120);
    console.error('Stripe request rejected:',JSON.stringify({status:response.status,type:safe(data.error?.type),code:safe(data.error?.code),parameter:safe(data.error?.param)}));
    throw Error(response.status===401?'Stripe did not accept this sandbox key. Check the private setup.':'Stripe could not complete this request. Please try again or check the Stripe dashboard.');
  }
  if(data.livemode===true)throw Error('Live payments are disabled on this sandbox server.');
  return data;
}
const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin;
  if(origin&&!origins.has(origin)){json(res,403,{error:'Origin not allowed.'});return}
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin')}
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Setup-Token, Idempotency-Key'});res.end();return}
  const url=new URL(req.url,base);
  try{
    if(url.pathname==='/api/stripe/config'&&req.method==='GET'){json(res,200,{configured:!!secret,mode:'sandbox',payments,currency:'usd'});return}
    if(url.pathname==='/api/stripe/setup'&&req.method==='POST'){
      if(!setupOpen||origin!==base||req.headers['x-setup-token']!==setupToken){json(res,403,{error:'Open the private setup link from this server to configure Stripe.'});return}
      const data=await body(req);
      if(typeof data.secret!=='string'||!/^(sk|rk)_test_[A-Za-z0-9]+$/.test(data.secret.trim())){json(res,400,{error:'Use a sandbox secret or restricted key, beginning sk_test_ or rk_test_.'});return}
      const previous=secret;secret=data.secret.trim();
      try{await stripe('balance')}catch(error){secret=previous;throw error}
      await mkdir(privateFolder,{recursive:true});
      await writeFile(configFile,JSON.stringify({secret}),{mode:0o600});
      setupOpen=false;json(res,200,{configured:true});return;
    }
    if(url.pathname==='/api/stripe/checkout'&&req.method==='POST'){
      if(!origin){json(res,403,{error:'Open the payment page in your browser.'});return}
      const data=await body(req);
      if(!expeditions.includes(data.expedition)||!Object.hasOwn(payments,data.payment_type)||(data.expedition==='Mount Kilimanjaro'&&!routes.includes(data.route))){json(res,400,{error:'Choose a valid expedition, route, and payment type.'});return}
      const reference=String(data.reference||'SANDBOX-PREVIEW').trim().slice(0,80);
      const params=new URLSearchParams({
        mode:'payment','allowed_payment_method_types[0]':'card',
        success_url:base+'/payments.html?session_id={CHECKOUT_SESSION_ID}',
        cancel_url:base+'/payments.html?cancelled=1',
        client_reference_id:reference,
        'line_items[0][quantity]':'1',
        'line_items[0][price_data][currency]':'usd',
        'line_items[0][price_data][unit_amount]':String(payments[data.payment_type]),
        'line_items[0][price_data][product_data][name]':'SANDBOX: '+data.expedition+' — '+data.payment_type,
        'line_items[0][price_data][product_data][description]':'Test transaction only. No real funds or expedition reservation. '+(data.route||''),
        'metadata[integration]':'outland-sandbox',
        'metadata[expedition]':data.expedition,
        'metadata[route]':data.route||'',
        'metadata[payment_type]':data.payment_type
      });
      const key=req.headers['idempotency-key'];
      if(key&&!/^[a-zA-Z0-9-]{10,100}$/.test(key)){json(res,400,{error:'Invalid checkout request.'});return}
      const session=await stripe('checkout/sessions',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':key||randomUUID()},body:params});
      if(!session.url?.startsWith('https://checkout.stripe.com/'))throw Error('Stripe did not return a valid checkout address.');
      json(res,200,{url:session.url});return;
    }
    if(url.pathname==='/api/stripe/status'&&req.method==='GET'){
      const id=url.searchParams.get('session_id');
      if(!/^cs_test_[A-Za-z0-9_]+$/.test(id||'')){json(res,400,{error:'Invalid sandbox checkout reference.'});return}
      const session=await stripe('checkout/sessions/'+encodeURIComponent(id));
      if(session.metadata?.integration!=='outland-sandbox'){json(res,404,{error:'Checkout not found.'});return}
      json(res,200,{paid:session.payment_status==='paid',status:session.status,amount:session.amount_total,currency:session.currency,expedition:session.metadata.expedition,payment_type:session.metadata.payment_type,reference:session.client_reference_id});return;
    }
    if(url.pathname==='/stripe-setup'&&req.method==='GET'){
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; form-action 'none'"});
      res.end(await readFile(path.join(folder,'setup.html')));return;
    }
    if(req.method!=='GET'&&req.method!=='HEAD'){json(res,405,{error:'Method not allowed.'});return}
    const filename=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!filename.startsWith(root+path.sep)){json(res,404,{error:'Not found.'});return}
    const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.webm':'video/webm','.mp4':'video/mp4'};
    const file=await readFile(filename);
    res.writeHead(200,{'Content-Type':mime[path.extname(filename).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(req.method==='HEAD'?undefined:file);
  }catch(error){json(res,error.code==='ENOENT'?404:400,{error:error.code==='ENOENT'?'Not found.':error.message||'Unable to complete request.'})}
});
server.listen(port,'127.0.0.1',()=>{
  console.log('Outland Stripe sandbox: '+base+'/payments.html');
  console.log('Private setup: '+base+'/stripe-setup#'+setupToken);
  console.log(secret?'Sandbox key is configured.':'Awaiting your sandbox key in the private setup page.');
});
