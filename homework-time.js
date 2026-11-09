(() => {
'use strict';
const numerals=['','一','两','三','四','五','六','七','八','九','十','十一','十二'];
function chinese(h,m){return numerals[h]+'点'+({0:'',15:'一刻',30:'半',45:'三刻'}[m]);}
function handEnd(h,m,minute=false){const angle=(minute?m/60:(h%12+m/60)/12)*2*Math.PI;const length=minute?49:32;return [80+Math.sin(angle)*length,80-Math.cos(angle)*length];}
function summarize(rows){return ['read','set'].map(kind=>{const items=rows.filter(r=>r.kind===kind);return {kind,correct:items.filter(r=>r.correct).length,total:items.length};});}
function validResult(r){return r&&Number.isFinite(r.time)&&Array.isArray(r.rows)&&r.rows.length===8&&r.rows.every(q=>['read','set'].includes(q.kind)&&Number.isInteger(q.h)&&q.h>=1&&q.h<=12&&[0,15,30,45].includes(q.m)&&typeof q.correct==='boolean')&&r.rows.filter(q=>q.kind==='read').length===4;}
if(typeof module!=='undefined'&&module.exports){module.exports={chinese,handEnd,summarize,validResult};return;}
const $=id=>document.getElementById(id),key='katya.homework.time.v1';let rows=[],queue=[],cursor=0,locked=false,saved=[];
try{saved=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(saved))saved=[];saved=saved.filter(validResult).slice(-5);}catch{saved=[];}
function shuffle(a){const items=[...a];for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}
function clock(h,m){let svg='<svg viewBox="0 0 160 160" class="game-clock" role="img" aria-label="Циферблат для задания"><circle cx="80" cy="80" r="74" fill="#fff" stroke="currentColor" stroke-width="2"/>';
for(let i=1;i<=12;i++){const a=i*Math.PI/6;svg+=`<text x="${80+58*Math.sin(a)}" y="${80-58*Math.cos(a)}" text-anchor="middle" dy=".35em" font-size="14">${i}</text>`;}
for(const minute of [false,true]){const [x,y]=handEnd(h,m,minute);svg+=`<path d="M80 80L${x} ${y}" stroke="${minute?'#be8540':'#27634e'}" stroke-width="${minute?2.5:4.5}" stroke-linecap="round"/>`;}
return svg+'<circle cx="80" cy="80" r="3" fill="currentColor"/></svg>';}
function renderReport(){const last=saved.at(-1);$('practice-empty').hidden=Boolean(last);$('practice-result').hidden=!last;if(!last)return;
const score=last.rows.filter(q=>q.correct).length;$('result-score').textContent=score+' из 8';$('result-date').textContent=new Date(last.time).toLocaleString('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'});
$('skill-results').innerHTML=summarize(last.rows).map(s=>`<div class="skill-row"><div><b>${s.kind==='read'?'Читает время на циферблате':'Ставит часы по китайской подписи'}</b><small>${s.correct} из ${s.total} верно с первой попытки</small></div><span class="skill-status">${s.correct===s.total?'В этом раунде получилось':'Ещё потренируем'}</span></div>`).join('');
const missed=[...new Set(last.rows.filter(q=>!q.correct).map(q=>chinese(q.h,q.m)))];$('practice-next').textContent=missed.length?'Повторим: '+missed.join(' · ')+'. Затем попробуем новый раунд.':'Следующий шаг: назвать несколько времён вслух без вариантов ответа на занятии.';
$('result-history').textContent=saved.length>1?'Последние раунды: '+saved.map(r=>r.rows.filter(q=>q.correct).length+'/8').join(' → '):'Первый сохранённый раунд';
}
function begin(){rows=[];cursor=0;const hours=shuffle([1,2,3,4,5,6,7,8,9,10,11,12]);queue=['read','set'].flatMap((kind,k)=>shuffle([0,15,30,45]).map((m,i)=>({h:hours[k*4+i],m,kind})));$('game-start').hidden=true;$('game-stage').hidden=false;render();}
function render(){locked=false;const q=queue[cursor];$('game-meter').value=cursor;$('game-count').textContent='Задание '+(cursor+1)+' из 8';$('game-feedback').textContent='';$('game-next').hidden=true;
$('game-question').textContent=q.kind==='read'?'Какое время показывают часы?':'Поставь время на часах';
if(q.kind==='read'){const opts=shuffle([{h:q.h,m:q.m},{h:q.h%12+1,m:q.m},{h:q.h,m:(q.m+30)%60}]);$('game-arena').innerHTML=clock(q.h,q.m)+'<div class="time-options">'+opts.map((o,i)=>`<button class="time-choice" data-option="${i}" lang="zh-CN">${chinese(o.h,o.m)}</button>`).join('')+'</div>';$('game-arena').querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>{const o=opts[Number(b.dataset.option)];answer(o.h===q.h&&o.m===q.m);b.classList.add(o.h===q.h&&o.m===q.m?'is-correct':'is-wrong');});}
else{$('game-arena').innerHTML=`<div class="time-prompt" lang="zh-CN">${chinese(q.h,q.m)}</div><div id="setting-clock">${clock(12,0)}</div><div class="time-controls"><label>Час<select id="set-hour" aria-label="Час">${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${i===11?'selected':''}>${i+1}</option>`).join('')}</select></label><label>Минуты<select id="set-minute" aria-label="Минуты">${[0,15,30,45].map(m=>`<option value="${m}">${String(m).padStart(2,'0')}</option>`).join('')}</select></label></div><p class="game-help">Меняй числа — стрелки будут двигаться. Короткая зелёная — часы, длинная золотая — минуты.</p><button id="check-time">Проверить часы</button>`;
const update=()=>$('setting-clock').innerHTML=clock(Number($('set-hour').value),Number($('set-minute').value));$('set-hour').onchange=update;$('set-minute').onchange=update;$('check-time').onclick=()=>answer(Number($('set-hour').value)===q.h&&Number($('set-minute').value)===q.m);}
}
function answer(correct){if(locked)return;locked=true;const q=queue[cursor];rows.push({...q,correct});$('game-feedback').textContent=(correct?'Верно! ':'Запомним: ')+chinese(q.h,q.m)+' — '+q.h+':'+String(q.m).padStart(2,'0')+'.';$('game-feedback').className='game-feedback '+(correct?'good':'retry');$('game-arena').querySelectorAll('button,select').forEach(b=>b.disabled=true);$('game-next').hidden=false;$('game-next').textContent=cursor===7?'Посмотреть результат':'Следующее задание';$('game-meter').value=cursor+1;}
function finish(){const result={time:Date.now(),rows:[...rows]};saved.push(result);saved=saved.slice(-5);try{localStorage.setItem(key,JSON.stringify(saved));}catch{$('save-note').textContent='Браузер не разрешил сохранить результат. Он виден до закрытия страницы.';}renderReport();$('game-stage').hidden=true;$('game-start').hidden=false;$('game-start').textContent='Попробовать ещё раз';$('practice-report').scrollIntoView({behavior:'smooth',block:'start'});}
$('game-start').onclick=begin;$('game-next').onclick=()=>{if(!locked)return;if(++cursor===queue.length)finish();else render();};renderReport();
})();
