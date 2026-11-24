const root = document.querySelector('#daily-game');
const art = 'lessons/media/daily-routine/studio/';
const media = 'lessons/media/homework-daily-routine/';
const progressKey = 'katya-radio-diary-2026-11-22';
const completeKey = 'chinese-homework:katya:task-radio-diary-nov22';

const day = [
  {key:'wake', action:'Подъём', time:'06:00', choices:['06:30','07:00','06:00'], zh:'我早上六点起床。', py:'Wǒ zǎoshang liù diǎn qǐchuáng.', ru:'Я встаю в шесть утра.', hint:'六点 — шесть часов. Слова 半 здесь нет.'},
  {key:'breakfast', action:'Завтрак', time:'06:30', choices:['06:30','06:15','07:30'], zh:'我早上六点半吃早饭。', py:'Wǒ zǎoshang liù diǎn bàn chī zǎofàn.', ru:'Я завтракаю в половине седьмого утра.', hint:'六点半 — 6:30. 半 добавляет полчаса.'},
  {key:'noon', action:'Полдень', time:'12:00', choices:['10:00','12:00','12:30'], zh:'现在是中午十二点。', py:'Xiànzài shì zhōngwǔ shí’èr diǎn.', ru:'Сейчас двенадцать часов дня.', hint:'中午 — полдень, 十二 — двенадцать.'},
  {key:'home', action:'Домой', time:'14:30', choices:['14:15','14:30','16:30'], zh:'我下午两点半回家。', py:'Wǒ xiàwǔ liǎng diǎn bàn huí jiā.', ru:'Я возвращаюсь домой в половине третьего дня.', hint:'下午两点半 — в 14:30. После полудня два часа — это 14:00.'},
  {key:'study', action:'Уроки', time:'16:00', choices:['16:30','15:00','16:00'], zh:'我下午四点做作业。', py:'Wǒ xiàwǔ sì diǎn zuò zuòyè.', ru:'Я делаю уроки в четыре дня.', hint:'四点 — четыре часа. 下午 относит это время ко второй половине дня.'},
  {key:'sleep', action:'Сон', time:'22:30', choices:['22:30','21:30','22:00'], zh:'我晚上十点半睡觉。', py:'Wǒ wǎnshang shí diǎn bàn shuìjiào.', ru:'Я ложусь спать в половине одиннадцатого вечера.', hint:'晚上十点半 — 22:30. Слышны и 十, и 半.'},
];
let nextCard = 0;
try {
  const saved = Number(localStorage.getItem(progressKey));
  if (Number.isInteger(saved) && saved >= 0 && saved <= day.length) nextCard = saved;
} catch {}
let audio;
let heard = false;

function store() {
  try {
    localStorage.setItem(progressKey, String(nextCard));
    if (nextCard === day.length) localStorage.setItem(completeKey,'true');
  } catch {}
}

function picture(entry) {
  if (entry.key === 'noon') return '<span class="noon" aria-hidden="true">☀</span>';
  return `<img src="${art}${entry.key}.webp" width="384" height="384" alt="">`;
}

function timeline(index) {
  return `<ol class="daily-deck" aria-label="Дневник">${day.map((entry, i) => `<li ${i < nextCard ? 'data-found' : ''} ${i === index ? 'data-now aria-current="step"' : ''}>
      ${picture(entry)}<small>${entry.action}</small><b>${i < nextCard ? entry.time : '—'}</b>
    </li>`).join('')}</ol>`;
}

function stopAudio() {
  audio?.pause();
}

async function playClip(src, onError) {
  stopAudio();
  const current = new Audio(src);
  audio = current;
  try { await current.play(); }
  catch(error) {
    if (audio === current && error.name !== 'AbortError') onError();
  }
}

function listen(entry, slow, feedback) {
  heard = true;
  playClip(`${media}${entry.key}${slow ? '-slow' : ''}.mp3`, () => {
    if (!feedback.isConnected) return;
    root.querySelector('details.hint').open = true;
    feedback.textContent = 'Звук не загрузился. Фраза в подсказке.';
  });
}

function line(entry) {
  return `<div class="revealed"><p lang="zh">${entry.zh}</p><small>${entry.py}</small><small>${entry.ru}</small></div>`;
}

function result() {
  root.innerHTML = `<article class="sheet result"><header class="sheet-header">
    <p class="eyebrow">Домашка выполнена · 6 из 6</p><h1>Дневник восстановлен</h1>
    <p>Катя, ты услышала каждую запись и нашла ей место в расписании.</p>
    </header>${timeline(-1)}
    <div class="finish-line"><h2>Теперь про твой день</h2>
      <p>Скажи одну фразу о себе. Поставь время перед действием.</p>
      <p lang="zh">我下午……点回家。</p>
    </div>
    <div class="actions"><button class="btn secondary restart" type="button">Сыграть ещё раз</button>
      <a class="btn" href="#notebook">К тетради</a>
      <a class="btn secondary" href="index.html#homework">К домашке</a></div>
    <p class="translation">Можно сделать скриншот этого экрана для преподавателя.</p>
  </article>`;
  root.querySelector('.restart').addEventListener('click',() => {
    nextCard = 0;
    store();
    draw(true);
  });
}

function draw(focus = false) {
  stopAudio();
  heard = false;
  const index = nextCard;
  const entry = day[index];
  if (!entry) result();
  else {
    root.innerHTML = `<article class="sheet"><header class="sheet-header">
      <p class="eyebrow">Мой обычный день · домашка</p>
      <h1>Радиодневник</h1><p>Голосовые записи остались без времени. Послушай их и восстанови расписание.</p></header>
      <div class="practice note">
        <div class="note-pic">${picture(entry)}</div>
        <div class="note-body"><p class="eyebrow">Запись ${index + 1} из ${day.length}</p><h2>${entry.action}</h2>
          <div class="actions"><button class="btn play" type="button">Слушать</button>
            <button class="btn secondary slow" type="button">Медленнее</button></div>
          <div class="time-picks">${entry.choices.map(time=>`<button class="opt pick" type="button" data-time="${time}">${time}</button>`).join('')}</div>
          <p class="status" role="status"></p>
          <details class="hint"><summary>Подсказка</summary>${line(entry)}<p>${entry.hint}</p></details>
          <div class="after" hidden>${line(entry)}<button class="btn footer-actions next" type="button">${index + 1 === day.length ? 'К результату' : 'Следующая запись'}</button></div>
        </div>
      </div>
      <div class="timeline">${timeline(index)}</div>
    </article>`;

    const status = root.querySelector('.status');
    const picks = [...root.querySelectorAll('.pick')];
    root.querySelector('.play').addEventListener('click', () => listen(entry,false,status));
    root.querySelector('.slow').addEventListener('click', () => listen(entry,true,status));
    for (const pick of picks) pick.addEventListener('click', () => {
      if (!heard) { status.textContent = 'Сначала послушай запись.'; listen(entry,false,status); return; }
      if (pick.dataset.time !== entry.time) {
        status.textContent = 'Почти! Переслушай число и проверь, есть ли 半.';
        pick.removeAttribute('data-retry');
        void pick.offsetWidth;
        pick.dataset.retry = '';
        return;
      }
      picks.forEach(option => { option.disabled = true; });
      pick.dataset.correct = '';
      nextCard = index + 1;
      store();
      root.querySelector('.timeline').innerHTML = timeline(index);
      status.textContent = 'Верно! Запись на своём месте.';
      root.querySelector('.after').hidden = false;
      root.querySelector('.next').focus({preventScroll:true});
    });
    root.querySelector('.next').addEventListener('click',() => draw(true));
  }
  if (focus) {
    const heading = root.querySelector('h2') || root.querySelector('h1');
    heading.tabIndex = -1;
    heading.focus({preventScroll:true});
  }
}

window.addEventListener('pagehide', stopAudio);
draw();

const notebookKey = 'katya-radio-diary-notebook-2026-11-22';
const periods = [
  ['morning','早上','zǎoshang','утро','wake'],
  ['noon','中午','zhōngwǔ','полдень','noon'],
  ['afternoon','下午','xiàwǔ','вторая половина дня','home'],
  ['evening','晚上','wǎnshang','вечер','sleep'],
];
const activities = [
  ['wake','起床','qǐchuáng','вставать с постели'],
  ['breakfast','吃早饭','chī zǎofàn','завтракать'],
  ['home','回家','huí jiā','возвращаться домой'],
  ['study','做作业','zuò zuòyè','делать домашнее задание'],
  ['sleep','睡觉','shuìjiào','ложиться спать'],
];
const notebook = document.querySelector('#notebook');
const count = notebook.querySelector('#notebook-count');
const recallButton = notebook.querySelector('#notebook-recall');
const audioStatus = notebook.querySelector('#notebook-audio');
let copied = new Set();
let recall = false;
try {
  const saved = JSON.parse(localStorage.getItem(notebookKey));
  if (Array.isArray(saved)) copied = new Set(saved);
} catch {}

function terms(title, words, image, clip, label) {
  return `<section class="notebook-group">
    <h3>${title}</h3>
    <ul class="notebook-terms">${words.map(([key, zh, py, ru, example]) =>
      `<li class="notebook-term">
        <img src="${image(key)}" alt="" width="432" height="432" loading="lazy">
        <div class="notebook-term-body">
          <p class="notebook-gloss">${ru}</p>
          <div class="notebook-answer" id="answer-${key}">
            <strong lang="zh">${zh}</strong><span>${py}</span>
          </div>
          <button class="btn secondary notebook-reveal" type="button" aria-controls="answer-${key}" aria-expanded="false" hidden>Показать</button>
          <button class="btn secondary notebook-play" type="button" data-audio="${clip(key,example)}" aria-label="${label}: ${ru}">${label}</button>
          <label class="notebook-mark"><input type="checkbox" data-copied="${key}"> Записала</label>
        </div>
      </li>`).join('')}</ul>
  </section>`;
}

notebook.querySelector('#notebook-words').innerHTML =
  terms('Части дня', periods, key=>`${media}notebook-${key}.webp`, (_,example)=>`${media}${example}.mp3`, 'Слушать пример') +
  terms('Действия', activities, key=>`${art}${key}.webp`, key=>`${art}${key}.mp3`, 'Слушать слово');
notebook.querySelector('#notebook-recordings').innerHTML = day.map(entry=>`<li>
  <div class="notebook-recording-head"><b>${entry.time} · ${entry.action}</b>
    <button class="btn secondary" type="button" data-audio="${media}${entry.key}.mp3" aria-label="Слушать: ${entry.action}">Слушать</button></div>
  ${line(entry)}
</li>`).join('');

const marks = [...notebook.querySelectorAll('[data-copied]')];
function updateCopied() {
  count.textContent = `В тетради: ${marks.filter(mark=>mark.checked).length} из ${marks.length}`;
}
for (const mark of marks) {
  mark.checked = copied.has(mark.dataset.copied);
  mark.addEventListener('change', () => {
    if (mark.checked) copied.add(mark.dataset.copied);
    else copied.delete(mark.dataset.copied);
    try { localStorage.setItem(notebookKey, JSON.stringify([...copied])); } catch {}
    updateCopied();
  });
}
updateCopied();

function showAnswer(button, show) {
  notebook.querySelector('#' + button.getAttribute('aria-controls')).hidden = !show;
  button.setAttribute('aria-expanded', String(show));
  button.textContent = show ? 'Спрятать ответ' : 'Показать';
}
const revealButtons = [...notebook.querySelectorAll('.notebook-reveal')];
recallButton.hidden = false;
recallButton.addEventListener('click', () => {
  recall = !recall;
  notebook.querySelector('.notebook-lines').open = !recall;
  recallButton.setAttribute('aria-pressed', String(recall));
  recallButton.textContent = recall ? 'Показать весь китайский' : 'Спрятать китайский';
  for (const button of revealButtons) {
    button.hidden = !recall;
    showAnswer(button, !recall);
  }
});
for (const button of revealButtons) {
  button.addEventListener('click', () => showAnswer(button, button.getAttribute('aria-expanded') !== 'true'));
}
for (const button of notebook.querySelectorAll('[data-audio]')) {
  button.addEventListener('click', () => {
    audioStatus.textContent = '';
    playClip(button.dataset.audio, () => { audioStatus.textContent = 'Звук не загрузился. Прочитай по пиньиню.'; });
  });
}
