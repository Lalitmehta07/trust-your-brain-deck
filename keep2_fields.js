function makeField(n, build, step) {
  const svg = svgOf(n);
  if (!svg) return null;
  /* FIX (demo slides): fields flagged st.once draw ONE static frame and never
     run an animation loop, so moving backgrounds never compete with stimuli. */
  const st = { svg, t: 0, raf: null, running: false, once: false, d: {} };
  build(st);
  const loop = () => {
    if (!st.running) return;
    st.t += 1 / 60;
    try { step(st); } catch (e) {}
    if (st.once) { st.running = false; return; }
    st.raf = requestAnimationFrame(loop);
  };
  st.start = () => { if (st.running || REDUCED) return; st.running = true; st.raf = requestAnimationFrame(loop); };
  st.stop = () => { st.running = false; if (st.raf) cancelAnimationFrame(st.raf); };
  return st;
}

const fields = [];

/* FIX (live-deck crash): setFocusForSlide was called by goTo()/init() but its
   definition had been lost in an earlier edit — every navigation threw a
   ReferenceError, killing transitions, HUD updates and MQTT publishing.
   Restored as a no-op safe focus guard: never steals focus from an active
   text input, otherwise blurs any stuck button focus so HID keyboards keep
   delivering keys to the window-level navigation listeners. */
function setFocusForSlide(idx) {
  try {
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
    if (ae && typeof ae.blur === 'function' && ae !== document.body) ae.blur();
  } catch (e) {}
}

/* ---- 1 · Title: attention ribbons converging on an algorithmic attractor ---- */
fields.push(makeField(1, (f) => {
  const grid = mk('g', {}), rib = mk('g', {}), ret = mk('g', {}), nd = mk('g', {});
  f.svg.append(grid, rib, ret, nd);
  for (let gx = 120; gx < 1920; gx += 240) for (let gy = 120; gy < 1080; gy += 240)
    grid.appendChild(mk('path', { d: `M ${gx-7} ${gy} H ${gx+7} M ${gx} ${gy-7} V ${gy+7}`, stroke: '#64748B', 'stroke-opacity': 0.10, 'stroke-width': 1, fill: 'none', 'vector-effect': 'non-scaling-stroke' }));
  f.d.ribbons = [];
  for (let i = 0; i < 12; i++) {
    const p = mk('path', { fill: 'none', stroke: `url(#${['rgA','rgB','rgC'][i % 3]})`, 'stroke-width': String(1 + (i % 4)), 'vector-effect': 'non-scaling-stroke' });
    if (i % 5 === 2) p.setAttribute('stroke-dasharray', '10 14');
    rib.appendChild(p);
    f.d.ribbons.push({ el: p, seed: i * 137.508, yBase: 90 + (i / 11) * 900, amp: 40 + (i % 5) * 26, freq: 0.6 + (i % 7) * 0.17, phase: (i * 137.508 % 360) * Math.PI / 180, speed: 0.12 + (i % 6) * 0.035, dash: i % 5 === 2 });
  }
  const r = mk('use', { href: '#sym-reticle' }); ret.appendChild(r);
  const core = mk('use', { href: '#sym-core' }); ret.appendChild(core);
  f.d.ret = r; f.d.core = core; f.d.ax = 1560; f.d.ay = 300;
  f.d.nodes = [];
  for (let m = 0; m < 7; m++) {
    const c = mk('circle', { r: String(2.5 + (m % 3)), fill: ['#E11D48','#2563EB','#4F46E5'][m % 3], opacity: 0.5 });
    nd.appendChild(c);
    f.d.nodes.push({ el: c, t: m / 7, speed: 0.03 + (m % 4) * 0.012, row: m % 12 });
  }
}, (f) => {
  const time = f.t;
  f.d.ax = 1560 + Math.sin(time * 0.11) * 60;
  f.d.ay = 300 + Math.cos(time * 0.09) * 46;
  f.d.ret.setAttribute('transform', `translate(${f.d.ax.toFixed(1)} ${f.d.ay.toFixed(1)}) rotate(${(time * 6).toFixed(2)})`);
  f.d.core.setAttribute('transform', `translate(${f.d.ax.toFixed(1)} ${f.d.ay.toFixed(1)})`);
  const dashOff = time * 26;
  for (const rb of f.d.ribbons) {
    const drift = Math.sin(time * rb.speed + rb.phase) * rb.amp;
    const y0 = rb.yBase + drift;
    const mx1 = 420 + Math.sin(time * rb.speed * 0.7 + rb.seed) * 120;
    const my1 = y0 + Math.cos(time * rb.freq * 0.5 + rb.phase) * rb.amp * 1.6;
    const mx2 = 1080 + Math.sin(time * rb.speed * 0.9 + rb.phase * 2) * 90;
    const my2 = lerp(y0, f.d.ay, 0.55) + Math.sin(time * rb.freq + rb.seed) * rb.amp * 0.7;
    rb.el.setAttribute('d', `M -60 ${y0.toFixed(1)} C ${mx1.toFixed(1)} ${my1.toFixed(1)}, ${mx2.toFixed(1)} ${my2.toFixed(1)}, ${f.d.ax.toFixed(1)} ${f.d.ay.toFixed(1)}`);
    if (rb.dash) rb.el.setAttribute('stroke-dashoffset', (-dashOff % 9999).toFixed(1));
    rb._c = [y0, mx1, my1, mx2, my2];
  }
  for (const nod of f.d.nodes) {
    nod.t += nod.speed / 60; if (nod.t > 1) nod.t -= 1;
    const rb = f.d.ribbons[nod.row]; if (!rb || !rb._c) continue;
    const [y0, mx1, my1, mx2, my2] = rb._c, tt = nod.t, mt = 1 - tt;
    nod.el.setAttribute('cx', (mt*mt*mt*-60 + 3*mt*mt*tt*mx1 + 3*mt*tt*tt*mx2 + tt*tt*tt*f.d.ax).toFixed(1));
    nod.el.setAttribute('cy', (mt*mt*mt*y0 + 3*mt*mt*tt*my1 + 3*mt*tt*tt*my2 + tt*tt*tt*f.d.ay).toFixed(1));
  }
}));

/* ---- 2 · Collapse: legacy waveform decaying into fragmented noise blocks ---- */
fields.push(makeField(2, (f) => {
  const g1 = mk('g', {}), g2 = mk('g', {});
  f.svg.append(g1, g2);
  f.d.waves = [];
  for (let w = 0; w < 5; w++) {
    const p = mk('path', { fill: 'none', stroke: `url(#${['rgA','rgB','rgC'][w % 3]})`, 'stroke-width': String(1.4 + (w % 3)), 'vector-effect': 'non-scaling-stroke', opacity: 0.9 - w * 0.12 });
    g1.appendChild(p);
    f.d.waves.push({ el: p, base: 200 + w * 150, amp: 90 - w * 12, ph: w * 0.9 });
  }
  f.d.blocks = [];
  for (let b = 0; b < 26; b++) {
    const r = mk('rect', { width: 14, height: 14, rx: 3, fill: b % 4 ? '#2563EB' : '#E11D48', opacity: 0.10 });
    g2.appendChild(r);
    f.d.blocks.push({ el: r, x: 120 + b * 66, y: 950, seed: b * 47.3 });
  }
}, (f) => {
  const t = f.t;
  for (const w of f.d.waves) {
    let dPath = 'M 0 ' + w.base;
    for (let x = 0; x <= 1920; x += 64) {
      const decay = 1 / (1 + x / 760);                        // amplitude collapse left→right
      const chop = x > 1150 ? Math.sign(Math.sin(x * 0.05 + t)) * 26 : 0; // fragmentation zone
      const y = w.base + Math.sin(x * 0.006 + t * (0.8 + w.ph * 0.2) + w.ph) * w.amp * decay + chop;
      dPath += ` L ${x} ${y.toFixed(1)}`;
    }
    w.el.setAttribute('d', dPath);
  }
  for (const b of f.d.blocks) {
    const jitter = Math.sin(t * 2.1 + b.seed) * 10 + Math.sin(t * 5.7 + b.seed * 2) * 4;
    const fall = ((t * 40 + b.seed * 9) % 1080);
    b.el.setAttribute('x', (b.x + Math.sin(t * 1.3 + b.seed) * 6).toFixed(1));
    b.el.setAttribute('y', (fall - 40 + jitter).toFixed(1));
    b.el.setAttribute('opacity', (0.05 + 0.10 * Math.abs(Math.sin(t + b.seed))).toFixed(3));
  }
}));

/* ---- 3 · Dopamine loop: reward pulses orbiting a prediction-error ellipse ---- */
fields.push(makeField(3, (f) => {
  const g = mk('g', {}); f.svg.appendChild(g);
  const ell = mk('ellipse', { cx: 960, cy: 540, rx: 620, ry: 300, fill: 'none', stroke: 'url(#rgB)', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke', opacity: 0.8 });
  const ell2 = mk('ellipse', { cx: 960, cy: 540, rx: 620, ry: 300, fill: 'none', stroke: 'url(#rgC)', 'stroke-width': 1.6, 'stroke-dasharray': '8 12', 'vector-effect': 'non-scaling-stroke', opacity: 0.7 });
  const rot = mk('g', {});
  rot.appendChild(ell); rot.appendChild(ell2);
  g.appendChild(rot);
  f.d.rot = rot;
  f.d.pulses = [];
  for (let i = 0; i < 4; i++) {
    const halo = mk('circle', { r: 26, fill: 'url(#attractorGlow)' });
    const c = mk('circle', { r: 7, fill: i % 2 ? '#4F46E5' : '#E11D48', opacity: 0.85 });
    g.appendChild(halo); g.appendChild(c);
    f.d.pulses.push({ c, halo, ph: i / 4, sp: 0.16 + (i % 3) * 0.05 });
  }
  const spark = mk('g', {}); g.appendChild(spark); f.d.spark = spark; f.d.sparks = [];
}, (f) => {
  const t = f.t;
  f.d.rot.setAttribute('transform', `rotate(${(Math.sin(t * 0.12) * 4).toFixed(2)} 960 540)`);
  for (const p of f.d.pulses) {
    const a = (t * p.sp + p.ph) * Math.PI * 2;
    const err = 1 + 0.10 * Math.sin(a * 3 + t);              // prediction-error wobble
    const x = 960 + Math.cos(a) * 620 * err, y = 540 + Math.sin(a) * 300 * err;
    p.c.setAttribute('cx', x.toFixed(1)); p.c.setAttribute('cy', y.toFixed(1));
    p.halo.setAttribute('cx', x.toFixed(1)); p.halo.setAttribute('cy', y.toFixed(1));
    p.c.setAttribute('opacity', (0.55 + 0.35 * Math.abs(Math.sin(a * 2))).toFixed(2));
  }
  /* intermittent reinforcement sparks at random pulse positions */
  if (Math.random() < 0.02) {
    const p = f.d.pulses[Math.floor(Math.random() * 4)];
    const x = parseFloat(p.c.getAttribute('cx')), y = parseFloat(p.c.getAttribute('cy'));
    const s = mk('circle', { cx: x, cy: y, r: 4, fill: '#4F46E5', opacity: 0.8 });
    f.d.spark.appendChild(s); f.d.sparks.push({ el: s, life: 1 });
  }
  f.d.sparks = f.d.sparks.filter((s) => {
    s.life -= 0.02;
    s.el.setAttribute('r', (14 * (1 - s.life) + 3).toFixed(1));
    s.el.setAttribute('opacity', (s.life * 0.7).toFixed(2));
    if (s.life <= 0) { s.el.remove(); return false; }
    return true;
  });
}));

/* ---- 4 · Hook: concentric ripple rings emanating from a fixed gaze point ---- */
fields.push(makeField(4, (f) => {
  const g = mk('g', {}); f.svg.appendChild(g);
  const anchor = mk('circle', { cx: 1450, cy: 330, r: 6, fill: '#E11D48', opacity: 0.85 });
  g.appendChild(anchor);
  f.d.rings = [];
  for (let i = 0; i < 7; i++) {
    const c = mk('circle', { cx: 1450, cy: 330, r: 10, fill: 'none', stroke: i % 2 ? '#2563EB' : '#4F46E5', 'stroke-width': 1.4, 'vector-effect': 'non-scaling-stroke' });
    g.appendChild(c);
    f.d.rings.push({ el: c, ph: i / 7 });
  }
  /* three-second fixation sweep wedge */
  const wedge = mk('path', { d: 'M 1450 330 L 1450 30 A 300 300 0 0 1 1610 120 Z', fill: 'url(#attractorGlow)', opacity: 0.5 });
  g.appendChild(wedge); f.d.wedge = wedge;
}, (f) => {
  const t = f.t;
  for (const r of f.d.rings) {
    const k = ((t * 0.22 + r.ph) % 1);
    r.el.setAttribute('r', (12 + k * 760).toFixed(1));
    r.el.setAttribute('stroke-opacity', (0.30 * (1 - k)).toFixed(3));
  }
  f.d.wedge.setAttribute('transform', `rotate(${(t * 24).toFixed(1)} 1450 330)`);
  f.d.wedge.setAttribute('opacity', (0.28 + 0.18 * Math.sin(t * 2)).toFixed(2));
}));

/* ---- 5 · Zeigarnik: open arcs breathing closed and re-opened along a chain ---- */
fields.push(makeField(5, (f) => {
  const g = mk('g', {}); f.svg.appendChild(g);
  f.d.arcs = [];
  for (let i = 0; i < 6; i++) {
    const p = mk('path', { fill: 'none', stroke: i === 5 ? '#E11D48' : '#4F46E5', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke', opacity: 0.55 });
    g.appendChild(p);
    f.d.arcs.push({ el: p, cx: 300 + i * 260, cy: 540 + (i % 2 ? 130 : -130), r: 120 + (i % 3) * 40, sp: 0.5 + i * 0.13 });
  }
  const trail = mk('g', {}); g.appendChild(trail); f.d.trail = trail; f.d.dots = [];
}, (f) => {
  const t = f.t;
  for (const a of f.d.arcs) {
    const start = t * a.sp;
    const span = Math.PI * (1.35 + 0.35 * Math.sin(t * 0.4 + a.cx));  // arc breathes → closes & re-opens
    const end = start + span;
    const x1 = a.cx + Math.cos(start) * a.r, y1 = a.cy + Math.sin(start) * a.r;
    const x2 = a.cx + Math.cos(end) * a.r, y2 = a.cy + Math.sin(end) * a.r;
    const large = span > Math.PI ? 1 : 0;
    a.el.setAttribute('d', `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${a.r} ${a.r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    a.el.setAttribute('opacity', (0.30 + 0.30 * Math.abs(Math.sin(t * 0.5 + a.cx))).toFixed(2));
    if (Math.random() < 0.05) {
      const d = mk('circle', { cx: x2, cy: y2, r: 3, fill: '#2563EB', opacity: 0.6 });
      f.d.trail.appendChild(d); f.d.dots.push({ el: d, life: 1 });
    }
  }
  f.d.dots = f.d.dots.filter((d) => {
    d.life -= 0.015;
    d.el.setAttribute('opacity', (d.life * 0.5).toFixed(2));
    d.el.setAttribute('r', (3 + (1 - d.life) * 5).toFixed(1));
    if (d.life <= 0) { d.el.remove(); return false; }
    return true;
  });
}));

/* ---- 6 · Micro-interactions: constellation of reactive perceptual dots ---- */
fields.push(makeField(6, (f) => {
  const lines = mk('g', {}), dots = mk('g', {});
  f.svg.append(lines, dots);
  f.d.pts = [];
  for (let i = 0; i < 34; i++) {
    const c = mk('circle', { r: 2 + (i % 3), fill: i % 6 === 0 ? '#E11D48' : (i % 3 === 0 ? '#4F46E5' : '#2563EB'), opacity: 0.4 });
    dots.appendChild(c);
    f.d.pts.push({ el: c, ox: 100 + Math.random() * 1720, oy: 80 + Math.random() * 920, ax: 30 + Math.random() * 70, ay: 24 + Math.random() * 60, sx: 0.25 + Math.random() * 0.5, sy: 0.2 + Math.random() * 0.5, ph: Math.random() * 6.28, x: 0, y: 0 });
  }
  f.d.lines = [];
  for (let i = 0; i < 16; i++) {
    const l = mk('line', { stroke: '#2563EB', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' });
    lines.appendChild(l);
    f.d.lines.push({ el: l, a: i * 2 % 34, b: (i * 5 + 3) % 34 });
  }
}, (f) => {
  const t = f.t;
  for (const p of f.d.pts) {
    p.x = p.ox + Math.sin(t * p.sx + p.ph) * p.ax;
    p.y = p.oy + Math.cos(t * p.sy + p.ph * 1.7) * p.ay;
    p.el.setAttribute('cx', p.x.toFixed(1)); p.el.setAttribute('cy', p.y.toFixed(1));
    p.el.setAttribute('opacity', (0.25 + 0.25 * Math.abs(Math.sin(t * 0.7 + p.ph))).toFixed(2));
  }
  for (const ln of f.d.lines) {
    const a = f.d.pts[ln.a], b = f.d.pts[ln.b];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    ln.el.setAttribute('x1', a.x.toFixed(1)); ln.el.setAttribute('y1', a.y.toFixed(1));
    ln.el.setAttribute('x2', b.x.toFixed(1)); ln.el.setAttribute('y2', b.y.toFixed(1));
    ln.el.setAttribute('stroke-opacity', dist < 300 ? ((1 - dist / 300) * 0.30).toFixed(3) : '0');
  }
}));

/* ---- 7 · Dark side: oscillating balance beam with sinking tension weights ---- */
fields.push(makeField(7, (f) => {
  const g = mk('g', {}); f.svg.appendChild(g);
  const glow = mk('circle', { cx: 960, cy: 540, r: 300, fill: 'url(#coralGlow)', opacity: 0.6 });
  const fulcrum = mk('path', { d: 'M 960 700 L 920 780 L 1000 780 Z', fill: 'none', stroke: '#4F46E5', 'stroke-opacity': 0.4, 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' });
  g.append(glow, fulcrum);
  const beam = mk('g', {}); g.appendChild(beam);
  const bar = mk('rect', { x: 460, y: 690, width: 1000, height: 10, rx: 5, fill: 'url(#rgA)' });
  beam.appendChild(bar);
  f.d.beam = beam;
  f.d.weights = [];
  for (let i = 0; i < 6; i++) {
    const w = mk('rect', { x: 500 + i * 160, y: 700, width: 46, height: 26, rx: 7, fill: i < 3 ? '#2563EB' : '#E11D48', opacity: 0.28 });
    beam.appendChild(w);
    f.d.weights.push({ el: w, side: i < 3 ? -1 : 1, ph: i * 1.1 });
  }
  f.d.glow = glow;
}, (f) => {
  const t = f.t;
  const tilt = Math.sin(t * 0.35) * 7 + Math.sin(t * 0.13) * 3;   // slow unstable seesaw
  f.d.beam.setAttribute('transform', `rotate(${tilt.toFixed(2)} 960 695)`);
  for (const w of f.d.weights) {
    const sink = 700 + (18 + 10 * Math.sin(t * 0.6 + w.ph)) * (w.side > 0 ? (1 + tilt / 12) : (1 - tilt / 12));
    w.el.setAttribute('y', sink.toFixed(1));
    w.el.setAttribute('height', (26 + (w.side > 0 ? 14 + tilt : 14 - tilt)).toFixed(1));
  }
  f.d.glow.setAttribute('opacity', (0.35 + 0.25 * Math.abs(Math.sin(t * 0.3))).toFixed(2));
}));

/* ---- 8 · Synthesis: three tool-gears meshing and driving one output shaft ---- */
fields.push(makeField(8, (f) => {
  const defs = mk('defs', {}); f.svg.appendChild(defs);
  const teeth = 14, R = 120, r = 96;
  let gd = '';
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2, a1 = ((i + 0.45) / teeth) * Math.PI * 2, a2 = ((i + 0.55) / teeth) * Math.PI * 2, a3 = ((i + 1) / teeth) * Math.PI * 2;
    gd += `${i ? 'L' : 'M'} ${(Math.cos(a0) * r).toFixed(1)} ${(Math.sin(a0) * r).toFixed(1)} L ${(Math.cos(a1) * R).toFixed(1)} ${(Math.sin(a1) * R).toFixed(1)} L ${(Math.cos(a2) * R).toFixed(1)} ${(Math.sin(a2) * R).toFixed(1)} L ${(Math.cos(a3) * r).toFixed(1)} ${(Math.sin(a3) * r).toFixed(1)} `;
  }
  const gear = mk('path', { id: 'gear-s8', d: gd + 'Z', fill: 'none', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' });
  defs.appendChild(gear);
  f.d.gears = [];
  [[560, 420, 1], [900, 560, -1], [1240, 420, 1]].forEach((cfg, i) => {
    const wrap = mk('g', {});
    const u = mk('use', { href: '#gear-s8' });
    u.setAttribute('stroke', ['#2563EB', '#4F46E5', '#E11D48'][i]);
    u.setAttribute('stroke-opacity', '0.30');
    const hub = mk('circle', { r: 14, fill: ['#2563EB', '#4F46E5', '#E11D48'][i], opacity: 0.35 });
    wrap.append(u, hub);
    f.svg.appendChild(wrap);
    f.d.gears.push({ el: wrap, x: cfg[0], y: cfg[1], dir: cfg[2], off: i * 0.24 });
  });
  const shaft = mk('path', { d: 'M 1360 420 C 1520 420, 1560 540, 1720 540', fill: 'none', stroke: 'url(#rgC)', 'stroke-width': 2, 'stroke-dasharray': '6 10', 'vector-effect': 'non-scaling-stroke', opacity: 0.6 });
  f.svg.appendChild(shaft);
}, (f) => {
  const t = f.t;
  for (const gr of f.d.gears) {
    gr.el.setAttribute('transform', `translate(${gr.x} ${gr.y}) rotate(${((t * 22 * gr.dir + gr.off * 360) % 360).toFixed(1)})`);
  }
}));

/* ---- 9 · Blueprint: construction modules assembling themselves on a timeline ---- */
fields.push(makeField(9, (f) => {
  const base = mk('path', { d: 'M 120 860 H 1800', stroke: '#94A3B8', 'stroke-opacity': 0.35, 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke', fill: 'none' });
  f.svg.appendChild(base);
  f.d.mods = [];
  for (let i = 0; i < 10; i++) {
    const gmod = mk('g', {});
    const rect = mk('rect', { x: -44, y: -30, width: 88, height: 60, rx: 10, fill: 'none', stroke: i % 3 ? '#2563EB' : '#4F46E5', 'stroke-width': 1.6, 'vector-effect': 'non-scaling-stroke', opacity: 0.4 });
    const fillBar = mk('rect', { x: -44, y: 12, width: 88, height: 18, rx: 6, fill: i % 4 === 3 ? '#E11D48' : '#2563EB', opacity: 0.18 });
    gmod.append(rect, fillBar);
    f.svg.appendChild(gmod);
    f.d.mods.push({ el: gmod, fill: fillBar, tx: 160 + i * 176, ph: i * 0.55 });
  }
  const crane = mk('path', { d: 'M 0 -120 L 0 0 M -40 -120 L 40 -120', stroke: '#4F46E5', 'stroke-opacity': 0.5, 'stroke-width': 2, fill: 'none', 'vector-effect': 'non-scaling-stroke' });
  f.svg.appendChild(crane); f.d.crane = crane;
}, (f) => {
  const t = f.t;
  for (const m of f.d.mods) {
    const settle = (Math.sin(t * 0.5 + m.ph) + 1) / 2;
    const y = 860 - 40 - settle * 260 - (m.ph % 1) * 30;
    m.el.setAttribute('transform', `translate(${(m.tx + Math.sin(t * 0.3 + m.ph) * 4).toFixed(1)} ${y.toFixed(1)}) rotate(${(Math.sin(t * 0.4 + m.ph) * 3).toFixed(2)})`);
    m.el.setAttribute('opacity', (0.45 + 0.4 * settle).toFixed(2));
    m.fill.setAttribute('width', (20 + 68 * settle).toFixed(1));
  }
  f.d.crane.setAttribute('transform', `translate(${(960 + Math.sin(t * 0.35) * 760).toFixed(1)} ${(560 + Math.cos(t * 0.5) * 60).toFixed(1)})`);
}));

/* ---- 10 · Closing: converging speech bursts folding into one horizon line ---- */
fields.push(makeField(10, (f) => {
  const g = mk('g', {}); f.svg.appendChild(g);
  const sun = mk('circle', { cx: 960, cy: 620, r: 90, fill: 'url(#attractorGlow)' });
  const horizon = mk('path', { d: 'M 100 620 H 1820', stroke: 'url(#rgA)', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke', fill: 'none', opacity: 0.8 });
  g.append(sun, horizon);
  f.d.sun = sun;
  f.d.bursts = [];
  for (let i = 0; i < 9; i++) {
    const u = mk('use', { href: '#sym-burst' });
    u.setAttribute('stroke', ['#2563EB', '#4F46E5', '#E11D48'][i % 3]);
    u.setAttribute('stroke-width', 1.6);
    g.appendChild(u);
    f.d.bursts.push({ el: u, ox: 180 + (i % 5) * 380, oy: 200 + Math.floor(i / 5) * 620 + (i % 3) * 60, sc: 0.6 + (i % 4) * 0.3, ph: i * 0.7 });
  }
}, (f) => {
  const t = f.t;
  for (const b of f.d.bursts) {
    const k = ((t * 0.10 + b.ph * 0.31) % 1);
    const x = lerp(b.ox, 960, k);
    const y = lerp(b.oy, 620, k);
    const sc = b.sc * (1 - k * 0.75);
    b.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(t * 18 + b.ph * 40).toFixed(1)}) scale(${sc.toFixed(3)})`);
    b.el.setAttribute('stroke-opacity', (0.42 * (1 - k) + 0.06).toFixed(3));
  }
  f.d.sun.setAttribute('r', (90 + Math.sin(t * 0.6) * 14).toFixed(1));
}));

function setActiveField(idx) {
  fields.forEach((fl, i) => { if (!fl) return; if (i === idx) fl.start(); else fl.stop(); });
}
