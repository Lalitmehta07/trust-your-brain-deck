/* ---------------------------------------------------------------------------
   PER-SLIDE GENERATIVE FIELDS (new deck) — ten bespoke static fields.
   Slides 1–7 are live-experiment stimuli, so their background fields draw ONE
   deterministic frame and never run a loop; the three closing slides keep a
   slow ambient drift. makeField's "once" flag guarantees at most one RAF loop
   on screen at any moment (the active field only).
--------------------------------------------------------------------------- */

/* ---- 1 · Title: soft converging ribbons meeting an inquiry reticle ---- */
fields.push(makeField(1, (f) => {
  const g = mk('g', {}); f.svg.appendChild(g);
  for (let i = 0; i < 9; i++) {
    const y0 = 120 + i * 96, mx = 520 + (i % 4) * 130, my = y0 + Math.sin(i * 1.7) * 150;
    g.appendChild(mk('path', {
      d: `M -40 ${y0} C ${mx} ${my}, 1420 ${(y0 + 470) / 2}, 1640 470`,
      fill: 'none', stroke: `url(#${['rgA','rgB','rgC'][i % 3]})`, 'stroke-width': String(1.2 + (i % 3)),
      'stroke-opacity': 0.55, 'vector-effect': 'non-scaling-stroke'
    }));
  }
  const u = mk('use', { href: '#sym-reticle', transform: 'translate(1640 470)' });
  g.appendChild(u);
  const c = mk('use', { href: '#sym-core', transform: 'translate(1640 470)' });
  g.appendChild(c);
}, null));

/* ---- 2 · Contrast: two gray families drifting toward one shared midpoint ---- */
fields.push(makeField(2, (f) => {
  const g = mk('g', {}); f.svg.appendChild(g);
  for (let i = 0; i < 14; i++) {
    const light = i % 2 === 0;
    const x = 90 + i * 132;
    g.appendChild(mk('rect', { x, y: 140 + (i % 5) * 150, width: 74, height: 74, rx: 16,
      fill: light ? '#E9EDF4' : '#3A4250', opacity: 0.14,
      transform: `rotate(${(i * 7) % 24} ${x + 37} ${177 + (i % 5) * 150})` }));
  }
  g.appendChild(mk('circle', { cx: 960, cy: 540, r: 150, fill: 'url(#attractorGlow)', opacity: 0.8 }));
  g.appendChild(mk('circle', { cx: 960, cy: 540, r: 9, fill: '#7A7A7A', opacity: 0.85 }));
}, null));

/* ---- 3 · Attention: sparse gaze-fixation saccade path with hubs ---- */
fields.push(makeField(3, (f) => {
  const pts = [[320,240],[760,180],[1180,300],[1520,220],[1620,560],[1240,700],[820,640],[420,760],[240,520]];
  let d = 'M ' + pts[0][0] + ' ' + pts[0][1];
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
  d += ' L 320 240';
  f.svg.appendChild(mk('path', { d, fill: 'none', stroke: 'url(#rgB)', 'stroke-width': 1.6,
    'stroke-dasharray': '2 16', 'stroke-opacity': 0.7, 'vector-effect': 'non-scaling-stroke' }));
  const g = mk('g', {}); f.svg.appendChild(g);
  pts.forEach((p, i) => {
    g.appendChild(mk('circle', { cx: p[0], cy: p[1], r: 10 + (i % 3) * 6, fill: 'none',
      stroke: i % 4 === 0 ? '#E11D48' : '#2563EB', 'stroke-opacity': 0.22, 'stroke-width': 1.2, 'vector-effect': 'non-scaling-stroke' }));
  });
}, null));

/* ---- 4 · Bistable: nested ambiguous contours that refuse to resolve ---- */
fields.push(makeField(4, (f) => {
  const g = mk('g', { transform: 'translate(960 540)' }); f.svg.appendChild(g);
  for (let i = 0; i < 5; i++) {
    g.appendChild(mk('ellipse', { rx: 180 + i * 130, ry: 110 + i * 78, fill: 'none',
      stroke: i % 2 ? '#4F46E5' : '#2563EB', 'stroke-opacity': 0.16, 'stroke-width': 1.4,
      transform: `rotate(${i * 18})`, 'vector-effect': 'non-scaling-stroke' }));
  }
  g.appendChild(mk('path', { d: 'M -260 40 C -120 -120, 120 -120, 260 40 C 120 160, -120 160, -260 40 Z',
    fill: 'none', stroke: '#E11D48', 'stroke-opacity': 0.2, 'stroke-width': 1.6, 'vector-effect': 'non-scaling-stroke' }));
}, null));

/* ---- 5 · Construction: locally consistent bars, globally impossible figure ---- */
fields.push(makeField(5, (f) => {
  const g = mk('g', { transform: 'translate(960 540)' }); f.svg.appendChild(g);
  const tri = [[0,-300],[280,190],[-280,190]];
  for (let i = 0; i < 3; i++) {
    const a = tri[i], b = tri[(i + 1) % 3];
    g.appendChild(mk('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: ['#2563EB','#4F46E5','#E11D48'][i],
      'stroke-opacity': 0.22, 'stroke-width': 26, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }));
  }
  tri.forEach((p) => g.appendChild(mk('circle', { cx: p[0], cy: p[1], r: 12, fill: 'none', stroke: '#64748B', 'stroke-opacity': 0.35, 'vector-effect': 'non-scaling-stroke' })));
  g.appendChild(mk('use', { href: '#sym-reticle', transform: 'translate(430 -240) scale(0.6)', opacity: 0.5 }));
}, null));

/* ---- 6 · Association: semantic network — four shown words around one absent hub ---- */
fields.push(makeField(6, (f) => {
  const hub = [960, 540];
  const sat = [[520,300],[1420,320],[560,800],[1380,780]];
  const g = mk('g', {}); f.svg.appendChild(g);
  sat.forEach((p) => g.appendChild(mk('line', { x1: p[0], y1: p[1], x2: hub[0], y2: hub[1],
    stroke: '#4F46E5', 'stroke-opacity': 0.16, 'stroke-width': 1.4, 'stroke-dasharray': '6 10', 'vector-effect': 'non-scaling-stroke' })));
  g.appendChild(mk('circle', { cx: hub[0], cy: hub[1], r: 120, fill: 'url(#coralGlow)', opacity: 0.9 }));
  g.appendChild(mk('circle', { cx: hub[0], cy: hub[1], r: 26, fill: 'none', stroke: '#E11D48', 'stroke-opacity': 0.3, 'stroke-dasharray': '4 6', 'vector-effect': 'non-scaling-stroke' }));
  sat.forEach((p, i) => g.appendChild(mk('circle', { cx: p[0], cy: p[1], r: 16 + i * 2, fill: '#2563EB', opacity: 0.14 })));
}, null));

/* ---- 7 · Framing: one event wave re-drawn through five verbal filters ---- */
fields.push(makeField(7, (f) => {
  const g = mk('g', {}); f.svg.appendChild(g);
  for (let w = 0; w < 5; w++) {
    const amp = 26 + w * 20, base = 200 + w * 150;
    let d = 'M 0 ' + base;
    for (let x = 0; x <= 1920; x += 48) {
      const bump = Math.exp(-Math.pow((x - 960) / 300, 2)) * amp;
      d += ` L ${x} ${(base - bump * Math.abs(Math.sin(x * 0.012 + w))).toFixed(1)}`;
    }
    g.appendChild(mk('path', { d, fill: 'none', stroke: `url(#${['rgA','rgB','rgC','rgA','rgB'][w]})`,
      'stroke-width': String(1.2 + w * 0.4), 'stroke-opacity': 0.6, 'vector-effect': 'non-scaling-stroke' }));
  }
  g.appendChild(mk('use', { href: '#sym-wavecycle', transform: 'translate(720 520) scale(1.4)', stroke: '#E11D48', 'stroke-opacity': 0.22, 'stroke-width': 2 }));
}, null));

/* ---- 8 · Reasoning: hypothesis nodes branching from one rule, one green path ---- */
fields.push(makeField(8, (f) => {
  const g = mk('g', {}); f.svg.appendChild(g);
  const root = [420, 540];
  const leaves = [[1180,220],[1320,420],[1180,860],[1320,660]];
  g.appendChild(mk('circle', { cx: root[0], cy: root[1], r: 130, fill: 'url(#attractorGlow)' }));
  g.appendChild(mk('circle', { cx: root[0], cy: root[1], r: 16, fill: '#2563EB', opacity: 0.55 }));
  leaves.forEach((p, i) => {
    const hit = i === 3;
    g.appendChild(mk('path', { d: `M ${root[0]} ${root[1]} C ${(root[0]+p[0])/2} ${root[1] + (i%2?160:-160)}, ${(root[0]+p[0])/2} ${p[1]}, ${p[0]} ${p[1]}`,
      fill: 'none', stroke: hit ? '#059669' : '#64748B', 'stroke-opacity': hit ? 0.5 : 0.18, 'stroke-width': hit ? 2.4 : 1.4,
      'stroke-dasharray': hit ? 'none' : '5 9', 'vector-effect': 'non-scaling-stroke' }));
    g.appendChild(mk('circle', { cx: p[0], cy: p[1], r: 12, fill: hit ? '#059669' : '#64748B', opacity: hit ? 0.6 : 0.22 }));
  });
}, null));

/* ---- 9 · Calibration: confidence-vs-accuracy chart with an overconfidence gap ---- */
fields.push(makeField(9, (f) => {
  const g = mk('g', {}); f.svg.appendChild(g);
  g.appendChild(mk('path', { d: 'M 320 880 H 1700 M 320 880 V 180', stroke: '#64748B', 'stroke-opacity': 0.3, 'stroke-width': 1.6, fill: 'none', 'vector-effect': 'non-scaling-stroke' }));
  g.appendChild(mk('path', { d: 'M 320 880 L 1700 180', stroke: '#2563EB', 'stroke-opacity': 0.3, 'stroke-width': 1.6, 'stroke-dasharray': '8 10', fill: 'none', 'vector-effect': 'non-scaling-stroke' }));
  g.appendChild(mk('path', { d: 'M 320 880 C 700 620, 1150 330, 1700 210', stroke: '#E11D48', 'stroke-opacity': 0.35, 'stroke-width': 2.4, fill: 'none', 'vector-effect': 'non-scaling-stroke' }));
  for (let i = 0; i < 6; i++) g.appendChild(mk('circle', { cx: 420 + i * 240, cy: 800 - i * 118, r: 7, fill: '#4F46E5', opacity: 0.35 }));
}, null));

/* ---- 10 · Closing: horizon of folded experiments with rising question marks ---- */
fields.push(makeField(10, (f) => {
  const g = mk('g', {}); f.svg.appendChild(g);
  g.appendChild(mk('circle', { cx: 960, cy: 640, r: 120, fill: 'url(#attractorGlow)' }));
  g.appendChild(mk('path', { d: 'M 120 640 H 1800', stroke: 'url(#rgA)', 'stroke-width': 2, fill: 'none', 'stroke-opacity': 0.7, 'vector-effect': 'non-scaling-stroke' }));
  for (let i = 0; i < 7; i++) {
    const x = 260 + i * 230;
    g.appendChild(mk('path', { d: `M ${x} 640 C ${x - 60} 520, ${x + 60} 470, ${x} 360`, fill: 'none',
      stroke: ['#2563EB','#4F46E5','#E11D48'][i % 3], 'stroke-opacity': 0.2, 'stroke-width': 1.6, 'vector-effect': 'non-scaling-stroke' }));
    g.appendChild(mk('circle', { cx: x, cy: 336, r: 5, fill: '#4F46E5', opacity: 0.3 }));
  }
}, null));

/* ---------------------------------------------------------------------------
   SLIDE ENGINE — transitions animate ONLY translate3d + opacity (GPU-safe)
--------------------------------------------------------------------------- */
const slides = $$('.slide');
let transitioning = false;

function goTo(idx, opts) {
  opts = opts || {};
  idx = clamp(idx, 0, TOTAL - 1);
  if (idx === slideIndex && document.querySelector('.slide.is-active') && !opts.force) return;
  const prevIdx = slideIndex;
  const goingForward = idx >= prevIdx;
  slides.forEach((s, i) => {
    s.classList.remove('is-active', 'is-exit-up', 'is-exit-down');
    if (i === idx) {
      s.classList.add('is-active');
    } else if (i === prevIdx && i !== idx) {
      s.classList.add(goingForward ? 'is-exit-up' : 'is-exit-down');
    }
  });
  /* DEMO lifecycle: leaving a slide ALWAYS resets its demo, so every demo
     (and every Replay button on slide 10) starts from a pristine state. */
  if (!IS_REMOTE && typeof DEMO !== 'undefined' && DEMO[prevIdx] && prevIdx !== idx) DEMO[prevIdx].reset();
  document.body.classList.toggle('stim-on', idx >= 0 && idx <= 6);
  slideIndex = idx;
  setFocusForSlide(idx);
  setActiveField(idx);
  updateHUD();
  onSlideEnter(idx);
  if (!opts.silent) AudioEngine.play(goingForward ? 'forward' : 'back');
  if (!IS_REMOTE) {
    refreshActLabel();          /* sync the .act-btn label to DEMO[idx].label() */
    publishNav(idx);
    publishState();             /* board -> remote STATE (label + hasDemo) */
  }
}
function next() { goTo(slideIndex + 1); }
function prev() { goTo(slideIndex - 1); }

function updateHUD() {
  const x = slideIndex + 1;
  $('#chip-num').textContent = String(x).padStart(2, '0');
  /* segmented dock: single authoritative state pass driven by slideIndex */
  $$('#progress-track .pseg').forEach((el, i) => {
    el.classList.toggle('done', i < slideIndex);
    el.classList.toggle('current', i === slideIndex);
  });
  $('#tel-x').textContent = x;
  $('#tel-left').textContent = (x === TOTAL) ? 'Final Slide' : ((TOTAL - x) + ' slides left');
  const mini = $('#mini-prog-fill'); if (mini) mini.style.transform = `scaleX(${x / TOTAL})`;
  /* remote UI sync */
  if (IS_REMOTE) {
    $('#rmu-idx').textContent = `SLIDE ${x} / ${TOTAL} · BOARD VIEW`;
    $('#rmu-name').textContent = slideName(slideIndex);
    $('#rmu-cue').textContent = CUES[slideIndex];
    $('#rmu-prog-fill').style.transform = `scaleX(${x / TOTAL})`;
    $$('#rmu-jump button').forEach((b, i) => b.classList.toggle('current', i === slideIndex));
  }
  const ts = $('#tele-slide'); if (ts) ts.textContent = `${x} / ${TOTAL}`;
}

/* ---------------------------------------------------------------------------
   INPUT HARDWARE: keyboard (Bluetooth HID), wheel, swipe, click zones, buttons
   Wrapped in bindDeckInput() so the demo action keys (A / Tab) can be checked
   before navigation and every listener is registered exactly once at init.
--------------------------------------------------------------------------- */
function bindDeckInput() {
window.addEventListener('keydown', (e) => {
  const k = e.key, c = e.code, kc = e.keyCode;
  /* never hijack ANY deck shortcut while typing in a text field */
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
    if (k === 'Escape') closeModal();
    return;
  }
  /* DEMO ACTION keys: A or Tab trigger the active slide's next step.
     Space/Enter/PageDown deliberately stay "next slide" only, so a Bluetooth
     clicker can never fire an experiment by accident. */
  if (!IS_REMOTE && (k === 'a' || k === 'A' || c === 'KeyA' || kc === 65 || k === 'Tab')) {
    e.preventDefault();
    triggerActiveSlideAction();
    return;
  }
  const isNext = (k === 'PageDown' || c === 'PageDown' || kc === 34 ||
                  k === 'ArrowRight' || k === 'ArrowDown' || c === 'ArrowRight' || c === 'ArrowDown' ||
                  k === ' ' || c === 'Space' || kc === 32 ||
                  k === 'Enter' || kc === 13 || c === 'KeyN' || kc === 78);
  const isPrev = (k === 'PageUp' || c === 'PageUp' || kc === 33 ||
                  k === 'ArrowLeft' || k === 'ArrowUp' || c === 'ArrowLeft' || c === 'ArrowUp' ||
                  k === 'Backspace' || kc === 8 || c === 'KeyP' || kc === 80);
  if (isNext) { e.preventDefault(); next(); return; }
  if (isPrev) { e.preventDefault(); prev(); return; }
  if (c === 'KeyF' || kc === 70 || k === 'F11' || kc === 122) { e.preventDefault(); toggleFullscreen(); return; }
  if (c === 'Escape' || kc === 27) { closeModal(); return; }
  /* direct jump: digits 1..9 -> slides 1..9 ; 0 -> slide 10 */
  let n = -1;
  if (/^[1-9]$/.test(k)) n = parseInt(k, 10) - 1;
  else if (k === '0') n = 9;
  else if (c && /^Digit[1-9]$/.test(c)) n = parseInt(c.slice(5), 10) - 1;
  else if (c === 'Digit0') n = 9;
  if (n >= 0) { e.preventDefault(); goTo(n); }
}, { passive: false });

/* debounced mouse wheel navigation */
let wheelLock = 0;
window.addEventListener('wheel', (e) => {
  if (IS_REMOTE) return;
  const nowT = Date.now();
  if (nowT - wheelLock < 650) return;
  if (Math.abs(e.deltaY) < 12) return;
  wheelLock = nowT;
  if (e.deltaY > 0) next(); else prev();
}, { passive: true });

/* touch swipe (board + phone both use this file) */
let touchX = null, touchY = null;
window.addEventListener('touchstart', (e) => {
  if (IS_REMOTE) return;
  if (e.touches.length !== 1) return;
  touchX = e.touches[0].clientX; touchY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchend', (e) => {
  if (!IS_REMOTE && touchX !== null) {
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev(); }
    touchX = null;
  }
}, { passive: true });

/* HUD buttons */
$('#next-btn').addEventListener('click', next);
$('#prev-btn').addEventListener('click', prev);
const restartBtn = $('#restart-btn');
if (restartBtn) restartBtn.addEventListener('click', () => goTo(0, { force: true }));
$$('[data-jump]').forEach(b => b.addEventListener('click', () => goTo(parseInt(b.dataset.jump, 10))));

/* presenter click-mode toggle + right/left zone clicks */
$('#presenter-toggle').addEventListener('click', () => {
  document.body.classList.toggle('presenter-click');
  $('#presenter-toggle').classList.toggle('is-on');
});
$('#zone-next').addEventListener('click', next);
$('#zone-prev').addEventListener('click', prev);
} /* ---- end bindDeckInput ---- */

/* ---------------------------------------------------------------------------
   FULLSCREEN (Android Chrome webkit fallback + dynamic icon/label)
--------------------------------------------------------------------------- */
function enterFS() {
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  else if (el.webkitRequestFullScreen) el.webkitRequestFullScreen();
}
function exitFS() {
  if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
}
function isFS() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function toggleFullscreen() { isFS() ? exitFS() : enterFS(); }
function refreshFSIcon() {
  const btn = $('#fullscreen-btn');
  btn.innerHTML = `<i data-lucide="${isFS() ? 'minimize-2' : 'maximize-2'}" stroke-width="2"></i>`;
  btn.setAttribute('aria-label', isFS() ? 'Exit fullscreen' : 'Enter fullscreen');
  if (window.lucide) lucide.createIcons();
}
$('#fullscreen-btn').addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', refreshFSIcon);
document.addEventListener('webkitfullscreenchange', refreshFSIcon);

/* ---------------------------------------------------------------------------
   MQTT ZERO-BACKEND PHONE SYNC (broker.emqx.io over WSS)
--------------------------------------------------------------------------- */
const BROKER = 'wss://broker.emqx.io:8084/mqtt';
let mqttClient = null, mqttOnline = false;

function setSyncStatus(state) {
  const dot = $('#sync-dot'), lbl = $('#sync-label');
  const ms = $('#modal-status'), tm = $('#tele-mqtt');
  const rdot = $('#rmu-dot'), rt = $('#rmu-status-txt');
  if (dot) { dot.className = ''; dot.classList.add(state === 'online' ? 'online' : (state === 'offline' ? 'offline' : '')); }
  const txt = state === 'online' ? 'SYNCED' : (state === 'offline' ? 'OFFLINE' : 'LINKING');
  if (lbl) lbl.textContent = txt;
  if (ms) { ms.textContent = state.toUpperCase(); ms.style.color = state === 'online' ? 'var(--emerald)' : (state === 'offline' ? 'var(--coral)' : 'var(--ink-c)'); }
  if (tm) { tm.textContent = state === 'online' ? 'ONLINE · WSS' : txt; tm.classList.toggle('online', state === 'online'); }
  if (rdot) rdot.style.background = state === 'online' ? '#059669' : (state === 'offline' ? '#E11D48' : '#94A3B8');
  if (rt) rt.textContent = txt;
}

function connectMQTT() {
  if (typeof mqtt === 'undefined') { setSyncStatus('offline'); return; }
  try {
    if (mqttClient) { try { mqttClient.end(true); } catch (e) {} }
    mqttClient = mqtt.connect(BROKER, {
      clientId: 'qp-' + Math.random().toString(16).slice(2, 10),
      keepalive: 30, reconnectPeriod: 2500, connectTimeout: 6000
    });
    mqttClient.on('connect', () => {
      mqttOnline = true; setSyncStatus('online');
      mqttClient.subscribe(roomTopic, { qos: 0 }, () => {
        /* announce presence so late joiners sync to our view */
        publishNav(slideIndex, true);
      });
    });
    mqttClient.on('reconnect', () => setSyncStatus('linking'));
    mqttClient.on('close', () => { mqttOnline = false; setSyncStatus('offline'); });
    mqttClient.on('error', () => setSyncStatus('offline'));
    mqttClient.on('message', (topic, payload) => {
      if (topic !== roomTopic) return;
      let msg;
      try { msg = JSON.parse(payload.toString()); } catch (e) { return; }
      if (!msg || typeof msg.slideIndex !== 'number') return;
      /* ---------- NAV: existing behaviour + loop protection (unchanged) ---------- */
      if (msg.type === 'NAV') {
        if (IS_REMOTE) {
          /* board-originated NAV: the phone mirrors the authoritative index */
          if (msg.src !== 'board') return;
          slideIndex = clamp(msg.slideIndex, 0, TOTAL - 1);
          updateHUD();
        } else {
          /* remote-originated NAV only — never obey our own echoes */
          if (msg.src !== 'remote') return;
          goTo(clamp(msg.slideIndex, 0, TOTAL - 1), { silent: true });
          showToast(`Remote jump → Slide ${msg.slideIndex + 1}`);
        }
        return;
      }
      /* ---------- ACT: remote -> board. Ignore echoes + wrong-slide messages ---------- */
      if (msg.type === 'ACT') {
        if (IS_REMOTE) return;                 /* the remote never executes ACT */
        if (msg.src !== 'remote') return;      /* never process our own echo */
        if (msg.slideIndex !== slideIndex) return;
        triggerActiveSlideAction();
        return;
      }
      /* ---------- STATE: board -> remote label/name mirror ---------- */
      if (msg.type === 'STATE') {
        if (!IS_REMOTE) return;                /* the board ignores STATE */
        if (msg.src !== 'board') return;
        remoteState.label = (typeof msg.label === 'string' || msg.label === null) ? msg.label : null;
        remoteState.hasDemo = !!msg.hasDemo;
        remoteState.slideIndex = clamp(msg.slideIndex, 0, TOTAL - 1);
        applyRemoteState();
        return;
      }
    });
  } catch (e) { setSyncStatus('offline'); }
}

function publishNav(idx, isAnnounce) {
  if (!IS_REMOTE && !isAnnounce && mqttClient == null) return;
  if (!mqttClient || !mqttOnline) return;
  try {
    mqttClient.publish(roomTopic, JSON.stringify({ type: 'NAV', slideIndex: idx, timestamp: Date.now(), src: IS_REMOTE ? 'remote' : 'board' }), { qos: 0 });
  } catch (e) {}
}

let toastTimer = null;
function showToast(msg) {
  const t = $('#toast'); $('#toast-msg').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ---------------------------------------------------------------------------
   DEMO ACTION SYSTEM — MQTT plumbing (additive; NAV stays exactly as before)
   Board -> remote : {type:'STATE', slideIndex, label, hasDemo, timestamp, src:'board'}
   Remote -> board : {type:'ACT',   slideIndex, timestamp, src:'remote'}
--------------------------------------------------------------------------- */
function publishState() {
  if (IS_REMOTE || !mqttClient || !mqttOnline) return;
  const d = DEMO[slideIndex];
  let label = null;
  try { label = d ? d.label() : null; } catch (e) { label = null; }
  try {
    mqttClient.publish(roomTopic, JSON.stringify({
      type: 'STATE', slideIndex: slideIndex, label: label, hasDemo: !!d,
      timestamp: Date.now(), src: 'board'
    }), { qos: 0 });
  } catch (e) {}
}
function publishAct() {
  if (!mqttClient || !mqttOnline) return;
  try {
    mqttClient.publish(roomTopic, JSON.stringify({
      type: 'ACT', slideIndex: slideIndex, timestamp: Date.now(), src: IS_REMOTE ? 'remote' : 'board'
    }), { qos: 0 });
  } catch (e) {}
}

/* ---------------------------------------------------------------------------
   REMOTE SYNC MODAL + QR
--------------------------------------------------------------------------- */
function remoteURL() {
  const u = new URL(location.href);
  u.searchParams.set('mode', 'remote');
  u.searchParams.set('room', roomTopic);
  return u.toString();
}
function refreshModalLinks() {
  const url = remoteURL();
  $('#remote-url').textContent = url;
  $('#open-remote-tab').href = url;
  const qr = $('#qr-img');
  if (qr) qr.src = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&color=0f172a&bgcolor=ffffff&data=' + encodeURIComponent(url);
  $('#topic-preview').textContent = roomTopic;
  $('#room-input').value = roomTopic;
  const tr = $('#tele-room'); if (tr) tr.textContent = roomTopic;
}
function openModal() { refreshModalLinks(); $('#remote-modal-overlay').classList.add('open'); }
function closeModal() { $('#remote-modal-overlay').classList.remove('open'); }
$('#sync-btn').addEventListener('click', openModal);
$('#reveal-sync-btn').addEventListener('click', openModal);
$('#modal-close-x').addEventListener('click', closeModal);
$('#remote-modal-overlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
$('#copy-url-btn').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(remoteURL()); showToast('Remote link copied'); }
  catch (e) { showToast('Copy blocked — long-press the link'); }
});
$('#apply-room-btn').addEventListener('click', () => {
  const v = $('#room-input').value.trim();
  if (v) { roomTopic = v; refreshModalLinks(); setSyncStatus('linking'); connectMQTT(); showToast('Broker reconnected on new topic'); }
});

/* ---------------------------------------------------------------------------
/* ---------------------------------------------------------------------------
   Slide 10 + remote — runtime timers (KEPT from the original deck, verbatim)
--------------------------------------------------------------------------- */
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

/* ---------------------------------------------------------------------------
   REMOTE UI BOOT (phone view) — Prev/Next/JUMP plus the third big ACT button
--------------------------------------------------------------------------- */
function bootRemoteUI() {
  document.body.classList.add('remote-mode');
  const jumpWrap = $('#rmu-jump');
  for (let i = 0; i < TOTAL; i++) {
    const b = document.createElement('button');
    b.textContent = i + 1;
    b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
    b.addEventListener('click', () => publishNav(i));
    jumpWrap.appendChild(b);
  }
  $('#rmu-next').addEventListener('click', () => publishNav(clamp(slideIndex + 1, 0, TOTAL - 1)));
  $('#rmu-prev').addEventListener('click', () => publishNav(clamp(slideIndex - 1, 0, TOTAL - 1)));
  const actBtn = $('#rmu-act');
  if (actBtn) actBtn.addEventListener('click', () => {
    if (actBtn.disabled) return;
    AudioEngine.play('tap');
    publishAct();
  });
  updateHUD();
  applyRemoteState();
}
