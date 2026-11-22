// ⚡ Neon Rush: an endless hoverboard run inside a 360° tunnel (just for fun: never touches points, study time or stats).
// Ride all the way round the tube; the camera rolls with you so you always feel upright. S teleports you to the
// opposite side. Three worlds (Retro, Woods, Basic) change the look only. Built for high frame rates: one shader
// draws the whole tunnel wall, and everything else is reused (no shadow maps, no post-processing).
import * as THREE from '/arcade/three.min.js?v=0170';
const $ = s => document.querySelector(s);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const api = async (p, m = 'GET', b) => { try { const r = await fetch(p, { method: m, credentials: 'same-origin', headers: b ? { 'content-type': 'application/json' } : {}, body: b ? JSON.stringify(b) : undefined }); let j = {}; try { j = await r.json(); } catch (e) { /* empty */ } return { ok: r.ok, status: r.status, data: j }; } catch (e) { return { ok: false, status: 0, data: {} }; } };
const nf = n => Math.round(n || 0).toLocaleString('en-AU');
const ls = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* blocked */ } };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t, R0 = Math.random, TAU = Math.PI * 2;
const angDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };

/* ================= renderer, scene, camera ================= */
const cv = $('#cv'); let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.05, 900);
let quality = ls('nr-q', matchMedia('(pointer:coarse)').matches ? 720 : 1080), view = ls('nr-view', 'third');
if (renderer) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1; }
function resize() { if (!renderer) return; const r = cv.getBoundingClientRect(); if (!r.width) return; renderer.setPixelRatio(clamp(quality / r.height, 0.5, 2.5)); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }

const RAD = 6, LEN = 280, SPAWN_Z = -170;
const outward = th => new THREE.Vector3(Math.sin(th), -Math.cos(th), 0); // from the tube's centre to the wall
const onWall = (th, h, z, v = new THREE.Vector3()) => v.set(Math.sin(th) * (RAD - h), -Math.cos(th) * (RAD - h), z); // h = height above the wall

function dotTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
const DOT = dotTex();
const glowMat = (color, op = 0.8) => new THREE.SpriteMaterial({ map: DOT, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
const basic = color => new THREE.MeshBasicMaterial({ color });
const lambert = (color, o = {}) => new THREE.MeshLambertMaterial({ color, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1 });

/* ================= the three worlds (looks only) ================= */
const WORLDS = {
  retro: { name: 'Retro', desc: 'Neon grid and a synth sun', card: 'linear-gradient(160deg,#12002a,#ff3fd8 70%,#ffd23f)', fog: 0x14052e, hemi: [0x9a7aff, 0x1a0a2a, 1.4], end: 0xff5fa8,
    pal: { block: 0x241a44, blockE: 0x8a4dff, edge: 0xff3fd8, edge2: 0x20e3ff, barrier: 0xff7a1a, gate: 0x1b1238, gateE: 0x20e3ff, pod: 0x161030, podE: 0x20e3ff, spin: 0xffd23f, trail: 0x20e3ff } },
  woods: { name: 'Woods', desc: 'A glowing forest tunnel at dusk', card: 'linear-gradient(160deg,#0d2010,#3d7a2e 60%,#ffcf6b)', fog: 0x0e1a0c, hemi: [0xd8f0a0, 0x1a120a, 1.5], end: 0xffc46b,
    pal: { block: 0x3b2a1c, blockE: 0x6b4a2a, edge: 0x9cff5a, edge2: 0xffcf6b, barrier: 0x6b3f1e, gate: 0x2a1c10, gateE: 0x9cff5a, pod: 0x2b3a1a, podE: 0xffcf6b, spin: 0xffcf6b, trail: 0xbfff7a } },
  basic: { name: 'Basic', desc: 'Plain grey walls, simple bright shapes', card: 'linear-gradient(160deg,#5b616b,#9aa1ab 60%,#e84a3c)', fog: 0xb4bac3, hemi: [0xffffff, 0x8a8f98, 1.8], end: 0xffffff,
    pal: { block: 0xe84a3c, blockE: 0xe84a3c, edge: 0x2b2f36, edge2: 0x2b2f36, barrier: 0xff9f1a, gate: 0x2f7de1, gateE: 0x1d4f94, pod: 0x2fb85a, podE: 0x1b7a3a, spin: 0xffd23f, trail: 0x2f7de1 } }
};
let world = ls('nr-world', 'retro'); if (!WORLDS[world]) world = 'retro';
scene.fog = new THREE.Fog(0x000000, 40, 175);
const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1.4); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(0, 0, 10); scene.add(key);
// 🌀 the tunnel wall: one cylinder, drawn by a shader that knows which world you picked
const wallMat = new THREE.ShaderMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false,
  uniforms: { dist: { value: 0 }, time: { value: 0 }, mode: { value: 0 }, fogc: { value: new THREE.Color() }, R: { value: RAD } },
  vertexShader: 'varying vec3 vP; varying float vD; void main(){ vP = (modelMatrix * vec4(position,1.0)).xyz; vec4 mv = viewMatrix * vec4(vP,1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: `uniform float dist; uniform float time; uniform float mode; uniform vec3 fogc; uniform float R; varying vec3 vP; varying float vD;
    float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
    float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * n2(p); p *= 2.03; a *= 0.5; } return s; }
    void main(){ float th = atan(vP.x, -vP.y); float u = th * R; float s = vP.z - dist, sm = s; vec3 c; float a = 1.0; float C = 6.2831853 * R, t01 = (th + 3.14159265) / 6.2831853; // s: the tunnel (still), sm: the white lights (moving)
      if (mode < 0.5) { // RETRO: dark tube, glowing grid, pink/cyan bands
        vec2 g = vec2(u / (C / 16.0), s / 2.4); vec2 f = abs(fract(g) - 0.5); float l = smoothstep(0.46, 0.5, max(f.x, f.y));
        vec3 lc = mix(vec3(1.0,0.25,0.85), vec3(0.13,0.89,1.0), 0.5 + 0.5 * sin(th));
        float band = smoothstep(0.92, 1.0, abs(sin(s * 0.13)));
        c = vec3(0.03,0.01,0.08) + lc * (l * 0.9 + band * 0.35);
        float lane = smoothstep(0.455, 0.49, abs(fract(u / (C / 8.0)) - 0.5)) * step(0.55, fract(sm / 3.0)); c += vec3(1.0) * lane * 0.9; // light dashes rushing past
      } else if (mode < 1.5) { // WOODS: bark and roots, moss, sunlight through gaps in the leaves
        #define FW(su, ss, o) mix(fbm(vec2(t01 * C * su + o, s * ss)), fbm(vec2((t01 - 1.0) * C * su + o, s * ss)), t01)
        float b = FW(0.35, 0.08, 0.0); float root = smoothstep(0.75, 0.95, abs(sin(u * 1.0 + FW(0.2, 0.05, 11.0) * 6.0)));
        vec3 bark = mix(vec3(0.16,0.10,0.06), vec3(0.32,0.22,0.13), b); vec3 moss = vec3(0.14,0.32,0.10) * (0.6 + 0.6 * FW(0.6, 0.2, 5.0));
        c = mix(bark, moss, smoothstep(0.45, 0.7, FW(0.25, 0.06, 3.0))) + root * vec3(0.18,0.12,0.06);
        float top = smoothstep(0.2, -0.9, cos(th)); float leaf = smoothstep(0.55, 0.8, mix(fbm(vec2(t01 * C * 0.5, s * 0.12 + time * 0.1)), fbm(vec2((t01 - 1.0) * C * 0.5, s * 0.12 + time * 0.1)), t01));
        c = mix(c, vec3(0.35,0.62,0.18), top * leaf * 0.8) + vec3(1.0,0.85,0.45) * top * smoothstep(0.78, 0.9, FW(0.4, 0.1, 7.0)) * 0.6;
        c *= 1.15;
        float slit = smoothstep(0.93, 1.0, sin(s * 0.55 + sin(th * 3.0) * 0.8)); c += vec3(1.0,0.8,0.4) * slit * 0.22; // shafts of light every few metres
        vec2 gc = vec2(u / (C / 24.0), s / 2.2); float glow = step(0.9, h21(vec2(mod(floor(gc.x), 24.0), floor(gc.y)))) * smoothstep(0.35, 0.0, length(fract(gc) - 0.5)); c += vec3(0.6,1.0,0.4) * glow * 1.3; // glowing fungi
        float wl = smoothstep(0.455, 0.49, abs(fract(u / (C / 6.0)) - 0.5)) * step(0.6, fract(sm / 3.5)); c += vec3(1.0) * wl * 0.8; // white lights rushing past
      } else { // BASIC: plain grey panels, soft shading, white lights rushing past
        vec2 g = vec2(u / (C / 12.0), s / 4.0); vec2 f = abs(fract(g) - 0.5); float seam = smoothstep(0.47, 0.5, max(f.x, f.y));
        c = vec3(0.56,0.58,0.62) * (0.82 + 0.18 * smoothstep(1.0, -1.0, cos(th))) - seam * 0.12;
        float wl = smoothstep(0.455, 0.49, abs(fract(u / (C / 8.0)) - 0.5)) * step(0.6, fract(sm / 3.0)); c = mix(c, vec3(1.0), wl * 0.9);
      }
      float fog = smoothstep(30.0, 170.0, vD); gl_FragColor = vec4(mix(c, fogc, fog), 1.0); }` });
const wallGeo = new THREE.CylinderGeometry(RAD, RAD, LEN, 112, 1, true); wallGeo.rotateX(Math.PI / 2); wallGeo.translate(0, 0, -LEN / 2 + 20);
const wall = new THREE.Mesh(wallGeo, wallMat); wall.renderOrder = 5; scene.add(wall);
// the glow at the end of the tunnel
const endGlow = new THREE.Sprite(glowMat(0xffffff, 0.9)); endGlow.scale.set(26, 26, 1); endGlow.position.set(0, 0, -168); scene.add(endGlow);
// decorations for each world
const deco = { retro: new THREE.Group(), woods: new THREE.Group(), basic: new THREE.Group() }; Object.values(deco).forEach(g => scene.add(g));
const RINGS = 22, RSP = 8;
function ringSet(group, geo, mat, colors) { const m = new THREE.InstancedMesh(geo, mat, RINGS); if (colors) for (let i = 0; i < RINGS; i++) m.setColorAt(i, new THREE.Color(colors[i % colors.length])); m.frustumCulled = false; group.add(m); return m; }
const retroRings = ringSet(deco.retro, new THREE.TorusGeometry(RAD - 0.04, 0.05, 6, 120), new THREE.MeshBasicMaterial({ color: 0xffffff }), [0xff3fd8, 0x20e3ff]);
const woodRings = ringSet(deco.woods, new THREE.TorusGeometry(RAD - 0.15, 0.32, 8, 80), lambert(0x4a3020, { e: 0x1a0d05, ei: 1 }));
const basicRings = ringSet(deco.basic, new THREE.TorusGeometry(RAD - 0.03, 0.06, 6, 112), basic(0x8b919a));
// ✨ fireflies in the woods, sparkles in retro
const ptsMat = (color, size, add = true) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { map: { value: DOT }, color: { value: new THREE.Color(color) }, size: { value: size } },
  vertexShader: 'attribute float alpha; varying float vA; uniform float size; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * 300.0 / -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform sampler2D map; uniform vec3 color; varying float vA; void main(){ gl_FragColor = vec4(color, texture2D(map, gl_PointCoord).a * vA); }' });
function floaters(group, n, color, size, rmin, rmax) { const pos = new Float32Array(n * 3), al = new Float32Array(n), ph = new Float32Array(n); for (let i = 0; i < n; i++) { const th = R0() * TAU, r = rmin + R0() * (rmax - rmin); pos[i * 3] = Math.sin(th) * r; pos[i * 3 + 1] = -Math.cos(th) * r; pos[i * 3 + 2] = -R0() * 190; ph[i] = R0() * 10; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('alpha', new THREE.BufferAttribute(al, 1)); const p = new THREE.Points(g, ptsMat(color, size)); p.frustumCulled = false; group.add(p); return { p, pos, al, ph, n }; }
const fireflies = floaters(deco.woods, 220, 0xffe46b, 0.28, 0.5, RAD - 0.6);
const sparkle = floaters(deco.retro, 160, 0xff9af0, 0.16, 0.5, RAD - 0.3);
// leaf clusters on the woods rings
const leafMat = new THREE.SpriteMaterial({ map: DOT, color: 0x5fae3a, transparent: true, opacity: 0.85, depthWrite: false }), leaves = [];
for (let i = 0; i < RINGS; i++) for (let k = 0; k < 7; k++) { const sp = new THREE.Sprite(leafMat); const th = Math.PI + (R0() - 0.5) * 3.4; sp.userData = { i, th }; sp.scale.set(2.6, 2.0, 1); deco.woods.add(sp); leaves.push(sp); }
// wall lamps (tiny glowing tiles stuck to the walls: they whip past and sell the speed)
const WL = 150, wlMat = new THREE.MeshBasicMaterial({ color: 0xffffff }), wallLamps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.04, 2.6), wlMat, WL); wallLamps.frustumCulled = false; scene.add(wallLamps);
const wlData = []; for (let i = 0; i < WL; i++) wlData.push({ th: R0() * TAU, z: -R0() * 175 });
// speed lines
const SL = 80, slMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const speedLines = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 0.025, 5), slMat, SL); speedLines.frustumCulled = false; scene.add(speedLines);
const slPos = []; for (let i = 0; i < SL; i++) { const th = R0() * TAU, r = 1.5 + R0() * (RAD - 2); slPos.push({ th, r, z: -R0() * 90 }); }

/* ================= the rider ================= */
const player = new THREE.Group(); scene.add(player); const rig = new THREE.Group(); player.add(rig); // rig: built "standing on the floor", then rotated to wherever you are on the wall
const jacket = new THREE.Color().setHSL(R0(), 0.8, 0.55).getHex();
const boardMat = lambert(0x15112a, { e: 0x20e3ff, ei: 0.25 }), edgeMat = basic(0x20e3ff);
const board = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 1.5), boardMat); board.position.y = 0.32;
const boardEdge = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 1.56), edgeMat); boardEdge.position.y = 0.27;
const under = new THREE.Sprite(glowMat(0x20e3ff, 0.9)); under.scale.set(1.8, 2.6, 1); under.position.y = 0.12;
const body = new THREE.Group(); body.position.y = 0.37;
const pants = lambert(0x221c3a), jac = lambert(jacket, { e: jacket, ei: 0.15 });
const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.45, 4, 8), pants); legL.position.set(0, 0.32, 0.22); legL.rotation.x = -0.2; const legR = legL.clone(); legR.position.z = -0.22; legR.rotation.x = 0.2;
const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.38, 6, 10), jac); torso.position.y = 0.95;
const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.45, 4, 8), jac); arm.position.set(0, 0.98, -0.34); arm.rotation.x = 1.0; const arm2 = arm.clone(); arm2.position.z = 0.34; arm2.rotation.x = -1.0;
const headM = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), lambert(0xffffff)); headM.position.y = 1.4;
const visor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.3), basic(0xff3fd8)); visor.position.set(0.17, 1.42, 0);
body.add(legL, legR, torso, arm, arm2, headM, visor); body.rotation.y = -Math.PI / 2 + 0.35;
const shieldBall = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 16), new THREE.MeshBasicMaterial({ color: 0x20e3ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })); shieldBall.position.y = 0.9; shieldBall.visible = false;
rig.add(under, board, boardEdge, body, shieldBall);
const TR = 90, trailPos = new Float32Array(TR * 3), trailAl = new Float32Array(TR), trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3)); trailGeo.setAttribute('alpha', new THREE.BufferAttribute(trailAl, 1));
const trail = new THREE.Points(trailGeo, ptsMat(0x20e3ff, 0.5)); trail.frustumCulled = false; scene.add(trail); let trailI = 0;
const SP = 450, spPos = new Float32Array(SP * 3), spVel = new Float32Array(SP * 3), spLife = new Float32Array(SP), spAl = new Float32Array(SP); let spI = 0;
const spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3)); spGeo.setAttribute('alpha', new THREE.BufferAttribute(spAl, 1));
const sparks = new THREE.Points(spGeo, ptsMat(0xffe7a0, 0.32)); sparks.frustumCulled = false; scene.add(sparks);
function burst(p, n, spd) { for (let i = 0; i < n; i++) { const k = spI; spI = (spI + 1) % SP; spPos[k * 3] = p.x; spPos[k * 3 + 1] = p.y; spPos[k * 3 + 2] = p.z; const a = R0() * TAU, b = R0() * Math.PI; spVel[k * 3] = Math.cos(a) * Math.sin(b) * spd; spVel[k * 3 + 1] = Math.cos(b) * spd; spVel[k * 3 + 2] = Math.sin(a) * Math.sin(b) * spd; spLife[k] = 0.4 + R0() * 0.5; } }

/* ================= obstacles (pooled), coins, power-ups ================= */
// every obstacle is built in a "floor" frame (the wall at the bottom, up = +y) and then rotated round the tube to its angle
const OM = { block: lambert(0x241a44), blockE: basic(0xff3fd8), edge2: basic(0x20e3ff), barrier: lambert(0xff7a1a), barrierTop: basic(0xff7a1a), gate: lambert(0x1b1238), gateE: basic(0x20e3ff), pod: lambert(0x161030), podE: basic(0x20e3ff), spin: lambert(0xffd23f, { e: 0xffd23f, ei: 0.35 }) };
function sector(a0, a1, rIn, rOut, depth) { // a slice of a ring (angles measured like the tube: 0 = bottom)
  const s = new THREE.Shape(), A = a => a - Math.PI / 2; s.absarc(0, 0, rOut, A(a0), A(a1), false); s.absarc(0, 0, rIn, A(a1), A(a0), true);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: Math.max(6, Math.ceil((a1 - a0) * 16)) }); g.translate(0, 0, -depth / 2); return g;
}
const pools = {}, active = [];
function makeObs(type, arg) {
  const g = new THREE.Group(); const o = { type, g, arg, th: 0, z: 0, vz: 0, spin: 0, w: 0, h: 0, d: 0.6, smashed: false };
  if (type === 'block') { const m = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 2.4), OM.block); m.position.y = -RAD + 0.75; const e1 = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.08, 2.48), OM.blockE); e1.position.y = -RAD + 1.5; const e2 = new THREE.Mesh(new THREE.BoxGeometry(2.46, 0.05, 2.46), OM.edge2); e2.position.y = -RAD + 0.75; g.add(m, e1, e2); o.w = 2.4; o.h = 1.5; o.d = 2.4; }
  else if (type === 'barrier') { const wa = arg; g.add(new THREE.Mesh(sector(-wa / 2, wa / 2, RAD - 0.6, RAD, 0.5), OM.barrier)); const t = new THREE.Mesh(sector(-wa / 2, wa / 2, RAD - 0.65, RAD - 0.57, 0.56), OM.barrierTop); g.add(t); o.w = wa * RAD; o.h = 0.6; o.d = 0.5; o.arc = wa; }
  else if (type === 'gate') { const gh = arg; g.add(new THREE.Mesh(sector(gh, TAU - gh, RAD - 1.6, RAD, 0.7), OM.gate)); g.add(new THREE.Mesh(sector(gh, TAU - gh, RAD - 1.66, RAD - 1.56, 0.76), OM.gateE)); o.gap = gh; o.h = 1.6; o.d = 0.7; }
  else if (type === 'pod') { const m = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 3.6), OM.pod); m.position.y = -RAD + 0.6; const st = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.08, 3.64), OM.podE); st.position.y = -RAD + 0.5; g.add(m, st);
    for (const s of [-0.6, 0.6]) { const hl = new THREE.Sprite(glowMat(0xfff4d0, 1)); hl.scale.set(1.3, 1.3, 1); hl.position.set(s, -RAD + 0.6, 1.85); g.add(hl); } o.w = 2.0; o.h = 1.2; o.d = 3.6; }
  else if (type === 'spinner') { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.7, RAD * 2, 0.5), OM.spin); const hub = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 12), OM.gateE); g.add(bar, hub); o.w = 0.9; o.h = 99; o.d = 0.5; }
  scene.add(g); return o;
}
function getObs(type, arg) { const key = type + (arg ? ':' + arg.toFixed(2) : ''), p = pools[key] || (pools[key] = []); const o = p.pop() || makeObs(type, arg); o.key = key; o.g.visible = true; o.smashed = false; o.vz = 0; o.spin = 0; active.push(o); return o; }
function freeObs(o) { o.g.visible = false; pools[o.key].push(o); }
function place(type, th, z, arg) { const o = getObs(type, arg); o.th = th; o.z = z; o.g.position.set(0, 0, z); o.g.rotation.set(0, 0, th); return o; }
// coins (one instanced mesh)
const NC = 340, coinMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.32, 0.32, 0.07, 18), new THREE.MeshLambertMaterial({ color: 0xffd23f, emissive: 0xffa800, emissiveIntensity: 0.7 }), NC); coinMesh.frustumCulled = false; scene.add(coinMesh);
const coins = []; for (let i = 0; i < NC; i++) coins.push({ on: false, th: 0, h: 0, z: 0 }); let coinI = 0;
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), V = new THREE.Vector3(), V2 = new THREE.Vector3(), SC = new THREE.Vector3(1, 1, 1), ZA = new THREE.Vector3(0, 0, 1), YA = new THREE.Vector3(0, 1, 0), XA = new THREE.Vector3(1, 0, 0);
function addCoin(th, h, z) { for (let t = 0; t < NC; t++) { const c = coins[coinI]; coinI = (coinI + 1) % NC; if (!c.on) { Object.assign(c, { on: true, th, h, z }); return; } } }
const PU = { magnet: { col: 0xff4d6d, icon: '🧲', name: 'Magnet', time: 10 }, shield: { col: 0x20e3ff, icon: '🛡️', name: 'Shield', time: 0 }, boost: { col: 0xffd23f, icon: '⚡', name: 'Boost', time: 5 } };
const pupItems = []; function makePup(kind) { const g = new THREE.Group(), core = new THREE.Mesh(kind === 'shield' ? new THREE.IcosahedronGeometry(0.42, 0) : kind === 'magnet' ? new THREE.TorusGeometry(0.34, 0.12, 8, 16, Math.PI) : new THREE.OctahedronGeometry(0.42, 0), basic(PU[kind].col));
  const gl = new THREE.Sprite(glowMat(PU[kind].col, 0.9)); gl.scale.set(2.4, 2.4, 1); g.add(core, gl); g.userData = { core }; scene.add(g); return { kind, g, th: 0, z: 0, on: false }; }
function addPup(kind, th, z) { let it = pupItems.find(p => !p.on && p.kind === kind); if (!it) { it = makePup(kind); pupItems.push(it); } Object.assign(it, { on: true, th, z }); it.g.visible = true; }

function applyWorld() {
  const W = WORLDS[world], P = W.pal; scene.fog.color.set(W.fog); scene.background = new THREE.Color(W.fog); wallMat.uniforms.fogc.value.set(W.fog); wallMat.uniforms.mode.value = world === 'retro' ? 0 : world === 'woods' ? 1 : 2;
  hemi.color.set(W.hemi[0]); hemi.groundColor.set(W.hemi[1]); hemi.intensity = W.hemi[2]; endGlow.material.color.set(W.end); endGlow.material.opacity = world === 'basic' ? 0.5 : 0.9;
  Object.entries(deco).forEach(([k, g]) => { g.visible = k === world; });
  OM.block.color.set(P.block); OM.block.emissive.set(P.blockE); OM.block.emissiveIntensity = 0.25; OM.blockE.color.set(P.edge); OM.edge2.color.set(P.edge2); OM.barrier.color.set(P.barrier); OM.barrier.emissive.set(P.barrier); OM.barrier.emissiveIntensity = 0.3; OM.barrierTop.color.set(P.edge2);
  OM.gate.color.set(P.gate); OM.gate.emissive.set(P.gateE); OM.gate.emissiveIntensity = 0.12; OM.gateE.color.set(P.gateE); OM.pod.color.set(P.pod); OM.podE.color.set(P.podE); OM.spin.color.set(P.spin); OM.spin.emissive.set(P.spin);
  wlMat.color.set(0xffffff);
  edgeMat.color.set(P.trail); under.material.color.set(P.trail); trail.material.uniforms.color.value.set(P.trail); boardMat.emissive.set(P.trail);
}

/* ================= the run ================= */
const S = { running: false, paused: false, dead: false, t: 0, dist: 0, sd: 0, coins: 0, bonus: 0, v: 15, th: 0, w: 0, h: 0, vh: 0, inv: 0, shield: false, magnet: 0, boost: 0, nextSpawn: 0, nextPup: 450, freeTh: 0, deathT: 0, lastMark: 0, shake: 0, jumpBuf: 0, tpCool: 0, camTh: 0, warp: 0 };
let keys = {}, token = null, best = 0;
function resetRun() {
  for (const o of active.splice(0)) freeObs(o); coins.forEach(c => { c.on = false; }); pupItems.forEach(p => { p.on = false; p.g.visible = false; });
  Object.assign(S, { running: true, paused: false, dead: false, t: 0, dist: 0, sd: 0, coins: 0, bonus: 0, v: 0, th: 0, w: 0, h: 0, vh: 0, inv: 0, shield: false, magnet: 0, boost: 0, nextSpawn: 150, nextPup: 450 + R0() * 200, freeTh: 0, deathT: 0, lastMark: 0, shake: 0, jumpBuf: 0, tpCool: 0, camTh: 0, warp: 0, airT: 0, flip: 0, big: false, squash: 0, thump: 0, tp: null });
  keys = {}; trailAl.fill(0); spLife.fill(0);
  for (let i = 0; i < 16; i++) addCoin(i * 0.4, 0.9, -40 - i * 5); // a spiral of coins to get you started: ride up the wall!
}
const V_BASE = 45, K_RATE = 0.35, M_RATE = 0.25; // m/s, per second, m/s per second
const SLOW = 0.85; // everything 15% slower than the first version
const speedAt = t => SLOW * Math.min(160, V_BASE * (1 - Math.exp(-K_RATE * t)) + M_RATE * t); // Speed(t) = V_base(1 - e^(-kt)) + mt: launches from a standstill, then never stops speeding up
function toast(t, col) { const e = $('#toast'); e.textContent = t; e.style.color = col || '#fff'; e.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('show'), 1100); }
// ✨ one set of obstacles, always with a way through (and sometimes the quickest way is to teleport)
function spawnRow(z) {
  const d = clamp((S.v - 20) / 50, 0, 1), roll = R0(); let ft = S.freeTh + (R0() - 0.5) * (1.2 + d * 2); S.freeTh = ft;
  const coinLine = (th, n, h = 0.9) => { for (let i = 0; i < n; i++) addCoin(th, h, z + 6 - i * 3); };
  const spiral = (th0, n, dir) => { for (let i = 0; i < n; i++) addCoin(th0 + dir * i * 0.22, 0.9, z + 8 - i * 2.4); };
  if (roll < 0.26) { // ▣ blocks around the ring
    const k = Math.round(3 + d * 4); const off = R0() * TAU; for (let i = 0; i < k; i++) { const th = off + i * TAU / k + (R0() - 0.5) * 0.25; if (Math.abs(angDiff(th, ft)) < 0.5) continue; place('block', th, z - R0() * 6); } coinLine(ft, 4);
  } else if (roll < 0.44) { // 🟧 low walls round part of the tube: jump them or ride round them
    const wa = [1.6, 2.4, 3.2][Math.floor(R0() * 3)] + d * 0.8; place('barrier', ft + Math.PI + (R0() - 0.5) * 0.6, z, +wa.toFixed(2)); if (d > 0.35) place('barrier', ft + (R0() < 0.5 ? 1 : -1) * 0.2, z - 16, 1.2);
    for (let i = -3; i <= 3; i++) addCoin(ft + Math.PI, 0.9 + 1.0 * Math.cos(i / 3 * 1.4), z - i * 2.2);
  } else if (roll < 0.64 && d > 0.05) { // 🚪 a gate with one gap
    const gh = +(lerp(0.75, 0.48, d)).toFixed(2), gth = ft + (d > 0.3 && R0() < 0.4 ? Math.PI : 0); place('gate', gth, z, gh); coinLine(gth, 5); S.freeTh = gth;
    if (d > 0.45 && R0() < 0.5) { place('gate', gth + Math.PI, z - 22, gh); coinLine(gth + Math.PI, 4); S.freeTh = gth + Math.PI; toast('⇅ Teleport with S!', '#7df9ff'); }
  } else if (roll < 0.78 && d > 0.15) { // 🔄 a spinning arm
    const sp = place('spinner', R0() * TAU, z); sp.spin = (R0() < 0.5 ? -1 : 1) * (0.9 + d * 1.6); spiral(ft, 8, R0() < 0.5 ? 1 : -1);
  } else if (roll < 0.9 && d > 0.1) { // 🚗 pods racing at you
    const n = 2 + Math.floor(d * 3), off = R0() * TAU; for (let i = 0; i < n; i++) { const th = off + i * TAU / n; if (Math.abs(angDiff(th, ft)) < 0.6) continue; const p = place('pod', th, z - 25); p.vz = 12 + d * 12; } coinLine(ft, 4);
  } else { // a coin spiral with a few blocks
    spiral(ft, 12, R0() < 0.5 ? 1 : -1); for (let i = 0; i < 2; i++) place('block', ft + Math.PI + (i - 0.5) * 1.2, z - 10);
  }
}
function hitTest(o) {
  if (Math.abs(o.z) > o.d / 2 + 0.4) return false;
  const pad = 0.32 / RAD;
  if (o.type === 'gate') return Math.abs(angDiff(S.th, o.th)) > o.gap - pad && S.h < o.h;
  if (o.type === 'barrier') return Math.abs(angDiff(S.th, o.th)) < o.arc / 2 + pad && S.h < o.h;
  if (o.type === 'spinner') { const a = Math.abs(angDiff(S.th, o.g.rotation.z)), b = Math.abs(angDiff(S.th, o.g.rotation.z + Math.PI)); return Math.min(a, b) < o.w / 2 / RAD + pad; }
  return Math.abs(angDiff(S.th, o.th)) < o.w / 2 / RAD + pad && S.h < o.h;
}
function smash(o) { o.smashed = true; burst(onWall(S.th, 1, o.z, V2), 40, 9); o.g.visible = false; S.bonus += 50; }
function die() { if (S.dead) return; S.dead = true; S.deathT = 0; S.shake = 0.5; burst(onWall(S.th, 1, 0, V2), 90, 11); flash(0.7); }
function flash(op) { const f = $('#flash'); f.style.transition = 'none'; f.style.opacity = op; requestAnimationFrame(() => { f.style.transition = 'opacity .35s'; f.style.opacity = 0; }); }
function teleport() { if (S.tpCool > 0 || S.dead || S.tp) return; burst(onWall(S.th, 0.6, 0, V2), 24, 6); S.tp = { t: 0, dur: 0.3, from: S.th, dir: S.w >= 0 ? 1 : -1 }; S.h = 0; S.vh = 0; S.big = false; S.flip = 0; S.tpCool = 0.55; S.warp = 1; }
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const tpPos = (T, k, lift, v = new THREE.Vector3()) => { const a = onWall(T.from, lift, 0, new THREE.Vector3()), b = onWall(T.from + Math.PI, lift, 0, new THREE.Vector3()); return v.copy(a).lerp(b, k); }; // straight across, through the middle
function step(dt) {
  if (S.dead) { S.deathT += dt; S.v *= Math.exp(-dt * 6); if (S.deathT > 0.9 && S.running) endRun(); }
  else {
    S.t += dt; S.v = speedAt(S.t) * (S.boost > 0 ? 1.4 : 1);
    // the faster you go, the faster you move round the tube (and the snappier it turns)
    const steer = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), lat = Math.min(40, 6 + S.v * 0.32), acc = 50 + S.v * 2.2; // m/s and m/s per second, round the tube
    S.w += clamp(steer * lat - S.w, -acc * dt, acc * dt); S.th += S.w / RAD * dt;
    if (S.jumpBuf > 0) S.jumpBuf -= dt; if (S.tpCool > 0) S.tpCool -= dt;
    // 🦘 the faster you go, the better you jump: you pop up quicker (jb) and a bit higher (ja), so a tap always clears a block
    const jb = 1 + S.v / 90, ja = 1 + S.v / 300;
    if (S.h <= 0 && S.jumpBuf > 0 && !S.tp) { S.vh = 11.4 * jb * Math.sqrt(ja); S.h = 0.001; S.jumpBuf = 0; S.airT = 0; S.flip = 0; S.squash = -0.35; burst(onWall(S.th, 0.2, 0.4, V2), 12, 3); }
    if (S.h > 0 || S.vh > 0) { S.airT += dt;
      const hold = keys.up && S.vh > 0 && S.airT < 0.3 / jb; // keep holding W: you float up higher
      S.vh -= (hold ? 18 : S.vh > 0 ? 34 : 42) * jb * jb * dt; S.h += S.vh * dt;
      if (hold && S.airT > 0.12 / jb) S.big = true; if (S.big) S.flip = Math.min(TAU, S.flip + dt * 11 * jb); // a big jump gets a 360 spin
      if (S.h <= 0) { S.h = 0; const hard = -S.vh; S.vh = 0; S.big = false; S.flip = 0; S.squash = clamp(hard / 30 / jb, 0.15, 0.45); S.thump = clamp(hard / 40 / jb, 0.1, 0.35); burst(onWall(S.th, 0.1, 0.2, V2), 16 + Math.min(30, Math.round(hard / jb)), 4); } }
    if (S.tp) { S.tp.t += dt; if (S.tp.t >= S.tp.dur) { S.th = S.tp.from + Math.PI; S.camTh = S.th; S.tp = null; S.squash = 0.3; S.thump = 0.2; burst(onWall(S.th, 0.3, 0, V2), 30, 6); } }
    S.dist += S.v * dt; S.sd += S.v * dt * (S.boost > 0 ? 2 : 1);
    if (S.inv > 0) S.inv -= dt; if (S.magnet > 0) S.magnet -= dt; if (S.boost > 0) { S.boost -= dt; if (S.boost <= 0) S.inv = 1; }
    const mark = Math.floor(S.dist / 1000); if (mark > S.lastMark) { S.lastMark = mark; toast('🚀 ' + nf(mark * 1000) + ' m!', '#7df9ff'); }
  }
  const move = S.v * dt;
  S.nextSpawn -= move; if (!S.dead && S.nextSpawn <= 0) { spawnRow(SPAWN_Z); const d = clamp((S.v - 20) / 50, 0, 1); S.nextSpawn = Math.max(22, S.v * lerp(1.25, 0.62, d)); }
  S.nextPup -= move; if (!S.dead && S.nextPup <= 0) { S.nextPup = 520 + R0() * 380; const kinds = Object.keys(PU); addPup(kinds[Math.floor(R0() * kinds.length)], S.freeTh, SPAWN_Z + 30); }
  for (let i = active.length - 1; i >= 0; i--) { const o = active[i]; o.z += move + o.vz * dt; if (o.spin) o.g.rotation.z += o.spin * dt; o.g.position.z = o.z;
    if (o.z > 12) { active.splice(i, 1); freeObs(o); continue; }
    if (!S.dead && !o.smashed && !S.tp && hitTest(o)) { if (S.boost > 0) smash(o); else if (S.inv > 0) { /* flashing after a hit */ } else if (S.shield) { S.shield = false; S.inv = 1.2; smash(o); toast('🛡️ Shield saved you!', '#7df9ff'); } else die(); } }
  for (const c of coins) if (c.on) { c.z += move; if (S.magnet > 0 && c.z > -30 && c.z < 2) { c.th += angDiff(S.th, c.th) * Math.min(1, dt * 8); c.h += (S.h + 0.9 - c.h) * Math.min(1, dt * 8); c.z += -c.z * Math.min(1, dt * 5); }
    if (!S.dead && Math.abs(c.z) < 0.8 && Math.abs(angDiff(c.th, S.th)) * RAD < 0.8 && c.h > S.h - 0.3 && c.h < S.h + 1.9) { c.on = false; S.coins++; S.bonus += S.boost > 0 ? 10 : 0; burst(onWall(c.th, c.h, c.z, V2), 6, 3); }
    else if (c.z > 8) c.on = false; }
  for (const p of pupItems) if (p.on) { p.z += move;
    if (!S.dead && Math.abs(p.z) < 1 && Math.abs(angDiff(p.th, S.th)) * RAD < 1.1) { p.on = false; p.g.visible = false; const P = PU[p.kind]; if (p.kind === 'shield') S.shield = true; else S[p.kind] = P.time; toast(P.icon + ' ' + P.name + '!', '#' + P.col.toString(16).padStart(6, '0')); burst(onWall(p.th, 1.1, 0, V2), 30, 6); }
    else if (p.z > 8) { p.on = false; p.g.visible = false; } }
  wallMat.uniforms.dist.value -= move;
}
function score() { return Math.floor(S.sd) + S.coins * 10 + S.bonus; }
async function endRun() {
  S.running = false; const sc = score(); hud();
  const res = $('#endRes'); res.replaceChildren(); [['Distance', nf(S.dist) + ' m'], ['Coins', '🪙 ' + nf(S.coins) + ' × 10'], ['Boost and smash bonus', nf(Math.floor(S.sd - S.dist) + S.bonus)], ['Top speed', nf(speedAt(S.t) * 3.6) + ' km/h']].forEach(([a, b]) => res.append(el('span', '', a), el('b', '', b)));
  res.append(el('span', 'tot', 'Score'), el('span', 'tot', nf(sc)));
  $('#newBest').hidden = !(sc > best); $('#endRank').textContent = token ? 'Saving…' : 'Not saved (no connection).'; $('#endOv').hidden = false; $('#againBtn').focus();
  if (token) { const r = await api('/api/arcade/finish', 'POST', { token, score: sc }); token = null;
    if (r.ok) { if (r.data.saved && sc > best) best = sc; const d = r.data.today, w = r.data.all; $('#endRank').textContent = r.data.saved ? (d ? 'You’re #' + d.rank + ' today' + (w ? ' · #' + w.rank + ' of all time' : '') : 'Saved!') : 'That run couldn’t be saved.'; loadBoard(); }
    else $('#endRank').textContent = r.data.error || 'Couldn’t save that run.'; }
}

/* ================= drawing ================= */
function hud() {
  $('#hScore').textContent = nf(score()); $('#hDist').textContent = nf(S.dist) + ' m'; $('#hCoins').textContent = '🪙 ' + nf(S.coins); $('#hSpd').textContent = nf(S.v * 3.6);
  const box = $('#pups'); box.replaceChildren();
  for (const [k, P] of Object.entries(PU)) { const left = k === 'shield' ? (S.shield ? 1 : 0) : clamp(S[k] / P.time, 0, 1); if (!left) continue; const row = el('div', 'pup'); row.style.color = '#' + P.col.toString(16).padStart(6, '0'); const bar = el('i'), f = el('b'); f.style.width = (left * 100) + '%'; bar.appendChild(f); row.append(el('span', '', P.icon), bar); box.appendChild(row); }
  $('#tpBtn') && $('#tpBtn').classList.toggle('cool', S.tpCool > 0);
}
const rollQ = th => Q.setFromAxisAngle(ZA, th);
let tPrev = 0, tAll = 0, lastHud = 0, menuDist = 0;
function frame(ts) {
  requestAnimationFrame(frame); if (!renderer) return;
  const dt = Math.min(0.05, (ts - (tPrev || ts)) / 1000); tPrev = ts; tAll += dt;
  if (S.running && !S.paused) { const n = Math.ceil(dt / (1 / 120)); for (let i = 0; i < n; i++) step(dt / n); }
  else if (!S.running && !S.dead) { const m = 16 * dt; wallMat.uniforms.dist.value -= m; menuDist += m; S.th += dt * 0.25; S.camTh = S.th; } // a gentle ride round the tube behind the menu
  const dist = -wallMat.uniforms.dist.value, mv = (S.running && !S.paused ? S.v : 16) * dt;
  // the rider stands on the wall at angle th, rotated so its "up" points to the middle of the tube
  const bob = S.h > 0 ? 0 : Math.sin(tAll * 7) * 0.04, tk = S.tp ? ease(Math.min(1, S.tp.t / S.tp.dur)) : 0;
  if (S.tp) { tpPos(S.tp, tk, 0.15, player.position); player.rotation.set(0, 0, S.tp.from + Math.PI * tk * S.tp.dir); } else { player.position.copy(onWall(S.th, S.h + 0.15 + bob, 0, V)); player.rotation.set(0, 0, S.th); }
  S.squash *= Math.exp(-dt * 9); S.thump *= Math.exp(-dt * 10);
  const st = S.h > 0 ? clamp(S.vh * 0.025, -0.12, 0.2) : 0; rig.scale.set(1 + S.squash * 0.6 - st * 0.4, 1 - S.squash + st, 1 + S.squash * 0.6 - st * 0.4); rig.rotation.x = -S.flip; rig.position.set(0, 0.8 - 0.8 * Math.cos(S.flip), 0.8 * Math.sin(S.flip)); // spin round the middle of the body, not the feet
  rig.rotation.z = -S.w * 0.035; rig.rotation.y = -S.w * 0.02 + (S.tp ? tk * TAU : 0); body.rotation.z = S.h > 0 ? Math.min(0.5, S.vh * -0.03) : 0;
  player.visible = view === 'third' && !(S.inv > 0 && !S.boost && Math.floor(tAll * 14) % 2 === 0) && !(S.dead && S.deathT > 0.05);
  shieldBall.visible = S.shield || S.boost > 0; shieldBall.material.color.set(S.boost > 0 ? 0xffd23f : 0x20e3ff);
  // trail and sparks
  trailI = (trailI + 1) % TR; if (S.tp) { tpPos(S.tp, tk, 0.4, V2); burst(V2, 2, 1.5); } else onWall(S.th, S.h + 0.2, 0.8, V2); trailPos[trailI * 3] = V2.x; trailPos[trailI * 3 + 1] = V2.y; trailPos[trailI * 3 + 2] = V2.z; for (let i = 0; i < TR; i++) { trailPos[i * 3 + 2] += mv * 0.9; trailAl[i] = Math.max(0, trailAl[i] - dt * 2.4); } trailAl[trailI] = S.dead || !S.running ? 0 : 0.85;
  trailGeo.attributes.position.needsUpdate = true; trailGeo.attributes.alpha.needsUpdate = true;
  for (let i = 0; i < SP; i++) { if (spLife[i] > 0) { spLife[i] -= dt; spPos[i * 3] += spVel[i * 3] * dt; spPos[i * 3 + 1] += spVel[i * 3 + 1] * dt; spPos[i * 3 + 2] += spVel[i * 3 + 2] * dt + mv; spAl[i] = clamp(spLife[i] * 2, 0, 1); } else spAl[i] = 0; }
  spGeo.attributes.position.needsUpdate = true; spGeo.attributes.alpha.needsUpdate = true;
  // coins and power-ups
  let k = 0; for (const c of coins) { if (!c.on) continue; Q.setFromAxisAngle(ZA, c.th).multiply(Q2.setFromAxisAngle(YA, tAll * 4 + c.z * 0.1)).multiply(new THREE.Quaternion().setFromAxisAngle(XA, Math.PI / 2)); M4.compose(onWall(c.th, c.h, c.z, V), Q, SC); coinMesh.setMatrixAt(k++, M4); } coinMesh.count = k; coinMesh.instanceMatrix.needsUpdate = true;
  for (const p of pupItems) if (p.on) { p.g.position.copy(onWall(p.th, 1.1 + Math.sin(tAll * 4) * 0.15, p.z, V)); p.g.userData.core.rotation.y += dt * 3; }
  // the world's decorations scroll past
  const ringZ = i => 12 - (((i * RSP + dist) % (RINGS * RSP)) + RINGS * RSP) % (RINGS * RSP);
  const deco1 = WORLDS[world] && world; for (let i = 0; i < RINGS; i++) { M4.makeTranslation(0, 0, ringZ(i)); if (deco1 === 'retro') retroRings.setMatrixAt(i, M4); else if (deco1 === 'woods') woodRings.setMatrixAt(i, M4); else basicRings.setMatrixAt(i, M4); }
  (world === 'retro' ? retroRings : world === 'woods' ? woodRings : basicRings).instanceMatrix.needsUpdate = true;
  if (world === 'woods') for (const sp of leaves) { sp.position.copy(onWall(sp.userData.th, 0.5, ringZ(sp.userData.i), V)); }
  const F = world === 'retro' ? sparkle : world === 'woods' ? fireflies : null;
  if (F) { for (let i = 0; i < F.n; i++) { F.pos[i * 3 + 2] += mv * 0.95; if (F.pos[i * 3 + 2] > 10) F.pos[i * 3 + 2] -= 200; F.al[i] = world === 'woods' ? 0.4 + 0.6 * Math.max(0, Math.sin(tAll * 2 + F.ph[i])) : 0.35 + 0.3 * Math.sin(tAll * 5 + F.ph[i]); }
  F.p.geometry.attributes.position.needsUpdate = true; F.p.geometry.attributes.alpha.needsUpdate = true; }
  for (let i = 0; i < WL; i++) { const w = wlData[i]; w.z += mv; if (w.z > 10) { w.z -= 185; w.th = R0() * TAU; } Q.setFromAxisAngle(ZA, w.th); M4.compose(onWall(w.th, 0.03, w.z, V), Q, SC); wallLamps.setMatrixAt(i, M4); } wallLamps.instanceMatrix.needsUpdate = true;
  // speed lines
  slMat.opacity = clamp((S.v - 20) / 40, 0.12, 0.55) * (S.running ? 1 : 0); for (let i = 0; i < SL; i++) { const p = slPos[i]; p.z += S.v * dt * 1.7; if (p.z > 8) { p.z -= 90; p.th = R0() * TAU; p.r = 1.5 + R0() * (RAD - 2); } M4.makeTranslation(Math.sin(p.th) * p.r, -Math.cos(p.th) * p.r, p.z); speedLines.setMatrixAt(i, M4); } speedLines.instanceMatrix.needsUpdate = true;
  // 🎥 camera: rolls with you so the wall under your board is always "down" (third person, or C for first person)
  if (S.tp) S.camTh = S.tp.from + Math.PI * tk * S.tp.dir; else S.camTh += angDiff(S.th, S.camTh) * Math.min(1, dt * 14); if (S.warp > 0) S.warp = Math.max(0, S.warp - dt * 2.5);
  const up = outward(S.camTh).negate(), base = S.tp ? tpPos(S.tp, tk, 0, V2) : onWall(S.camTh, S.h * (view === 'first' ? 0.85 : 0.3) - S.thump * 0.6, 0, V2);
  if (view === 'first') { camera.position.copy(base).addScaledVector(up, 1.55); camera.position.z = 0.25; } else { camera.position.copy(base).addScaledVector(up, 2.35); camera.position.z = 3.9; }
  if (S.shake > 0) { S.shake -= dt; camera.position.x += (R0() - 0.5) * S.shake; camera.position.y += (R0() - 0.5) * S.shake; }
  camera.up.copy(up); const look = S.tp ? tpPos(S.tp, tk, 0, new THREE.Vector3()).addScaledVector(up, 2.3).setZ(-16) : onWall(S.camTh, S.h * (view === 'first' ? 0.85 : 0.3) + (view === 'first' ? 1.35 : 2.3), -16, new THREE.Vector3()); camera.lookAt(look); // (aimed high so your rider sits low on screen)
  const fov = 68 + clamp(S.v / 70, 0, 1) * 24 + (S.boost > 0 ? 6 : 0) + S.warp * 14; if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 6); camera.updateProjectionMatrix(); }
  wallMat.uniforms.time.value = tAll; key.position.copy(camera.position);
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
function setView(v) { view = v; lset('nr-view', v); document.querySelectorAll('#vSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); }
const K = { a: 'left', A: 'left', ArrowLeft: 'left', d: 'right', D: 'right', ArrowRight: 'right', w: 'up', W: 'up', ArrowUp: 'up', ' ': 'up', s: 'down', S: 'down', ArrowDown: 'down' };
function press(k) { if (!S.running || S.paused || S.dead) return; if (k === 'up') S.jumpBuf = 0.15; else if (k === 'down') teleport(); }
addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input,textarea,select')) return;
  if ((e.key === ' ' || e.key === 'Enter') && (!$('#endOv').hidden || !$('#startOv').hidden) && !$('#app').hidden) { e.preventDefault(); start(); return; }
  if ((e.key === 'c' || e.key === 'C') && !$('#app').hidden) { setView(view === 'first' ? 'third' : 'first'); return; }
  const k = K[e.key]; if (k && S.running) { e.preventDefault(); if (!e.repeat && !keys[k]) press(k); keys[k] = true; }
  if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && S.running) { e.preventDefault(); S.paused ? resume() : pause(); }
});
addEventListener('keyup', e => { const k = K[e.key]; if (k) keys[k] = false; });
addEventListener('blur', () => { keys = {}; }); document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
document.querySelectorAll('.pad button').forEach(b => { const k = b.dataset.k; b.addEventListener('pointerdown', e => { e.preventDefault(); if (k === 'view') { setView(view === 'first' ? 'third' : 'first'); return; } keys[k] = true; press(k); }); const off = () => { keys[k] = false; }; b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off); });
let sw = null; $('#stage').addEventListener('pointerdown', e => { if (e.target.closest('.pad,.over,button')) return; sw = { y: e.clientY }; });
$('#stage').addEventListener('pointerup', e => { if (!sw) return; const dy = e.clientY - sw.y; if (Math.abs(dy) > 30) press(dy < 0 ? 'up' : 'down'); sw = null; });
$('#playBtn').onclick = start; $('#againBtn').onclick = start; $('#resumeBtn').onclick = resume; $('#quitBtn').onclick = start; $('#pauseBtn').onclick = pause;
$('#menuBtn') && ($('#menuBtn').onclick = () => { $('#endOv').hidden = true; $('#startOv').hidden = false; $('#hud').hidden = true; S.dead = false; S.running = false; });
$('#fsBtn').onclick = () => { const s = $('#stage'); if (document.fullscreenElement) document.exitFullscreen(); else if (s.requestFullscreen) s.requestFullscreen().catch(() => {}); };
document.addEventListener('fullscreenchange', () => setTimeout(resize, 50));
document.querySelectorAll('#qSeg button').forEach(b => { b.classList.toggle('on', +b.dataset.q === quality); b.onclick = () => { quality = +b.dataset.q; lset('nr-q', quality); document.querySelectorAll('#qSeg button').forEach(x => x.classList.toggle('on', x === b)); resize(); }; });
document.querySelectorAll('#vSeg button').forEach(b => { b.onclick = () => setView(b.dataset.v); }); setView(view);
function drawWorlds() { const box = $('#worlds'); box.replaceChildren(); Object.entries(WORLDS).forEach(([id, W]) => { const b = el('button', 'world' + (id === world ? ' on' : '')); b.type = 'button'; b.style.background = W.card; b.append(el('b', '', W.name), el('span', '', W.desc)); b.setAttribute('aria-pressed', String(id === world)); b.onclick = () => { world = id; lset('nr-world', id); applyWorld(); drawWorlds(); }; box.appendChild(b); }); }
let B = null, range = 'today';
async function loadBoard() { const r = await api('/api/arcade/board?game=neon'); if (!r.ok) return; B = r.data; if (B.today.me) best = Math.max(best, B.today.me.best); drawBoard(); $('#bestLine').textContent = best ? 'Your best today: ' + nf(best) : (B.today.top[0] ? '🥇 Today’s best: ' + B.today.top[0].name + ' with ' + nf(B.today.top[0].best) : 'Nobody has run today yet. Be the first!'); }
function drawBoard() {
  const box = $('#lb'); box.replaceChildren(); const D = B && B[range]; if (!D) return;
  if (!D.top.length) box.appendChild(el('p', 'small muted', range === 'today' ? 'Nobody has run today yet. Be the first!' : 'Nobody has run yet. Be the first!'));
  D.top.forEach(x => { const row = el('div', 'row' + (x.me ? ' me' : '')), av = el('span', 'av'); if (window.ecAv) window.ecAv(av, x.look, x.name); else av.textContent = x.name[0];
    const nm = el('span', 'nm', x.name), tt = window.ecTitle && window.ecTitle(x.look); if (tt) nm.appendChild(tt);
    row.append(el('span', 'rk', ['🥇', '🥈', '🥉'][x.rank - 1] || String(x.rank)), av, nm, el('span', 'sc', nf(x.best))); box.appendChild(row); });
  $('#lbMe').textContent = D.me && D.me.rank > 20 ? 'You: #' + D.me.rank + ' with ' + nf(D.me.best) : '';
}
document.querySelectorAll('#rangeTabs button').forEach(b => b.onclick = () => { range = b.dataset.r; document.querySelectorAll('#rangeTabs button').forEach(x => x.classList.toggle('on', x === b)); drawBoard(); });
window.__nr = { S, camera, player, get keys() { return keys; }, press, setView, setWorld(w) { world = w; applyWorld(); drawWorlds(); }, sim(sec, k) { if (k) Object.assign(keys, k); for (let t = 0; t < sec && S.running; t += 1 / 120) step(1 / 120); return { t: S.t, v: S.v, dist: S.dist, dead: S.dead, coins: S.coins, score: score(), th: S.th }; } }; // (for testing)

(async () => {
  const me = await api('/api/me'); if (me.status === 401) { location.replace('/?next=arcade'); return; }
  $('#loading').hidden = true;
  const j = window.ecLive ? await window.ecLive() : null;
  if (j && j.study && j.study.study) { $('#closedBox').hidden = false; return; }
  if (!renderer) { $('#noGl').hidden = false; return; }
  if (matchMedia('(pointer:coarse)').matches) $('#stage').classList.add('coarse');
  applyWorld(); drawWorlds(); $('#app').hidden = false; resize(); addEventListener('resize', resize); requestAnimationFrame(frame); loadBoard();
})();
