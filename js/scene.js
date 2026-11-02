// Scena 3D: anello solitario in oro con diamante taglio brillante.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const INK = 0x0b0a09;

/* ---------- Ambiente luminoso: pannelli da studio intorno all'anello ---------- */
function buildEnvScene() {
  const env = new THREE.Scene();

  // cupola scura con un lieve chiarore caldo in alto
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(20, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `varying vec3 vP; void main(){
        float t = vP.y*.5+.5;
        vec3 c = mix(vec3(.002,.0015,.001), vec3(.06,.045,.025), pow(t, 2.6));
        gl_FragColor = vec4(c,1.); }`
    })
  );
  env.add(dome);

  // pannelli luminosi (HDR): danno i riflessi sull'oro e i lampi nel diamante
  const panels = [
    // [theta, phi, w, h, intensity, warm]
    [0.0, 0.9, 6, 1.2, 9, 0], [1.2, 0.5, 2.0, 5, 6, 1], [2.4, 1.2, 4, 0.8, 7, 0],
    [3.3, 0.7, 1.4, 4, 5, 1], [4.4, 1.0, 5, 1.0, 8, 0], [5.4, 0.4, 1.2, 3, 7, 0],
    [0.7, 1.9, 3, 0.6, 3, 1], [3.9, 2.1, 4, 0.5, 2.5, 0], [2.0, 0.2, 2, 2, 6, 0],
    [5.0, 1.6, 0.8, 0.8, 12, 0], [1.6, 1.4, 0.6, 0.6, 14, 0], [4.0, 0.3, 0.5, 0.5, 14, 1]
  ];
  for (const [th, ph, w, h, k, warm] of panels) {
    const col = warm ? new THREE.Color(1.0, 0.78, 0.5) : new THREE.Color(1, 0.97, 0.94);
    col.multiplyScalar(k * .55);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
    const r = 9;
    m.position.setFromSphericalCoords(r, ph, th);
    m.lookAt(0, 0, 0);
    env.add(m);
  }
  // tante piccole luci: danno la tipica scacchiera di lampi del brillante
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) {
    const sz = .15 + rnd() * .5;
    const col = new THREE.Color(1, .96 - rnd() * .12, .9 - rnd() * .25).multiplyScalar(6 + rnd() * 14);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }));
    m.position.setFromSphericalCoords(8, Math.acos(1 - 2 * rnd()), rnd() * Math.PI * 2);
    m.lookAt(0, 0, 0);
    env.add(m);
  }
  return env;
}

/* ---------- Diamante taglio brillante (57 faccette, semplificato) ---------- */
function brilliantGeometry() {
  const P = [];
  const ring = (n, r, y, off = 0) => Array.from({ length: n }, (_, i) => {
    const a = off + (i / n) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
  });
  const T = ring(8, 0.56, 0.33);                 // tavola
  const C = ring(8, 0.80, 0.19, Math.PI / 8);    // punte delle stelle / kite
  const Gt = ring(16, 1.0, 0.025);               // cintura sopra
  const Gb = ring(16, 1.0, -0.025);              // cintura sotto
  const L = ring(8, 0.43, -0.47, Math.PI / 8);   // faccette inferiori
  const top = new THREE.Vector3(0, 0.33, 0);
  const culet = new THREE.Vector3(0, -0.86, 0);
  const tri = (a, b, c) => P.push([a, b, c]);
  const m8 = (i) => (i + 8) % 8, m16 = (i) => (i + 16) % 16;

  for (let k = 0; k < 8; k++) {
    tri(top, T[k], T[m8(k + 1)]);                         // tavola
    tri(T[k], T[m8(k + 1)], C[k]);                        // stelle
    tri(T[k], C[m8(k - 1)], Gt[m16(2 * k)]);              // kite
    tri(T[k], Gt[m16(2 * k)], C[k]);
    tri(C[k], Gt[m16(2 * k)], Gt[m16(2 * k + 1)]);        // cintura superiore
    tri(C[k], Gt[m16(2 * k + 1)], Gt[m16(2 * k + 2)]);
  }
  for (let i = 0; i < 16; i++) {                          // fascia della cintura
    tri(Gt[i], Gb[i], Gb[m16(i + 1)]);
    tri(Gt[i], Gb[m16(i + 1)], Gt[m16(i + 1)]);
  }
  for (let k = 0; k < 8; k++) {                           // padiglione
    tri(Gb[m16(2 * k)], Gb[m16(2 * k + 1)], L[k]);
    tri(Gb[m16(2 * k + 1)], Gb[m16(2 * k + 2)], L[k]);
    tri(Gb[m16(2 * k + 2)], L[k], L[m8(k + 1)]);
    tri(L[k], L[m8(k + 1)], culet);
  }

  // orienta ogni triangolo verso l'esterno (la forma è convessa)
  const center = new THREE.Vector3(0, -0.2, 0);
  const pos = [];
  const e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), n = new THREE.Vector3(), c = new THREE.Vector3();
  for (const [a, b, d] of P) {
    e1.subVectors(b, a); e2.subVectors(d, a); n.crossVectors(e1, e2);
    c.copy(a).add(b).add(d).divideScalar(3).sub(center);
    const [x, y, z] = n.dot(c) < 0 ? [a, d, b] : [a, b, d];
    pos.push(x.x, x.y, x.z, y.x, y.y, y.z, z.x, z.y, z.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals(); // non indicizzata: normali piatte, una per faccetta
  return g;
}

function diamondMaterial(envCube) {
  return new THREE.ShaderMaterial({
    uniforms: { envMap: { value: envCube }, uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vW;
      void main(){
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 w = modelMatrix * vec4(position,1.);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform samplerCube envMap; uniform float uTime;
      varying vec3 vN; varying vec3 vW;
      vec3 env(vec3 d){ return textureCube(envMap, d).rgb; }
      void main(){
        vec3 V = normalize(vW - cameraPosition);
        vec3 N = normalize(vN);
        vec3 R = reflect(V, N);
        // rifrazione con dispersione: tre indici, uno per canale
        vec3 iors = vec3(2.40, 2.42, 2.46);
        vec3 refr;
        vec3 flip = vec3(1., -1., 1.);
        vec3 tr = refract(V, N, 1./iors.r); vec3 tg = refract(V, N, 1./iors.g); vec3 tb = refract(V, N, 1./iors.b);
        // il padiglione rimanda la luce verso l'alto: simuliamo un rimbalzo interno
        refr.r = env(reflect(tr, normalize(N*flip + vec3(0.,.35,0.)))).r;
        refr.g = env(reflect(tg, normalize(N*flip + vec3(0.,.35,0.)))).g;
        refr.b = env(reflect(tb, normalize(N*flip + vec3(0.,.35,0.)))).b;
        refr += .35 * vec3(env(tr*flip).r, env(tg*flip).g, env(tb*flip).b);
        float F = .17 + .83 * pow(1. - max(dot(-V, N), 0.), 5.);
        refr = pow(refr, vec3(1.35)) * 1.5;
        vec3 col = mix(refr, env(R), F);
        // lampi
        vec3 L1 = normalize(vec3(.4, .9, .5)), L2 = normalize(vec3(-.7, .6, .3));
        col += vec3(1.,.97,.9) * (pow(max(dot(R, L1), 0.), 380.) * 6. + pow(max(dot(R, L2), 0.), 300.) * 4.);
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
}

/* ---------- Scintille sospese ---------- */
function sparkles(count) {
  const g = new THREE.BufferGeometry();
  const p = new Float32Array(count * 3), s = new Float32Array(count), ph = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 1.6 + Math.random() * 3.4, th = Math.random() * Math.PI * 2, y = (Math.random() - .5) * 4.5;
    p.set([Math.cos(th) * r, y, Math.sin(th) * r - 1.0], i * 3);
    s[i] = .5 + Math.random() * 1.5; ph[i] = Math.random() * 100;
  }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(s, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uFade: { value: 1 } },
    vertexShader: `
      attribute float aSize; attribute float aPhase; uniform float uTime; uniform float uPx;
      varying float vA;
      void main(){
        vec3 p = position; p.y += sin(uTime*.2 + aPhase)*.15;
        vec4 mv = modelViewMatrix * vec4(p,1.);
        float tw = pow(.5 + .5*sin(uTime*(.8+fract(aPhase)*1.6) + aPhase), 8.);
        vA = tw;
        gl_PointSize = aSize * (1.5 + 9.*tw) * uPx * 6. / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA; uniform float uFade;
      void main(){
        vec2 c = gl_PointCoord - .5; float d = length(c);
        float star = max(0., 1. - abs(c.x)*14.) * max(0., 1. - abs(c.y)*2.2) + max(0., 1. - abs(c.y)*14.) * max(0., 1. - abs(c.x)*2.2);
        float a = (smoothstep(.5, 0., d) * .6 + star) * vA * uFade;
        gl_FragColor = vec4(vec3(1., .86, .62) * a * 2., a);
      }`
  });
  return new THREE.Points(g, mat);
}

/* ---------- Scena completa ---------- */
export function createScene(canvas, onProgress = () => {}) {
  const isSmall = Math.min(window.innerWidth, window.innerHeight) < 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.75 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  // Il fondo passa dalla resa tonale del composer: questo valore, dopo la conversione,
  // torna il nero caldo della pagina (#0b0a09). Misurato a schermo.
  renderer.setClearColor(new THREE.Color(0x1d1b19).convertSRGBToLinear(), 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  onProgress(.15);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, .05, 100);
  camera.position.set(0, .3, 6.2);

  // ambiente
  const envScene = buildEnvScene();
  const cubeRT = new THREE.WebGLCubeRenderTarget(512, { type: THREE.HalfFloatType });
  const cubeCam = new THREE.CubeCamera(.1, 50, cubeRT);
  cubeCam.update(renderer, envScene);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, .015).texture;
  onProgress(.45);

  // anello
  const ring = new THREE.Group();
  const gold = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color().setRGB(1.0, .74, .36, THREE.LinearSRGBColorSpace),
    metalness: 1, roughness: .14, clearcoat: .4, clearcoatRoughness: .1, envMapIntensity: 1.0
  });
  const band = new THREE.Mesh(new THREE.TorusGeometry(1, .085, 64, 240), gold);
  band.scale.set(1, 1, 1.35); // fascia leggermente più larga in profondità
  ring.add(band);

  const S = .42;               // raggio della cintura del diamante
  const gy = 1.43;             // quota della cintura
  const diamond = new THREE.Mesh(brilliantGeometry(), diamondMaterial(cubeRT.texture));
  diamond.scale.setScalar(S);
  diamond.position.y = gy;
  ring.add(diamond);

  // sei griffe e un cestello
  const prongMat = gold;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const at = (r, y) => new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    const curve = new THREE.CatmullRomCurve3([at(.07, 1.05), at(.24, 1.2), at(.40, 1.38), at(.445, 1.46), at(.39, 1.52)]);
    const prong = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .024, 10, false), prongMat);
    ring.add(prong);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.03, 16, 12), prongMat);
    tip.position.copy(at(.39, 1.52));
    ring.add(tip);
  }
  const basket = new THREE.Mesh(new THREE.TorusGeometry(.27, .016, 12, 80), gold);
  basket.rotation.x = Math.PI / 2; basket.position.y = 1.24;
  ring.add(basket);
  const collet = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, .1, 32), gold);
  collet.position.y = 1.07;
  ring.add(collet);

  ring.rotation.x = .12;
  scene.add(ring);

  // alone caldo dietro l'anello
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uFade: { value: 1 } },
      vertexShader: `varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `varying vec2 vU; uniform float uFade; void main(){
        float d = length(vU - .5); float a = smoothstep(.5, 0., d); a = pow(a, 3.0) * .035 * uFade;
        gl_FragColor = vec4(vec3(.95,.68,.32)*a, a); }`
    })
  );
  halo.position.set(0, .3, -2.2);
  scene.add(halo);

  const dust = sparkles(isSmall ? 140 : 260);
  scene.add(dust);
  onProgress(.75);

  // post: bagliore sui lampi
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), .32, .15, 1.1);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // stato guidato dallo scorrimento (valori obiettivo, poi smorzati)
  const target = { camZ: 6.2, camY: .3, tgtY: .25, posX: 0, posY: 0, rot: 0, scale: 1, fade: 1 };
  const cur = { ...target };
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX / window.innerWidth - .5;
    mouse.y = e.clientY / window.innerHeight - .5;
  }, { passive: true });

  let running = true;
  let intro = 0; // 0..1, animato dall'ingresso
  const clock = new THREE.Clock();
  const lookAt = new THREE.Vector3();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    dust.material.uniforms.uPx.value = renderer.getPixelRatio() * Math.max(.6, h / 900);
  }
  window.addEventListener('resize', resize);
  resize();

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), .05);
    const t = clock.elapsedTime;
    if (!running) return;

    const k = 1 - Math.pow(.0015, dt); // smorzamento indipendente dal framerate
    for (const key in target) cur[key] += (target[key] - cur[key]) * k;
    mouse.sx += (mouse.x - mouse.sx) * k; mouse.sy += (mouse.y - mouse.sy) * k;

    const spin = reduced ? 0 : t * .28;
    const e = 1 - Math.pow(1 - intro, 3);
    ring.rotation.y = cur.rot + spin - (1 - e) * 2.6 + mouse.sx * .5;
    ring.rotation.x = .12 + mouse.sy * .25 - (1 - e) * .4;
    ring.position.set(cur.posX, cur.posY - (1 - e) * .6, 0);
    ring.scale.setScalar(cur.scale * (.55 + .45 * e));

    camera.position.set(mouse.sx * .25, cur.camY - mouse.sy * .15, cur.camZ);
    lookAt.set(cur.posX * 0, cur.tgtY, 0);
    camera.lookAt(lookAt);

    dust.material.uniforms.uTime.value = t;
    dust.material.uniforms.uFade.value = cur.fade * e;
    halo.material.uniforms.uFade.value = cur.fade * e;
    halo.position.x = cur.posX;
    composer.render();
  }
  frame();
  onProgress(1);

  return {
    target,
    camera,
    setIntro(v) { intro = v; },
    setRunning(v) { running = v; if (v) clock.getDelta(); },
    visibleWidthAt(dist) { return 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect; }
  };
}
