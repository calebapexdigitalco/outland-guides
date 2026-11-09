const assert=require('node:assert/strict');
const {recommend,path}=require('../outputs/assets/kilimanjaro-route-logic.js');
const base={time:'7',sleep:'either',altitude:'low',fitness:'strong',priority:'scenery',group:'small',cold:'freezing'};
assert.equal(recommend(base).id,'lemosho-7');
assert.equal(recommend({...base,priority:'classic'}).id,'machame-7');
assert.equal(recommend({...base,priority:'value'}).id,'machame-7');
assert.equal(recommend({...base,sleep:'huts'}).id,'marangu-6');
assert.equal(recommend({...base,time:'6',flex:'fixed'}).id,'lemosho-6');
assert.equal(recommend({...base,time:'6',flex:'one',priority:'value'}).id,'machame-7');
assert.equal(recommend({...base,time:'5',flex:'one',sleep:'huts'}).id,'marangu-6');
const five=recommend({...base,time:'5',flex:'fixed',sleep:'tents',altitude:'high',response:'well'});
assert.equal(five.id,'marangu-5');assert.equal(five.status,'review');assert.ok(five.tradeoffs.some(t=>t.includes('no exact match')));
assert.equal(recommend({...base,fitness:'building'}).status,'review');
assert.equal(recommend({...base,altitude:'high',response:'concern'}).status,'review');
assert.equal(recommend({...base,altitude:'high',response:'well'}).id,recommend(base).id,'Past altitude never shortens the schedule.');
assert.equal(recommend({...base,cold:'winter',group:'large'}).id,recommend(base).id,'Cold experience and group size cannot reduce altitude margins.');
assert.ok(!path(base).some(q=>q.id==='flex'||q.id==='response'));
assert.ok(path({...base,time:'6',altitude:'high'}).some(q=>q.id==='response'));
assert.throws(()=>recommend({...base,fitness:'invented'}));
assert.throws(()=>recommend({...base,time:'6'}));
for(const time of ['5','6','7','flexible'])for(const flex of ['fixed','one','two'])for(const sleep of ['huts','tents','either'])for(const priority of ['margin','scenery','value','classic']){
  const result=recommend({...base,time,flex,sleep,priority});
  assert.ok(['machame-6','machame-7','lemosho-6','lemosho-7','marangu-5','marangu-6'].includes(result.id));
  assert.ok(Number(result.id.at(-1))<=result.available);
}
console.log('Route finder: branching, all six route matches, time constraints, and conservative review rules passed.');
