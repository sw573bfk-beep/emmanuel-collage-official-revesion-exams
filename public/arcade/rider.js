// 🏂 Peak Rider: a 3D snowboarding game (just for fun: never touches points, study time or stats).
// Three tracks, built from a fixed seed each, so everyone rides the same mountain. Uses three.js (bundled, no CDN).
import * as THREE from '/arcade/three.min.js?v=0170';
const $ = s => document.querySelector(s);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const api = async (p, m = 'GET', b) => { try { const r = await fetch(p, { method: m, credentials: 'same-origin', headers: b ? { 'content-type': 'application/json' } : {}, body: b ? JSON.stringify(b) : undefined }); let j = {}; try { j = await r.json(); } catch (e) { /* empty */ } return { ok: r.ok, status: r.status, data: j }; } catch (e) { return { ok: false, status: 0, data: {} }; } };
const nf = n => Math.round(n || 0).toLocaleString('en-AU');
const ls = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } };
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* ================= the 3 tracks ================= */
const MAPS = [
  { id: 't1', name: 'Pine Valley', lvl: 'Easy', desc: 'Sunny slopes and friendly jumps.', len: 1100, par: 48, slope: [0.2, 0.07], bend: [26, 9], seed: 1101,
    sky: [0x2f7fe0, 0xd4ebff], fog: [0xdcefff, 160, 1300], sun: [[0.45, 0.8, 0.45], 0xfff4e0, 2.4], hemi: [0xd6ebff, 0x9aaabf, 1.5], kick: 8, kickH: [2.2, 3.2], rails: 4, rocks: 10, gates: 8, trees: 1, night: false, snow: 0.25, card: 'linear-gradient(160deg,#2f7fe0,#9fd2ff 60%,#f4fbff)' },
  { id: 't2', name: 'Sunset Ridge', lvl: 'Medium', desc: 'Golden hour, bigger air, more rails.', len: 1400, par: 56, slope: [0.25, 0.09], bend: [34, 12], seed: 2202,
    sky: [0x30357d, 0xffa36b], fog: [0xf1b48f, 140, 1150], sun: [[0.6, 0.3, 0.55], 0xffb36b, 2.8], hemi: [0xffd2b0, 0x9b84a8, 1.6], glow: [-0.5, 0.12, -0.85], kick: 11, kickH: [2.8, 4.0], rails: 6, rocks: 18, gates: 10, trees: 0.9, night: false, snow: 0.1, card: 'linear-gradient(160deg,#30357d,#e0607e 55%,#ffb36b)' },
  { id: 't3', name: 'Midnight Peak', lvl: 'Hard', desc: 'Steep, icy and lit by the aurora.', len: 1700, par: 64, slope: [0.29, 0.1], bend: [40, 14], seed: 3303,
    sky: [0x03050f, 0x1d2660], fog: [0x161d44, 110, 1000], sun: [[0.35, 0.75, 0.4], 0xa9c2ff, 1.7], hemi: [0x7484cc, 0x2a3050, 1.25], kick: 14, kickH: [3.2, 4.8], rails: 7, rocks: 26, gates: 12, trees: 0.8, night: true, snow: 0.8, card: 'linear-gradient(160deg,#03050f,#1d2660 55%,#2fd6a0)' }
];
const WID = 18, BANK = 24, WALL = 30; // the flat run, then a banked edge, then the trees

function buildCourse(M) {
  const R = rng(M.seed), S0 = -90, N = M.len + 320, Y = new Float32Array(N), CX = new Float32Array(N);
  const p = [R() * 6, R() * 6, R() * 6, R() * 6];
  for (let i = 0; i < N; i++) {
    const s = S0 + i; let th = M.slope[0] + M.slope[1] * Math.sin(s / 95 + p[0]) + M.slope[1] * 0.6 * Math.sin(s / 41 + p[1]);
    if (s < 10) th = 0.14; if (s > M.len) th = Math.max(0.03, 0.14 - (s - M.len) * 0.004); // a gentle start, a run-out after the finish
    th = clamp(th, 0.06, 0.5); Y[i] = i ? Y[i - 1] - Math.tan(th) : 0;
    CX[i] = M.bend[0] * Math.sin(s / 230 + p[2]) + M.bend[1] * Math.sin(s / 88 + p[3]);
  }
  const at = (A, s) => { const f = clamp(s - S0, 0, N - 1.001), i = Math.floor(f), t = f - i; return A[i] * (1 - t) + A[i + 1] * t; };
  const C = { M, S0, N, y: s => at(Y, s), cx: s => at(CX, s), kickers: [], rails: [], gates: [], rocks: [] };
  C.dcx = s => (C.cx(s + 1) - C.cx(s - 1)) / 2;
  C.slope = s => (C.y(s - 1) - C.y(s + 1)) / 2;
  const used = [], free = (s, gap) => used.every(u => Math.abs(u - s) > gap);
  for (let k = 0; k < M.kick; k++) { // 🟦 kickers (jumps)
    const s0 = 70 + (M.len - 140) * (k + 0.5) / M.kick + (R() - 0.5) * 30, h = M.kickH[0] + R() * (M.kickH[1] - M.kickH[0]), L = 9 + h * 1.4;
    C.kickers.push({ s0, L, h, u: (R() - 0.5) * 16, w: 8 + R() * 3 }); used.push(s0, s0 + L);
  }
  for (let k = 0; k < M.rails; k++) { // 🛤️ rails
    let s0 = 0; for (let t = 0; t < 40; t++) { s0 = 60 + R() * (M.len - 140); if (free(s0, 28) && free(s0 + 24, 28)) break; }
    const L = 16 + R() * 14; C.rails.push({ s0, L, u: (R() - 0.5) * 20, h: 0.75 }); used.push(s0, s0 + L);
  }
  C.kickers.forEach((kk, i) => { if (i % 2 === 0 && C.gates.length < M.gates) C.gates.push({ s: kk.s0 + kk.L + 14 + kk.h * 2, u: kk.u, up: 4 + kk.h * 1.2, r: 3.4 }); }); // 🟡 rings in the air after jumps
  for (let t = 0; t < 400 && C.gates.length < M.gates; t++) { const s = 50 + R() * (M.len - 100); if (free(s, 12)) { C.gates.push({ s, u: (R() - 0.5) * 22, up: 2.6, r: 3.2 }); used.push(s); } }
  for (let k = 0; k < M.rocks; k++) { const s = 60 + R() * (M.len - 100), u = (R() - 0.5) * 30, r = 0.9 + R() * 0.9; if (!free(s, 16)) continue; C.rocks.push({ s, u, r }); }
  C.bank = u => { const a = Math.abs(u); return a <= WID ? 0 : a <= BANK ? (a - WID) * (a - WID) * 0.18 : (BANK - WID) * (BANK - WID) * 0.18 + (a - BANK) * 0.42 + Math.max(0, a - 60) * 0.25; };
  C.bump = (s, u) => 0.35 * Math.sin(s * 0.13 + u * 0.05) * Math.sin(u * 0.21 + s * 0.031);
  C.kickAt = (s, u) => { for (const k of C.kickers) if (s >= k.s0 && s <= k.s0 + k.L && Math.abs(u - k.u) <= k.w / 2) return k.h * Math.pow((s - k.s0) / k.L, 1.6); return 0; };
  C.ground = (s, u) => C.y(s) + C.bank(u) + C.bump(s, u) * (Math.abs(u) < BANK ? 1 : 2.5) + C.kickAt(s, u);
  C.railTop = (r, s) => C.y(s) + C.bump(s, r.u) + r.h;
  C.outer = (s, u) => { const a = Math.abs(u); if (a <= WALL) return 0; const k = Math.min(1, (a - WALL) / 20); return k * (Math.sin(s * 0.031 + u * 0.07) * 2.2 + Math.sin(s * 0.011 - u * 0.05) * 3 + Math.sin(u * 0.19 + s * 0.05) * 0.8); };
  return C;
}

/* ================= three.js scene ================= */
const cv = $('#cv'); let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(64, 16 / 9, 0.1, 5000);
let C = null, M = null, world = null, quality = ls('pr-q', matchMedia('(pointer:coarse)').matches ? 720 : 1080);
if (renderer) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
function resize() {
  if (!renderer) return; const r = cv.getBoundingClientRect(); if (!r.width) return;
  const pr = clamp(quality / r.height, 0.5, 2.5); renderer.setPixelRatio(pr); renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
}
function mat(color, o = {}) { return new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.6, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, flatShading: !!o.flat, transparent: !!o.t, opacity: o.op ?? 1, depthWrite: !o.t }); }
function merge(geos) { // join simple geometries (each already positioned) into one, keeping their vertex colours
  const out = new THREE.BufferGeometry(), P = [], Nn = [], Cc = [];
  for (const g0 of geos) { const g = g0.index ? g0.toNonIndexed() : g0; g.computeVertexNormals(); P.push(...g.attributes.position.array); Nn.push(...g.attributes.normal.array); Cc.push(...g.attributes.color.array); }
  out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); out.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); return out;
}
const tint = (g, hex) => { const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
function softDot() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
const DOT = softDot();
function textTex(text, bg, fg) { const c = document.createElement('canvas'); c.width = 1024; c.height = 192; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 1024, 192); x.fillStyle = fg; x.font = '800 120px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 512, 100); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// 🏂 the rider (built from simple shapes)
function makeRider(jacket, ghost) {
  const g = new THREE.Group(), body = new THREE.Group(), o = ghost ? { t: true, op: 0.38 } : {};
  const M2 = (c, x = {}) => mat(c, { ...o, ...x });
  const bm = M2(ghost ? 0x9fd8ff : 0x14161c, { r: 0.35 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 1.3), bm);
  const tipF = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 18), bm); tipF.position.z = -0.65;
  const tipB = tipF.clone(); tipB.position.z = 0.65;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.065, 0.5), M2(jacket, { e: jacket, ei: 0.25 }));
  board.add(tipF, tipB, stripe); board.position.y = 0.03; g.add(board);
  const pants = M2(0x23283a, { r: 0.8 }), jac = M2(jacket, { r: 0.7 }), skin = M2(0xf2c6a0, { r: 0.8 });
  const leg = z => { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.42, 4, 10), pants); l.position.set(0, 0.36, z); l.rotation.x = z > 0 ? -0.25 : 0.25; return l; };
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.34, 6, 14), jac); torso.position.y = 0.92;
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.42, 4, 10), jac); armL.position.set(0, 0.95, -0.32); armL.rotation.x = 1.1;
  const armR = armL.clone(); armR.position.z = 0.32; armR.rotation.x = -1.1;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16), skin); head.position.y = 1.32;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.185, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), M2(0xffffff, { r: 0.3 })); helmet.position.y = 1.35;
  const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.26), M2(0xff8a1f, { r: 0.1, m: 0.6, e: 0xff6a00, ei: 0.35 })); goggles.position.set(-0.14, 1.33, 0);
  body.add(leg(-0.22), leg(0.22), torso, armL, armR, head, helmet, goggles); g.add(body);
  g.traverse(m => { if (m.isMesh) { m.castShadow = !ghost; m.receiveShadow = !ghost; } });
  g.userData = { board, body };
  return g;
}

function buildWorld(Cc) {
  if (world) { scene.remove(world.root); world.root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); }); if (world.sun.shadow.map) world.sun.shadow.map.dispose(); }
  const M = Cc.M, root = new THREE.Group(); scene.add(root); const W = { root };
  scene.fog = new THREE.Fog(M.fog[0], M.fog[1], M.fog[2]);
  // 🌌 sky dome: gradient, sun glow, and stars + aurora at night
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color(M.sky[0]) }, hor: { value: new THREE.Color(M.sky[1]) }, sunDir: { value: new THREE.Vector3(...(M.glow || M.sun[0])).normalize() }, sunCol: { value: new THREE.Color(M.sun[1]) }, night: { value: M.night ? 1 : 0 }, time: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }',
    fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 sunDir; uniform vec3 sunCol; uniform float night; uniform float time; varying vec3 vP;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
      void main(){ float y = clamp(vP.y, -0.2, 1.0); vec3 c = mix(hor, top, pow(max(y,0.0), 0.55));
        float s = max(dot(normalize(vP), sunDir), 0.0); c += sunCol * (pow(s, 600.0) * (night > 0.5 ? 1.2 : 3.0) + pow(s, 12.0) * 0.35);
        if (night > 0.5) { vec3 q = floor(vP * 420.0); float st = step(0.9965, h(q)) * smoothstep(0.02, 0.3, y); c += vec3(st) * (0.6 + 0.4 * sin(time * 2.0 + h(q) * 30.0));
          float a = smoothstep(0.08, 0.35, y) * (1.0 - smoothstep(0.45, 0.8, y)); float band = sin(vP.x * 7.0 + sin(vP.z * 5.0 + time * 0.25) * 1.6 + time * 0.12);
          c += vec3(0.1, 0.9, 0.55) * a * pow(max(band, 0.0), 3.0) * 0.55 + vec3(0.5, 0.2, 0.9) * a * pow(max(-band, 0.0), 4.0) * 0.25; }
        gl_FragColor = vec4(c, 1.0); }` });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 24), skyMat); sky.renderOrder = -1; sky.frustumCulled = false; root.add(sky); W.skyMat = skyMat; W.sky = sky;
  // ☀️ lights
  root.add(new THREE.HemisphereLight(M.hemi[0], M.hemi[1], M.hemi[2]));
  const sun = new THREE.DirectionalLight(M.sun[1], M.sun[2]); sun.castShadow = true; const sm = quality >= 1080 ? 2048 : 1024; sun.shadow.mapSize.set(sm, sm);
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 300 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; root.add(sun, sun.target); W.sun = sun; W.sunDir = new THREE.Vector3(...M.sun[0]).normalize();
  // 🏔️ the slope: one big mesh following the course (groomed snow on the run, bluer snow up the sides)
  const s0 = Cc.S0 + 5, s1 = Cc.S0 + Cc.N - 5, stepS = 2, us = []; for (let u = -110; u <= 110; u += (Math.abs(u) < BANK + 6 ? 1.5 : 5)) us.push(u);
  const rows = Math.floor((s1 - s0) / stepS) + 1, cols = us.length, pos = new Float32Array(rows * cols * 3), col = new Float32Array(rows * cols * 3), idx = [];
  const cRun = new THREE.Color(M.night ? 0xb8c6ee : 0xf6f9ff), cSide = new THREE.Color(M.night ? 0x7d8cc4 : 0xdfe9f7), cRock = new THREE.Color(M.night ? 0x2b2f45 : 0x6f7480), tmp = new THREE.Color();
  for (let r = 0; r < rows; r++) { const s = s0 + r * stepS, cx = Cc.cx(s);
    for (let c = 0; c < cols; c++) { const u = us[c], i = (r * cols + c) * 3, a = Math.abs(u);
      pos[i] = cx + u; pos[i + 1] = Cc.y(s) + Cc.bank(u) + Cc.bump(s, u) * (a < BANK ? 1 : 2.5) + Cc.outer(s, u); pos[i + 2] = -s;
      tmp.copy(cRun).lerp(cSide, clamp((a - WID) / 10, 0, 1)); if (a > 60) tmp.lerp(cRock, clamp((a - 60) / 50, 0, 0.55) * (0.5 + 0.5 * Math.sin(s * 0.05 + u)));
      tmp.offsetHSL(0, 0, 0.02 * Math.sin(s * 0.045 + u * 0.09) + 0.015 * Math.sin(u * 0.4 - s * 0.02));
      col[i] = tmp.r; col[i + 1] = tmp.g; col[i + 2] = tmp.b; } }
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) { const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1; idx.push(a, b, d, b, e, d); } // (counter-clockwise from above, so the snow faces up)
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); tg.setAttribute('color', new THREE.BufferAttribute(col, 3)); tg.setIndex(idx); tg.computeVertexNormals();
  const terrain = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0, emissive: new THREE.Color(M.fog[0]), emissiveIntensity: M.night ? 0.05 : 0.08 })); terrain.receiveShadow = true; root.add(terrain);
  // 🏔️ far mountains
  const R = rng(M.seed + 7), mg = [];
  for (let i = 0; i < 26; i++) { const h = 180 + R() * 380, rad = h * (0.8 + R() * 0.5), cone = new THREE.ConeGeometry(rad, h, 7 + Math.floor(R() * 4), 4);
    const pp = cone.attributes.position, cc = new Float32Array(pp.count * 3), snowC = new THREE.Color(M.night ? 0x9fb0e0 : 0xffffff), rockC = new THREE.Color(M.night ? 0x1d2240 : 0x55606f);
    for (let v = 0; v < pp.count; v++) { const c2 = (pp.getY(v) + h / 2) / h > 0.62 ? snowC : rockC; cc[v * 3] = c2.r; cc[v * 3 + 1] = c2.g; cc[v * 3 + 2] = c2.b; }
    cone.setAttribute('color', new THREE.BufferAttribute(cc, 3)); const side = R() < 0.5 ? -1 : 1, s = -100 + R() * (M.len + 400);
    cone.translate(Cc.cx(s) + side * (rad + 200 + R() * 400), Cc.y(s) + h / 2 - 40 - R() * 40, -s - R() * 200); mg.push(cone); } // well away from the run
  root.add(new THREE.Mesh(merge(mg), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 })));
  // 🌲 trees (one instanced mesh)
  const tg2 = merge([tint(new THREE.CylinderGeometry(0.22, 0.3, 1.6, 7).translate(0, 0.8, 0), 0x4a3424), tint(new THREE.ConeGeometry(2.0, 3.2, 9).translate(0, 2.8, 0), M.night ? 0x0f3a2b : 0x1f5a3a),
    tint(new THREE.ConeGeometry(1.55, 2.7, 9).translate(0, 4.4, 0), M.night ? 0x134a35 : 0x266b45), tint(new THREE.ConeGeometry(1.0, 2.2, 9).translate(0, 5.9, 0), M.night ? 0x1a5a40 : 0x2f7d50), tint(new THREE.ConeGeometry(0.55, 1.0, 9).translate(0, 6.95, 0), 0xf4f8ff)]);
  const treesAt = [], RT = rng(M.seed + 3);
  for (let s = Cc.S0 + 10; s < Cc.S0 + Cc.N - 10; s += 3.2 / M.trees) for (const side of [-1, 1]) { if (RT() < 0.45) continue; treesAt.push([s + RT() * 3, side * (WALL + 1 + Math.pow(RT(), 1.6) * 70), 0.7 + RT() * 0.8]); }
  const trees = new THREE.InstancedMesh(tg2, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true }), treesAt.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), v3 = new THREE.Vector3();
  treesAt.forEach(([s, u, k], i) => { const y = Cc.y(s) + Cc.bank(u) + Cc.bump(s, u) * 2.5 + Cc.outer(s, u) - 0.2;
    q.setFromAxisAngle(v3.set(0, 1, 0), (s * 7.1) % 6.28); m4.compose(v3.set(Cc.cx(s) + u, y, -s), q, sc.set(k, k * (0.9 + ((s * 13) % 1) * 0.3), k)); trees.setMatrixAt(i, m4); });
  trees.castShadow = true; trees.receiveShadow = true; root.add(trees);
  // 🪨 rocks
  if (Cc.rocks.length) { const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: M.night ? 0x3c4058 : 0x7a7f8c, roughness: 0.95, flatShading: true }), Cc.rocks.length);
    Cc.rocks.forEach((r, i) => { m4.compose(v3.set(Cc.cx(r.s) + r.u, Cc.ground(r.s, r.u) + r.r * 0.35, -r.s), q.setFromEuler(new THREE.Euler(r.s, r.u, 0)), sc.set(r.r * 1.15, r.r * 0.8, r.r)); rocks.setMatrixAt(i, m4); });
    rocks.castShadow = true; rocks.receiveShadow = true; root.add(rocks); }
  // 🟦 kickers: a curved ramp of packed snow with a coloured lip
  const kmat = new THREE.MeshStandardMaterial({ color: M.night ? 0xc8d4ff : 0xffffff, roughness: 0.55 }), lip = mat(M.night ? 0x35e0ff : 0x2f80ed, { e: M.night ? 0x35e0ff : 0x000000, ei: M.night ? 0.8 : 0 });
  for (const k of Cc.kickers) { const seg = 14, P2 = [], I = [];
    for (let i = 0; i <= seg; i++) { const s = k.s0 + k.L * i / seg; for (const side of [-1, 1]) { const u = k.u + side * k.w / 2, x = Cc.cx(s) + u, gy = Cc.y(s) + Cc.bump(s, u); P2.push(x, gy + k.h * Math.pow(i / seg, 1.6) + 0.02, -s, x, gy - 0.4, -s); } }
    for (let i = 0; i < seg; i++) { const a = i * 4, b = a + 4; I.push(a, b, a + 2, a + 2, b, b + 2, a, a + 1, b, a + 1, b + 1, b, a + 2, b + 2, a + 3, a + 3, b + 2, b + 3); }
    const e = seg * 4; I.push(e, e + 2, e + 1, e + 1, e + 2, e + 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); g.setIndex(I); g.computeVertexNormals();
    const m = new THREE.Mesh(g, kmat); m.castShadow = true; m.receiveShadow = true; m.material.side = THREE.DoubleSide; root.add(m);
    const se = k.s0 + k.L, bar = new THREE.Mesh(new THREE.BoxGeometry(k.w, 0.14, 0.4), lip); bar.position.set(Cc.cx(se) + k.u, Cc.y(se) + Cc.bump(se, k.u) + k.h + 0.04, -se); bar.rotation.y = -Math.atan(Cc.dcx(se)); root.add(bar);
    for (const side of [-1, 1]) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.1, 8), lip); f.position.set(Cc.cx(k.s0) + k.u + side * (k.w / 2 + 0.6), Cc.ground(k.s0, k.u + side * (k.w / 2 + 0.6)) + 0.55, -k.s0); root.add(f); } }
  // 🛤️ rails
  const rmat = mat(0xd9dee8, { r: 0.22, m: 1 }), pmat = mat(M.night ? 0xff4fa8 : 0xff6a3d, { r: 0.5, e: M.night ? 0xff4fa8 : 0x000000, ei: M.night ? 0.6 : 0 });
  for (const r of Cc.rails) { const pts = []; for (let i = 0; i <= 12; i++) { const s = r.s0 + r.L * i / 12; pts.push(new THREE.Vector3(Cc.cx(s) + r.u, Cc.railTop(r, s), -s)); }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.07, 10), rmat); tube.castShadow = true; root.add(tube);
    for (let i = 0; i <= 3; i++) { const s = r.s0 + r.L * i / 3, pl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, r.h, 8), pmat); pl.position.set(Cc.cx(s) + r.u, Cc.railTop(r, s) - r.h / 2, -s); pl.castShadow = true; root.add(pl); } }
  // 🟡 rings
  Cc.gates.forEach(gt => { const m = new THREE.Mesh(new THREE.TorusGeometry(gt.r, 0.22, 12, 48), mat(0xffd21f, { e: 0xffb000, ei: M.night ? 1.6 : 0.7, r: 0.3, m: 0.4 }));
    gt.y = Cc.ground(gt.s, gt.u) + gt.up; m.position.set(Cc.cx(gt.s) + gt.u, gt.y, -gt.s); m.rotation.y = -Math.atan(Cc.dcx(gt.s)); root.add(m); gt.mesh = m; gt.done = false; });
  // 🏁 start and finish arches
  const arch = (s, text, colr) => { const x = Cc.cx(s), y = Cc.y(s), pm = mat(0x1d2433, { r: 0.4, m: 0.6 });
    for (const side of [-1, 1]) { const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 9, 12), pm); p2.position.set(x + side * (WID + 1), y + 4.5, -s); p2.castShadow = true; root.add(p2); }
    const ban = new THREE.Mesh(new THREE.PlaneGeometry((WID + 1) * 2, 3.2), new THREE.MeshBasicMaterial({ map: textTex(text, colr, '#ffffff'), side: THREE.DoubleSide })); ban.position.set(x, y + 8.2, -s); ban.rotation.y = -Math.atan(Cc.dcx(s)); root.add(ban); };
  arch(0, 'START', '#2f80ed'); arch(M.len, 'FINISH', '#e23b5a');
  // ❄️ falling snow
  const NS = Math.round(1800 + 3000 * M.snow), sp = new Float32Array(NS * 3); for (let i = 0; i < NS * 3; i++) sp[i] = (Math.random() - 0.5) * (i % 3 === 1 ? 60 : 120);
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  W.snow = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.16, map: DOT, transparent: true, depthWrite: false, color: 0xffffff, opacity: 0.9 })); W.snow.frustumCulled = false; root.add(W.snow);
  // 💨 snow spray from the board
  const NP = 700; W.spray = { n: NP, pos: new Float32Array(NP * 3), vel: new Float32Array(NP * 3), life: new Float32Array(NP), al: new Float32Array(NP), sz: new Float32Array(NP), next: 0 };
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(W.spray.pos, 3)); pg.setAttribute('alpha', new THREE.BufferAttribute(W.spray.al, 1)); pg.setAttribute('size', new THREE.BufferAttribute(W.spray.sz, 1));
  const pm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { map: { value: DOT }, scale: { value: 260 }, tint: { value: new THREE.Color(M.night ? 0xc9d6ff : 0xffffff) } },
    vertexShader: 'attribute float alpha; attribute float size; varying float vA; uniform float scale; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D map; uniform vec3 tint; varying float vA; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(tint, t.a * vA); }' });
  W.sprayPts = new THREE.Points(pg, pm); W.sprayPts.frustumCulled = false; root.add(W.sprayPts);
  return W;
}

/* ================= the ride ================= */
const G = 22, JUMP0 = 6.5, JUMP1 = 6.5, VMAX = 62;
let P = null, rider = null, ghostRider = null, running = false, paused = false, finished = false, tRun = 0, score = 0, combo = 0, comboT = 0, keys = {}, jumpHold = 0, jumpHeld = false, token = null, countdown = 0;
let parts = { trick: 0, gates: 0, grind: 0, time: 0 }, rec = [], recT = 0, ghost = null, lastHud = 0, meName = 'You';
const jacketFor = name => { let h = 0; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return new THREE.Color().setHSL((h % 360) / 360, 0.75, 0.5).getHex(); };
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
function resetRun() {
  P = { s: -40, u: 0, y: C.ground(-40, 0), v: 9, vu: 0, vy: 0, air: false, spin: 0, flip: 0, airT: 0, crash: 0, grind: null, tuck: 0 };
  tRun = 0; score = 0; combo = 0; comboT = 0; finished = false; parts = { trick: 0, gates: 0, grind: 0, time: 0 }; rec = []; recT = 0; jumpHold = 0; jumpHeld = false; keys = {};
  C.gates.forEach(g => { g.done = false; g.hit = 0; g.mesh.visible = true; g.mesh.scale.setScalar(1); });
  ghost = $('#ghostChk').checked ? ls('pr-ghost-' + M.id, null) : null; if (ghostRider) ghostRider.visible = false;
  camPos.set(C.cx(P.s), P.y + 6, -P.s + 14); camLook.set(C.cx(P.s), P.y, -P.s - 8);
}
function popTrick(text, sub, bad) { const t = $('#trick'); t.replaceChildren(el('div', '', text)); if (sub) t.appendChild(el('small', '', sub)); t.className = 'trick show' + (bad ? ' bad' : ''); clearTimeout(popTrick.t); popTrick.t = setTimeout(() => { t.className = 'trick'; }, 1300); }
function emit(n, x, y, z, spd, up) { const S = world.spray; for (let i = 0; i < n; i++) { const k = S.next; S.next = (S.next + 1) % S.n; S.pos[k * 3] = x + (Math.random() - 0.5) * 0.6; S.pos[k * 3 + 1] = y + 0.05; S.pos[k * 3 + 2] = z + (Math.random() - 0.5) * 0.6;
  S.vel[k * 3] = (Math.random() - 0.5) * spd; S.vel[k * 3 + 1] = Math.random() * up; S.vel[k * 3 + 2] = (Math.random() - 0.5) * spd + 2; S.life[k] = 0.5 + Math.random() * 0.5; S.sz[k] = 0.12 + Math.random() * 0.3; } }
const here = () => [C.cx(P.s) + P.u, P.y, -P.s];
function crash(why) { P.crash = 1.2; P.v *= 0.35; P.vu *= 0.3; combo = 0; comboT = 0; popTrick('💥 ' + why, 'combo lost', true); emit(60, ...here(), 7, 5); P.air = false; P.grind = null; P.spin = 0; P.flip = 0; P.y = C.ground(P.s, P.u); P.vy = 0; }
function land() {
  const nS = Math.round(P.spin / Math.PI), offS = Math.abs(P.spin - nS * Math.PI), nF = Math.round(P.flip / (2 * Math.PI)), offF = Math.abs(P.flip - nF * 2 * Math.PI);
  P.air = false; const air = P.airT; P.airT = 0;
  if (air < 0.35 && Math.abs(P.spin) < 1.2 && Math.abs(P.flip) < 1.2) { P.spin = 0; P.flip = 0; return; } // just a little hop: you land fine
  if (offS > 0.7 || offF > 0.85) { crash(offF > 0.75 ? 'Landed on your head!' : 'Landed sideways!'); return; }
  emit(26 + Math.min(40, air * 20), ...here(), 6, 3.5);
  const spinDeg = Math.abs(nS) * 180, flips = Math.abs(nF);
  P.spin = 0; P.flip = 0;
  if (!spinDeg && !flips) { if (air > 0.9) { const pts = Math.round(air * 80) * Math.max(1, combo); score += pts; parts.trick += pts; popTrick('Big air', '+' + nf(pts)); comboT = 3; } return; }
  const cork = spinDeg >= 360 && flips >= 1, dir = nF > 0 ? 'Front' : 'Back';
  let name = cork ? 'Cork ' + spinDeg : spinDeg ? String(spinDeg) : ''; if (flips) name += (name ? ' + ' : '') + (flips === 1 ? '' : flips === 2 ? 'Double ' : flips === 3 ? 'Triple ' : flips + 'x ') + dir + 'flip';
  combo = Math.min(10, combo + 1); comboT = 3.5;
  const pts = (Math.abs(nS) * 100 + flips * 350 + (cork ? 250 : 0) + Math.round(air * 60)) * combo; score += pts; parts.trick += pts;
  P.v = Math.min(VMAX, P.v + 2.5 + Math.abs(nS) * 0.9 + flips * 1.6); // clean landings = more speed
  popTrick(name, '+' + nf(pts) + (combo > 1 ? '  (×' + combo + ')' : ''));
}
function step(dt) {
  if (countdown > 0) { countdown -= dt; $('#count').textContent = countdown > 0 ? Math.ceil(countdown) : 'GO!'; return; }
  if (countdown > -0.8) { countdown -= dt; if (countdown <= -0.8) $('#count').hidden = true; }
  const steer = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), th = Math.atan(C.slope(P.s));
  tRun += dt; if (comboT > 0) { comboT -= dt; if (comboT <= 0 && !P.air && !P.grind) combo = 0; }
  if (P.crash > 0) { P.crash -= dt; P.v = Math.max(0, P.v - 6 * dt); }
  const ctl = P.crash <= 0;
  // jump: hold Space to crouch, let go to pop
  if (keys.jump && ctl) { jumpHeld = true; jumpHold = Math.min(0.6, jumpHold + dt); }
  else if (jumpHeld) { jumpHeld = false; if ((!P.air || P.grind) && ctl) { P.vy = Math.max(P.vy, 0) * 0.6 + JUMP0 + JUMP1 * jumpHold / 0.6; P.air = true; P.airT = 0; P.grind = null; P.y += 0.05; emit(10, ...here(), 3, 2); } jumpHold = 0; }
  if (P.grind) { // 🛤️ grinding
    const r = P.grind; P.v = Math.max(8, P.v - 0.6 * dt); P.s += P.v * dt; P.u += (r.u - P.u) * Math.min(1, dt * 12); P.vu = 0;
    const gp = Math.round(60 * P.v * dt * Math.max(1, combo)); score += gp; parts.grind += gp; comboT = 3; if (Math.random() < 0.6) emit(1, ...here(), 2, 2);
    if (P.s > r.s0 + r.L) { P.grind = null; P.air = true; P.vy = 2; P.airT = 0; popTrick('Rail grind!', 'combo ×' + Math.max(1, combo)); } else { const ny = C.railTop(r, P.s) + 0.03; P.vy = (ny - P.y) / Math.max(dt, 1e-3); P.y = ny; }
  } else if (!P.air) { // 🏂 on the snow
    P.tuck += ((keys.down && ctl ? 1 : 0) - P.tuck) * Math.min(1, dt * 6);
    const drag = (0.0072 - 0.0032 * P.tuck) * P.v * P.v;
    P.v += (G * Math.sin(th) - drag - 0.4 - Math.abs(steer) * 1.0) * dt; P.v = clamp(P.v, 0, VMAX);
    const tv = ctl ? steer * Math.min(15, 4 + P.v * 0.38) : P.vu; P.vu += clamp(tv - P.vu, -28 * dt, 28 * dt);
    const a = Math.abs(P.u); if (a > WID) P.vu -= Math.sign(P.u) * (a - WID) * 0.36 * G * 0.5 * dt; // the banks push you back in
    const oy = P.y; P.s += P.v * dt; P.u += P.vu * dt; if (Math.abs(P.u) > BANK + 2) { P.u = Math.sign(P.u) * (BANK + 2); P.vu *= -0.3; }
    const gy = C.ground(P.s, P.u), vyG = (gy - oy) / Math.max(dt, 1e-3);
    const onKick = C.kickAt(P.s - P.v * dt, P.u) > 0.5;
    if (vyG < P.vy - G * dt - 2.5 && oy - gy > 0.04) { P.air = true; P.airT = 0; P.vy = Math.max(P.vy, -2) + (onKick ? 3.5 + P.v * 0.06 : 0); P.y = oy + P.vy * dt; } // the ground dropped away: you're flying (jump lips get extra pop)
    else { P.vy = vyG; P.y = gy; }
    if (steer && P.v > 8) emit(Math.ceil(P.v / 12), ...here(), 3, 2.2);
  }
  if (P.air && !P.grind) { // ✈️ in the air
    P.airT += dt; P.vy -= G * dt; P.y += P.vy * dt; P.s += P.v * dt; P.u += P.vu * dt; P.v = Math.max(0, P.v - 0.0035 * P.v * P.v * dt);
    if (Math.abs(P.u) > BANK + 2) { P.u = Math.sign(P.u) * (BANK + 2); P.vu *= -0.3; }
    if (ctl && P.airT > 0.12) { P.spin += steer * 6.4 * dt; P.flip += ((keys.up ? 1 : 0) - (keys.down ? 1 : 0)) * 5.2 * dt; } // tricks once you're properly in the air
    for (const r of C.rails) if (P.vy < 0 && P.s >= r.s0 && P.s <= r.s0 + r.L && Math.abs(P.u - r.u) < 1.0) { const ty = C.railTop(r, P.s); if (P.y <= ty + 0.25 && P.y >= ty - 0.6) { // landed on a rail
      if (P.spin || P.flip) land(); if (P.crash > 0) break; P.grind = r; P.air = false; P.y = ty; P.spin = 0; P.flip = 0; popTrick('Grind!', ''); break; } }
    if (!P.grind && P.air) { const gy = C.ground(P.s, P.u); if (P.y <= gy) { P.y = gy; P.vy = 0; land(); } }
  }
  // 🪨 rocks and 🛤️ running into a rail
  if (P.crash <= 0) { for (const r of C.rocks) if (Math.abs(r.s - P.s) < r.r + 0.3 && Math.abs(r.u - P.u) < r.r + 0.3 && P.y < C.ground(r.s, r.u) + r.r * 1.1) { crash('Hit a rock!'); P.u += (P.u >= r.u ? 1 : -1) * (r.r + 0.6); break; }
    if (!P.air && !P.grind) for (const r of C.rails) if (P.s > r.s0 && P.s < r.s0 + r.L && Math.abs(P.u - r.u) < 0.5 && P.y < C.railTop(r, P.s) - 0.25) {
      if (P.s - r.s0 < 2.5 && P.v > 6) { P.grind = r; P.y = C.railTop(r, P.s); popTrick('Boardslide!', 'hop on and ride it'); } // ride straight at the end of a rail and you hop on
      else { crash('Ran into a rail!'); P.u += (P.u >= r.u ? 1 : -1) * 1.2; } break; } }
  // 🟡 rings
  for (const g of C.gates) if (!g.done && P.s >= g.s) { g.done = true; if (Math.hypot(P.u - g.u, P.y + 0.9 - g.y) < g.r) { P.v = Math.min(VMAX, P.v + 5); const pts = 150 * Math.max(1, combo); score += pts; parts.gates += pts; popTrick('🟡 Ring!', '+' + nf(pts) + ' · speed boost'); g.hit = 0.5; } }
  // 👻 record your run (for your ghost)
  recT += dt; if (recT >= 0.05) { recT -= 0.05; rec.push([+P.s.toFixed(2), +P.u.toFixed(2), +P.y.toFixed(2), +P.spin.toFixed(2), +P.flip.toFixed(2)]); }
  if (P.s >= C.M.len && !finished) finish();
}
async function finish() {
  finished = true; running = false; const tb = Math.max(0, Math.round((C.M.par - tRun) * 120)) + 1000; parts.time = tb; score += tb; hud();
  const res = $('#endRes'); res.replaceChildren(); [['Tricks', parts.trick], ['Rings', parts.gates], ['Grinds', parts.grind], ['Finish + time bonus (' + tRun.toFixed(1) + 's)', parts.time]].forEach(([a, b]) => res.append(el('span', '', a), el('b', '', nf(b))));
  res.append(el('span', 'tot', 'Score'), el('span', 'tot', nf(score)));
  const pb = ls('pr-best-' + M.id, 0), isPb = score > pb; $('#newBest').hidden = !isPb; if (isPb) { lset('pr-best-' + M.id, score); lset('pr-ghost-' + M.id, rec); }
  $('#endTitle').textContent = '🏁 ' + M.name + ' finished!'; $('#endRank').textContent = token ? 'Saving…' : 'Not saved (no connection).'; $('#endOv').hidden = false; $('#againBtn').focus();
  if (token) { const r = await api('/api/arcade/finish', 'POST', { token, score, finished: true }); token = null;
    if (r.ok) { const a = r.data.all, w = r.data.week; $('#endRank').textContent = r.data.saved ? (a ? 'You’re #' + a.rank + ' all time on ' + M.name + (w ? ' · #' + w.rank + ' this week' : '') : 'Saved!') : 'That run couldn’t be saved.'; loadBoard(); }
    else $('#endRank').textContent = r.data.error || 'Couldn’t save that run.'; }
  drawMaps();
}

/* ================= camera, drawing, loop ================= */
const tv3 = new THREE.Vector3(), rp = new THREE.Vector3(), want = new THREE.Vector3(), look = new THREE.Vector3(), Y1 = new THREE.Vector3(0, 1, 0);
function placeRider(R0, s, u, y, spin, flip, lean, tuck, crashT, vu, v) {
  const head = -Math.atan(C.dcx(s)), th = Math.atan(C.slope(s));
  R0.position.set(C.cx(s) + u, y, -s);
  R0.rotation.set(0, 0, 0); R0.rotateY(head - Math.atan2(vu || 0, Math.max(4, v || 10)) * 0.8); R0.rotateX(-th); R0.rotateZ(lean); R0.rotateY(spin); R0.rotateX(-flip);
  if (crashT > 0) { R0.rotateZ(crashT * 9); R0.rotateX(crashT * 4); }
  const ud = R0.userData; ud.body.position.y = -0.18 * tuck; ud.body.scale.y = 1 - 0.18 * tuck;
}
function updateCamera(dt, snap) {
  const s = P.s, d = tv3.set(C.dcx(s), 0, -1).normalize(); rp.set(C.cx(s) + P.u, P.y, -s);
  const back = 7 + P.v * 0.05, hgt = 2.7 + P.v * 0.03;
  want.copy(rp).addScaledVector(d, -back); want.y += hgt; const gyCam = C.ground(s - back, P.u * 0.7) + 1.6; if (want.y < gyCam) want.y = gyCam;
  look.copy(rp).addScaledVector(d, 7); look.y += 0.8;
  const k1 = snap ? 1 : 1 - Math.exp(-dt * 6), k2 = snap ? 1 : 1 - Math.exp(-dt * 10); camPos.lerp(want, k1); camLook.lerp(look, k2);
  const shake = Math.max(0, P.v - 32) * 0.004; camera.position.copy(camPos); camera.position.x += (Math.random() - 0.5) * shake; camera.position.y += (Math.random() - 0.5) * shake; camera.up.copy(Y1); camera.lookAt(camLook);
  const fov = 62 + clamp((P.v - 10) * 0.42, 0, 20); if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix(); }
  world.sun.position.copy(rp).addScaledVector(world.sunDir, 120); world.sun.target.position.copy(rp); world.sky.position.copy(camera.position);
}
function updateFx(dt, t) {
  world.skyMat.uniforms.time.value = t;
  const S = world.spray; for (let i = 0; i < S.n; i++) if (S.life[i] > 0) { S.life[i] -= dt; S.vel[i * 3 + 1] -= 9 * dt; S.pos[i * 3] += S.vel[i * 3] * dt; S.pos[i * 3 + 1] += S.vel[i * 3 + 1] * dt; S.pos[i * 3 + 2] += S.vel[i * 3 + 2] * dt; S.al[i] = clamp(S.life[i] / 0.6, 0, 1) * 0.9; } else S.al[i] = 0;
  const g = world.sprayPts.geometry; g.attributes.position.needsUpdate = true; g.attributes.alpha.needsUpdate = true; g.attributes.size.needsUpdate = true;
  const a = world.snow.geometry.attributes.position, arr = a.array, cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
  for (let i = 0; i < arr.length; i += 3) { arr[i + 1] -= dt * (2.2 + (i % 7) * 0.2); arr[i] += Math.sin(t + i) * dt * 0.4;
    if (arr[i + 1] < cy - 30) arr[i + 1] += 60; else if (arr[i + 1] > cy + 30) arr[i + 1] -= 60; if (arr[i] < cx - 60) arr[i] += 120; else if (arr[i] > cx + 60) arr[i] -= 120; if (arr[i + 2] < cz - 60) arr[i + 2] += 120; else if (arr[i + 2] > cz + 60) arr[i + 2] -= 120; }
  a.needsUpdate = true;
  for (const gt of C.gates) { gt.mesh.rotation.z += dt * 0.8; if (gt.hit > 0) { gt.hit -= dt; gt.mesh.scale.setScalar(1 + (0.5 - gt.hit) * 1.6); if (gt.hit <= 0) gt.mesh.visible = false; } }
}
function hud() {
  $('#hScore').textContent = nf(score); $('#hTime').textContent = tRun.toFixed(1); $('#hSpd').textContent = Math.round(Math.hypot(P.v, P.vu) * 3.6);
  $('#hCombo').textContent = combo > 1 ? '×' + combo : ''; $('#hProg').style.width = clamp(P.s / C.M.len * 100, 0, 100) + '%';
}
let tPrev = 0, tAll = 0, menuT = 0;
function loop(ts) {
  requestAnimationFrame(loop); if (!renderer || !world || !P) return;
  const dt = Math.min(0.033, (ts - (tPrev || ts)) / 1000); tPrev = ts; tAll += dt;
  if (running && !paused) { step(dt / 2); step(dt / 2); }
  else if (!running && !finished && !paused) { menuT += dt; P.s = -40 + (menuT * 14) % 600; P.y = C.ground(P.s, P.u); P.v = 14; } // a calm ride behind the menu
  placeRider(rider, P.s, P.u, P.y, P.spin, P.flip, P.air ? 0 : -P.vu * 0.02, P.tuck + (jumpHeld ? jumpHold : 0), P.crash > 0 ? 1.2 - P.crash : 0, P.vu, P.v);
  if (ghost && ghost.length && (running || finished)) { const f = ghost[Math.min(ghost.length - 1, Math.floor(tRun / 0.05))]; ghostRider.visible = true; placeRider(ghostRider, f[0], f[1], f[2], f[3], f[4], 0, 0, 0, 0, 10); } else ghostRider.visible = false;
  if (!paused) { updateCamera(dt); updateFx(dt, tAll); }
  if (running && ts - lastHud > 60) { lastHud = ts; hud(); }
  renderer.render(scene, camera);
}

/* ================= menus, controls, leaderboards ================= */
let B = null, lbRange = 'all', lbTrack = 't1';
function drawMaps() {
  const box = $('#maps'); box.replaceChildren();
  MAPS.forEach(m => { const b = el('button', 'map'); b.type = 'button'; b.style.background = m.card; const pb = ls('pr-best-' + m.id, 0), top = B && B[m.id] && B[m.id].all.top[0];
    b.append(el('span', 'lvl', m.lvl), el('b', '', m.name), el('span', '', m.desc), el('span', '', top ? '🥇 ' + top.name + ': ' + nf(top.best) : '🥇 Nobody yet: be first!')); if (pb) b.appendChild(el('span', 'pb', 'Your best ' + nf(pb)));
    b.onclick = () => startMap(m); box.appendChild(b); });
}
function loadMap(m) { M = m; C = buildCourse(m); world = buildWorld(C); }
async function startMap(m) {
  $('#menuOv').hidden = true; $('#endOv').hidden = true; $('#pauseOv').hidden = true;
  if (!C || C.M !== m) loadMap(m);
  resetRun(); updateCamera(0, true); $('#hMap').textContent = m.name; $('#hud').hidden = false; countdown = 3; $('#count').hidden = false; $('#count').textContent = '3'; running = true; paused = false; lbTrack = m.id; drawBoard(); hud();
  token = null; const r = await api('/api/arcade/start', 'POST', { game: m.id }); if (r.status === 401) { location.replace('/?next=arcade'); return; } token = r.ok ? r.data.token : null;
  $('#stage').scrollIntoView({ behavior: 'smooth', block: 'center' }); cv.focus({ preventScroll: true });
}
function pause() { if (!running || finished) return; paused = true; keys = {}; $('#pauseOv').hidden = false; }
function resume() { paused = false; tPrev = 0; $('#pauseOv').hidden = true; cv.focus({ preventScroll: true }); }
function toMenu() { paused = false; running = false; finished = false; $('#pauseOv').hidden = true; $('#endOv').hidden = true; $('#menuOv').hidden = false; $('#hud').hidden = true; menuT = 0; P.crash = 0; P.air = false; P.spin = 0; P.flip = 0; }
const KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ' ': 'jump' };
addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input,textarea,select')) return;
  if (!$('#endOv').hidden && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); startMap(M); return; }
  const k = KEYMAP[e.key]; if (k && running && !paused) { keys[k] = true; e.preventDefault(); }
  if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && running) { e.preventDefault(); paused ? resume() : pause(); }
  if ((e.key === 'r' || e.key === 'R') && (running || finished) && M) startMap(M);
});
addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) keys[k] = false; });
addEventListener('blur', () => { keys = {}; });
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
document.querySelectorAll('.pad button').forEach(b => { const k = b.dataset.k === 'flip' ? 'down' : b.dataset.k, on = e => { e.preventDefault(); keys[k] = true; }, off = () => { keys[k] = false; };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); });
$('#againBtn').onclick = () => startMap(M); $('#menuBtn').onclick = toMenu; $('#quitBtn').onclick = toMenu;
$('#resumeBtn').onclick = resume; $('#restartBtn').onclick = () => startMap(M); $('#pauseBtn').onclick = pause;
$('#fsBtn').onclick = () => { const s = $('#stage'); if (document.fullscreenElement) document.exitFullscreen(); else if (s.requestFullscreen) s.requestFullscreen().catch(() => {}); };
document.addEventListener('fullscreenchange', () => setTimeout(resize, 50));
document.querySelectorAll('#qSeg button').forEach(b => { b.classList.toggle('on', +b.dataset.q === quality); b.onclick = () => { quality = +b.dataset.q; lset('pr-q', quality); document.querySelectorAll('#qSeg button').forEach(x => x.classList.toggle('on', x === b)); resize(); if (world) { const s = quality >= 1080 ? 2048 : 1024; world.sun.shadow.mapSize.set(s, s); if (world.sun.shadow.map) { world.sun.shadow.map.dispose(); world.sun.shadow.map = null; } } }; });
async function loadBoard() { const r = await api('/api/arcade/board'); if (!r.ok) return; B = r.data; drawBoard(); drawMaps(); }
function drawBoard() {
  const tt = $('#trackTabs'); tt.replaceChildren(); MAPS.forEach(m => { const b = el('button', m.id === lbTrack ? 'on' : '', m.name); b.type = 'button'; b.onclick = () => { lbTrack = m.id; drawBoard(); }; tt.appendChild(b); });
  const box = $('#lb'); box.replaceChildren(); const D = B && B[lbTrack] && B[lbTrack][lbRange]; if (!D) return;
  if (!D.top.length) box.appendChild(el('p', 'small muted', 'Nobody has ridden this track yet. Be the first!'));
  D.top.forEach(x => { const row = el('div', 'row' + (x.me ? ' me' : '')), av = el('span', 'av'); if (window.ecAv) window.ecAv(av, x.look, x.name); else av.textContent = x.name[0];
    const nm = el('span', 'nm', x.name), t2 = window.ecTitle && window.ecTitle(x.look); if (t2) nm.appendChild(t2);
    row.append(el('span', 'rk', ['🥇', '🥈', '🥉'][x.rank - 1] || String(x.rank)), av, nm, el('span', 'sc', nf(x.best))); box.appendChild(row); });
  $('#lbMe').textContent = D.me && D.me.rank > 20 ? 'You: #' + D.me.rank + ' with ' + nf(D.me.best) : '';
}
document.querySelectorAll('#rangeTabs button').forEach(b => b.onclick = () => { lbRange = b.dataset.r; document.querySelectorAll('#rangeTabs button').forEach(x => x.classList.toggle('on', x === b)); drawBoard(); });
window.__pr = { get P() { return P; }, get C() { return C; }, get keys() { return keys; }, get running() { return running; }, snap() { updateCamera(0, true); }, sim(sec, k) { if (k) Object.assign(keys, k); for (let t = 0; t < sec && running; t += 1 / 120) step(1 / 120); return { s: P.s, v: P.v, air: P.air, score, combo, crash: P.crash, trick: $('#trick').textContent }; } }; // (for testing)

/* ================= start up ================= */
(async () => {
  const me = await api('/api/me'); if (me.status === 401) { location.replace('/?next=arcade'); return; }
  $('#loading').hidden = true; meName = me.ok ? me.data.username : 'You';
  const j = window.ecLive ? await window.ecLive() : null;
  if (j && j.study && j.study.study) { $('#closedBox').hidden = false; return; }
  if (!renderer) { $('#noGl').hidden = false; return; }
  if (matchMedia('(pointer:coarse)').matches) $('#stage').classList.add('coarse');
  $('#app').hidden = false; resize(); addEventListener('resize', resize);
  loadMap(MAPS[0]); rider = makeRider(jacketFor(meName)); scene.add(rider); ghostRider = makeRider(0x9fd8ff, true); ghostRider.visible = false; scene.add(ghostRider); resetRun(); updateCamera(0, true);
  drawMaps(); drawBoard(); requestAnimationFrame(loop); loadBoard();
})();
