/* Slide 10 + remote — runtime timers */
function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}
setInterval(() => {
  const el = $('#qa-timer');
  if (el) el.textContent = fmtTime(Date.now() - T0);
  const rt = $('#rmu-timer');
  if (rt) {
    const ms = Date.now() - T0;
    rt.textContent = fmtTime(ms);
    rt.classList.toggle('over', ms > 10 * 60 * 1000);
  }
}, 1000);

