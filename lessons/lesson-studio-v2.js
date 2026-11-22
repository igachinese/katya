const data = JSON.parse(document.querySelector('#lesson-content').textContent);
const host = document.querySelector('#lesson-play');
const progress = document.querySelector('#stage-progress');
const nav = document.querySelector('.steps');
const speedNotice = document.querySelector('#audio-notice');
const teacher = document.querySelector('#teacher-panel');
const modes = document.querySelector('#mode');
const tones = document.querySelector('#tone-color');
const media = `media/${data.slug}/studio/`;
const key = `lesson-studio-v2:${data.slug}`;
const shortSteps = ['Контекст', 'Тоны', 'Смысл', 'Фразы', 'Речь'];
const steps = ['Контекст', 'Звук и тоны', 'Смысл и ключи', 'Конструктор фраз', 'Живая речь'];
const wordIds = data.words.map(word => word.id);
const speech = {...data.phrases, ...data.praise, hook: data.hook,
  ...Object.fromEntries(data.words.map(word => [word.id, word]))};
const initial = () => ({step: 0, unlocked: 0, index: [0, 0, 0, 0, 0],
  bank: [], wrong: {}, correct: {}, mode: data.slug === 'platform-change' ? 'hanzi' : 'pinyin', tones: true, view: ''});
let state = initial();
try {
  const stored = JSON.parse(localStorage.getItem(key));
  if (stored && Array.isArray(stored.index) && stored.index.length === 5 &&
      Array.isArray(stored.bank) && stored.wrong && stored.correct &&
      Number.isInteger(stored.step) && stored.step >= 0 && stored.step < steps.length) {
    state = {...state, ...stored};
  }
} catch {}
let track;
let tileRate = 1;
let audioTurn = 0;
let recordCleanup = () => {};
let reviewIndex = 0;
let reviewQueue = [];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

function save() {
  try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
}

function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, char =>
    ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'})[char]);
}

function toneOf(pinyin) {
  const marks = {'\u0304':1, '\u0301':2, '\u030c':3, '\u0300':4};
  for (const mark of pinyin.normalize('NFD')) if (marks[mark]) return marks[mark];
  return 0;
}

function phrase(clip, {lesson = true, translate = false} = {}) {
  const text = speech[clip];
  const syllables = text.py.trim().split(/\s+/);
  let index = 0;
  const line = (text.zh.match(/哪儿|./gu) ?? []).map(char => {
    if (!/\p{Script=Han}/u.test(char) && !/[A-Z]/.test(char)) return safe(char);
    const py = syllables[index++] || '';
    const label = /[A-Z]/.test(char) ? '' : py;
    return `<ruby data-tone="${toneOf(py)}">${safe(char)}${label ? `<rt>${safe(label)}</rt>` : ''}</ruby>`;
  }).join('');
  return `<span class="phrase ${lesson ? 'adaptive' : ''}"><span class="chinese" lang="zh">${line}</span>
    ${translate && text.ru ? `<span class="translation">${safe(text.ru)}</span>` : ''}</span>`;
}

function controls(clip, compact = false) {
  return `<div class="audio-controls" role="group" aria-label="Скорость озвучки">
    <button class="btn secondary" data-clip="${clip}" data-speed="1" type="button" aria-label="Слушать в обычном темпе, 1.0×">${compact ? '1.0×' : 'Слушать · 1.0×'}</button>
    <button class="btn secondary" data-clip="${clip}" data-speed="0.75" type="button" aria-label="Слушать медленно, 0.75×">${compact ? '0.75×' : 'Чётко · 0.75×'}</button>
  </div>`;
}

function hint(clip, label = 'Открыть текст') {
  return `<details class="hint"><summary>${label}</summary>${phrase(clip, {lesson:false, translate:true})}</details>`;
}

function stopAudio() {
  audioTurn++;
  track?.pause();
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

async function play(clip, rate = 1, button) {
  if (!speech[clip]) return;
  stopAudio();
  const turn = audioTurn;
  speedNotice.textContent = '';
  const audio = new Audio(`${media}${clip}${rate === .75 ? '-slow' : ''}.mp3`);
  track = audio;
  button?.setAttribute('aria-pressed', 'true');
  const clear = () => button?.removeAttribute('aria-pressed');
  audio.addEventListener('pause', clear, {once:true});
  audio.addEventListener('ended', clear, {once:true});
  try {
    await audio.play();
  } catch (error) {
    clear();
    if (turn !== audioTurn || error.name === 'AbortError') return;
    const voice = 'speechSynthesis' in window && window.speechSynthesis.getVoices()
      .find(option => /^(zh-(CN|Hans)|zh$)/i.test(option.lang));
    if (voice && 'SpeechSynthesisUtterance' in window) {
      const sound = new SpeechSynthesisUtterance(speech[clip].zh);
      sound.voice = voice;
      sound.lang = voice.lang;
      sound.rate = rate;
      sound.onerror = () => { speedNotice.textContent = 'Звук недоступен. Открой текст рядом с репликой.'; };
      window.speechSynthesis.speak(sound);
    } else {
      speedNotice.textContent = 'Звук недоступен. Открой текст рядом с репликой.';
      button?.closest('.practice, .section-card, .word, .role-model, .hero-copy')?.querySelector('details.hint')?.setAttribute('open','');
    }
  }
}

function prime(clip) {
  if (!clip) return;
  const url = `${media}${clip}.mp3`;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.onload = link.onerror = () => link.remove();
  document.head.append(link);
}

function settings() {
  document.body.dataset.mode = state.mode;
  document.body.classList.toggle('tones-on', state.tones);
  modes.value = state.mode;
  tones.setAttribute('aria-pressed', String(state.tones));
  tones.textContent = state.tones ? 'Цвет тонов · вкл' : 'Цвет тонов · выкл';
}

function bar() {
  nav.innerHTML = steps.map((label, i) => `<button type="button" class="step" data-step="${i}"
    ${state.step === i ? 'aria-current="step"' : ''} ${i < state.unlocked || state.finished ? 'data-done' : ''}
    ${i > state.unlocked ? 'disabled' : ''}><span class="step-no">${i + 1}</span><span class="step-full">${label}</span><span class="step-short" aria-hidden="true">${shortSteps[i]}</span></button>`).join('');
  progress.value = state.finished ? 5 : state.unlocked;
}

function sheet(title, description, content) {
  return `<article class="sheet"><header class="sheet-header">
    <p class="eyebrow">${state.step + 1} / 5 · ${steps[state.step]}</p>
    <h2>${title}</h2><p>${description}</p>
  </header>${content}</article>`;
}

function button(label, attribute, extra = '') {
  return `<button type="button" class="btn ${extra}" ${attribute}>${label}</button>`;
}

function go(step) {
  state.step = step;
  state.unlocked = Math.max(state.unlocked, step);
  state.view = '';
  save();
  render(true);
}

function advance() {
  state.index[state.step]++;
  save();
  render(true);
}

function checked(id, right, review) {
  if (review) {
    if (right) {
      state.bank = state.bank.filter(item => item !== id);
      save();
    }
    return;
  }
  if (!right && !state.correct[id]) {
    state.wrong[id] = true;
    if (!state.bank.includes(id)) state.bank.push(id);
  }
  if (right) state.correct[id] = true;
  save();
}

function feedback(scope, id, right, message, review, target) {
  checked(id, right, review);
  scope.querySelector('.status').textContent = message;
  if (right) {
    scope.querySelectorAll('.answer-button, .check-build').forEach(option => { option.disabled = true; });
    if (target) target.dataset.correct = '';
    const next = scope.querySelector('.item-next');
    next.hidden = false;
    next.focus({preventScroll:true});
  } else if (target) {
    target.removeAttribute('data-retry');
    void target.offsetWidth;
    target.dataset.retry = '';
  }
}

function quizFrame(title, body, nextLabel) {
  return `<section class="practice current-quiz"><h3>${title}</h3>${body}
    <p class="status" role="status"></p>
    ${button(nextLabel, 'hidden', 'item-next')}
  </section>`;
}

function wireNext(scope, onNext) {
  scope.querySelector('.item-next').addEventListener('click', onNext);
}

function choices(scope, {id, answer, correct, wrong, clip, review, onCorrect}) {
  for (const option of scope.querySelectorAll('.answer-button')) {
    option.addEventListener('click', () => {
      const right = option.dataset.answer === String(answer);
      feedback(scope, id, right, right ? correct : wrong, review, option);
      if (right) onCorrect?.(option);
      if (!right) play(clip);
    });
  }
}

function toneQuiz(container, number, review, next) {
  const item = data.tones[number];
  const contour = ['→', '↗', '↘↗', '↘'];
  container.innerHTML = quizFrame('Поймай тон',
    `<p>${item.index === 0 ? 'Как движется голос на первом слоге?' : 'Как движется голос на втором слоге?'}</p>
    ${controls(item.clip)}${hint(item.clip, 'Подсказка с произношением')}
    <div class="tone-grid">${contour.map((shape, i) => `<button class="opt answer-button" type="button" data-answer="${i + 1}">
    <span data-tone="${i + 1}" class="contour" aria-hidden="true">${shape}</span><span>${i + 1} тон</span></button>`).join('')}</div>`,
    'Дальше');
  const scope = container.querySelector('.current-quiz');
  choices(scope, {id:`tone:${number}`, answer:item.tone, clip:item.clip, review,
    correct:item.why, wrong:'Послушай ещё раз. Обрати внимание на движение голоса.'});
  wireNext(scope, next);
  prime(item.clip);
}

function wordQuiz(container, number, review, next) {
  const word = data.words[number];
  const options = [word.id, wordIds[(number + 1) % wordIds.length], wordIds[(number + 2) % wordIds.length]];
  if (number % 3 === 0) options.push(options.shift());
  if (number % 3 === 1) options.unshift(options.pop());
  container.innerHTML = quizFrame('Звук → картинка',
    `<p>Послушай и выбери картинку.</p>${controls(word.id)}${hint(word.id, 'Подсказка')}
      <div class="picture-choices">${options.map(id => `<button class="opt answer-button" type="button" data-answer="${id}">
        <img src="${media}${id}.webp" width="384" height="384" alt="${safe(speech[id].ru)}">
      </button>`).join('')}</div>`, 'Дальше');
  const scope = container.querySelector('.current-quiz');
  choices(scope, {id:`word:${number}`, answer:word.id, clip:word.id, review,
    correct:`${word.zh} · ${word.ru}. Верно!`, wrong:'Переслушай и попробуй ещё раз.'});
  wireNext(scope, next);
  prime(word.id);
}

function clock(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return `<span class="clock" aria-hidden="true"><b>12</b>
    <span class="hand" style="--deg:${(hours % 12) * 30 + minutes / 2}deg"></span>
    <span class="hand minute" style="--deg:${minutes * 6}deg"></span></span>`;
}

function bonusQuiz(container, number, review, next) {
  const bonus = data.bonus;
  const item = bonus.rounds[number];
  let options;
  if (bonus.type === 'board') {
    options = `<div class="board"><p class="board-head"><span>Рейс</span><span>Город</span><span>Платформа</span></p>
    ${item.choices.map(([id, code, city, platform]) => `<button type="button" class="opt answer-button" data-answer="${id}">
      <span>${code}</span><span lang="zh">${city}</span><span>${platform}</span></button>`).join('')}</div>`;
  } else if (bonus.type === 'clocks') {
    options = `<div class="option-grid">${item.choices.map(time => `<button type="button" class="opt answer-button" data-answer="${time}" aria-label="${time}">
      ${clock(time)}${Number(time.slice(0,2)) < 12 ? 'Утро' : Number(time.slice(0,2)) < 18 ? 'День' : 'Вечер'}
      </button>`).join('')}</div>`;
  } else {
    options = `<div class="pitch"><div class="option-grid">${item.choices.map(count => `<button type="button" class="opt answer-button" data-answer="${count}" aria-label="Ворота, мячей: ${count}">
      <span aria-hidden="true">${'⚽'.repeat(count)}</span></button>`).join('')}</div><span class="ball-shot" aria-hidden="true">⚽</span></div>`;
  }
  container.innerHTML = quizFrame(bonus.title, `<p>${bonus.prompt}</p>${controls(item.clip)}${hint(item.clip)}${options}`, 'Дальше');
  const scope = container.querySelector('.current-quiz');
  choices(scope, {id:`bonus:${number}`, answer:item.answer, clip:item.clip, review,
    correct:bonus.type === 'goals' ? 'Гол!' : speech[item.clip].ru, wrong:'Ещё раз послушай и проверь подсказку.',
    onCorrect: option => {
      if (bonus.type !== 'goals') return;
      const pitch = scope.querySelector('.pitch');
      const box = option.getBoundingClientRect();
      pitch.style.setProperty('--aim', (box.left + box.width / 2 - pitch.getBoundingClientRect().left) + 'px');
      pitch.dataset.scored = '';
    }});
  wireNext(scope, next);
  prime(item.clip);
}

function build(container, number, review, next) {
  const exercise = data.builds[number];
  const tokens = [...exercise.pieces.slice(1), exercise.pieces[0]];
  const current = [];
  container.innerHTML = quizFrame('Собери фразу',
    `<p>${exercise.task}</p><div class="chunk-target chunks" role="status" aria-label="Собранные плитки"></div>
    <label class="tile-toggle">Темп плиток <select class="tile-rate"><option value="1">1.0×</option><option value="0.75">0.75×</option></select></label>
    <div class="chunks token-list">${tokens.map((clip, i) => `<button type="button" class="opt chunk" data-token="${clip}" aria-label="Плитка ${i + 1}: ${safe(speech[clip].zh)}">
      ${phrase(clip)}<span aria-hidden="true">♪ ${i + 1}</span></button>`).join('')}</div>
    <div class="actions">${button('Проверить', 'disabled', 'check-build')}
      ${button('Убрать последнюю', 'disabled', 'secondary undo')}</div>
    <div class="complete-phrase" hidden>${phrase(exercise.full, {translate:true})}${controls(exercise.full)}</div>
    ${hint(exercise.full, 'Подсказка с целой фразой')}`, 'Дальше');
  const scope = container.querySelector('.current-quiz');
  const target = scope.querySelector('.chunk-target');
  const check = scope.querySelector('.check-build');
  const undo = scope.querySelector('.undo');
  const tileList = [...scope.querySelectorAll('.token-list button')];
  const rate = scope.querySelector('.tile-rate');
  rate.value = String(tileRate);
  rate.addEventListener('change', () => { tileRate = Number(rate.value); });
  let solved = false;

  function update() {
    target.innerHTML = current.map(clip => `<span class="opt chunk">${phrase(clip)}<span aria-hidden="true">♪ ${tokens.indexOf(clip) + 1}</span></span>`).join('');
    for (const tile of tileList) tile.disabled = solved || current.includes(tile.dataset.token);
    check.disabled = solved || current.length !== exercise.pieces.length;
    undo.disabled = solved || !current.length;
  }

  for (const tile of tileList) tile.addEventListener('click', () => {
    current.push(tile.dataset.token);
    play(tile.dataset.token, tileRate);
    update();
    (tileList.find(option => !option.disabled) || check).focus({preventScroll:true});
  });
  undo.addEventListener('click', () => {
    const removed = current.pop();
    update();
    tileList.find(tile => tile.dataset.token === removed)?.focus({preventScroll:true});
  });
  check.addEventListener('click', () => {
    solved = exercise.pieces.every((clip, i) => current[i] === clip);
    feedback(scope, `build:${number}`, solved, solved ? 'Фраза готова. Послушай, как звучит целиком.' :
      'Переставь блоки. Послушай образец, если нужна опора.', review, check);
    if (solved) {
      scope.querySelector('.complete-phrase').hidden = false;
      update();
    }
    play(exercise.full);
  });
  wireNext(scope, next);
  prime(exercise.full);
}

function stageZero() {
  host.innerHTML = `<article class="hero"><div class="hero-copy"><p class="eyebrow">${data.name} · ${data.theme}</p>
    <h1>${data.title}</h1><p class="lead">${data.intro}</p>
    ${controls('hook')}${hint('hook', 'Текст приветствия')}
    ${button(data.go, 'data-go="1"')}
    </div><img class="hero-image" width="1280" height="720" src="${media}hero.webp" alt="${safe(data.hero)}"></article>`;
  prime('hook');
}

function stageOne() {
  const index = state.index[1];
  host.innerHTML = sheet('Поймай движение голоса', 'Послушай слово целиком. Потом повтори нужный слог вместе с голосом.',
    `<div class="lesson-grid"><div class="panel">
      ${index < data.tones.length ? '<div class="quiz-area"></div>' :
      `<div class="section-card"><h3>Тоны пойманы</h3>${controls('passed', true)}${button('К картинкам', 'data-go="2"')}</div>`}
      </div><aside class="section-card"><h3>Карта тонов</h3>
      <p><span data-tone="1">1 → ровный</span> · <span data-tone="2">2 ↗ вверх</span> ·
        <span data-tone="3">3 ↘↗ низкий</span> · <span data-tone="4">4 ↘ вниз</span> · <span data-tone="0">нейтральный · лёгкий</span></p>
      <details class="secret"><summary>Секрет произношения</summary><p>${safe(data.secret.body)}</p>
        ${phrase(data.secret.clip, {translate:true})}${controls(data.secret.clip)}${data.secret.extra ? controls(data.secret.extra, true) : ''}</details>
      </aside></div>`);
  if (index < data.tones.length) toneQuiz(host.querySelector('.quiz-area'), index, false, advance);
}

function card(word) {
  return `<article class="word"><img src="${media}${word.id}.webp" alt="${safe(word.ru)}" width="384" height="384" loading="lazy">
    ${phrase(word.id)}${controls(word.id, true)}
    <details class="hint"><summary>Разобрать слово</summary><p>${safe(word.parts)}</p></details></article>`;
}

function stageTwo() {
  const index = state.index[2];
  const bonusIndex = index - data.words.length;
  const deck = `<div class="deck">${data.words.map(card).join('')}</div>`;
  const intro = index === 0
    ? `<details class="section-card" open><summary>Карточки слов</summary>${deck}</details>`
    : `<details class="section-card"><summary>Карточки слов</summary>${deck}</details>`;
  host.innerHTML = sheet('Узнай без перевода',
    'Послушай карточки, затем подбери картинку к звуку. Можно открыть разбор слова.',
    `${intro}<div class="quiz-area"></div>${bonusIndex >= data.bonus.rounds.length ?
      `<div class="actions footer-actions">${button('К фразам', 'data-go="3"')}</div>` : ''}`);
  const slot = host.querySelector('.quiz-area');
  if (index < data.words.length) wordQuiz(slot, index, false, advance);
  else if (bonusIndex < data.bonus.rounds.length) bonusQuiz(slot, bonusIndex, false, advance);
}

function stageThree() {
  const index = state.index[3];
  const line = data.slug === 'daily-routine' ? 'Кто → когда → что делает.' :
    data.slug === 'platform-change' ? 'Сначала собери смысл целыми блоками. Уточни действие, результат и следующий шаг.' :
    'Кто → что любит. Кто → что сделал.';
  host.innerHTML = sheet('Из плиток в речь', line,
    `<div class="quiz-area"></div>${index >= data.builds.length ?
      `<div class="section-card"><h3>Фразы готовы</h3>${controls('great', true)}${button('К разговору', 'data-go="4"')}</div>` : ''}`);
  if (index < data.builds.length) build(host.querySelector('.quiz-area'), index, false, advance);
}
function recorder(scope) {
  const start = scope.querySelector('.record-start');
  const stop = scope.querySelector('.record-stop');
  const playback = scope.querySelector('.reply');
  const status = scope.querySelector('.record-status');
  let stream;
  let mediaRecorder;
  let objectUrl;
  let timer;
  let alive = true;

  function release() {
    clearTimeout(timer);
    stream?.getTracks().forEach(track => track.stop());
    stream = undefined;
    host.removeAttribute('data-recording');
  }

  function stopRecording() {
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
    stop.hidden = true;
  }
  stop.addEventListener('click', stopRecording);

  start.addEventListener('click', async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      status.textContent = 'Микрофон недоступен. Ответь вслух и сравни с образцом.';
      return;
    }
    start.disabled = true;
    status.textContent = 'Разреши микрофон в браузере.';
    try {
      const allowedStream = await navigator.mediaDevices.getUserMedia({audio:true});
      if (!alive) {
        allowedStream.getTracks().forEach(track => track.stop());
        return;
      }
      stream = allowedStream;
      stopAudio();
      playback.pause();
      const chunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      mediaRecorder.onerror = () => {
        release();
        if (!alive) return;
        start.disabled = false;
        stop.hidden = true;
        status.textContent = 'Запись прервалась. Попробуй ещё раз или ответь вслух.';
      };
      mediaRecorder.onstop = () => {
        release();
        if (!alive) return;
        start.disabled = false;
        if (!chunks.length) {
          status.textContent = 'Запись не сохранилась. Попробуй ещё раз.';
          return;
        }
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        const blob = new Blob(chunks, {type:mediaRecorder.mimeType || chunks[0].type});
        objectUrl = URL.createObjectURL(blob);
        playback.src = objectUrl;
        playback.hidden = false;
        status.textContent = 'Запись готова. Послушай себя, затем включи образец.';
      };
      mediaRecorder.start();
      host.dataset.recording = '';
      stop.hidden = false;
      stop.focus();
      status.textContent = 'Идёт запись. Скажи фразу и нажми «Стоп».';
      timer = setTimeout(stopRecording, 30000);
    } catch {
      release();
      if (alive) {
        start.disabled = false;
        status.textContent = 'Доступ к микрофону недоступен. Ответь вслух и включи образец.';
      }
    }
  });

  playback.addEventListener('play', stopAudio);
  return () => {
    alive = false;
    if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
    release();
    playback.pause();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  };
}

function stageFour() {
  const index = state.index[4];
  const role = data.roles[index];
  if (!role) {
    const lead = state.bank.length
      ? 'Здесь вернутся только те задания, где ты сначала ошибся или ошиблась.'
      : 'Все задания с первого раза. Можно завершить урок или ещё раз послушать любимые реплики.';
    host.innerHTML = sheet('Закрепление без ошибок', lead, `<div class="actions">
      ${state.bank.length ? button('Повторить сложное', 'data-review') : button('К результату', 'data-finish')}${controls('ready', true)}
    </div>`);
    return;
  }
  const models = role.models.map(clip => `<div class="role-model">${phrase(clip, {translate:true})}
      ${controls(clip)}${hint(clip, 'Текст образца')}</div>`).join('');
  host.innerHTML = sheet('Ответь собеседнику', role.task,
    `<div class="lesson-grid">
      <section class="section-card"><p class="eyebrow">Реплика ${index + 1} из ${data.roles.length}</p>
        <h3>Послушай вопрос</h3>${controls(role.question)}${hint(role.question, 'Показать вопрос')}
        <details class="hint"><summary>Свериться с образцом</summary><p class="translation">Повтори вместе с голосом в темпе 0,75×. Затем дай свой ответ.</p><div class="role-models">${models}</div></details>
      </section>
      <section class="section-card recorder">
        <h3>Твой ответ</h3><p>Скажи вслух. Можно записать ответ и сравнить с образцом.</p>
        <div class="actions">
          ${button('Записать ответ', '', 'secondary record-start')}${button('Стоп', 'hidden', 'record-stop')}
        </div>
        <p class="status record-status" role="status"></p>
        <audio hidden class="reply" controls aria-label="Твоя запись"></audio>
        <p class="translation">Запись остаётся в этой вкладке, пока открыта реплика.</p>
      </section>
    </div><div class="actions footer-actions">${button('Я ответил' + (data.slug === 'press-room' ? '' : 'а'), 'data-spoken')}</div>`);
  recordCleanup = recorder(host);
  prime(role.question);
}

function showReview() {
  const currentId = reviewQueue[reviewIndex];
  if (!currentId) {
    finish();
    return;
  }
  const [kind, number] = currentId.split(':');
  const renderItem = ({tone:toneQuiz, word:wordQuiz, bonus:bonusQuiz, build})[kind];
  host.innerHTML = sheet('Закрепление без ошибок',
    'Повтори задание, которое раньше потребовало ещё одной попытки.', `<div class="quiz-area"></div>`);
  renderItem(host.querySelector('.quiz-area'), Number(number), true, () => {
    reviewIndex++;
    if (reviewQueue[reviewIndex]) render(true);
    else finish();
  });
}

function finish() {
  state.view = 'done';
  state.finished = true;
  save();
  render(true);
}

function showFinish() {
  const total = Object.keys(state.correct).length;
  const first = Object.keys(state.correct).filter(id => !state.wrong[id]).length;
  host.innerHTML = `<article class="sheet result"><header class="sheet-header">
    ${data.slug === "press-room" ? `<img class="award" src="${media}trophy.webp" alt="" width="96" height="96">` : ""}
    <p class="eyebrow">Урок пройден</p><h2>${data.finish}</h2><p>${data.success}</p></header>
    <div class="results-data"><p><strong>${data.words.length}</strong> слов на слух</p>
    <p><strong>${total ? Math.round(first / total * 100) : 0}%</strong> с первой попытки</p></div>
    <div class="actions">${button('Повторить сложные слова', 'data-words')}${controls('nice', true)}
    ${button('Пройти заново', 'data-restart', 'secondary')}</div><div class="quiz-area"></div></article>`;
}

function wordReplay() {
  const difficult = data.words.filter((_, i) => state.wrong[`word:${i}`] ||
    data.tones.some((item, j) => item.clip === data.words[i].id && state.wrong[`tone:${j}`]));
  const cards = difficult.length ? difficult : data.words;
  host.querySelector('.quiz-area').innerHTML = `<div class="section-card"><h3>${difficult.length ? 'Слова для повторения' : 'Повтори слова на слух'}</h3>
    <div class="deck">${cards.map(card).join('')}</div></div>`;
}

function render(focus = false) {
  stopAudio();
  recordCleanup();
  recordCleanup = () => {};
  settings();
  bar();
  if (state.view === 'review') showReview();
  else if (state.view === 'done') showFinish();
  else [stageZero, stageOne, stageTwo, stageThree, stageFour][state.step]();
  if (focus) {
    host.focus({preventScroll:true});
    document.querySelector('.toolbar').scrollIntoView({block:'start', behavior:reduced.matches ? 'instant' : 'smooth'});
  }
}

document.addEventListener('click', event => {
  const action = event.target.closest('button');
  if (!action) return;
  if (action.dataset.clip) {
    if (host.hasAttribute('data-recording')) {
      host.querySelector('.record-status').textContent = 'Сначала останови запись, затем включи образец.';
      return;
    }
    host.querySelector('.reply')?.pause();
    play(action.dataset.clip, Number(action.dataset.speed), action);
  } else if (action.dataset.step !== undefined) {
    const step = Number(action.dataset.step);
    if (step <= state.unlocked) go(step);
  } else if (action.dataset.go !== undefined) {
    go(Number(action.dataset.go));
  } else if (action.hasAttribute('data-spoken')) {
    advance();
  } else if (action.hasAttribute('data-review')) {
    state.view = 'review';
    reviewQueue = [...state.bank];
    reviewIndex = 0;
    save();
    render(true);
  } else if (action.hasAttribute('data-finish')) {
    finish();
  } else if (action.hasAttribute('data-words')) {
    wordReplay();
  } else if (action.hasAttribute('data-restart')) {
    const {mode, tones: showTones} = state;
    state = {...initial(), mode, tones:showTones};
    save();
    render(true);
  }
});

modes.addEventListener('change', () => {
  state.mode = modes.value;
  settings();
  save();
});
tones.addEventListener('click', () => {
  state.tones = !state.tones;
  settings();
  save();
});

const teacherButton = document.querySelector('#teacher-open');
function toggleTeacher() {
  if (teacher.open) teacher.close();
  else teacher.showModal();
}
teacherButton.addEventListener('click', toggleTeacher);
document.addEventListener('keydown', event => {
  if (['t', 'е'].includes(event.key.toLowerCase()) && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey &&
      !event.target.closest('input,textarea,select,[contenteditable="true"]')) toggleTeacher();
});

window.addEventListener('pagehide', () => {
  stopAudio();
  recordCleanup();
});
if (state.view === 'review') reviewQueue = [...state.bank];
render();
