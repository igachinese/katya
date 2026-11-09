const assert=require('node:assert/strict');const {chinese,handEnd,summarize,validResult}=require('../homework-time.js');
assert.equal(chinese(2,30),'两点半');assert.equal(chinese(12,45),'十二点三刻');
for(let h=1;h<=12;h++)for(const m of [0,15,30,45]){for(const minute of [false,true]){const [x,y]=handEnd(h,m,minute);assert(Math.abs(Math.hypot(x-80,y-80)-(minute?49:32))<1e-8);}}
const [x,y]=handEnd(2,30);assert(x>110&&y<80&&y>70,'Hour hand must advance halfway between 2 and 3');
assert.deepEqual(handEnd(12,0),[80,48]);
const rows=['read','set'].flatMap(kind=>[0,15,30,45].map((m,i)=>({kind,h:2,m,correct:i<3})));
assert.deepEqual(summarize(rows),[{kind:'read',correct:3,total:4},{kind:'set',correct:3,total:4}]);
assert(validResult({time:Date.now(),rows}));assert(!validResult({time:Date.now(),rows:rows.slice(1)}));assert(!validResult({time:Date.now(),rows:rows.map(r=>({...r,h:15}))}));console.log('Clock positions, 12-hour labels, scoring and saved result validation passed');
