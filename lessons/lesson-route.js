export function setupLessonRoute({stopAudio, onStage} = {}) {
  const route = document.querySelector('#lesson-route');
  const list = route.querySelector('ol');
  const links = [...list.querySelectorAll('[data-stage]')];
  const screens = links.map(link => document.querySelector(link.hash));
  const back = document.querySelector('#lesson-back');
  const next = document.querySelector('#lesson-next');
  const home = document.querySelector('#lesson-home');
  const count = document.querySelector('#lesson-count');
  const progress = document.querySelector('#lesson-progress');
  const cover = document.querySelector('#lesson-cover');
  const audioNotice = document.querySelector('#lesson-audio-status');
  const teacher = document.querySelector('#lesson-teacher');
  let current = -1;

  route.hidden = false;
  document.querySelector('#lesson-footer').hidden = false;
  progress.max = links.length;
  function show(index, focusHeading) {
    if (current !== index) {
      stopAudio?.();
      audioNotice.textContent = '';
      current = index;
      onStage?.(screens[index].id);
    }
    for (const [i, screen] of screens.entries()) {
      screen.hidden = i !== index;
      if (i === index) links[i].setAttribute('aria-current','step');
      else links[i].removeAttribute('aria-current');
    }
    cover.hidden = index !== 0;
    count.textContent = 'Этап '+(index+1)+' из '+links.length;
    progress.value = index + 1;
    back.disabled = index === 0;
    next.hidden = index === links.length - 1;
    home.hidden = !next.hidden;
    const link = links[index];
    list.scrollLeft += link.getBoundingClientRect().left - list.getBoundingClientRect().left
      - (list.clientWidth - link.offsetWidth)/2;
    if (focusHeading) {
      const heading = screens[index].querySelector('h2');
      heading.tabIndex = -1;
      heading.focus({preventScroll:true});
      window.scrollTo(0,0);
    }
  }

  function navigate(index, focusHeading = true) {
    if (!links[index]) return;
    if (location.hash !== links[index].hash) history.pushState(null,'',links[index].hash);
    show(index,focusHeading);
  }

  links.forEach((link,index) => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      navigate(index);
    });
    link.addEventListener('keydown', event => {
      const target = { ArrowLeft:index-1, ArrowRight:index+1, Home:0, End:links.length-1 }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      if (links[target]) {
        navigate(target,false);
        links[target].focus();
      }
    });
  });
  back.addEventListener('click',()=>navigate(current-1));
  next.addEventListener('click',()=>navigate(current+1));
  document.querySelector('#lesson-teacher-open').addEventListener('click',()=>{
    stopAudio?.();
    teacher.showModal();
  });
  function followLocation(focusHeading) {
    const index = links.findIndex(link=>link.hash===location.hash);
    show(index < 0 ? 0 : index, focusHeading);
  }
  window.addEventListener('hashchange',()=>followLocation(true));
  followLocation(false);
}
