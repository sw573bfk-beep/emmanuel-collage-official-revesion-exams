// ⚡ Neon Rush: an endless hoverboard runner through a neon city (just for fun: never touches points, study time or stats).
// Built for high frame rates: no shadow maps or post-processing; glowing materials, fog and reused objects instead.
import * as THREE from '/arcade/three.min.js?v=0170';
const $ = s => document.querySelector(s);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const api = async (p, m = 'GET', b) => { try { const r = await fetch(p, { method: m, credentials: 'same-origin', headers: b ? { 'content-type': 'application/json' } : {}, body: b ? JSON.stringify(b) : undefined }); let j = {}; try { j = await r.json(); } catch (e) { /* empty */ } return { ok: r.ok, status: r.status, data: j }; } catch (e) { return { ok: false, status: 0, data: {} }; } };
const nf = n => Math.round(n || 0).toLocaleString('en-AU');
const ls = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* blocked */ } };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t, R = Math.random;

/* ================= renderer, scene, camera ================= */
const cv = $('#cv'); let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(64, 16 / 9, 0.1, 1200);
const FOG = new THREE.Color(0x1a0838); scene.fog = new THREE.Fog(FOG, 60, 210);
let quality = ls('nr-q', matchMedia('(pointer:coarse)').matches ? 720 : 1080);
if (renderer) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1; }
function resize() { if (!renderer) return; const r = cv.getBoundingClientRect(); if (!r.width) return; renderer.setPixelRatio(clamp(quality / r.height, 0.5, 2.5)); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }

const ROAD = 4.3, XMAX = 3.75, ZONES = [-2.85, 0, 2.85], SPAWN_Z = -175, SPAN = 420;
const PINK = 0xff3fd8, CYAN = 0x20e3ff, GOLD = 0xffd23f, ORANGE = 0xff7a1a, RED = 0xff2850, VIOLET = 0x8a4dff;

function dotTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
const DOT = dotTex();
function windowsTex(hue) { // lit and dark windows on a dark wall
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 128, 256);
  for (let r = 0; r < 16; r++) for (let k = 0; k < 8; k++) { if (R() < 0.42) continue; const l = 40 + R() * 35; x.fillStyle = R() < 0.25 ? `hsl(${hue},90%,${l}%)` : `hsl(${40 + R() * 20},70%,${l * 0.8}%)`; x.globalAlpha = 0.35 + R() * 0.65; x.fillRect(k * 16 + 3, r * 16 + 4, 10, 8); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function stripesTex(a, b) { const c = document.createElement('canvas'); c.width = 128; c.height = 32; const x = c.getContext('2d'); x.fillStyle = a; x.fillRect(0, 0, 128, 32); x.fillStyle = b; for (let i = -32; i < 160; i += 32) { x.beginPath(); x.moveTo(i, 32); x.lineTo(i + 16, 32); x.lineTo(i + 32, 0); x.lineTo(i + 16, 0); x.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const glowMat = (color, op = 0.8) => new THREE.SpriteMaterial({ map: DOT, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
const basic = color => new THREE.MeshBasicMaterial({ color });
const lambert = (color, o = {}) => new THREE.MeshLambertMaterial({ color, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, emissiveMap: o.em || null, map: o.map || null, transparent: !!o.t, opacity: o.op ?? 1 });

/* ================= the city (built once, reused forever) ================= */
const world = new THREE.Group(); scene.add(world);
scene.add(new THREE.HemisphereLight(0x7a5cff, 0x1a0a2a, 1.4));
const key = new THREE.DirectionalLight(0xff9ad8, 1.2); key.position.set(-3, 8, 4); scene.add(key);
// sky: deep purple to a pink horizon, stars, and a big striped synth sun straight ahead
const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { t: { value: 0 } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }',
  fragmentShader: `uniform float t; varying vec3 vP; float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
    void main(){ float y = vP.y; vec3 c = mix(vec3(0.55,0.12,0.55), vec3(0.04,0.01,0.12), smoothstep(-0.02, 0.45, y));
      c = mix(c, vec3(1.0,0.35,0.55), smoothstep(0.12, -0.02, y) * 0.6);
      vec3 q = floor(vP * 380.0); c += vec3(step(0.996, h(q)) * smoothstep(0.08, 0.4, y)) * (0.6 + 0.4 * sin(t * 3.0 + h(q) * 40.0));
      vec2 d = vec2(atan(vP.x, -vP.z), y - 0.09); float r = length(d * vec2(1.0, 1.0));
      if (r < 0.16 && vP.z < 0.0) { float band = step(0.5, fract((y - 0.09) * 46.0 + t * 0.3)) + step(0.04, y - 0.02); vec3 sc = mix(vec3(1.0,0.2,0.55), vec3(1.0,0.85,0.25), smoothstep(-0.07, 0.15, y - 0.02));
        if (y > 0.04 || band > 0.5) c = mix(c, sc, smoothstep(0.16, 0.15, r)); }
      c += vec3(1.0,0.3,0.7) * exp(-r * 9.0) * 0.35 * step(vP.z, 0.0);
      gl_FragColor = vec4(c, 1.0); }` }));
sky.frustumCulled = false; scene.add(sky);
// road and the ground: dark glass with a glowing grid that scrolls past
const gridMat = (lineCol, base, cell, edge) => new THREE.ShaderMaterial({ transparent: false, uniforms: { off: { value: 0 }, line: { value: new THREE.Color(lineCol) }, base: { value: new THREE.Color(base) }, fogc: { value: FOG }, cell: { value: cell }, edge: { value: edge } },
  vertexShader: 'varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vec4 mv = viewMatrix * w; vD = -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: `uniform float off; uniform vec3 line; uniform vec3 base; uniform vec3 fogc; uniform float cell; uniform float edge; varying vec3 vW; varying float vD;
    void main(){ vec2 g = vec2(vW.x / cell, (vW.z - off) / cell); vec2 f = abs(fract(g) - 0.5); float l = smoothstep(0.47, 0.5, max(f.x, f.y));
      float e = edge > 0.0 ? smoothstep(edge - 0.18, edge, abs(vW.x)) : 0.0; vec3 c = base + line * (l * 0.85 + e * 1.6);
      gl_FragColor = vec4(mix(c, fogc, smoothstep(60.0, 205.0, vD)), 1.0); }` });
const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD * 2, 260), gridMat(CYAN, 0x0a0620, 2.85, ROAD)); road.rotation.x = -Math.PI / 2; road.position.z = -110; world.add(road);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), gridMat(PINK, 0x0b0418, 6, 0)); ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.02, -110); world.add(ground);
for (const s of [-1, 1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 260), basic(s < 0 ? PINK : CYAN)); rail.position.set(s * (ROAD + 0.1), 0.06, -110); world.add(rail); }
// buildings: dark towers with lit windows and neon signs, recycled from behind you to the far end
const WIN = [windowsTex(190), windowsTex(310), windowsTex(270), windowsTex(30)], buildings = [];
const signCols = [PINK, CYAN, GOLD, VIOLET, 0x3dff8b];
function makeBuilding(side, z) {
  const w = 6 + R() * 8, h = 14 + R() * 48, d = 8 + R() * 10, g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 8, uv.getY(i) * h / 16);
  const m = new THREE.Mesh(g, lambert(0x120d24, { e: 0xffffff, ei: 0.9, em: WIN[Math.floor(R() * WIN.length)] }));
  const grp = new THREE.Group(); grp.add(m); m.position.y = h / 2;
  const col = signCols[Math.floor(R() * signCols.length)], face = -side * (w / 2 + 0.06);
  if (R() < 0.75) { const sh = 2 + R() * 6, sw = 0.5 + R() * 0.8, sg = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), basic(col)); sg.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; sg.position.set(face, 4 + R() * (h - sh - 6) + sh / 2, (R() - 0.5) * d * 0.6); grp.add(sg);
    const gl = new THREE.Sprite(glowMat(col, 0.5)); gl.scale.set(sw * 5, sh * 1.6, 1); gl.position.copy(sg.position); gl.position.x += -side * 0.3; grp.add(gl); }
  const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.25, d + 0.2), basic(col)); trim.position.y = h; grp.add(trim);
  grp.position.set(side * (ROAD + 7 + w / 2 + R() * 6), 0, z); grp.userData = { d }; world.add(grp); buildings.push(grp); return d;
}
for (const side of [-1, 1]) { let z = 20; while (z > 20 - SPAN) { const d = makeBuilding(side, z - 6); z -= d + 2 + R() * 6; } }
// street lamps
const LAMPS = Math.round(SPAN / 24), LSPAN = LAMPS * 24, lamps = []; for (let i = 0; i < LAMPS; i++) for (const side of [-1, 1]) { const g = new THREE.Group(), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 5, 6), lambert(0x2a2340)); pole.position.y = 2.5; g.add(pole);
  const col = (i + (side > 0 ? 1 : 0)) % 2 ? CYAN : PINK, head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.3), basic(col)); head.position.set(-side * 0.5, 5, 0); g.add(head);
  const gl = new THREE.Sprite(glowMat(col, 0.6)); gl.scale.set(3.5, 3.5, 1); gl.position.copy(head.position); g.add(gl);
  g.position.set(side * (ROAD + 1.1), 0, 20 - i * 24); world.add(g); lamps.push(g); }
// a far skyline that never moves (it's part of the horizon)
for (let i = 0; i < 70; i++) { const w = 15 + R() * 30, h = 30 + R() * 140, m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 20), new THREE.MeshBasicMaterial({ color: 0x170a33, fog: false })); m.position.set((R() - 0.5) * 900, h / 2 - 5, -480 - R() * 120); scene.add(m);
  if (R() < 0.6) { const t = new THREE.Mesh(new THREE.BoxGeometry(w, 0.8, 20.5), new THREE.MeshBasicMaterial({ color: signCols[i % 5], fog: false })); t.position.set(m.position.x, h - 5, m.position.z); scene.add(t); } }
// flying traffic high above
const sky_cars = []; for (let i = 0; i < 14; i++) { const c = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 3.2), lambert(0x1c1636)), l = new THREE.Sprite(glowMat(i % 2 ? CYAN : PINK, 0.9)); l.scale.set(2.2, 1, 1); c.add(b, l);
  c.position.set((R() - 0.5) * 40, 16 + R() * 20, -R() * 300); c.userData.v = 10 + R() * 25; scene.add(c); sky_cars.push(c); }
// speed lines
const SL = 70, slMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const speedLines = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 0.025, 5), slMat, SL); speedLines.frustumCulled = false; scene.add(speedLines); const slPos = [];
for (let i = 0; i < SL; i++) slPos.push(new THREE.Vector3((R() < 0.5 ? -1 : 1) * (2.5 + R() * 6), 0.4 + R() * 6, -R() * 80));

/* ================= the hoverboard rider ================= */
const player = new THREE.Group(); scene.add(player);
const jacket = new THREE.Color().setHSL(R(), 0.8, 0.55).getHex();
const board = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 1.5), lambert(0x15112a, { e: CYAN, ei: 0.25 })); board.position.y = 0.32;
const boardEdge = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 1.56), basic(CYAN)); boardEdge.position.y = 0.27;
const under = new THREE.Sprite(glowMat(CYAN, 0.9)); under.scale.set(1.8, 2.6, 1); under.position.y = 0.12;
const body = new THREE.Group(); body.position.y = 0.37;
const pants = lambert(0x221c3a), jac = lambert(jacket, { e: jacket, ei: 0.15 });
const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.45, 4, 8), pants); legL.position.set(0, 0.32, 0.22); legL.rotation.x = -0.2;
const legR = legL.clone(); legR.position.z = -0.22; legR.rotation.x = 0.2;
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.38, 6, 10), jac); torso.position.y = 0.95;
const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.45, 4, 8), jac); arm.position.set(0, 0.98, -0.34); arm.rotation.x = 1.0; const arm2 = arm.clone(); arm2.position.z = 0.34; arm2.rotation.x = -1.0;
const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), lambert(0xffffff)); head.position.y = 1.4;
const visor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.3), basic(PINK)); visor.position.set(0.17, 1.42, 0);
body.add(legL, legR, torso, arm, arm2, head, visor); body.rotation.y = -Math.PI / 2 + 0.35;
const shieldBall = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 16), new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })); shieldBall.position.y = 0.9; shieldBall.visible = false;
const blob = new THREE.Mesh(new THREE.CircleGeometry(0.7, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.position.y = 0.02; scene.add(blob);
player.add(under, board, boardEdge, body, shieldBall);
// light trail behind the board, and a pool of sparks
const TR = 90, trailPos = new Float32Array(TR * 3), trailAl = new Float32Array(TR); const trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3)); trailGeo.setAttribute('alpha', new THREE.BufferAttribute(trailAl, 1));
const ptsMat = (color, size) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { map: { value: DOT }, color: { value: new THREE.Color(color) }, size: { value: size } },
  vertexShader: 'attribute float alpha; varying float vA; uniform float size; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * 300.0 / -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform sampler2D map; uniform vec3 color; varying float vA; void main(){ gl_FragColor = vec4(color, texture2D(map, gl_PointCoord).a * vA); }' });
const trail = new THREE.Points(trailGeo, ptsMat(CYAN, 0.55)); trail.frustumCulled = false; scene.add(trail); let trailI = 0;
const SP = 400, spPos = new Float32Array(SP * 3), spVel = new Float32Array(SP * 3), spLife = new Float32Array(SP), spAl = new Float32Array(SP); let spI = 0;
const spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3)); spGeo.setAttribute('alpha', new THREE.BufferAttribute(spAl, 1));
const sparks = new THREE.Points(spGeo, ptsMat(0xffe7a0, 0.35)); sparks.frustumCulled = false; scene.add(sparks);
function burst(x, y, z, n, spd) { for (let i = 0; i < n; i++) { const k = spI; spI = (spI + 1) % SP; spPos[k * 3] = x; spPos[k * 3 + 1] = y; spPos[k * 3 + 2] = z; const a = R() * 6.28, b = R() * 3.14; spVel[k * 3] = Math.cos(a) * Math.sin(b) * spd; spVel[k * 3 + 1] = Math.abs(Math.cos(b)) * spd; spVel[k * 3 + 2] = Math.sin(a) * Math.sin(b) * spd; spLife[k] = 0.5 + R() * 0.5; } }

/* ================= obstacles, coins and power-ups (pooled) ================= */
const barrierTex = stripesTex('#ff7a1a', '#1a0a00'), pools = {}, active = [];
function makeObs(type) {
  const g = new THREE.Group(); let box;
  if (type === 'barrier') { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.85, 0.45), lambert(0xffffff, { map: barrierTex, e: ORANGE, ei: 0.35 })); m.position.y = 0.425; const top = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.5), basic(ORANGE)); top.position.y = 0.88; g.add(m, top); box = { w: 1, h: 0.85, d: 0.45, y: 0 }; }
  else if (type === 'laser') { const beam = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.1), basic(RED)); beam.position.y = 1.12; const gl = new THREE.Sprite(glowMat(RED, 0.8)); gl.scale.set(1, 0.9, 1); gl.position.y = 1.12; g.add(beam, gl); g.userData.glow = gl; box = { w: 1, h: 0.3, d: 0.2, y: 0.98 }; }
  else if (type === 'block') { const h = 2.6, m = new THREE.Mesh(new THREE.BoxGeometry(2.5, h, 2.5), lambert(0x241a44, { e: VIOLET, ei: 0.12 })); m.position.y = h / 2; const ed = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.08, 2.58), basic(PINK)); ed.position.y = h; const ed2 = ed.clone(); ed2.position.y = 0.05; const mid = new THREE.Mesh(new THREE.BoxGeometry(2.56, 0.05, 2.56), basic(CYAN)); mid.position.y = h * 0.5; g.add(m, ed, ed2, mid); box = { w: 2.5, h, d: 2.5, y: 0 }; }
  else if (type === 'car') { const m = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 4.0), lambert(0x161030, { e: 0x3a1a60, ei: 0.4 })); m.position.y = 0.75; const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 2.2), lambert(0x0c0820)); top.position.set(0, 1.5, 0.2);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.08, 4.04), basic(CYAN)); stripe.position.y = 0.55; g.add(m, top, stripe);
    for (const s of [-0.7, 0.7]) { const hl = new THREE.Sprite(glowMat(0xfff4d0, 1)); hl.scale.set(1.4, 1.4, 1); hl.position.set(s, 0.8, 2.05); g.add(hl); } box = { w: 2.2, h: 1.8, d: 4, y: 0 }; }
  else if (type === 'drone') { const m = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 1.0), lambert(0x1a1430)); m.position.y = 1.3; const eye = new THREE.Sprite(glowMat(RED, 1)); eye.scale.set(1, 1, 1); eye.position.set(0, 1.3, 0.55);
    const rot = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.03, 0.12), basic(0xffffff)); rot.position.y = 1.5; g.add(m, eye, rot); g.userData.rot = rot; box = { w: 1.4, h: 0.6, d: 1.0, y: 1.02 }; }
  scene.add(g); return { type, g, box: { ...box }, x: 0, z: 0, vx: 0, vz: 0, w: box.w };
}
function getObs(type) { const p = pools[type] || (pools[type] = []); const o = p.pop() || makeObs(type); o.g.visible = true; o.smashed = false; o.vx = 0; o.vz = 0; o.g.scale.set(1, 1, 1); o.g.rotation.set(0, 0, 0); active.push(o); return o; }
function freeObs(o) { o.g.visible = false; (pools[o.type] || (pools[o.type] = [])).push(o); }
function place(type, x, z, w) { const o = getObs(type); o.x = x; o.z = z; o.g.position.set(x, 0, z); if (w) { o.box.w = w; o.g.scale.x = w; } else { o.box.w = o.w; } return o; }
// coins: one instanced mesh
const NC = 320, coinMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.32, 0.32, 0.07, 18), new THREE.MeshLambertMaterial({ color: GOLD, emissive: 0xffa800, emissiveIntensity: 0.7 }), NC); coinMesh.frustumCulled = false; scene.add(coinMesh);
const coins = []; for (let i = 0; i < NC; i++) coins.push({ on: false, x: 0, y: 0, z: 0 }); let coinI = 0; const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3(1, 1, 1), E = new THREE.Euler();
function addCoin(x, y, z) { for (let t = 0; t < NC; t++) { const c = coins[coinI]; coinI = (coinI + 1) % NC; if (!c.on) { c.on = true; c.x = x; c.y = y; c.z = z; return; } } }
// power-ups
const PU = { magnet: { col: 0xff4d6d, icon: '🧲', name: 'Magnet', time: 10 }, shield: { col: CYAN, icon: '🛡️', name: 'Shield', time: 0 }, boost: { col: GOLD, icon: '⚡', name: 'Boost', time: 5 } };
const pupItems = []; function makePup(kind) { const g = new THREE.Group(), core = new THREE.Mesh(kind === 'shield' ? new THREE.IcosahedronGeometry(0.42, 0) : kind === 'magnet' ? new THREE.TorusGeometry(0.34, 0.12, 8, 16, Math.PI) : new THREE.OctahedronGeometry(0.42, 0), basic(PU[kind].col));
  const gl = new THREE.Sprite(glowMat(PU[kind].col, 0.9)); gl.scale.set(2.4, 2.4, 1); g.add(core, gl); g.userData = { core }; scene.add(g); return { kind, g, x: 0, z: 0, on: false }; }
function addPup(kind, x, z) { let it = pupItems.find(p => !p.on && p.kind === kind); if (!it) { it = makePup(kind); pupItems.push(it); } it.on = true; it.x = x; it.z = z; it.g.visible = true; }

/* ================= the run ================= */
const S = { running: false, paused: false, dead: false, t: 0, dist: 0, sd: 0, coins: 0, bonus: 0, v: 15, x: 0, vx: 0, y: 0, vy: 0, slide: 0, inv: 0, shield: false, magnet: 0, boost: 0, nextSpawn: 0, nextPup: 450, freeZ: 1, deathT: 0, lastMark: 0, shake: 0, jumpBuf: 0, slow: 1 };
let keys = {}, token = null, best = 0;
function resetRun() {
  for (const o of active.splice(0)) freeObs(o); coins.forEach(c => { c.on = false; }); pupItems.forEach(p => { p.on = false; p.g.visible = false; });
  Object.assign(S, { running: true, paused: false, dead: false, t: 0, dist: 0, sd: 0, coins: 0, bonus: 0, v: 15, x: 0, vx: 0, y: 0, vy: 0, slide: 0, inv: 0, shield: false, magnet: 0, boost: 0, nextSpawn: -60, nextPup: 450 + R() * 200, freeZ: 1, deathT: 0, lastMark: 0, shake: 0, jumpBuf: 0, slow: 1 });
  keys = {}; trailAl.fill(0); spLife.fill(0);
  for (let z = -60; z > SPAWN_Z; z -= 12) { addCoin(ZONES[1], 0.9, z); } // a line of coins to get you started
  S.nextSpawn = 140; // metres until the first obstacles
}
const speedAt = t => 15 + 57 * (1 - Math.exp(-t / 95)); // m/s: starts calm, keeps building
function toast(t, col) { const e = $('#toast'); e.textContent = t; e.style.color = col || '#fff'; e.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('show'), 1100); }
// ✨ one row of obstacles, always with a way through
function spawnRow(z) {
  const d = clamp((S.v - 15) / 57, 0, 1), roll = R(), prev = S.freeZ;
  let fz = clamp(prev + (R() < 0.5 ? -1 : 1) * (R() < 0.7 ? 1 : 0), 0, 2); if (d < 0.2 && R() < 0.5) fz = prev; S.freeZ = fz;
  const coinLine = (zi, n, y) => { for (let i = 0; i < n; i++) addCoin(ZONES[zi], y ?? 0.9, z + 6 - i * 3.2); };
  const others = [0, 1, 2].filter(i => i !== fz);
  if (roll < 0.2) { // 🟧 jump it
    place('barrier', 0, z, ROAD * 2 - 0.4); for (let i = -3; i <= 3; i++) addCoin(ZONES[fz], 0.9 + 1.0 * Math.cos(i / 3 * 1.4), z - i * 2.2);
  } else if (roll < 0.36 && d > 0.05) { // 🔴 slide under it
    const L = place('laser', 0, z, ROAD * 2 - 0.2); L.g.userData.glow.scale.x = ROAD * 2; coinLine(fz, 5, 0.45);
  } else if (roll < 0.62) { // ▣ blocks with a gap
    const n = d < 0.15 && R() < 0.6 ? 1 : 2; others.slice(0, n).forEach(i => place('block', ZONES[i], z)); if (n === 1) place('block', ZONES[others[1]], z - 26 - R() * 10); coinLine(fz, 5);
  } else if (roll < 0.74 && d > 0.12) { // 🚗 oncoming cars
    others.forEach((i, k) => { if (k === 0 || d > 0.4) { const c = place('car', ZONES[i], z - 30); c.vz = 12 + d * 10; } }); coinLine(fz, 4);
  } else if (roll < 0.84 && d > 0.22) { // 🛸 a drone sweeping across: slide under it or dodge it
    const dr = place('drone', (R() < 0.5 ? -1 : 1) * 3, z); dr.vx = (dr.x > 0 ? -1 : 1) * (3 + d * 4); if (d > 0.5) place('barrier', 0, z - 22, ROAD * 2 - 0.4);
  } else if (roll < 0.93 && d > 0.3) { // a gate: blocks on both sides, a laser in the middle
    place('block', ZONES[0], z); place('block', ZONES[2], z); const L = place('laser', 0, z, 2.6); L.g.userData.glow.scale.x = 2.6; coinLine(1, 4, 0.45); S.freeZ = 1;
  } else { // mixed: a block, and a barrier to jump next to it
    place('block', ZONES[others[0]], z); place('barrier', ZONES[others[1]], z, 2.6); coinLine(fz, 5);
  }
}
function hitTest(o) {
  const ph = S.slide > 0 ? 0.62 : 1.65, b = o.box, hw = b.w / 2 + 0.3;
  return Math.abs(o.x - S.x) < hw && Math.abs(o.z) < b.d / 2 + 0.35 && S.y < b.y + b.h && S.y + ph > b.y;
}
function smash(o) { o.smashed = true; burst(o.x, 1, o.z, 40, 9); o.g.visible = false; S.bonus += 50; }
function die() { if (S.dead) return; S.dead = true; S.deathT = 0; S.shake = 0.6; burst(S.x, 1, 0, 90, 11); const f = $('#flash'); f.style.opacity = 0.7; setTimeout(() => { f.style.opacity = 0; }, 90); }
function step(dt) {
  if (S.dead) { S.deathT += dt; S.v *= Math.exp(-dt * 6); if (S.deathT > 0.9 && S.running) endRun(); }
  else {
    S.t += dt; S.v = speedAt(S.t) * (S.boost > 0 ? 1.4 : 1);
    const steer = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), lat = 9 + S.v * 0.075;
    S.vx += clamp(steer * lat - S.vx, -70 * dt, 70 * dt); S.x += S.vx * dt; if (Math.abs(S.x) > XMAX) { S.x = Math.sign(S.x) * XMAX; S.vx = 0; }
    // jump, slide, fall
    if (S.jumpBuf > 0) S.jumpBuf -= dt;
    if (S.y <= 0 && S.jumpBuf > 0) { S.vy = 10.5; S.y = 0.001; S.slide = 0; S.jumpBuf = 0; burst(S.x, 0.2, 0.4, 10, 3); }
    if (S.y > 0 || S.vy > 0) { S.vy -= (S.vy > 0 ? 34 : 40) * dt; S.y += S.vy * dt; if (S.y <= 0) { S.y = 0; S.vy = 0; burst(S.x, 0.1, 0.3, 8, 2.5); } }
    if (S.slide > 0) S.slide -= dt;
    S.dist += S.v * dt; S.sd += S.v * dt * (S.boost > 0 ? 2 : 1);
    if (S.inv > 0) S.inv -= dt; if (S.magnet > 0) S.magnet -= dt; if (S.boost > 0) { S.boost -= dt; if (S.boost <= 0) S.inv = 1; }
    const mark = Math.floor(S.dist / 1000); if (mark > S.lastMark) { S.lastMark = mark; toast('🚀 ' + nf(mark * 1000) + ' m!', '#7df9ff'); }
  }
  const move = S.v * dt;
  // spawn ahead
  S.nextSpawn -= move; if (!S.dead && S.nextSpawn <= 0) { spawnRow(SPAWN_Z); const d = clamp((S.v - 15) / 57, 0, 1); S.nextSpawn = Math.max(16, S.v * lerp(1.3, 0.62, d)); }
  S.nextPup -= move; if (!S.dead && S.nextPup <= 0) { S.nextPup = 520 + R() * 380; const kinds = Object.keys(PU); addPup(kinds[Math.floor(R() * kinds.length)], ZONES[S.freeZ], SPAWN_Z + 30); }
  // move the world toward you
  for (let i = active.length - 1; i >= 0; i--) { const o = active[i]; o.z += move + o.vz * dt; o.x += o.vx * dt; if (o.type === 'drone' && Math.abs(o.x) > 3.4) { o.x = Math.sign(o.x) * 3.4; o.vx *= -1; }
    o.g.position.set(o.x, 0, o.z); if (o.g.userData.rot) o.g.userData.rot.rotation.y += dt * 30;
    if (o.z > 12) { active.splice(i, 1); freeObs(o); continue; }
    if (!S.dead && !o.smashed && Math.abs(o.z) < 3 && hitTest(o)) { if (S.boost > 0) smash(o); else if (S.inv > 0) { /* still flashing after a hit */ } else if (S.shield) { S.shield = false; S.inv = 1.2; smash(o); toast('🛡️ Shield saved you!', '#7df9ff'); } else die(); } }
  for (const c of coins) if (c.on) { c.z += move; if (S.magnet > 0 && c.z > -30 && c.z < 2) { c.x += (S.x - c.x) * Math.min(1, dt * 9); c.y += (S.y + 0.9 - c.y) * Math.min(1, dt * 9); c.z += (0 - c.z) * Math.min(1, dt * 5); }
    if (!S.dead && Math.abs(c.z) < 0.8 && Math.abs(c.x - S.x) < 0.75 && c.y > S.y - 0.3 && c.y < S.y + 1.9) { c.on = false; S.coins++; S.bonus += S.boost > 0 ? 10 : 0; burst(c.x, c.y, c.z, 6, 3); }
    else if (c.z > 8) c.on = false; }
  for (const p of pupItems) if (p.on) { p.z += move; p.g.position.set(p.x, 1.1 + Math.sin(S.t * 4) * 0.15, p.z); p.g.userData.core.rotation.y += dt * 3;
    if (!S.dead && Math.abs(p.z) < 1 && Math.abs(p.x - S.x) < 1) { p.on = false; p.g.visible = false; const P = PU[p.kind]; if (p.kind === 'shield') S.shield = true; else S[p.kind] = P.time; toast(P.icon + ' ' + P.name + '!', '#' + P.col.toString(16).padStart(6, '0')); burst(p.x, 1.1, 0, 30, 6); }
    else if (p.z > 8) { p.on = false; p.g.visible = false; } }
  // recycle the city
  for (const b of buildings) { b.position.z += move; if (b.position.z - b.userData.d / 2 > 30) b.position.z -= SPAN; }
  for (const l of lamps) { l.position.z += move; if (l.position.z > 24) l.position.z -= LSPAN; }
  road.material.uniforms.off.value -= move; ground.material.uniforms.off.value -= move;
}
function score() { return Math.floor(S.sd) + S.coins * 10 + S.bonus; }
async function endRun() {
  S.running = false; const sc = score(); hud();
  const res = $('#endRes'); res.replaceChildren(); [['Distance', nf(S.dist) + ' m'], ['Coins', '🪙 ' + nf(S.coins) + ' × 10'], ['Boost and smash bonus', nf(Math.floor(S.sd - S.dist) + S.bonus)], ['Top speed', nf(speedAt(S.t) * 3.6) + ' km/h']].forEach(([a, b]) => res.append(el('span', '', a), el('b', '', b)));
  res.append(el('span', 'tot', 'Score'), el('span', 'tot', nf(sc)));
  $('#newBest').hidden = !(sc > best); $('#endRank').textContent = token ? 'Saving…' : 'Not saved (no connection).'; $('#endOv').hidden = false; $('#againBtn').focus();
  if (token) { const r = await api('/api/arcade/finish', 'POST', { token, score: sc }); token = null;
    if (r.ok) { if (r.data.saved && sc > best) best = sc; const d = r.data.today, w = r.data.week; $('#endRank').textContent = r.data.saved ? (d ? 'You’re #' + d.rank + ' today' + (w ? ' · #' + w.rank + ' this week' : '') : 'Saved!') : 'That run couldn’t be saved.'; loadBoard(); }
    else $('#endRank').textContent = r.data.error || 'Couldn’t save that run.'; }
}

/* ================= drawing ================= */
const camPos = new THREE.Vector3(0, 3, 6.5), camLook = new THREE.Vector3(0, 1.2, -10);
function hud() {
  $('#hScore').textContent = nf(score()); $('#hDist').textContent = nf(S.dist) + ' m'; $('#hCoins').textContent = '🪙 ' + nf(S.coins); $('#hSpd').textContent = nf(S.v * 3.6);
  const box = $('#pups'); box.replaceChildren();
  for (const [k, P] of Object.entries(PU)) { const left = k === 'shield' ? (S.shield ? 1 : 0) : clamp(S[k] / P.time, 0, 1); if (!left) continue; const row = el('div', 'pup'); row.style.color = '#' + P.col.toString(16).padStart(6, '0'); const bar = el('i'), f = el('b'); f.style.width = (left * 100) + '%'; bar.appendChild(f); row.append(el('span', '', P.icon), bar); box.appendChild(row); }
}
let tPrev = 0, tAll = 0, lastHud = 0;
function frame(ts) {
  requestAnimationFrame(frame); if (!renderer) return;
  let dt = Math.min(0.05, (ts - (tPrev || ts)) / 1000); tPrev = ts; tAll += dt;
  if (S.running && !S.paused) { const n = Math.ceil(dt / (1 / 120)); for (let i = 0; i < n; i++) step(dt / n); }
  else if (!S.running && !S.dead) { const m = 14 * dt; road.material.uniforms.off.value -= m; ground.material.uniforms.off.value -= m; for (const b of buildings) { b.position.z += m; if (b.position.z - b.userData.d / 2 > 30) b.position.z -= SPAN; } for (const l of lamps) { l.position.z += m; if (l.position.z > 24) l.position.z -= LSPAN; } } // gently cruise behind the menu
  // the rider
  const sl = S.slide > 0 ? 1 : 0, bob = S.y > 0 ? 0 : Math.sin(tAll * 7) * 0.04;
  player.position.set(S.x, S.y + 0.15 + bob, 0); player.rotation.z = -S.vx * 0.035; player.rotation.y = -S.vx * 0.02;
  body.scale.y += ((sl ? 0.55 : 1) - body.scale.y) * Math.min(1, dt * 18); body.rotation.z = S.y > 0 ? Math.min(0.5, S.vy * -0.03) : 0;
  player.visible = !(S.inv > 0 && !S.boost && Math.floor(tAll * 14) % 2 === 0) && !(S.dead && S.deathT > 0.05);
  shieldBall.visible = S.shield || S.boost > 0; shieldBall.material.color.set(S.boost > 0 ? GOLD : CYAN); shieldBall.scale.setScalar(1 + Math.sin(tAll * 8) * 0.04);
  under.material.color.set(S.boost > 0 ? GOLD : CYAN); blob.position.set(S.x, 0.02, 0); blob.scale.setScalar(Math.max(0.3, 1 - S.y * 0.25));
  // trail and sparks
  trailI = (trailI + 1) % TR; trailPos[trailI * 3] = S.x + (R() - 0.5) * 0.2; trailPos[trailI * 3 + 1] = S.y + 0.2; trailPos[trailI * 3 + 2] = 0.8; for (let i = 0; i < TR; i++) { trailPos[i * 3 + 2] += S.v * dt * 0.9; trailAl[i] = Math.max(0, trailAl[i] - dt * 2.4); } trailAl[trailI] = S.dead ? 0 : 0.85;
  trailGeo.attributes.position.needsUpdate = true; trailGeo.attributes.alpha.needsUpdate = true; trail.material.uniforms.color.value.set(S.boost > 0 ? GOLD : CYAN);
  for (let i = 0; i < SP; i++) { if (spLife[i] > 0) { spLife[i] -= dt; spVel[i * 3 + 1] -= 18 * dt; spPos[i * 3] += spVel[i * 3] * dt; spPos[i * 3 + 1] += spVel[i * 3 + 1] * dt; spPos[i * 3 + 2] += spVel[i * 3 + 2] * dt + (S.running ? S.v * dt : 0); spAl[i] = clamp(spLife[i] * 2, 0, 1); } else spAl[i] = 0; }
  spGeo.attributes.position.needsUpdate = true; spGeo.attributes.alpha.needsUpdate = true;
  // coins (spinning)
  let k = 0; for (const c of coins) { if (!c.on) continue; E.set(Math.PI / 2, 0, tAll * 4 + c.z * 0.1); Q.setFromEuler(E); M4.compose(V.set(c.x, c.y, c.z), Q, SC); coinMesh.setMatrixAt(k++, M4); } coinMesh.count = k; coinMesh.instanceMatrix.needsUpdate = true;
  for (const o of active) if (o.type === 'laser') o.g.userData.glow.material.opacity = 0.55 + Math.sin(tAll * 20) * 0.25;
  // speed lines
  slMat.opacity = clamp((S.v - 28) / 45, 0, 0.55) * (S.running ? 1 : 0); for (let i = 0; i < SL; i++) { const p = slPos[i]; p.z += S.v * dt * 1.6; if (p.z > 8) { p.z -= 80; p.x = (R() < 0.5 ? -1 : 1) * (2.5 + R() * 6); p.y = 0.4 + R() * 6; } M4.makeTranslation(p.x + S.x * 0.5, p.y, p.z); speedLines.setMatrixAt(i, M4); } speedLines.instanceMatrix.needsUpdate = true;
  for (const c of sky_cars) { c.position.z += c.userData.v * dt + (S.running ? S.v * dt * 0.15 : 0); if (c.position.z > 20) c.position.z -= 320; }
  // camera: follows behind, leans into turns, widens with speed, shakes on a crash
  const fov = 62 + clamp((S.v - 15) / 57, 0, 1) * 20 + (S.boost > 0 ? 6 : 0);
  camPos.lerp(V.set(S.x * 0.55, 2.7 + S.y * 0.45, 6.2), 1 - Math.exp(-dt * 9)); camLook.lerp(new THREE.Vector3(S.x * 0.75, 1.1 + S.y * 0.3, -12), 1 - Math.exp(-dt * 12));
  camera.position.copy(camPos); if (S.shake > 0) { S.shake -= dt; camera.position.x += (R() - 0.5) * S.shake; camera.position.y += (R() - 0.5) * S.shake; }
  camera.lookAt(camLook); camera.rotation.z += -S.vx * 0.006; if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
  sky.material.uniforms.t.value = tAll; sky.position.copy(camera.position);
  if (S.running && ts - lastHud > 90) { lastHud = ts; hud(); }
  renderer.render(scene, camera);
}

/* ================= controls, menus, leaderboard ================= */
async function start() {
  $('#startOv').hidden = true; $('#endOv').hidden = true; $('#pauseOv').hidden = true; $('#hud').hidden = false;
  resetRun(); hud(); cv.focus({ preventScroll: true }); $('#stage').scrollIntoView({ behavior: 'smooth', block: 'center' });
  token = null; const r = await api('/api/arcade/start', 'POST', { game: 'neon' }); if (r.status === 401) { location.replace('/?next=arcade'); return; } token = r.ok ? r.data.token : null;
}
function pause() { if (!S.running || S.dead) return; S.paused = true; keys = {}; $('#pauseOv').hidden = false; }
function resume() { S.paused = false; tPrev = 0; $('#pauseOv').hidden = true; cv.focus({ preventScroll: true }); }
const K = { a: 'left', A: 'left', ArrowLeft: 'left', d: 'right', D: 'right', ArrowRight: 'right', w: 'up', W: 'up', ArrowUp: 'up', ' ': 'up', s: 'down', S: 'down', ArrowDown: 'down' };
function press(k) { if (!S.running || S.paused || S.dead) return; if (k === 'up') S.jumpBuf = 0.15; else if (k === 'down') { if (S.y > 0) S.vy = Math.min(S.vy, -22); S.slide = 0.8; } }
addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input,textarea,select')) return;
  if ((e.key === ' ' || e.key === 'Enter') && (!$('#endOv').hidden || !$('#startOv').hidden) && !$('#app').hidden) { e.preventDefault(); start(); return; }
  const k = K[e.key]; if (k && S.running) { e.preventDefault(); if (!e.repeat && !keys[k]) press(k); keys[k] = true; }
  if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && S.running) { e.preventDefault(); S.paused ? resume() : pause(); }
});
addEventListener('keyup', e => { const k = K[e.key]; if (k) keys[k] = false; });
addEventListener('blur', () => { keys = {}; }); document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
document.querySelectorAll('.pad button').forEach(b => { const k = b.dataset.k; b.addEventListener('pointerdown', e => { e.preventDefault(); keys[k] = true; press(k); }); const off = () => { keys[k] = false; }; b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); });
// phones: swipe up to jump, down to slide anywhere on the game
let sw = null; $('#stage').addEventListener('pointerdown', e => { if (e.target.closest('.pad,.over,button')) return; sw = { y: e.clientY, x: e.clientX }; });
$('#stage').addEventListener('pointerup', e => { if (!sw) return; const dy = e.clientY - sw.y; if (Math.abs(dy) > 30) press(dy < 0 ? 'up' : 'down'); sw = null; });
$('#playBtn').onclick = start; $('#againBtn').onclick = start; $('#resumeBtn').onclick = resume; $('#quitBtn').onclick = start; $('#pauseBtn').onclick = pause;
$('#fsBtn').onclick = () => { const s = $('#stage'); if (document.fullscreenElement) document.exitFullscreen(); else if (s.requestFullscreen) s.requestFullscreen().catch(() => {}); };
document.addEventListener('fullscreenchange', () => setTimeout(resize, 50));
document.querySelectorAll('#qSeg button').forEach(b => { b.classList.toggle('on', +b.dataset.q === quality); b.onclick = () => { quality = +b.dataset.q; lset('nr-q', quality); document.querySelectorAll('#qSeg button').forEach(x => x.classList.toggle('on', x === b)); resize(); }; });
let B = null, range = 'today';
async function loadBoard() { const r = await api('/api/arcade/board?game=neon'); if (!r.ok) return; B = r.data; if (B.today.me) best = Math.max(best, B.today.me.best); drawBoard(); $('#bestLine').textContent = best ? 'Your best today: ' + nf(best) : (B.today.top[0] ? '🥇 Today’s best: ' + B.today.top[0].name + ' with ' + nf(B.today.top[0].best) : 'Nobody has run today yet. Be the first!'); }
function drawBoard() {
  const box = $('#lb'); box.replaceChildren(); const D = B && B[range]; if (!D) return;
  if (!D.top.length) box.appendChild(el('p', 'small muted', range === 'today' ? 'Nobody has run today yet. Be the first!' : 'Nobody has run this week yet.'));
  D.top.forEach(x => { const row = el('div', 'row' + (x.me ? ' me' : '')), av = el('span', 'av'); if (window.ecAv) window.ecAv(av, x.look, x.name); else av.textContent = x.name[0];
    const nm = el('span', 'nm', x.name), tt = window.ecTitle && window.ecTitle(x.look); if (tt) nm.appendChild(tt);
    row.append(el('span', 'rk', ['🥇', '🥈', '🥉'][x.rank - 1] || String(x.rank)), av, nm, el('span', 'sc', nf(x.best))); box.appendChild(row); });
  $('#lbMe').textContent = D.me && D.me.rank > 20 ? 'You: #' + D.me.rank + ' with ' + nf(D.me.best) : '';
}
document.querySelectorAll('#rangeTabs button').forEach(b => b.onclick = () => { range = b.dataset.r; document.querySelectorAll('#rangeTabs button').forEach(x => x.classList.toggle('on', x === b)); drawBoard(); });
window.__nr = { S, get keys() { return keys; }, press, sim(sec, k) { if (k) Object.assign(keys, k); for (let t = 0; t < sec && S.running; t += 1 / 120) step(1 / 120); return { t: S.t, v: S.v, dist: S.dist, dead: S.dead, coins: S.coins, score: score(), active: active.length }; } }; // (for testing)

(async () => {
  const me = await api('/api/me'); if (me.status === 401) { location.replace('/?next=arcade'); return; }
  $('#loading').hidden = true;
  const j = window.ecLive ? await window.ecLive() : null;
  if (j && j.study && j.study.study) { $('#closedBox').hidden = false; return; }
  if (!renderer) { $('#noGl').hidden = false; return; }
  if (matchMedia('(pointer:coarse)').matches) $('#stage').classList.add('coarse');
  if (me.ok && j && j.me && j.me.look && j.me.look.a) { /* (your picture shows on the leaderboard) */ }
  $('#app').hidden = false; resize(); addEventListener('resize', resize); requestAnimationFrame(frame); loadBoard();
})();
