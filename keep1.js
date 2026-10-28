'use strict';
/* =========================================================================
   CAN YOU TRUST YOUR OWN BRAIN? — DECK ENGINE
   Sections: state · field · slides · input · telemetry · mqtt · interactions
   ========================================================================= */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const params = new URLSearchParams(location.search);
const IS_REMOTE = params.get('mode') === 'remote';
/* shared room topic — default qinfinity/lalit/trust-brain-2026, customizable via ?room=xyz */
let roomTopic = params.get('room') ? params.get('room') : 'qinfinity/lalit/trust-brain-2026';

/* ---------------------------------------------------------------------------
   AUDIO ENGINE — synthesized, zero-asset, mesmerising sound design.
   Action SFX for every click / slide / animation event + generative ambient
   BGM pad. Both independently toggleable; persisted in localStorage.
--------------------------------------------------------------------------- */
const AudioEngine = (() => {
  /* FIX (PRIORITY 2 — complete BGM mute): strict two-bus audio graph.
       SFX path : voices -> sfxDry -> sfxBus ------------------> master
                \-> sfxWet -> convolver -> sfxWetGain -/
       BGM path : voices -> bgmDry -> bgmBus ------------------> master
                \-> bgmWet -> convolver -> bgmWetGain -> bgmBus -/
     Every ambient source AND its reverb return now terminates behind
     bgmBus, so muting BGM silences pad, bells, noise layer, reverb tail
     and every future-scheduled note. SFX has its own parallel convolver
     send behind sfxBus — the two mutes are fully independent. */
  let ctx = null, master = null, noiseBuf = null;
  let bgmBus = null, bgmDry = null, bgmWet = null, bgmConv = null, bgmWetGain = null;
  let sfxBus = null, sfxDry = null, sfxWet = null, sfxConv = null, sfxWetGain = null;
  /* FIX: BGM defaults to OFF unless explicitly enabled previously — an
     unrelated first gesture can never silently start the music */
  let bgmOn = false, sfxOn = true, bgmPlaying = false, bgmTimer = null, nextBellAt = 0;
  let bgmNodes = [];
  let bgmVol = 0.55, sfxVol = 0.8;
  try { const v = parseFloat(localStorage.getItem('ap-bgmvol')); if (!isNaN(v)) bgmVol = clamp(v, 0, 1); } catch (e) {}
  try { const v = parseFloat(localStorage.getItem('ap-sfxvol')); if (!isNaN(v)) sfxVol = clamp(v, 0, 1); } catch (e) {}
  try { bgmOn = localStorage.getItem('ap-bgm') === 'on'; } catch (e) {}
  try { sfxOn = localStorage.getItem('ap-sfx') !== 'off'; } catch (e) {}

  function makeReverb() {
    /* lightweight generated reverb (2.8s stereo decaying noise IR) */
    const cv = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 2.8);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
    }
    cv.buffer = ir;
    return cv;
  }
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    /* --- BGM chain: everything ambient terminates through bgmBus --- */
    bgmBus = ctx.createGain(); bgmBus.gain.value = 0.0001; bgmBus.connect(master);
    bgmDry = ctx.createGain(); bgmDry.gain.value = 1; bgmDry.connect(bgmBus);
    bgmWet = ctx.createGain(); bgmWet.gain.value = 0.34;
    bgmConv = makeReverb(); bgmWetGain = ctx.createGain(); bgmWetGain.gain.value = 1;
    bgmWet.connect(bgmConv); bgmConv.connect(bgmWetGain); bgmWetGain.connect(bgmBus);
    /* --- SFX chain: independent dry + dedicated reverb send behind sfxBus --- */
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxVol; sfxBus.connect(master);
    sfxDry = ctx.createGain(); sfxDry.gain.value = 1; sfxDry.connect(sfxBus);
    sfxWet = ctx.createGain(); sfxWet.gain.value = 0.34;
    sfxConv = makeReverb(); sfxWetGain = ctx.createGain();
    sfxWet.connect(sfxConv); sfxConv.connect(sfxWetGain); sfxWetGain.connect(sfxBus);
    /* shared white-noise buffer for airy/swish layers */
    const nlen = Math.floor(ctx.sampleRate * 1.2);
    noiseBuf = ctx.createBuffer(1, nlen, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nlen; i++) nd[i] = Math.random() * 2 - 1;
    return true;
  }

  function stopBGM() {
    bgmPlaying = false;
    if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
    if (!ctx) { bgmNodes = []; return; }
    const t = ctx.currentTime;
    /* 1. fade the ENTIRE BGM output (dry + reverb returns ride on bgmBus) */
    try {
      bgmBus.gain.cancelScheduledValues(t);
      bgmBus.gain.setValueAtTime(Math.max(bgmBus.gain.value, 0.0001), t);
      bgmBus.gain.linearRampToValueAtTime(0.0001, t + 0.6);
    } catch (e) {}
    /* 2/3. stop every live or future-scheduled ambient node, then drop refs */
    bgmNodes.forEach((n) => {
      try { if (n.stop) n.stop(t + 0.7); } catch (e) {}
      try { if (n.disconnect) n.disconnect(); } catch (e) {}
    });
    bgmNodes = [];
  }

  const now = () => ctx.currentTime;
  function reg(node) { bgmNodes.push(node); return node; }
  function tone(freq, t0, dur, type, vol, glideTo, bus) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    const isBgm = (bus === bgmBus);
    if (isBgm) reg(o);
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(isBgm ? bgmDry : sfxDry);          /* dry path stays behind its bus */
    g.connect(isBgm ? bgmWet : sfxWet);          /* reverb SEND — return also lands on the same bus */
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noiseHit(t0, dur, f0, f1, vol, q) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || 1.1;
    bp.frequency.setValueAtTime(f0, t0);
    bp.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp); bp.connect(g);
    g.connect(sfxDry); g.connect(sfxWet);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  /* ---- action sounds: soft, glassy, pentatonic — satisfying, never harsh ---- */
  const SFX = {
    tap()     { const t = now(); tone(1180, t, 0.09, 'triangle', 0.10); noiseHit(t, 0.05, 3200, 1400, 0.03); },
    toggle()  { const t = now(); tone(660, t, 0.10, 'triangle', 0.09); tone(990, t + 0.055, 0.12, 'sine', 0.07); },
    forward() { const t = now(); [523.25, 659.25, 783.99].forEach((f, i) => tone(f, t + i * 0.06, 0.5, 'sine', 0.085)); noiseHit(t, 0.22, 900, 2600, 0.028, 0.8); },
    back()    { const t = now(); [783.99, 659.25, 523.25].forEach((f, i) => tone(f, t + i * 0.06, 0.5, 'sine', 0.075)); noiseHit(t, 0.2, 2400, 800, 0.024, 0.8); },
    jump()    { const t = now(); tone(440, t, 0.32, 'triangle', 0.09, 1318.5); tone(880, t + 0.05, 0.4, 'sine', 0.05); },
    reveal()  { const t = now(); [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, t + i * 0.07, 0.9, 'sine', 0.07)); tone(261.6, t, 1.4, 'triangle', 0.05); },
    open()    { const t = now(); tone(392, t, 0.4, 'sine', 0.08, 784); tone(587.3, t + 0.08, 0.5, 'sine', 0.05); },
    close()   { const t = now(); tone(784, t, 0.3, 'sine', 0.07, 392); },
    morph()   { const t = now(); tone(329.6, t, 0.5, 'triangle', 0.07, 659.3); tone(493.9, t + 0.1, 0.55, 'sine', 0.05, 987.8); },
    kinetic() { const t = now(); tone(1567.98, t, 0.35, 'sine', 0.05); tone(2349.3, t + 0.02, 0.25, 'sine', 0.03); },
    chime()   { const t = now(); tone(1046.5, t, 1.6, 'sine', 0.06); tone(1567.98, t + 0.02, 1.2, 'sine', 0.035); }
  };
  function play(name) {
    if (!sfxOn || IS_REMOTE) return;
    if (!ensure()) return;
    try { SFX[name] && SFX[name](); } catch (e) {}
  }

  /* FIX (action sounds not working): iOS/Android Chrome silently suspends the
     AudioContext unless it is created/resumed INSIDE a real user-gesture task.
     The old one-shot unlock listener was consumed by any first pointerdown —
     including taps that hit a <button>, whose click handler then fired in a
     separate, non-gesture task, leaving ctx permanently "suspended" and every
     action sound inaudible. This dedicated synchronous listener re-arms on
     every gesture for the whole session (zero cost once running). */
  window.addEventListener('pointerdown', () => {
    try { if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); } catch (e) {}
  }, true);
  window.addEventListener('keydown', () => {
    try { if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); } catch (e) {}
  }, true);

  /* ---- ambient generative BGM: warm detuned pad + sparse bell rain ---- */
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  function startBGM() {
    if (bgmPlaying || !ensure() || !bgmOn) return;
    bgmPlaying = true;
    const base = [130.81, 196.0, 261.63]; // C3 · G3 · C4 — open fifths, calm
    base.forEach((f, i) => {
      [-3.5, 3.5].forEach((cents) => {
        const o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sine';
        o.frequency.value = f; o.detune.value = cents;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 620 + i * 240; lp.Q.value = 0.5;
        const g = ctx.createGain(); g.gain.value = 0.0001;
        g.gain.exponentialRampToValueAtTime(i === 2 ? 0.016 : 0.026, now() + 6);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.045 + i * 0.017;
        const lg = ctx.createGain(); lg.gain.value = 0.011;
        lfo.connect(lg); lg.connect(g.gain); lfo.start();
        o.connect(lp); lp.connect(g); g.connect(bgmDry); g.connect(bgmWet);
        o.start(); reg(o); reg(lfo);
      });
    });
    const air = ctx.createBufferSource(); air.buffer = noiseBuf; air.loop = true;
    const abp = ctx.createBiquadFilter(); abp.type = 'bandpass'; abp.frequency.value = 900; abp.Q.value = 0.4;
    const ag = ctx.createGain(); ag.gain.value = 0.0001;
    ag.gain.linearRampToValueAtTime(0.0045, now() + 8);
    const alfo = ctx.createOscillator(); alfo.frequency.value = 0.07;
    const alg = ctx.createGain(); alg.gain.value = 320;
    alfo.connect(alg); alg.connect(abp.frequency); alfo.start();
    /* FIX: noise layer routes through the BGM dry/wet sends — never a shared
       convolver that could bypass bgmBus and keep ringing after mute */
    air.connect(abp); abp.connect(ag); ag.connect(bgmDry); ag.connect(bgmWet);
    air.start(); reg(air); reg(alfo);
    nextBellAt = now() + 4;
    bgmTimer = setInterval(scheduleBells, 1500);
  }
  function scheduleBells() {
    if (!ctx || !bgmOn || !bgmPlaying) return;
    while (nextBellAt < ctx.currentTime + 2) {
      const f = PENTA[Math.floor(Math.random() * PENTA.length)];
      tone(f, nextBellAt, 2.6, 'sine', 0.035 + Math.random() * 0.02, null, bgmBus);
      tone(f * 2, nextBellAt + 0.01, 1.6, 'sine', 0.012, null, bgmBus);
      nextBellAt += 3.5 + Math.random() * 6;
    }
  }
  /* FIX: mute tears down EVERYTHING ambient (nodes, scheduler, reverb tail via
     the bus fade). Re-enable recreates cleanly — startBGM guards against
     duplicate schedulers/oscillators via bgmPlaying, and stopBGM clears it. */
  function setBGM(on) {
    bgmOn = on;
    try { localStorage.setItem('ap-bgm', on ? 'on' : 'off'); } catch (e) {}
    if (on) {
      if (!ensure()) return;
      startBGM();
      if (bgmBus) {
        bgmBus.gain.cancelScheduledValues(now());
        bgmBus.gain.setValueAtTime(Math.max(bgmBus.gain.value, 0.0001), now());
        bgmBus.gain.linearRampToValueAtTime(Math.max(bgmVol, 0.0001), now() + 1.4);
      }
    } else stopBGM();
  }
  function setSFX(on) {
    sfxOn = on;
    try { localStorage.setItem('ap-sfx', on ? 'on' : 'off'); } catch (e) {}
  }
  /* FIX (BGM volume slider): live, persisted gain control for both buses */
  function setBGMVolume(v) {
    bgmVol = clamp(v, 0, 1);
    try { localStorage.setItem('ap-bgmvol', String(bgmVol)); } catch (e) {}
    if (ctx && bgmBus && bgmOn) {
      bgmBus.gain.cancelScheduledValues(now());
      bgmBus.gain.setValueAtTime(Math.max(bgmBus.gain.value, 0.0001), now());
      bgmBus.gain.linearRampToValueAtTime(Math.max(bgmVol, 0.0001), now() + 0.12);
    }
  }
  function setSFXVolume(v) {
    sfxVol = clamp(v, 0, 1);
    try { localStorage.setItem('ap-sfxvol', String(sfxVol)); } catch (e) {}
    if (ctx && sfxBus) {
      sfxBus.gain.cancelScheduledValues(now());
      sfxBus.gain.setValueAtTime(sfxVol, now());
    }
  }
  function unlock() {
    /* FIX: gesture-unlock only resumes the AudioContext; it never starts or
       re-starts BGM behind the user's back. Music begins ONLY via setBGM(true) */
    ensure();
  }
  return {
    play, unlock, setBGM, setSFX, setBGMVolume, setSFXVolume,
    isBGM: () => bgmOn, isSFX: () => sfxOn,
    getBGMVolume: () => bgmVol, getSFXVolume: () => sfxVol,
    /* telemetry for regression tests: live ambient node count + scheduler id */
    _bgmNodeCount: () => bgmNodes.length,
    _bgmTimerActive: () => bgmTimer !== null,
    /* phonetic readout of the presenter's name — Web Speech API */
    pronounce() {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance('luh, lit. Lalit Mehta.');
          u.lang = 'en-IN'; u.rate = 0.82; u.pitch = 1.0; u.volume = 1;
          const pick = (window.speechSynthesis.getVoices() || [])
            .find(v => /en[-_]IN/i.test(v.lang)) ||
            (window.speechSynthesis.getVoices() || []).find(v => /^en/i.test(v.lang));
          if (pick) u.voice = pick;
          window.speechSynthesis.speak(u);
        }
      } catch (e) {}
    }
  };
})();

/* global gesture unlock — browsers require a user gesture before audio can start */
['pointerdown', 'keydown', 'touchstart'].forEach((ev) => {
  window.addEventListener(ev, () => AudioEngine.unlock(), { once: true, passive: true });
});

/* HUD audio toggle buttons */
function refreshAudioIcons() {
  const s = $('#sfx-toggle'), b = $('#bgm-toggle');
  if (s) {
    s.innerHTML = `<i data-lucide="${AudioEngine.isSFX() ? 'volume-2' : 'volume-x'}" stroke-width="2"></i>`;
    s.classList.toggle('muted', !AudioEngine.isSFX());
    s.setAttribute('aria-pressed', String(AudioEngine.isSFX()));
  }
  if (b) {
    b.innerHTML = `<i data-lucide="${AudioEngine.isBGM() ? 'music' : 'music-off'}" stroke-width="2"></i>`;
    b.classList.toggle('muted', !AudioEngine.isBGM());
    b.setAttribute('aria-pressed', String(AudioEngine.isBGM()));
  }
  if (window.lucide) lucide.createIcons();
}
document.addEventListener('DOMContentLoaded', () => {
  $('#sfx-toggle').addEventListener('click', () => {
    AudioEngine.setSFX(!AudioEngine.isSFX());
    refreshAudioIcons();
    AudioEngine.play('toggle');
  });
  $('#bgm-toggle').addEventListener('click', () => {
    AudioEngine.setBGM(!AudioEngine.isBGM());
    refreshAudioIcons();
    AudioEngine.play('toggle');
  });
  const pb = $('#pronounce-btn');
  if (pb) pb.addEventListener('click', () => { AudioEngine.play('chime'); AudioEngine.pronounce(); });
  refreshAudioIcons();
});

const T0 = Date.now();                       // presentation runtime epoch
let slideIndex = 0;                          // current slide (0-based)
const TOTAL = 10;

/* Speaker cues surfaced in the phone remote */
const CUES = [
  'Title + bridge test (0:45). Ask the room which square looks lighter; press ACT to bridge them. Landing line: same gray, judged by surroundings.',
  'Size by comparison (1:15). Hands up BEFORE pressing ACT. The two orange circles are identical; one line on context: we judge size by the neighbours.',
  'Duck or rabbit (1:15). Hands for duck vs rabbit first; ACT shows the duck reading, then the rabbit reading. Mention the Easter/October study as one study.',
  'Attention arena (1:45). Stress: count WHITE bounces only, 12 seconds. Collect answers by hands; the answer is 15. ACT again to replay with highlights and ask who saw the star, the border, the square.',
  'Memory words (1:45). Do not say the theme before the reveal. After the poll: the lure SLEEP was never shown. Keep the tone friendly — false recall here is normal memory.',
  'Loftus & Palmer (1:15). Ask for a prediction before each reveal; use the verbs in order. The broken-glass follow-up had no glass in the film; add that the mechanism is still debated.',
  'Secret rule (1:30). Ask yes/no before each ACT press; the surprise is 3-17-104 = YES. The rule is any three ascending numbers.',
  'Confidence does not equal accuracy (0:45). Say both halves: confidence can be wrong, and that is not the same as confidence always being wrong.',
  'Check yourself (0:45). Four habits; stress process over willpower — change the steps, not the person.',
  'Closing + Q&A (0:30 + Q&A). Land the thesis line, then offer a replay of any experiment from the buttons on screen.'
];

/* ---------------------------------------------------------------------------
   PER-SLIDE GENERATIVE VECTOR FIELDS — one bespoke, content-relevant animated
   SVG field INSIDE the slide stage for each of the 10 slides. Each field owns
   its own RAF loop; only the active slide animates (others stay paused).
--------------------------------------------------------------------------- */
const SVGNS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs) => {
  const el = document.createElementNS(SVGNS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
};
const svgOf = (n) => document.querySelector('#s' + n + ' .slide-field svg');
const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
