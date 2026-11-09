(function(){
  'use strict';
  function initialize(){
    const matcher=window.OutlandRouteMatcher,overview=document.querySelector('[data-panel="overview"]'),tabList=document.querySelector('[role="tablist"]');
    if(!matcher||!overview||!tabList||document.getElementById('kilimanjaro-route-finder'))return;
    const tab=document.createElement('button');tab.type='button';tab.dataset.tab='route-finder';tab.className='tab whitespace-nowrap px-5 py-5 text-xs font-black uppercase tracking-[.12em] text-white/60';tab.setAttribute('aria-selected','false');tab.textContent='Route Finder';
    tabList.insertBefore(tab,tabList.querySelector('[data-tab="itinerary"]'));
    const panel=document.createElement('div');panel.dataset.panel='route-finder';panel.className='hidden kili-tab-panel';
    panel.innerHTML='<section id="kilimanjaro-route-finder" class="route-finder" aria-labelledby="rf-title"><p class="rf-kicker">Three approaches. Six itineraries. Your starting point.</p><h2 id="rf-title" class="rf-heading">Find your way up.</h2><p class="rf-intro">A few questions about your calendar, hiking background, and priorities. We’ll suggest an itinerary to discuss, explain the tradeoffs, and help you prepare for a personal conversation.</p><div class="rf-shell"><aside class="rf-rail" aria-hidden="true"><p class="rf-kicker">The route pathway</p><svg viewBox="0 0 120 130" fill="none"><path d="M60 8v25M60 33 20 63v28M60 33l40 30v28M20 91l40 30 40-30" stroke="currentColor" stroke-width="1.5"/><circle cx="60" cy="8" r="6" fill="currentColor"/><circle cx="20" cy="63" r="7" fill="#20201d" stroke="currentColor"/><circle cx="100" cy="63" r="7" fill="#20201d" stroke="currentColor"/><circle cx="60" cy="121" r="6" fill="currentColor"/></svg><p>Your time.<br>Your preferred approach.<br>A conversation with real people.</p></aside><div class="rf-main" id="rf-main"></div></div><details class="rf-disclosure"><summary>How we make this match</summary><p>We first filter by mountain days and shared huts versus tents. Within tented options, scenery favors Lemosho; the classic southern circuit or lower listed price favors Machame. Where your calendar allows, we use the longer version. A fixed five-day calendar, a hiking base still in development, or a previous altitude concern calls for personal review. Group size and cold-weather experience shape logistics and gear advice, not an altitude-safety score.</p><p>This tool compares Outland’s six advertised itineraries. It does not assess medical fitness or predict a summit. Historical altitude exposure is not current acclimatization, and physical fitness does not protect against altitude illness. Even the longer options require careful preparation and guide judgment. <a href="https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html" target="_blank" rel="noopener noreferrer">CDC altitude guidance</a> · <a href="https://www.tanzaniaparks.go.tz/kilimanjaro/visitor-guide" target="_blank" rel="noopener noreferrer">Kilimanjaro National Park visitor guide</a></p><p>Your answers stay in this page’s memory. We add a readable summary to the inquiry only when you choose to talk with us; you can edit or remove it before submitting.</p></details></section>';
    overview.parentElement.append(panel);
    const teaser=document.createElement('aside');teaser.className='rf-teaser';teaser.innerHTML='<div><p class="rf-kicker">Not sure which route fits?</p><h3>Start with your kind of climb.</h3><p>Compare your available days, hut or tent preference, and hiking background. Get a route suggestion with the reasoning behind it.</p></div><button class="rf-button" type="button">Find my route →</button>';
    teaser.querySelector('button').onclick=()=>tab.click();overview.prepend(teaser);
    const main=panel.querySelector('#rf-main');let answers={},index=0;
    const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
    const button=(text,action,secondary=false)=>{const node=el('button',text,'rf-button'+(secondary?' rf-secondary':''));node.type='button';node.onclick=action;return node;};
    function focusQuestion(){
      main.querySelector('legend,h3')?.focus({preventScroll:true});
      requestAnimationFrame(()=>{
        const header=document.getElementById('site-nav')?.getBoundingClientRect().height||0;
        const tabs=tabList.closest('section')?.getBoundingClientRect().height||0;
        window.scrollTo({top:Math.max(0,main.getBoundingClientRect().top+window.scrollY-header-tabs-20),behavior:'smooth'});
      });
    }
    function render(){
      const questions=matcher.path(answers),q=questions[index];main.replaceChildren();
      const top=el('div',undefined,'rf-progress-copy');top.append(el('span','Question '+(index+1)+' of '+questions.length),el('span','About two minutes'));main.append(top);
      const progress=el('progress',undefined,'rf-progress');progress.max=questions.length;progress.value=index;progress.setAttribute('aria-label','Route finder progress');main.append(progress);
      const form=el('form'),fieldset=el('fieldset'),legend=el('legend',q.title,'rf-question');legend.tabIndex=-1;fieldset.append(legend);
      const help=el('p',q.help,'rf-help');help.id='rf-question-help';fieldset.setAttribute('aria-describedby',help.id);fieldset.append(help);
      const options=el('div',undefined,'rf-options');
      const next=el('button',index===questions.length-1?'See my route match':'Continue →','rf-button');next.type='submit';next.disabled=!answers[q.id];
      q.options.forEach(([value,label])=>{const option=el('label',undefined,'rf-option'),input=document.createElement('input');input.type='radio';input.name=q.id;input.value=value;input.checked=answers[q.id]===value;input.required=true;input.onchange=()=>{answers[q.id]=value;next.disabled=false;next.textContent=index===matcher.path(answers).length-1?'See my route match':'Continue →';};option.append(input,el('span',label));options.append(option);});
      fieldset.append(options);form.append(fieldset);const controls=el('div',undefined,'rf-controls'),back=button('← Back',()=>{index--;render();focusQuestion();},true);back.disabled=index===0;controls.append(back,next);form.append(controls);main.append(form);
      form.onsubmit=event=>{event.preventDefault();if(!answers[q.id])return;if(index<matcher.path(answers).length-1){index++;render();}else showResult();focusQuestion();};
    }
    function summary(result){return 'Kilimanjaro route finder\nSuggested itinerary to discuss: '+result.name+'\n'+(result.status==='review'?'Personal review requested.\n':'')+matcher.path(answers).map(q=>q.title+' '+q.options.find(o=>o[0]===answers[q.id])[1]).join('\n');}
    function showResult(){
      const result=matcher.recommend(answers);main.replaceChildren();const box=el('div',undefined,'rf-result');box.append(el('span',result.status==='review'?'Let’s review this together':'Your starting-point match','rf-status'));
      const heading=el('h3',result.name,'rf-result-title');heading.tabIndex=-1;box.append(heading);
      box.append(el('p',result.status==='review'?'A route to discuss, rather than a recommendation to book yet. Your answers identify preparation or timing questions we should work through personally.':'This is a starting point for planning. Our team will confirm the itinerary, readiness, logistics, and availability with you.','rf-help'));
      [['Why this option',result.reasons],['Tradeoffs to understand',result.tradeoffs],['What we would talk through',result.preparation]].forEach(([title,items])=>{box.append(el('h4',title));const list=el('ul');items.forEach(text=>list.append(el('li',text)));box.append(list);});
      const actions=el('div',undefined,'rf-actions'),contact=button('Talk this through with us',()=>{});contact.classList.add('rf-primary');contact.dataset.openModal='';contact.dataset.expedition='Mount Kilimanjaro';contact.dataset.routeFinderSummary=summary(result);actions.append(contact,button('View this itinerary',()=>{
        tabList.querySelector('[data-tab="itinerary"]').click();requestAnimationFrame(()=>document.querySelector('[data-panel="itinerary"] .route-side a[href="#'+result.id.replace('-','')+'"]')?.click());
      },true));box.append(actions,el('p','We’ll bring your answers into the inquiry so you don’t have to start again. Review or edit that summary before sending. No booking or payment is made here.','rf-help'));
      const details=el('details',undefined,'rf-disclosure');details.append(el('summary','Review your answers'));const responses=el('dl',undefined,'rf-answers');matcher.path(answers).forEach(q=>responses.append(el('dt',q.title),el('dd',q.options.find(o=>o[0]===answers[q.id])[1])));details.append(responses);box.append(details);
      const controls=el('div',undefined,'rf-actions');controls.append(button('← Edit answers',()=>{index=0;render();focusQuestion();},true),button('Start again',()=>{answers={};index=0;render();focusQuestion();},true));box.append(controls);main.append(box);
    }
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize);else initialize();
})();
