const assert=require('node:assert/strict'),s=require('../schedule-time.js');
assert.equal(s.dual('2026-10-25'),'18:00 МСК (10:00 · Чикаго)');
assert.equal(s.dual('2026-11-15'),'18:00 МСК (09:00 · Чикаго)');
assert.equal(s.dual('2027-03-14'),'18:00 МСК (10:00 · Чикаго)');
const html=require('node:fs').readFileSync(require('node:path').resolve(__dirname,'../index.html'),'utf8');const c=JSON.parse(html.match(/id="dashboard-data" type="application\/json">(.*?)<\/script>/s)[1]);
assert.equal(c.remaining_lessons,8);const planned=c.events.filter(e=>e[2]==='planned');assert.equal(planned.length,8);assert.equal(planned[0][0],'2026-11-15');assert.equal(planned.at(-1)[0],'2027-01-03');assert.equal(c.events.find(e=>e[0]==='2026-11-08')[2],'cancelled');console.log('Cancellation, eight dates and Chicago daylight saving passed');
