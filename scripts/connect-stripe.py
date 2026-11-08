"""Private localhost setup for the SiteGround Stripe connection. Never publish this server."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen
import getpass
import hashlib
import hmac
import json
import os
import re
import secrets
import subprocess
import threading
from urllib.parse import urlencode
from siteground_connection import remote, PRIVATE, SITE

VERSION = '2026-10-28.endive'
WEBHOOK = 'https://outlandguides.com/api/stripe/webhook'
ORIGIN = 'http://localhost:4185'

def stripe(key, resource, data=None, idempotency=None):
    headers = {'Authorization': 'Bearer ' + key, 'Stripe-Version': VERSION, 'User-Agent': 'Outland-Payments-Setup'}
    if idempotency:
        headers['Idempotency-Key'] = idempotency
    encoded = None
    if data is not None:
        encoded = urlencode(data).encode()
        headers['Content-Type'] = 'application/x-www-form-urlencoded'
    try:
        with urlopen(Request('https://api.stripe.com/v1/' + resource, data=encoded, headers=headers), timeout=35) as response:
            return json.load(response)
    except Exception:
        raise RuntimeError('Stripe did not accept this request. Check that the key is correct and has permission to manage Checkout Sessions and webhook endpoints.') from None

def private_local_folder():
    directory = Path(os.environ['LOCALAPPDATA']) / 'OutlandGuides' / 'payments'
    directory.mkdir(parents=True, exist_ok=True)
    owner = os.environ.get('USERDOMAIN', '') + '\\' + getpass.getuser()
    result = subprocess.run(['icacls', str(directory), '/inheritance:r', '/grant:r', owner+':(OI)(CI)F', 'SYSTEM:(OI)(CI)F'], capture_output=True)
    if result.returncode:
        raise RuntimeError('The private configuration folder could not be secured.')
    return directory

def save_remote(config):
    command = f'umask 077; mkdir -p {PRIVATE} && chmod 700 {PRIVATE} && cat > {PRIVATE}/config.next.json && chmod 600 {PRIVATE}/config.next.json && mv -f {PRIVATE}/config.next.json {PRIVATE}/config.json'
    result = remote(command, json.dumps(config))
    if result.returncode:
        raise RuntimeError('The private SiteGround configuration could not be saved. The key remains in the protected local setup folder for retrying.')

def configure(key, mode='live'):
    if mode not in ('test','live') or not re.fullmatch(r'(?:sk|rk)_' + mode + r'_[A-Za-z0-9]{20,}',key):
        raise RuntimeError('Enter a live secret key beginning sk_live_ or rk_live_. Never paste it into chat.')
    probe = remote(f'test -f {SITE}/public_html/api/stripe/index.php')
    if probe.returncode:
        raise RuntimeError('The payment connection is still being deployed. Please try again shortly.')
    account = stripe(key,'account')
    if mode == 'live' and not account.get('charges_enabled'):
        raise RuntimeError('Stripe has not enabled live charges for this account. Finish Activate Payments in the Stripe dashboard, then try again.')
    if mode == 'live' and not account.get('payouts_enabled'):
        raise RuntimeError('Stripe has not enabled bank payouts. Complete the bank account and verification requirements in Stripe, then try again.')
    directory = private_local_folder()
    file = directory / ('stripe-' + mode + '.json')
    previous = json.loads(file.read_text()) if file.exists() else {}
    if previous.get('account_id') == account['id'] and previous.get('webhook_secret'):
        endpoint = stripe(key,'webhook_endpoints/' + previous['webhook_id'])
        if endpoint.get('url') != WEBHOOK or endpoint.get('status') != 'enabled':
            raise RuntimeError('The saved Stripe webhook needs attention. Ask to repair the Stripe connection before continuing.')
        signing_secret = previous['webhook_secret']
    else:
        identity = hashlib.sha256((account['id'] + ':' + mode + ':' + WEBHOOK).encode()).hexdigest()
        endpoint = stripe(key,'webhook_endpoints', {
            'url':WEBHOOK,'api_version':VERSION,'description':'Outland Guides booking payments',
            'enabled_events[0]':'checkout.session.completed',
            'enabled_events[1]':'checkout.session.async_payment_succeeded',
            'enabled_events[2]':'checkout.session.async_payment_failed'}, 'outland-webhook-'+identity)
        signing_secret = endpoint['secret']
    config = {'enabled':True,'mode':mode,'secret':key,'webhook_secret':signing_secret,
              'webhook_id':endpoint['id'],'account_id':account['id']}
    file.write_text(json.dumps(config),encoding='utf-8')
    save_remote(config)
    request = Request('https://outlandguides.com/api/stripe/config?check='+secrets.token_hex(8),headers={'User-Agent':'Outland-Deployment-Check','Cache-Control':'no-cache'})
    with urlopen(request,timeout=30) as response:
        public = json.load(response)
    if not public.get('configured') or public.get('mode') != mode:
        raise RuntimeError('The key was saved privately, but the live website connection has not been confirmed. Ask to check the Stripe connection before taking payments.')
    return {'connected':True,'mode':mode}

PAGE = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connect live Stripe — Outland Guides</title>
<style>body{margin:0;background:#1a1a1a;color:#fdfdfd;font:16px/1.6 system-ui,sans-serif}main{max-width:580px;margin:8vh auto;padding:28px}h1{font-size:36px;line-height:1.15}p{color:#ccc}label{display:block;font-weight:700}input{box-sizing:border-box;width:100%;margin:12px 0 24px;padding:16px;border:1px solid #777;border-radius:8px;background:#292923;color:#fff;font-size:16px}button,a{display:inline-block;border:0;border-radius:40px;background:#a5592e;color:white;padding:14px 24px;font:700 14px system-ui;text-decoration:none;cursor:pointer}button:disabled{opacity:.5}[hidden]{display:none!important}</style>
<main><p>OUTLAND GUIDES · PRIVATE LOCAL SETUP</p><h1>Connect real booking payments.</h1><p>In your Stripe dashboard, switch to <strong>Live mode</strong>, finish account and bank verification, then open Developers → API keys.</p><p>Enter your live secret key here. It travels only to Stripe and your protected SiteGround configuration. It is never included in your website files or GitHub repository. This connects payments but does not charge anyone.</p><form id="setup"><label for="key">Live Stripe secret key</label><input id="key" type="password" autocomplete="off" spellcheck="false" placeholder="sk_live_…" required><button>Connect live Stripe</button></form><p id="status" role="status" aria-live="polite"></p><a href="https://outlandguides.com/payments" id="continue" hidden>Open payment page</a></main>
<script>const token=location.hash.slice(1);history.replaceState(null,'',location.pathname);document.getElementById('setup').addEventListener('submit',async event=>{event.preventDefault();const button=event.target.querySelector('button'),key=document.getElementById('key'),status=document.getElementById('status');button.disabled=true;status.textContent='Checking Stripe and connecting your protected SiteGround configuration…';try{const response=await fetch('/connect',{method:'POST',headers:{'Content-Type':'application/json','X-Setup-Token':token},body:JSON.stringify({secret:key.value.trim()})});const result=await response.json();key.value='';if(!response.ok)throw Error(result.error);event.target.hidden=true;status.textContent='Connected. Real payments are enabled for private, approved booking links. No payment has been taken.';document.getElementById('continue').hidden=false}catch(error){key.value='';status.textContent=error.message}finally{button.disabled=false}});</script></html>'''

def main():
    token = secrets.token_hex(32)
    lock = threading.Lock()
    state = {'connected':False}
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass
        def send(self,status,body,content='application/json'):
            self.send_response(status)
            self.send_header('Content-Type',content)
            self.send_header('Cache-Control','no-store')
            self.send_header('X-Content-Type-Options','nosniff')
            self.send_header('Referrer-Policy','no-referrer')
            self.send_header('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; form-action 'none'")
            self.end_headers()
            self.wfile.write((json.dumps(body) if content=='application/json' else body).encode())
        def do_GET(self):
            if self.headers.get('Host') != 'localhost:4185' or self.path != '/stripe-setup':
                self.send(404,{'error':'Not found.'}); return
            self.send(200,PAGE,'text/html; charset=utf-8')
        def do_POST(self):
            if self.path != '/connect' or self.headers.get('Host') != 'localhost:4185' or self.headers.get('Origin') != ORIGIN or not hmac.compare_digest(self.headers.get('X-Setup-Token',''),token):
                self.send(403,{'error':'Open the private setup link on this computer.'}); return
            if not lock.acquire(blocking=False):
                self.send(409,{'error':'A connection request is already running.'}); return
            try:
                if state['connected']:
                    self.send(409,{'error':'Already connected. Close this setup page.'}); return
                length=int(self.headers.get('Content-Length','0'))
                if length<1 or length>8192:
                    self.send(400,{'error':'Invalid request.'}); return
                data=json.loads(self.rfile.read(length))
                result=configure(str(data.get('secret','')).strip())
                state['connected']=True
                self.send(200,result)
                print('Live Stripe connected successfully. No payment was taken.',flush=True)
            except RuntimeError as error:
                self.send(400,{'error':str(error)})
            except Exception:
                self.send(400,{'error':'The connection could not be completed. No private information was printed. Ask to check the Stripe setup.'})
            finally:
                lock.release()
    server=ThreadingHTTPServer(('127.0.0.1',4185),Handler)
    print(ORIGIN+'/stripe-setup#'+token,flush=True)
    server.serve_forever()

if __name__=='__main__':
    main()
