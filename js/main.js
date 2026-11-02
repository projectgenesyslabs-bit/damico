// Gioielleria D'Amico: regia dello scorrimento, ingresso, orologio, orari, vetrina.
import { createScene } from './scene.js';

window.__damicoReady = true; // il paracadute in index.html non serve: gli script sono partiti

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- Testo diviso in lettere ---------- */
$$('.split').forEach((el) => {
  const text = el.textContent;
  el.textContent = '';
  for (const ch of text) {
    const s = document.createElement('span');
    s.className = 'char';
    s.textContent = ch === ' ' ? ' ' : ch;
    s.setAttribute('aria-hidden', 'true');
    el.appendChild(s);
  }
});

/* ---------- Scorrimento morbido ---------- */
let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ lerp: .085, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}
const menu = $('.menu'), menuBtn = $('.nav__menu');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-hidden', String(!open));
  $('.nav__menu-label').textContent = open ? 'Chiudi' : 'Menu';
  if (lenis) open ? lenis.stop() : lenis.start();
}
menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });

$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  if (document.body.classList.contains('menu-open')) setMenu(false);
  const id = a.getAttribute('href');
  const el = id === '#top' ? document.body : $(id);
  if (!el) return;
  e.preventDefault();
  // i pannelli orizzontali stanno dentro una sezione verticale: si calcola il punto giusto
  let y = id === '#top' ? 0 : el.getBoundingClientRect().top + window.scrollY;
  const panelIdx = { '#mestieri': 0, '#orologi': 1, '#piercing': 2 }[id];
  if (panelIdx !== undefined) {
    const sec = $('#mestieri');
    const span = sec.offsetHeight - window.innerHeight;
    y = sec.offsetTop + span * (panelIdx / 2);
  }
  if (lenis) lenis.scrollTo(y, { duration: 1.8 }); else window.scrollTo({ top: y, behavior: 'smooth' });
}));

/* ---------- Scena 3D e ingresso ---------- */
const countEl = $('.loader__count span');
let shown = 0, real = 0;
const counter = { v: 0 };
let scene = null;
try {
  scene = createScene($('.gl'), (p) => { real = Math.max(real, p * .8); });
} catch (err) {
  console.warn('WebGL non disponibile, la pagina resta senza scena 3D.', err);
  $('.gl').style.display = 'none';
}

const minTime = new Promise((r) => setTimeout(r, reduced ? 200 : 2300));
const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
fonts.then(() => { real = Math.max(real, scene ? .9 : .9); });

gsap.ticker.add(() => {
  counter.v += (real - counter.v) * .08;
  const n = Math.round(counter.v * 100);
  if (n !== shown) { shown = n; countEl.textContent = n; }
});

Promise.all([fonts, minTime]).then(() => {
  real = 1;
  const tl = gsap.timeline({ delay: .35 });
  tl.to('.loader__count', { yPercent: -40, opacity: 0, duration: .6, ease: 'power2.in' })
    .to('.loader__mono', { scale: .8, opacity: 0, duration: .7, ease: 'power2.in' }, '<')
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=.2')
    .add(() => {
      const loader = $('.loader');
      if (loader) loader.remove();
      document.body.classList.remove('is-loading');
      lenis && lenis.start();
      ScrollTrigger.refresh();
    })
    .from('.hero__title .char', {
      yPercent: 120, rotateX: -80, opacity: 0, transformOrigin: '50% 100% -40px',
      duration: 1.6, stagger: .07, ease: 'expo.out'
    }, '-=.75')
    .from('.reveal-line > span', { yPercent: 110, duration: 1.2, stagger: .12, ease: 'expo.out' }, '-=1.3')
    // si animano i figli: la barra ha già una transizione CSS sul movimento e le due si scontrerebbero
    .from('.nav > *', { y: -40, opacity: 0, duration: 1, stagger: .08, ease: 'expo.out', clearProps: 'transform,opacity' }, '-=1.1')
    .from('.hero__scroll', { opacity: 0, duration: 1 }, '-=.6')
    .add(buildHeroText);
  if (scene) {
    const p = { v: 0 };
    tl.to(p, { v: 1, duration: 2.6, ease: 'power3.out', onUpdate: () => scene.setIntro(p.v) }, 1.1);
  }
});

/* ---------- Regia della scena guidata dallo scorrimento ---------- */
const state = { hero: 0, mest: 0 };
const isPortrait = () => window.innerWidth / window.innerHeight < .9;
const fit = () => Math.max(1, .95 / (window.innerWidth / window.innerHeight));

function keyframes() {
  const f = fit(), portrait = isPortrait();
  const far = 6.2 * f;
  return [
    { at: 0, camZ: far, camY: .3, tgtY: .25, posX: 0, posY: 0, rot: 0 },
    { at: .38, camZ: 3.6 * Math.min(f, 1.4), camY: 1.05, tgtY: 1.0, posX: 0, posY: 0, rot: Math.PI * .9 },
    // sugli schermi verticali la camera resta più indietro e il diamante sta più in alto, lontano dal testo
    { at: .66, camZ: 1.5 * Math.min(f, 2.4), camY: portrait ? 1.75 : 2.05, tgtY: portrait ? 1.12 : 1.42, posX: 0, posY: 0, rot: Math.PI * 1.6 },
    { at: .82, camZ: 1.6 * Math.min(f, 2.4), camY: portrait ? 1.7 : 2.0, tgtY: portrait ? 1.12 : 1.42, posX: 0, posY: 0, rot: Math.PI * 1.8 },
    { at: 1, camZ: portrait ? far * 1.05 : 6.2, camY: .3, tgtY: .25,
      posX: portrait ? 0 : 1.85, posY: portrait ? -1.25 * f : 0, rot: Math.PI * 2 }
  ];
}
let KF = keyframes();
window.addEventListener('resize', () => { KF = keyframes(); updateScene(); });

function sample(p) {
  let i = 0;
  while (i < KF.length - 2 && p > KF[i + 1].at) i++;
  const a = KF[i], b = KF[i + 1];
  const t = smooth(clamp((p - a.at) / (b.at - a.at)));
  const o = {};
  for (const k of ['camZ', 'camY', 'tgtY', 'posX', 'posY', 'rot']) o[k] = lerp(a[k], b[k], t);
  return o;
}

function updateScene() {
  if (!scene) return;
  const s = sample(state.hero);
  // nei pannelli l'anello segue il primo pannello e scivola via con lui
  const slide = clamp(state.mest * 2);
  const w = scene.visibleWidthAt(s.camZ);
  s.posX -= slide * w;
  Object.assign(scene.target, s);
  scene.target.fade = 1 - slide * .6;
}

ScrollTrigger.create({
  trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate: (st) => { state.hero = st.progress; updateScene(); }
});

// testo dell'apertura legato allo scorrimento.
// Si crea solo a ingresso finito: così le due animazioni non si contendono le stesse lettere.
function buildHeroText() {
  const heroTl = gsap.timeline({
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: .6 }
  });
  heroTl
    .to('.hero__meta, .hero__scroll', { opacity: 0, y: -30, duration: .12, ease: 'none' }, 0)
    .to('.hero__title .char', {
      yPercent: -60, opacity: 0, filter: 'blur(12px)', duration: .22, stagger: { each: .02, from: 'center' }, ease: 'power1.in'
    }, .04)
    .fromTo('.hero__close', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .1, ease: 'none' }, .5)
    .to('.hero__close', { opacity: 0, y: -40, duration: .08, ease: 'none' }, .84)
    .to({}, { duration: .01 }, .99);
}

// i tre mestieri: binario orizzontale dentro una sezione alta
const track = $('.mestieri__track');
ScrollTrigger.create({
  trigger: '.mestieri', start: 'top top', end: 'bottom bottom', scrub: true,
  onUpdate: (st) => {
    state.mest = st.progress;
    gsap.set(track, { x: -st.progress * 2 * window.innerWidth });
    updateScene();
  }
});
$$('.panel').forEach((panel, i) => {
  const items = $$('.panel__num, .panel__title, .panel__body, .panel__live', panel);
  gsap.from(items, {
    x: 80, opacity: 0, stagger: .08, ease: 'power2.out',
    scrollTrigger: {
      trigger: '.mestieri', scrub: .5,
      start: () => `top+=${(i - .6) * (window.innerHeight * .9)} top`,
      end: () => `top+=${(i - .1) * (window.innerHeight * .9)} top`
    }
  });
});

// dopo i pannelli la scena si spegne: niente lavoro inutile per la scheda grafica
if (scene) {
  ScrollTrigger.create({
    trigger: '.mestieri', start: 'bottom 60%',
    onEnter: () => gsap.to('.gl', { opacity: 0, duration: .8, onComplete: () => scene.setRunning(false) }),
    onLeaveBack: () => { scene.setRunning(true); gsap.to('.gl', { opacity: 1, duration: .8 }); }
  });
}

// titoli di sezione: lettere che salgono
$$('.section-title').forEach((t) => {
  gsap.from($$('.char', t), {
    yPercent: 110, rotate: 6, opacity: 0, stagger: .035, duration: 1.2, ease: 'expo.out',
    scrollTrigger: { trigger: t, start: 'top 85%' }
  });
});
gsap.from('.visita__address, .visita__contacts li, .orari tr, .status', {
  y: 30, opacity: 0, stagger: .06, duration: 1, ease: 'expo.out',
  scrollTrigger: { trigger: '.visita', start: 'top 60%' }
});
gsap.fromTo('.visita__map', { clipPath: 'inset(18% 18% 18% 18%)' }, {
  clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
  scrollTrigger: { trigger: '.visita__map', start: 'top 95%', end: 'top 35%', scrub: .6 }
});
gsap.from('.footer__word span', {
  yPercent: 60, opacity: 0, duration: 1.6, ease: 'expo.out',
  scrollTrigger: { trigger: '.footer', start: 'top 90%' }
});

/* ---------- Navigazione che si nasconde scendendo ---------- */
const nav = $('.nav');
let lastY = 0;
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: (st) => {
    const y = st.scroll();
    nav.classList.toggle('is-hidden', y > 200 && y > lastY);
    nav.classList.toggle('is-solid', y > window.innerHeight * .8);
    lastY = y;
  }
});

/* ---------- Orologio con l'ora di Mussomeli ---------- */
const NS = 'http://www.w3.org/2000/svg';
const ticks = $('.watch__ticks'), guil = $('.watch__guilloche');
for (let i = 0; i < 60; i++) {
  const big = i % 5 === 0;
  const l = document.createElementNS(NS, 'line');
  l.setAttribute('x1', 0); l.setAttribute('x2', 0);
  l.setAttribute('y1', big ? -126 : -128); l.setAttribute('y2', big ? -110 : -122);
  l.setAttribute('stroke-width', big ? 2.4 : .8);
  l.setAttribute('transform', `rotate(${i * 6})`);
  ticks.appendChild(l);
}
for (let i = 0; i < 180; i++) {
  const l = document.createElementNS(NS, 'line');
  l.setAttribute('x1', 0); l.setAttribute('y1', -18); l.setAttribute('x2', 34); l.setAttribute('y2', -104);
  l.setAttribute('transform', `rotate(${i * 2})`);
  guil.appendChild(l);
}
const hands = { h: $('.watch__hand--h'), m: $('.watch__hand--m'), s: $('.watch__hand--s') };
const liveTime = $('.live-time');
const romeFmt = new Intl.DateTimeFormat('it-IT', {
  timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', hourCycle: 'h23'
});
function romeNow() {
  const d = new Date();
  const parts = Object.fromEntries(romeFmt.formatToParts(d).map((p) => [p.type, p.value]));
  return { h: +parts.hour, m: +parts.minute, s: +parts.second, ms: d.getMilliseconds(), wd: parts.weekday };
}
let lastSec = -1;
gsap.ticker.add(() => {
  const n = romeNow();
  const s = n.s + n.ms / 1000;
  hands.s.setAttribute('transform', `rotate(${s * 6})`);
  hands.m.setAttribute('transform', `rotate(${(n.m + s / 60) * 6})`);
  hands.h.setAttribute('transform', `rotate(${((n.h % 12) + n.m / 60) * 30})`);
  if (n.s !== lastSec) {
    lastSec = n.s;
    liveTime.textContent = [n.h, n.m, n.s].map((v) => String(v).padStart(2, '0')).join(':');
  }
});

/* ---------- Punto luce: faccette ---------- */
const facets = $('.stud__facets');
const stone = document.createElementNS(NS, 'circle');
stone.setAttribute('r', 37); stone.setAttribute('fill', 'url(#stone)');
facets.appendChild(stone);
for (let i = 0; i < 8; i++) {
  const a1 = (i / 8) * Math.PI * 2, a2 = ((i + 1) / 8) * Math.PI * 2;
  const p = document.createElementNS(NS, 'path');
  const r = 37, t = 17;
  p.setAttribute('d', `M${Math.cos(a1) * t} ${Math.sin(a1) * t} L${Math.cos(a1) * r} ${Math.sin(a1) * r} L${Math.cos(a2) * r} ${Math.sin(a2) * r} L${Math.cos(a2) * t} ${Math.sin(a2) * t} Z`);
  p.setAttribute('fill', i % 2 ? 'rgba(255,255,255,.18)' : 'rgba(120,140,160,.22)');
  facets.appendChild(p);
}
const oct = document.createElementNS(NS, 'path');
oct.setAttribute('d', Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2; return `${i ? 'L' : 'M'}${Math.cos(a) * 17} ${Math.sin(a) * 17}`;
}).join(' ') + ' Z');
oct.setAttribute('fill', 'rgba(255,255,255,.28)');
facets.appendChild(oct);

/* ---------- Orari e stato aperto/chiuso ---------- */
// Fonte: schede pubbliche (Pagine Gialle). Da confermare con il negozio.
const ORARI = [
  { d: 'lun', label: 'Lunedì', slots: [['16:00', '20:00']] },
  { d: 'mar', label: 'Martedì', slots: [['09:00', '13:00'], ['16:00', '20:00']] },
  { d: 'mer', label: 'Mercoledì', slots: [['09:00', '13:00'], ['16:00', '20:00']] },
  { d: 'gio', label: 'Giovedì', slots: [['09:00', '13:00'], ['16:00', '20:00']] },
  { d: 'ven', label: 'Venerdì', slots: [['09:00', '13:00'], ['16:00', '20:00']] },
  { d: 'sab', label: 'Sabato', slots: [['09:00', '13:00'], ['16:00', '20:00']] },
  { d: 'dom', label: 'Domenica', slots: [] }
];
const tbody = $('.orari tbody');
const now0 = romeNow();
const todayKey = now0.wd.slice(0, 3).toLowerCase();
for (const g of ORARI) {
  const tr = document.createElement('tr');
  if (g.d === todayKey) tr.className = 'is-today';
  tr.innerHTML = `<td>${g.label}</td><td>${g.slots.length ? g.slots.map((s) => s.join(' - ')).join(', ') : 'Chiuso'}</td>`;
  tbody.appendChild(tr);
}
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
function updateStatus() {
  const n = romeNow();
  const key = n.wd.slice(0, 3).toLowerCase();
  const idx = ORARI.findIndex((g) => g.d === key);
  const mins = n.h * 60 + n.m;
  const el = $('[data-status]'), txt = $('.status__text', el);
  const open = ORARI[idx].slots.find(([a, b]) => mins >= toMin(a) && mins < toMin(b));
  el.classList.toggle('is-open', !!open);
  el.classList.toggle('is-closed', !open);
  if (open) { txt.textContent = `Aperto ora, fino alle ${open[1]}`; return; }
  const later = ORARI[idx].slots.find(([a]) => toMin(a) > mins);
  if (later) { txt.textContent = `Chiuso ora, riapre alle ${later[0]}`; return; }
  for (let i = 1; i <= 7; i++) {
    const g = ORARI[(idx + i) % 7];
    if (g.slots.length) { txt.textContent = `Chiuso ora, riapre ${i === 1 ? 'domani' : g.label.toLowerCase()} alle ${g.slots[0][0]}`; return; }
  }
}
updateStatus();
setInterval(updateStatus, 30000);

/* ---------- Vetrina con lente da gioielliere ---------- */
const FOTO = Array.isArray(window.FOTO) ? window.FOTO : [];
if (FOTO.length) {
  $$('[data-needs-photos]').forEach((el) => { el.hidden = false; });
  const rail = $('.vetrina__rail');
  for (const f of FOTO) {
    const fig = document.createElement('figure');
    fig.className = 'vetrina__item';
    fig.innerHTML = `<img src="${f.src}" alt="${(f.alt || '').replace(/"/g, '&quot;')}" loading="lazy">${f.caption ? `<figcaption>${f.caption}</figcaption>` : ''}`;
    rail.appendChild(fig);
  }
  gsap.to(rail, {
    x: () => -Math.max(0, rail.scrollWidth - window.innerWidth), ease: 'none',
    scrollTrigger: { trigger: '.vetrina', start: 'top 70%', end: 'bottom 20%', scrub: .8, invalidateOnRefresh: true }
  });
  if (fine) {
    const loupe = $('.loupe'), cursor = $('.cursor');
    const Z = 2.6;
    $$('.vetrina__item').forEach((it) => {
      const img = $('img', it);
      it.addEventListener('pointerenter', () => {
        loupe.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
        loupe.classList.add('is-on'); cursor.classList.add('is-loupe');
      });
      it.addEventListener('pointerleave', () => { loupe.classList.remove('is-on'); cursor.classList.remove('is-loupe'); });
      it.addEventListener('pointermove', (e) => {
        const r = img.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        loupe.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
        loupe.style.backgroundPosition = `${-x * Z + 110}px ${-y * Z + 110}px`;
        loupe.style.left = `${e.clientX}px`; loupe.style.top = `${e.clientY}px`;
      });
    });
  }
} else {
  $$('[data-needs-photos]').forEach((el) => { el.hidden = true; });
}

/* ---------- Cursore, bottoni magnetici, piede ---------- */
if (fine) {
  const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
  const p = { x: innerWidth / 2, y: innerHeight / 2 }, r = { x: p.x, y: p.y };
  window.addEventListener('pointermove', (e) => { p.x = e.clientX; p.y = e.clientY; }, { passive: true });
  gsap.ticker.add(() => {
    r.x += (p.x - r.x) * .18; r.y += (p.y - r.y) * .18;
    dot.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${r.x}px, ${r.y}px) translate(-50%, -50%)`;
  });
  document.addEventListener('pointerover', (e) => {
    cur.classList.toggle('is-hover', !!e.target.closest('a, button'));
  });

  $$('.magnetic').forEach((el) => {
    const inner = $('span', el);
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect();
      const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
      gsap.to(el, { x: dx * .3, y: dy * .4, duration: .6, ease: 'power3.out' });
      gsap.to(inner, { x: dx * .15, y: dy * .2, duration: .6, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => {
      gsap.to([el, inner], { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)' });
    });
  });

  const word = $('.footer__word span');
  word.style.animation = 'none';
  $('.footer').addEventListener('pointermove', (e) => {
    const x = e.clientX / innerWidth;
    gsap.to(word, { backgroundPosition: `${-x * 150}% 50%`, duration: 1.2, ease: 'power3.out' });
  });
}

window.addEventListener('load', () => ScrollTrigger.refresh());
