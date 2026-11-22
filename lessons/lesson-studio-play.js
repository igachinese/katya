const chinese = 'zh';

function element(tag, text = '', className = '') {
  const item = document.createElement(tag);
  item.textContent = text;
  if (className) item.className = className;
  return item;
}

function button(label, action, className = 'button') {
  const item = element('button', label, className);
  item.type = 'button';
  item.addEventListener('click', action);
  return item;
}

function phrase(text, pinyin = '', translation = '') {
  const content = element('div', '', 'play-phrase');
  const hanzi = element('p', text);
  hanzi.lang = chinese;
  content.append(hanzi);
  if (pinyin) content.append(element('p', pinyin, 'material-pinyin'));
  if (translation) content.append(element('p', translation, 'caption'));
  return content;
}

export function lessonAudio(config, file, label) {
  const player = element('audio', '', 'play-audio');
  player.controls = true;
  player.preload = 'none';
  player.src = `media/${config.slug}/${file}.mp3`;
  player.setAttribute('aria-label', label);
  return player;
}

function audioClue(config, file, label, line, summary = 'Открыть текст') {
  const block = element('div', '', 'play-recording');
  const details = element('details', '', 'play-transcript');
  details.append(element('summary', summary), phrase(line.zh, line.py, line.ru));
  const audio = lessonAudio(config, file, label);
  const status = element('p', '', 'caption');
  status.setAttribute('role', 'status');
  audio.addEventListener('error', () => {
    status.textContent = 'Аудио не загрузилось. Текст доступен ниже.';
    details.open = true;
  });
  block.append(audio, status, details);
  return block;
}

function clockFace(time) {
  const [hour, minute] = time.split(':').map(Number);
  const dial = element('span', '', 'play-dial');
  dial.setAttribute('aria-hidden', 'true');
  for (const position of [12, 3, 6, 9]) {
    dial.append(element('span', String(position), `play-numeral play-numeral-${position}`));
  }
  const short = element('span', '', 'play-hand play-hour');
  short.style.setProperty('--needle', ((hour % 12) * 30 + minute * .5) + 'deg');
  const long = element('span', '', 'play-hand play-minute');
  long.style.setProperty('--needle', minute * 6 + 'deg');
  dial.append(short, long);
  return dial;
}

function readProgress(key, max) {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '{}');
    const step = stored?.step;
    const firstTry = stored?.firstTry;
    if (Number.isInteger(step) && step >= 0 && step <= max &&
        Number.isInteger(firstTry) && firstTry >= 0 && firstTry <= step) {
      return {step, firstTry, started: step > 0 || stored.started === true};
    }
  } catch {}
  return {step: 0, firstTry: 0, started: false};
}

export function startLessonGame(root, config) {
  const key = 'lesson.game.' + config.slug + '.v1';
  const stages = config.stages;
  let state = readProgress(key, stages.length);

  function write() {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }

  function restart() {
    state = {step: 0, firstTry: 0, started: true};
    write();
    render(true);
  }

  function journal(extra) {
    const found = stages.slice(0, state.step).flatMap(stage => stage.fact ? [stage.fact] : []);
    if (extra) found.push(extra);
    if (!found.length) return null;
    const block = element('div', '', 'play-journal');
    block.append(element('h4', config.collection));
    const entries = element('dl');
    for (const [label, value] of found) {
      const row = element('div');
      const labelNode = element('dt', label);
      const valueNode = element('dd', value);
      if (/\p{Script=Han}/u.test(label)) labelNode.lang = chinese;
      if (/\p{Script=Han}/u.test(value)) valueNode.lang = chinese;
      row.append(labelNode, valueNode);
      entries.append(row);
    }
    block.append(entries);
    return block;
  }

  function choiceArea(stage, done, miss) {
    const group = element('div', '', `play-choices play-choices-${stage.type || 'text'}`);
    if (stage.type === 'board') {
      const header = element('div', '', 'play-board-header');
      header.append(...['Рейс', 'Город', 'Платформа'].map(label => element('span', label)));
      group.append(header);
    }
    const controls = [];
    for (const entry of stage.choices) {
      const control = button('', () => {
        if (entry.id === stage.answer) {
          for (const item of controls) item.disabled = true;
          control.dataset.result = 'correct';
          done();
        } else {
          control.dataset.result = 'wrong';
          miss(entry.feedback);
        }
      }, 'play-choice');
      if (stage.type === 'clock') {
        control.setAttribute('aria-label', entry.label + ', ' + entry.period);
        control.append(clockFace(entry.label), element('span', entry.period, 'play-period'));
      } else if (stage.type === 'board') {
        for (const line of entry.cells) {
          const cell = element('span', line);
          if (/\p{Script=Han}/u.test(line)) cell.lang = chinese;
          control.append(cell);
        }
      } else {
        const label = element('span', entry.label);
        if (/\p{Script=Han}/u.test(entry.label)) label.lang = chinese;
        control.append(label);
        if (entry.py) control.append(element('span', entry.py, 'material-pinyin'));
      }
      controls.push(control);
      group.append(control);
    }
    return group;
  }

  function assembleArea(stage, done, miss) {
    const group = element('div');
    const display = element('p', '', 'play-assembly');
    display.lang = chinese;
    display.setAttribute('aria-live', 'polite');
    const pool = element('div', '', 'actions');
    const tools = element('div', '', 'actions');
    const selected = [];
    const tokens = new Map();
    const undo = button('Убрать последний фрагмент', () => {
      const id = selected.pop();
      update();
      tokens.get(id)?.focus();
    });
    const check = button('Проверить фразу', () => {
      const right = stage.solution.every((id, index) => selected[index] === id);
      if (right) {
        for (const token of tokens.values()) token.disabled = true;
        undo.disabled = true;
        check.disabled = true;
        done();
      } else {
        miss(stage.hint);
      }
    }, 'button primary');

    function update() {
      display.textContent = selected.map(id => tokens.get(id).textContent).join('');
      check.disabled = selected.length !== stage.solution.length;
      undo.disabled = selected.length === 0;
      for (const [id, token] of tokens) {
        token.disabled = selected.includes(id) || selected.length === stage.solution.length;
      }
    }

    for (const [id, label] of stage.tokens) {
      const token = button(label, () => {
        selected.push(id);
        update();
        ([...tokens.values()].find(item => !item.disabled) || check).focus();
      });
      token.lang = chinese;
      tokens.set(id, token);
      pool.append(token);
    }
    tools.append(check, undo);
    group.append(display, pool, tools);
    update();
    return group;
  }

  function render(focus = false) {
    for (const audio of root.querySelectorAll('audio')) audio.pause();
    const shell = element('div', '', 'play-shell');
    const header = element('header', '', 'play-header');
    const heading = element('h2', config.title);
    heading.id = 'lesson-play-title';
    header.append(heading);
    shell.append(header);
    let focusTarget = heading;

    if (!state.started) {
      const cover = element('div', '', 'play-cover');
      const intro = element('div', '', 'play-cover-text');
      intro.append(element('p', config.lead), button('Начать игру', restart, 'button primary'));
      const image = element('img', '', 'play-cover-image');
      image.src = `media/${config.slug}/scene.webp`;
      image.alt = config.alt;
      image.width = 1280;
      image.height = 720;
      image.loading = 'lazy';
      cover.append(intro, image);
      shell.append(cover);
    } else {
      const panel = element('div', '', 'play-panel');
      shell.append(panel);
      const collected = journal();
      const wrap = element('div');
      if (collected) wrap.append(collected);
      if (state.step === stages.length) {
        focusTarget = element('h3', config.finish);
        panel.append(focusTarget, element('p', `С первого раза получилось ${state.firstTry} из ${stages.length} заданий.`), wrap);
        panel.append(element('p', config.final, 'play-final'),
          audioClue(config, 'model', 'Образец ответа', {zh: config.model}, 'Свериться с образцом'),
          button('Сыграть ещё раз', restart));
      } else {
        const stage = stages[state.step];
        const progress = element('progress', '', 'play-progress');
        progress.max = stages.length;
        progress.value = state.step;
        progress.setAttribute('aria-label', 'Пройденные задания');
        focusTarget = element('h3', stage.title);
        panel.append(element('p', `Задание ${state.step + 1} из ${stages.length}`, 'caption'),
          progress, focusTarget, element('p', stage.prompt));
        if (stage.clue) {
          panel.append(audioClue(config, `step-${state.step + 1}`, 'Реплика для задания', stage.clue, 'Подсказка с текстом'));
        }
        if (stage.type === 'clock') {
          panel.append(element('p', 'Смотри на стрелки и время суток.', 'caption play-clock-tip'));
        }
        let hadMistake = false;
        let passed = false;
        const status = element('p', '', 'play-feedback');
        status.setAttribute('role', 'status');
        const actions = element('div', '', 'play-next');
        const next = button(state.step + 1 < stages.length ? 'Дальше' : 'К результату', () => {
          if (!passed) return;
          state.step++;
          if (!hadMistake) state.firstTry++;
          write();
          render(true);
        }, 'button primary');
        actions.hidden = true;
        actions.append(next);
        function success() {
          passed = true;
          status.dataset.result = 'correct';
          status.textContent = stage.success;
          const updated = journal(stage.fact);
          if (updated) wrap.replaceChildren(updated);
          if (stage.example) {
            actions.prepend(audioClue(config, `example-${state.step + 1}`, 'Образец фразы', stage.example, 'Свериться с фразой'));
          }
          actions.hidden = false;
          next.focus({preventScroll: true});
        }
        function retry(message) {
          hadMistake = true;
          status.dataset.result = 'wrong';
          status.textContent = message;
        }
        const game = stage.type === 'assemble' ? assembleArea(stage, success, retry) : choiceArea(stage, success, retry);
        panel.append(game, status, actions, wrap);
      }
    }
    root.replaceChildren(shell);
    if (focus) {
      focusTarget.tabIndex = -1;
      focusTarget.focus();
    }
  }

  document.addEventListener('play', event => {
    if (!(event.target instanceof HTMLAudioElement)) return;
    for (const player of document.querySelectorAll('audio')) if (player !== event.target) player.pause();
  }, true);
  render();
}
