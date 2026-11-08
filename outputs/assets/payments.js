(function(){
  const form=document.getElementById('payment-preview-form');if(!form)return;
  const api=(location.hostname==='localhost'||location.hostname==='127.0.0.1')&&location.port==='4183'?'http://localhost:4184':'';
  const expedition=form.elements.expedition,route=form.elements.route,routeField=document.getElementById('payment-route-field'),review=document.getElementById('payment-review'),complete=document.getElementById('payment-complete'),next=document.getElementById('finish-payment-demo');
  const status=document.createElement('p');status.className='mt-5 text-sm leading-relaxed text-white/75';status.setAttribute('role','status');status.setAttribute('aria-live','polite');review.append(status);
  const connection=document.getElementById('payment-connection');
  let configured=false,prices={},payload=null,requestKey=null,busy=false;
  const money=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
  function showForm(){review.hidden=true;complete.hidden=true;form.hidden=false;form.style.removeProperty('display')}
  function updateAmount(){form.elements.amount.value=(prices[form.elements.payment_type.value]||1000)/100}
  function updateRoute(){const kili=expedition.value==='Mount Kilimanjaro';routeField.hidden=!kili;route.required=kili;if(!kili)route.value=''}
  const params=new URLSearchParams(location.search),requested=params.get('route');
  if(requested&&[...route.options].some(option=>option.value===requested)){expedition.value='Mount Kilimanjaro';route.value=requested}
  updateRoute();expedition.addEventListener('change',updateRoute);form.elements.payment_type.addEventListener('change',updateAmount);
  async function request(path,options={}){const response=await fetch(api+path,{...options,headers:{Accept:'application/json',...options.headers}});const data=await response.json();if(!response.ok)throw Error(data.error||'Unable to complete the payment request.');return data}
  async function loadConnection(){
    next.disabled=true;
    try{const config=await request('/api/stripe/config');configured=config.configured;prices=config.payments;updateAmount();connection.textContent=configured?'Stripe sandbox connected. Use test payment details only. No real funds move.':'Stripe sandbox is ready for your key. Complete the private setup on this computer to enable checkout.';next.disabled=!configured}
    catch{connection.textContent='Sandbox checkout is unavailable. Start the local Stripe server to connect. No payment has been taken.'}
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();
    payload={expedition:expedition.value,route:route.value,payment_type:form.elements.payment_type.value,reference:form.elements.reference.value.trim()};
    requestKey=crypto.randomUUID();
    const rows=[['Expedition',payload.expedition],...(payload.route?[['Route',payload.route]]:[]),['Payment type',payload.payment_type],['Sandbox amount',money(prices[payload.payment_type]||1000)],['Booking reference',payload.reference||'SANDBOX-PREVIEW']];
    const summary=document.getElementById('payment-summary');summary.replaceChildren();
    rows.forEach(([title,value])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');row.className='flex flex-wrap justify-between gap-2 border-b border-white/10 pb-3';dt.className='text-white/55';dd.className='font-bold text-white';dt.textContent=title;dd.textContent=value;row.append(dt,dd);summary.append(row)});
    form.hidden=true;form.style.display='none';review.hidden=false;status.textContent=configured?'Payment details are collected securely on Stripe’s test checkout.':'Complete the private sandbox setup before continuing.';document.getElementById('payment-review-title').focus();
  });
  document.getElementById('edit-payment-demo').addEventListener('click',()=>{if(busy)return;showForm();expedition.focus()});
  next.addEventListener('click',async()=>{
    if(busy||!configured||!payload)return;busy=true;next.disabled=true;next.textContent='Opening Stripe…';status.textContent='Creating your sandbox checkout…';
    try{const session=await request('/api/stripe/checkout',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':requestKey},body:JSON.stringify(payload)});const target=new URL(session.url);if(target.protocol!=='https:'||target.hostname!=='checkout.stripe.com')throw Error('Invalid checkout destination.');location.assign(session.url)}
    catch(error){status.textContent=error.message||'Checkout could not open. Please try again.';busy=false;next.disabled=false;next.textContent='Continue to Stripe sandbox'}
  });
  document.getElementById('restart-payment-demo').addEventListener('click',()=>{showForm();history.replaceState(null,'',location.pathname);expedition.focus()});
  async function verifyReturn(){
    const id=params.get('session_id');if(!id)return;
    form.hidden=true;form.style.display='none';review.hidden=true;complete.hidden=false;
    const heading=complete.querySelector('h3'),message=complete.querySelector('p');heading.textContent='Checking your payment…';message.textContent='Confirming the result directly with Stripe.';
    try{const result=await request('/api/stripe/status?session_id='+encodeURIComponent(id));heading.textContent=result.paid?'Sandbox payment confirmed.':'Payment not completed.';message.textContent=result.paid?money(result.amount)+' test payment confirmed for '+result.expedition+'. No real funds moved and no expedition reservation was created. You can view this transaction in your Stripe sandbox dashboard.':'Stripe has not confirmed a successful payment. No reservation has been created.'}
    catch(error){heading.textContent='Payment confirmation unavailable.';message.textContent='We could not verify this checkout. Check the Stripe sandbox dashboard before trying again. '+error.message}
    heading.focus();
  }
  if(params.has('cancelled')){const cancel=document.createElement('p');cancel.className='mt-4 text-sm text-white';cancel.setAttribute('role','status');cancel.textContent='Checkout cancelled. Review your details to try again.';form.before(cancel)}
  loadConnection().then(verifyReturn);
  window.addEventListener('pageshow',event=>{if(event.persisted){busy=false;next.textContent='Continue to Stripe sandbox';loadConnection()}});
  const toggle=document.getElementById('menu-toggle'),menu=document.getElementById('mobile-menu'),nav=document.getElementById('site-nav');
  toggle?.addEventListener('click',()=>{const open=menu.classList.contains('hidden');menu.classList.toggle('hidden',!open);toggle.setAttribute('aria-expanded',String(open))});
  window.addEventListener('scroll',()=>nav.classList.toggle('nav-scrolled',scrollY>20),{passive:true});
})();
