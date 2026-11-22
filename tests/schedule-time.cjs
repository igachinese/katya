const assert=require('node:assert/strict'),s=require('../schedule-time.js');
assert.equal(s.dual('2026-10-25'),'19:00 МСК (11:00 · Чикаго)');
assert.equal(s.dual('2026-11-15'),'19:00 МСК (10:00 · Чикаго)');
assert.equal(s.dual('2026-11-22'),'19:00 МСК (10:00 · Чикаго)');
assert.equal(s.dual('2026-11-29'),'19:00 МСК (10:00 · Чикаго)');
assert.equal(s.dual('2027-03-14'),'19:00 МСК (11:00 · Чикаго)');
const html=require('node:fs').readFileSync(require('node:path').resolve(__dirname,'../index.html'),'utf8');const c=JSON.parse(html.match(/id="dashboard-data" type="application\/json">(.*?)<\/script>/s)[1]);
assert.equal(c.remaining_lessons,7);const planned=c.events.filter(e=>e[2]==='planned');assert.equal(planned.length,7);assert.equal(planned[0][0],'2026-11-29');assert.equal(planned.at(-1)[0],'2027-01-10');assert.equal(c.events.find(e=>e[0]==='2026-11-08')[2],'cancelled');assert.equal(c.events.find(e=>e[0]==='2026-11-15')[2],'cancelled');assert.equal(c.events.find(e=>e[0]==='2026-11-22')[2],'done');console.log('Cancellation, seven dates, lesson 13 done and Chicago daylight saving passed');
