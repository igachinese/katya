const unit = 'two-days';
let player;
const notice = document.querySelector('#lesson-audio-status');
function speak(clip) {
  player?.pause();
  const current = new Audio(`media/${unit}/studio/${clip}.mp3`);
  player = current;
  notice.textContent = '';
  current.play().catch(error => {
    if (player === current && error.name !== 'AbortError') notice.textContent = 'Запись не загрузилась. Открой текст рядом с заданием.';
  });
}
window.addEventListener('pagehide', () => player?.pause());
const recordings = [
  {"id": "schoolday", "title": "Кэ-кэ · понедельник", "text": "星期一，我早上六点起床，六点半吃早饭。中午十二点吃午饭。下午两点半回家，四点做作业。晚上六点吃晚饭，十点半睡觉。"},
  {"id": "saturday", "title": "Сяоюй · суббота", "text": "星期六，我早上八点半起床，九点吃早饭。中午十二点半吃午饭。下午三点回家。晚上七点吃晚饭，十点睡觉。"}
];
document.querySelector('#diary-sources').innerHTML = recordings.map(({id,title,text}) =>
  `<article class="lesson-cell"><h3>${title}</h3>
    <div class="actions">
      <button class="btn" type="button" data-clip="${id}">Слушать</button>
      <button class="btn secondary" type="button" data-clip="${id}-slow">Медленнее</button>
    </div>
    <details class="hint"><summary>Текст записи</summary><p class="listen-line" lang="zh">${text}</p></details></article>`).join('');

const rows = [
  ["起床", "Подъём", "06:00", "08:30", ["06:30", "08:00"]],
  ["吃早饭", "Завтрак", "06:30", "09:00", ["06:00", "09:30"]],
  ["吃午饭", "Обед", "12:00", "12:30", ["11:30", "13:00"]],
  ["回家", "Возвращение домой", "14:30", "15:00", ["14:00", "16:00"]],
  ["吃晚饭", "Ужин", "18:00", "19:00", ["18:30", "19:30"]],
  ["睡觉", "Сон", "22:30", "22:00", ["21:30", "23:00"]]
];
const form = document.querySelector('#schedule-check');
const days = ['понедельник','суббота'];
form.querySelector('tbody').innerHTML = rows.map(([zh,ru,mon,sat,distractors]) => {
  const choices = [mon,sat,...distractors].sort();
  return `<tr><th scope="row"><b lang="zh">${zh}</b><span>${ru}</span></th>
    ${[mon,sat].map((answer,i) => `<td><select aria-label="${ru}, ${days[i]}" data-answer="${answer}">
      <option value="">—</option>${choices.map(time => `<option>${time}</option>`).join('')}
      </select></td>`).join('')}</tr>`;
}).join('');
const scheduleStatus = document.querySelector('#schedule-status');
const timings = [...form.querySelectorAll('select')];
form.addEventListener('submit', event => {
  event.preventDefault();
  let correct = 0;
  let missing = 0;
  for (const choice of timings) {
    const matches = choice.value === choice.dataset.answer;
    if (matches) correct++;
    if (!choice.value) missing++;
    choice.toggleAttribute('data-correct', matches);
    choice.toggleAttribute('data-retry', !!choice.value && !matches);
  }
  scheduleStatus.textContent = correct === timings.length ? 'Всё совпало. Назови два отличия между днями полными фразами.' :
    'Совпало ' + correct + ' из ' + timings.length + '. ' + (missing ? 'Заполни пустые поля и переслушай спорные места.' : 'Переслушай отмеченные строки.');
});
form.addEventListener('change', event => {
  event.target.removeAttribute('data-correct');
  event.target.removeAttribute('data-retry');
});
const routes = {bus:'我坐公共汽车去学校。',walk:'我走路去学校。'};
const routeButtons = [...document.querySelectorAll('[data-route]')];
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.clip) speak(button.dataset.clip);
  if (button.dataset.route) {
    for (const item of routeButtons) item.setAttribute('aria-pressed', String(item === button));
    document.querySelector('#route-phrase').textContent = routes[button.dataset.route];
    speak(button.dataset.route);
  }
});
