/* ---------------------------------------------------------------------------
   INIT
--------------------------------------------------------------------------- */
function init() {
  /* build the ten progress segments once, from TOTAL — single source of truth */
  const track = $('#progress-track');
  if (track && !track.children.length) {
    for (let i = 0; i < TOTAL; i++) {
      const s = document.createElement('span');
      s.className = 'pseg';
      track.appendChild(s);
    }
  }
  setActiveField(0);
  setFocusForSlide(0);
  document.body.classList.toggle('stim-on', !IS_REMOTE);
  bindDeckInput();
  if (IS_REMOTE) {
    bootRemoteUI();
  } else {
    slides.forEach((s, i) => {
      if (i !== 0) s.classList.remove('is-active');
    });
    goTo(0, { force: true });
  }
  connectMQTT();
  refreshModalLinks();
  wireDemoButtons();
  primeStepTexts();
  if (window.lucide) lucide.createIcons();
  /* re-run icon creation after dynamic innerHTML swaps */
  setInterval(() => { if (window.lucide) lucide.createIcons(); }, 2500);
}
document.addEventListener('DOMContentLoaded', init);
