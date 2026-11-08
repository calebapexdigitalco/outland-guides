import test from 'node:test';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4184';
test('public configuration exposes fixed sandbox prices and never credentials',async()=>{
  const response=await fetch(base+'/api/stripe/config');const text=await response.text(),config=JSON.parse(text);
  assert.equal(response.status,200);assert.equal(config.mode,'sandbox');
  assert.deepEqual(config.payments,{Deposit:1000,'Remaining balance':2000,'Full payment':3000});
  assert.doesNotMatch(text,/(sk_test_|rk_test_|sk_live_)/);
});
test('external websites cannot call the local payment API',async()=>{
  const response=await fetch(base+'/api/stripe/config',{headers:{Origin:'https://unrelated.example'}});
  assert.equal(response.status,403);assert.equal(response.headers.get('access-control-allow-origin'),null);
});
test('unknown payment types are rejected before Stripe is contacted',async()=>{
  const response=await fetch(base+'/api/stripe/checkout',{method:'POST',headers:{Origin:'http://localhost:4183','Content-Type':'application/json'},body:JSON.stringify({expedition:'Wildlife Safari',payment_type:'invented',amount:1})});
  assert.equal(response.status,400);assert.match((await response.json()).error,/valid expedition/);
});
test('Kilimanjaro requires one of the four approved route options',async()=>{
  const response=await fetch(base+'/api/stripe/checkout',{method:'POST',headers:{Origin:'http://localhost:4183','Content-Type':'application/json'},body:JSON.stringify({expedition:'Mount Kilimanjaro',payment_type:'Deposit',route:'unapproved'})});
  assert.equal(response.status,400);
});
test('a typed or live session reference cannot claim a successful payment',async()=>{
  for(const id of ['paid','cs_live_example','<script>']){
    const response=await fetch(base+'/api/stripe/status?session_id='+encodeURIComponent(id));
    assert.equal(response.status,400);assert.equal((await response.json()).paid,undefined);
  }
});
test('private setup requires its one-time token',async()=>{
  const response=await fetch(base+'/api/stripe/setup',{method:'POST',headers:{Origin:'http://localhost:4184','Content-Type':'application/json'},body:'{}'});
  assert.equal(response.status,403);
});
test('the local server does not serve its source or credential file',async()=>{
  for(const resource of ['/server.mjs','/stripe-sandbox.json','/..%2fstripe-sandbox/server.mjs']){
    const response=await fetch(base+resource);assert.equal(response.status,404);
  }
});
