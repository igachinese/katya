(() => {
'use strict';
const at=(date,time='19:00')=>new Date(date+'T'+time+':00+03:00');
const chicago=date=>new Intl.DateTimeFormat('ru-RU',{timeZone:'America/Chicago',hour:'2-digit',minute:'2-digit',hour12:false}).format(date);
const dual=(date,time='19:00')=>time+' МСК ('+chicago(at(date,time))+' · Чикаго)';
const api={at,chicago,dual};if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.KatyaSchedule=api;
})();
