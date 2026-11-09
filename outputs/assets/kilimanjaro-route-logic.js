/* Route matching is a planning aid, never a medical clearance or summit forecast. */
(function (root) {
  'use strict';
  const questions = [
    {id:'time',title:'How many days can you spend on the mountain?',help:'Count trekking days only. International travel, arrival briefing, and hotel nights need extra time.',options:[['5','Five days'],['6','Six days'],['7','Seven days'],['flexible','My dates are flexible']]},
    {id:'flex',title:'Could you make room for more mountain time?',help:'An extra day can change the itinerary we can discuss with you.',options:[['two','I could add up to two days'],['one','I could add one day'],['fixed','My mountain days are fixed']],show:a=>['5','6'].includes(a.time)},
    {id:'sleep',title:'Where would you rather sleep?',help:'Marangu uses shared huts. Machame and Lemosho use tented camps. All routes still require warm personal sleeping gear.',options:[['huts','Shared huts'],['tents','Tented mountain camps'],['either','Either works for me']]},
    {id:'altitude',title:'What is the highest elevation you have hiked to?',help:'Past altitude experience helps us understand your background. It does not mean you are acclimatized for this trip.',options:[['low','Below 2,500 m / 8,200 ft'],['middle','2,500–4,000 m / 8,200–13,100 ft'],['high','Above 4,000 m / 13,100 ft']]},
    {id:'response',title:'How did you feel on that high-altitude trip?',help:'We use this to identify questions for a personal consultation, not to diagnose altitude illness.',options:[['well','I managed the trip without altitude concerns'],['concern','Altitude symptoms changed my plans'],['discuss','I would rather discuss it with you']],show:a=>a.altitude&&a.altitude!=='low'},
    {id:'fitness',title:'What best describes your hiking readiness today?',help:'Think about sustained uphill walking with a daypack. Fitness helps with the workload; it does not protect against altitude illness.',options:[['building','I am starting to build a hiking base'],['regular','I regularly hike for 3–5 hours'],['strong','I am comfortable with long hikes on consecutive days']]},
    {id:'priority',title:'What matters most when choosing your route?',help:'We will honor your available time and accommodation preference first.',options:[['margin','More time to acclimatize'],['scenery','Western approach and Shira Plateau scenery'],['value','Keeping the overall trip cost down'],['classic','The classic southern circuit']]},
    {id:'group',title:'Who is coming with you?',help:'We plan around the least experienced member. Online Kilimanjaro group pricing starts at two travelers; solo travelers can discuss joining a departure.',options:[['solo','Just me for now'],['small','2–4 people'],['medium','5–8 people'],['large','9 or more people']]},
    {id:'cold',title:'How familiar are you with cold overnight conditions?',help:'This shapes your gear consultation. Shared huts do not remove the need to prepare for a very cold summit night.',options:[['new','I have not slept outdoors near freezing'],['freezing','I have camped around 0°C / 32°F'],['winter','I have camped below −10°C / 14°F']]}
  ];
  const routeNames={'machame-6':'Machame 6-Day','machame-7':'Machame 7-Day','lemosho-6':'Lemosho 6-Day','lemosho-7':'Lemosho 7-Day','marangu-5':'Marangu 5-Day','marangu-6':'Marangu 6-Day'};
  function path(answers) { return questions.filter(q=>!q.show||q.show(answers)); }
  function recommend(a) {
    const active=path(a);
    if(active.some(q=>!q.options.some(o=>o[0]===a[q.id]))) throw Error('Please complete the route finder before viewing a match.');
    const base=a.time==='flexible'?7:Number(a.time);
    const available=Math.min(7,base+(['5','6'].includes(a.time)?a.flex==='two'?2:a.flex==='one'?1:0:0));
    const reasons=[],preparation=[],tradeoffs=[];
    let id,status='match';
    if(available===5){
      id='marangu-5';status='review';
      reasons.push('Marangu 5-Day is the only current itinerary that fits five fixed mountain days.');
      tradeoffs.push('Five days offers the least acclimatization time in our range. We need to discuss your schedule and altitude preparation before recommending it.');
      if(a.sleep==='tents')tradeoffs.push('Your tent preference conflicts with the only five-day option, which uses shared huts. There is no exact match for those two preferences.');
      preparation.push('If your calendar changes, discuss Marangu 6-Day or a seven-day tented route for more mountain time.');
    } else if(a.sleep==='huts'){
      id='marangu-6';
      reasons.push('You prefer shared huts, so Marangu is the relevant approach.','The six-day version adds an acclimatization walk and a second night at Horombo.');
      tradeoffs.push('Marangu ascends and descends along the same corridor. Hut beds are shared, and a warm sleeping bag is still essential.');
      if(available===7)tradeoffs.push('This match uses six mountain days. An extra travel or hotel day is not an extra acclimatization day on the route; discuss a seven-day tented option if mountain time is your priority.');
    } else {
      const days=available>=7?7:6;
      const approach=['value','classic'].includes(a.priority)?'machame':'lemosho';
      id=approach+'-'+days;
      reasons.push(days===7?'Your available time allows a seven-day itinerary with Karanga and Barafu on separate days.':'Your calendar fits a six-day tented itinerary.');
      reasons.push(approach==='lemosho'?'Lemosho follows the western forest approach and crosses the Shira Plateau.':'Machame follows the classic southern circuit; its listed starting price is lower than Lemosho at the same duration.');
      tradeoffs.push(days===6?'The six-day tented itineraries combine the Karanga–Barafu stage, creating a longer day immediately before the summit attempt.':'Seven days adds time compared with our compact options, but is still a demanding ascent to 5,895 m.');
      if(a.altitude==='low'&&days===6)preparation.push('For a first major altitude trip, discuss adding mountain time rather than choosing six days on schedule alone.');
    }
    if(available>base)reasons.push('You allowed extra mountain time, so the match uses that flexibility rather than automatically choosing the shortest itinerary.');
    if(a.fitness==='building'){
      status='review';preparation.push('Build a sustained hiking base and agree a training runway with us before fixing a route or departure.');
    } else if(a.fitness==='regular')preparation.push('Prepare for consecutive hiking days and a much longer summit day; we will help you plan the progression.');
    if(a.altitude!=='low'&&['concern','discuss'].includes(a.response)){
      status='review';preparation.push('Discuss your previous altitude response with us and a clinician familiar with altitude travel before committing to an itinerary.');
    }
    if(a.cold==='new')preparation.push('Include a personal cold-weather gear audit and practice using your sleeping system before departure.');
    else preparation.push('Review your sleeping bag and summit layering system against the route-specific gear list.');
    preparation.push(a.group==='solo'?'We will discuss a suitable departure or group arrangement and confirm solo pricing personally.':a.group==='large'?'A larger party needs a readiness review, hut or camp capacity checks, and a confirmed group quote.':'Confirm that everyone in your group is comfortable with the itinerary; we plan to the least experienced member.');
    return {id,name:routeNames[id],status,available,reasons,tradeoffs,preparation};
  }
  const api={questions,path,recommend,routeNames};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.OutlandRouteMatcher=api;
})(typeof window==='undefined'?{}:window);
