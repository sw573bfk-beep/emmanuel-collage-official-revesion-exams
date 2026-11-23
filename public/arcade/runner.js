// ⚡ Neon Rush: an endless hoverboard run inside a 360° tunnel (just for fun: never touches points, study time or stats).
// Ride all the way round the tube; the camera rolls with you so you always feel upright. S teleports you to the
// opposite side. Three worlds (Retro, Woods, Basic) change the look only. Built for high frame rates: one shader
// draws the whole tunnel wall, and everything else is reused. The picture is drawn off-screen at a size the device can
// keep up with (Auto graphics), then given a glow and a speed blur. Physics runs in fixed 1/240 s steps so it feels smooth.
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
try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.05, 900);
// 🎨 the scene is drawn into an off-screen picture, so the built-in materials do their own tone mapping and colour step
THREE.ShaderChunk.common += '\nvec3 nrAces(vec3 c){ c *= 1.1 / 0.6; c = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777) * c; vec3 a = c * (c + 0.0245786) - 0.000090537; vec3 b = c * (0.983729 * c + 0.4329510) + 0.238081; c = a / b; c = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602) * c; return clamp(c, 0.0, 1.0); }\nvec3 nrSrgb(vec3 c){ return mix(pow(max(c, vec3(0.0)), vec3(0.41666)) * 1.055 - vec3(0.055), c * 12.92, vec3(lessThanEqual(c, vec3(0.0031308)))); }\n';
THREE.ShaderChunk.tonemapping_fragment = 'gl_FragColor.rgb = nrAces(gl_FragColor.rgb);';
THREE.ShaderChunk.colorspace_fragment = 'gl_FragColor.rgb = nrSrgb(gl_FragColor.rgb);';
const DPR = Math.min(window.devicePixelRatio || 1, 2), coarse = matchMedia('(pointer:coarse)').matches;
// ⚙️ graphics levels: Auto moves between these to keep the frame rate up (h = how many pixels tall the picture is drawn)
const TIERS = [{ h: 480, glow: 0, aa: 0 }, { h: 600, glow: 0, aa: 0 }, { h: 720, glow: 1, aa: 0 }, { h: 900, glow: 1, aa: 4 }, { h: 1080, glow: 1, aa: 4 }, { h: 1440, glow: 1, aa: 4 }];
let gfx = ls('nr-gfx', 'auto'); if (!['auto', 'fast', 'sharp'].includes(gfx)) gfx = 'auto';
const autoStart = () => clamp(ls('nr-tier', coarse ? 2 : 3), 0, TIERS.length - 1);
let tier = gfx === 'fast' ? 1 : gfx === 'sharp' ? 4 : autoStart();
let showFps = ls('nr-fps', false), view = ls('nr-view', 'third');
let rtScene = null, rtA = null, rtB = null, rtC = null, rtD = null, cssW = 1280, cssH = 720;
const effH = t => Math.max(120, Math.round(Math.min(TIERS[t].h, cssH * DPR)));
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), postScene = new THREE.Scene(), quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); quad.frustumCulled = false; postScene.add(quad);
const PV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const post = (fs, u) => new THREE.ShaderMaterial({ vertexShader: PV, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false });
const DOWN = 'uniform sampler2D src; uniform vec2 px; uniform vec2 th; varying vec2 vUv; void main(){ vec3 c = (texture2D(src, vUv + px * vec2(-1.0, -1.0)).rgb + texture2D(src, vUv + px * vec2(1.0, -1.0)).rgb + texture2D(src, vUv + px * vec2(-1.0, 1.0)).rgb + texture2D(src, vUv + px * vec2(1.0, 1.0)).rgb) * 0.25; float l = max(dot(c, vec3(0.3, 0.59, 0.11)), max(c.r, max(c.g, c.b)) * 0.85); gl_FragColor = vec4(c * smoothstep(th.x, th.y, l), 1.0); }';
const BLUR = 'uniform sampler2D src; uniform vec2 dir; varying vec2 vUv; void main(){ vec3 c = texture2D(src, vUv).rgb * 0.227027; c += (texture2D(src, vUv + dir * 1.384615).rgb + texture2D(src, vUv - dir * 1.384615).rgb) * 0.316216; c += (texture2D(src, vUv + dir * 3.230769).rgb + texture2D(src, vUv - dir * 3.230769).rgb) * 0.070270; gl_FragColor = vec4(c, 1.0); }';
const COMP = 'uniform sampler2D scn; uniform sampler2D b1; uniform sampler2D b2; uniform float glow; uniform float blur; varying vec2 vUv;\n' +
  'void main(){ vec3 c = texture2D(scn, vUv).rgb;\n' +
  '  if (blur > 0.0005) { vec2 d = (vUv - 0.5) * blur; c = c * 0.3 + texture2D(scn, vUv - d * 0.25).rgb * 0.25 + texture2D(scn, vUv - d * 0.5).rgb * 0.2 + texture2D(scn, vUv - d * 0.75).rgb * 0.15 + texture2D(scn, vUv - d).rgb * 0.1; }\n' +
  '  if (glow > 0.0005) c += (texture2D(b1, vUv).rgb * 0.8 + texture2D(b2, vUv).rgb * 1.2) * glow;\n' +
  '  vec2 q = vUv - 0.5; c *= 1.0 - 0.45 * dot(q, q);\n' +
  '  c += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;\n' +
  '  gl_FragColor = vec4(c, 1.0); }';
const v2 = () => ({ value: new THREE.Vector2() }), tx = () => ({ value: null });
const mDown = post(DOWN, { src: tx(), px: v2(), th: { value: new THREE.Vector2(0.6, 0.95) } }), mDown2 = post(DOWN, { src: tx(), px: v2(), th: { value: new THREE.Vector2(-1, 0) } });
const bH1 = post(BLUR, { src: tx(), dir: v2() }), bV1 = post(BLUR, { src: tx(), dir: v2() }), bH2 = post(BLUR, { src: tx(), dir: v2() }), bV2 = post(BLUR, { src: tx(), dir: v2() });
const mComp = post(COMP, { scn: tx(), b1: tx(), b2: tx(), glow: { value: 0 }, blur: { value: 0 } });
function pass(m, target) { quad.material = m; renderer.setRenderTarget(target); renderer.render(postScene, postCam); }
function sizeTargets() {
  if (!renderer) return; const T = TIERS[tier], h = effH(tier), w = Math.max(2, Math.round(h * cssW / cssH));
  if (!rtScene || rtScene.samples !== T.aa) { if (rtScene) rtScene.dispose(); rtScene = new THREE.WebGLRenderTarget(w, h, { samples: T.aa, depthBuffer: true }); } else rtScene.setSize(w, h);
  const mk = (rt, d) => { const ww = Math.max(1, Math.round(w / d)), hh = Math.max(1, Math.round(h / d)); if (!rt) return new THREE.WebGLRenderTarget(ww, hh, { depthBuffer: false }); rt.setSize(ww, hh); return rt; };
  rtA = mk(rtA, 4); rtB = mk(rtB, 4); rtC = mk(rtC, 8); rtD = mk(rtD, 8);
  mDown.uniforms.src.value = rtScene.texture; mDown.uniforms.px.value.set(1 / w, 1 / h);
  bH1.uniforms.src.value = rtA.texture; bH1.uniforms.dir.value.set(1 / rtA.width, 0); bV1.uniforms.src.value = rtB.texture; bV1.uniforms.dir.value.set(0, 1 / rtA.height);
  mDown2.uniforms.src.value = rtA.texture; mDown2.uniforms.px.value.set(1 / rtA.width, 1 / rtA.height);
  bH2.uniforms.src.value = rtC.texture; bH2.uniforms.dir.value.set(1 / rtC.width, 0); bV2.uniforms.src.value = rtD.texture; bV2.uniforms.dir.value.set(0, 1 / rtC.height);
  mComp.uniforms.scn.value = rtScene.texture; mComp.uniforms.b1.value = rtA.texture; mComp.uniforms.b2.value = rtC.texture;
}
function resize() { if (!renderer) return; const r = cv.getBoundingClientRect(); if (!r.width) return; cssW = r.width; cssH = r.height; renderer.setPixelRatio(DPR); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); sizeTargets(); }

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
  retro: { name: 'Retro', desc: 'Neon grid and a synth sun', card: 'linear-gradient(160deg,#12002a,#ff3fd8 70%,#ffd23f)', fog: 0x14052e, hemi: [0x9a7aff, 0x1a0a2a, 1.4], end: 0xff5fa8, bloom: [0.95, 0.55],
    pal: { block: 0x241a44, blockE: 0x8a4dff, edge: 0xff3fd8, edge2: 0x20e3ff, barrier: 0xff7a1a, gate: 0x1b1238, gateE: 0x20e3ff, pod: 0x161030, podE: 0x20e3ff, spin: 0xffd23f, trail: 0x20e3ff } },
  woods: { name: 'Woods', desc: 'A glowing forest tunnel at dusk', card: 'linear-gradient(160deg,#0d2010,#3d7a2e 60%,#ffcf6b)', fog: 0x0e1a0c, hemi: [0xd8f0a0, 0x1a120a, 1.5], end: 0xffc46b, bloom: [0.7, 0.6],
    pal: { block: 0x3b2a1c, blockE: 0x6b4a2a, edge: 0x9cff5a, edge2: 0xffcf6b, barrier: 0x6b3f1e, gate: 0x2a1c10, gateE: 0x9cff5a, pod: 0x2b3a1a, podE: 0xffcf6b, spin: 0xffcf6b, trail: 0xbfff7a } },
  basic: { name: 'Basic', desc: 'Plain grey walls, simple bright shapes', card: 'linear-gradient(160deg,#5b616b,#9aa1ab 60%,#e84a3c)', fog: 0xb4bac3, hemi: [0xffffff, 0x8a8f98, 1.8], end: 0xffffff, bloom: [0.4, 0.8],
    pal: { block: 0xe84a3c, blockE: 0xe84a3c, edge: 0x2b2f36, edge2: 0x2b2f36, barrier: 0xff9f1a, gate: 0x2f7de1, gateE: 0x1d4f94, pod: 0x2fb85a, podE: 0x1b7a3a, spin: 0xffd23f, trail: 0x2f7de1 } }
};
let world = ls('nr-world', 'retro'); if (!WORLDS[world]) world = 'retro';
scene.fog = new THREE.Fog(0x000000, 40, 175);
const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1.4); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(0, 0, 10); scene.add(key);
// 🌀 the tunnel wall: one cylinder, drawn by a shader that knows which world you picked
// a tiling noise picture (4 channels), made once: much cheaper than working out noise for every pixel every frame
function noiseTex() { const N = 128, P = 8, d = new Uint8Array(N * N * 4), L = [];
  for (let c = 0; c < 4; c++) { const oct = []; for (let o = 0; o < 4; o++) { const g = P << o, a = new Float32Array(g * g); for (let i = 0; i < g * g; i++) a[i] = R0(); oct.push({ g, a }); } L.push(oct); }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) for (let c = 0; c < 4; c++) { let sum = 0, amp = 0.5; for (const { g, a } of L[c]) { const fx = x / N * g, fy = y / N * g, ix = Math.floor(fx), iy = Math.floor(fy), sx = (fx - ix) * (fx - ix) * (3 - 2 * (fx - ix)), sy = (fy - iy) * (fy - iy) * (3 - 2 * (fy - iy)); const at = (i, j) => a[((iy + j) % g) * g + (ix + i) % g]; sum += amp * lerp(lerp(at(0, 0), at(1, 0), sx), lerp(at(0, 1), at(1, 1), sx), sy); amp *= 0.5; } d[(y * N + x) * 4 + c] = Math.round(sum / 0.9375 * 255); }
  const t = new THREE.DataTexture(d, N, N); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t; }
const wallMat = new THREE.ShaderMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false,
  uniforms: { dist: { value: 0 }, time: { value: 0 }, mode: { value: 0 }, fogc: { value: new THREE.Color() }, R: { value: RAD }, nz: { value: noiseTex() } },
  vertexShader: 'varying vec3 vP; varying float vD; void main(){ vP = (modelMatrix * vec4(position,1.0)).xyz; vec4 mv = viewMatrix * vec4(vP,1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }',
  fragmentShader: `uniform float dist; uniform float time; uniform float mode; uniform vec3 fogc; uniform float R; uniform sampler2D nz; varying vec3 vP; varying float vD;
    float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float aaline(float x, float hw, float w){ float d = abs(fract(x) - 0.5); float l = smoothstep(0.5 - hw - w, 0.5 - hw + w, d); return mix(l, 2.0 * hw, smoothstep(0.15, 0.4, w)); }
    float dash(float x, float on, float w){ float f = fract(x); float a = smoothstep(on - w, on + w, f) * (1.0 - smoothstep(1.0 - w, 1.0, f)); return mix(a, 1.0 - on, smoothstep(0.15, 0.4, w)); }
    void main(){
      float th = atan(vP.x, -vP.y); float u = th * R; float s = vP.z - dist, sm = s; vec3 c;
      float C = 6.2831853 * R, t01 = (th + 3.14159265) / 6.2831853;
      float r2 = max(dot(vP.xy, vP.xy), 0.0001);
      float dtx = (-vP.y * dFdx(vP.x) + vP.x * dFdx(vP.y)) / r2, dty = (-vP.y * dFdy(vP.x) + vP.x * dFdy(vP.y)) / r2;
      float du = R * (abs(dtx) + abs(dty)), ds = abs(dFdx(vP.z)) + abs(dFdy(vP.z));
      vec2 gx = vec2(dtx / 6.2831853, dFdx(vP.z)), gy = vec2(dty / 6.2831853, dFdy(vP.z));
      #define NZ(k, ss, o) (textureGrad(nz, vec2(t01 * k + o * 0.137, s * ss * 0.125 + o * 0.311), gx * vec2(k, ss * 0.125), gy * vec2(k, ss * 0.125)).r * 0.9375)
      if (mode < 0.5) {
        float cu = C / 16.0, cs = 2.4;
        float l = max(aaline(u / cu, 0.03, du / cu), aaline(s / cs, 0.03, ds / cs));
        vec3 lc = mix(vec3(1.0,0.25,0.85), vec3(0.13,0.89,1.0), 0.5 + 0.5 * sin(th));
        float band = smoothstep(0.92, 1.0, abs(sin(s * 0.13)));
        c = vec3(0.03,0.01,0.08) + lc * (l * 0.9 + band * 0.35);
        float lane = aaline(u / (C / 8.0), 0.025, du / (C / 8.0)) * dash(sm / 3.0, 0.55, ds / 3.0); c += vec3(1.0) * lane * 0.9;
      } else if (mode < 1.5) {
        float b = NZ(2.0, 0.08, 0.0); float root = smoothstep(0.75, 0.95, abs(sin(u + NZ(1.0, 0.05, 11.0) * 6.0)));
        vec3 bark = mix(vec3(0.16,0.10,0.06), vec3(0.32,0.22,0.13), b); vec3 moss = vec3(0.14,0.32,0.10) * (0.6 + 0.6 * NZ(3.0, 0.2, 5.0));
        c = mix(bark, moss, smoothstep(0.45, 0.7, NZ(1.0, 0.06, 3.0))) + root * vec3(0.18,0.12,0.06);
        float top = smoothstep(0.2, -0.9, cos(th));
        float leaf = smoothstep(0.55, 0.8, textureGrad(nz, vec2(t01 * 2.0, (s * 0.12 + time * 0.1) * 0.125), gx * vec2(2.0, 0.015), gy * vec2(2.0, 0.015)).g * 0.9375);
        c = mix(c, vec3(0.35,0.62,0.18), top * leaf * 0.8) + vec3(1.0,0.85,0.45) * top * smoothstep(0.78, 0.9, NZ(2.0, 0.1, 7.0)) * 0.6;
        c *= 1.15;
        float slit = smoothstep(0.93, 1.0, sin(s * 0.55 + sin(th * 3.0) * 0.8)); c += vec3(1.0,0.8,0.4) * slit * 0.22;
        vec2 gc = vec2(u / (C / 24.0), s / 2.2); float glow = step(0.9, h21(vec2(mod(floor(gc.x), 24.0), floor(gc.y)))) * smoothstep(0.35, 0.0, length(fract(gc) - 0.5)); c += vec3(0.6,1.0,0.4) * glow * 1.3 * (1.0 - smoothstep(0.2, 0.5, ds / 2.2));
        float wl = aaline(u / (C / 6.0), 0.025, du / (C / 6.0)) * dash(sm / 3.5, 0.6, ds / 3.5); c += vec3(1.0) * wl * 0.8;
      } else {
        float cu = C / 12.0, cs = 4.0;
        float seam = max(aaline(u / cu, 0.02, du / cu), aaline(s / cs, 0.02, ds / cs));
        c = vec3(0.56,0.58,0.62) * (0.82 + 0.18 * smoothstep(1.0, -1.0, cos(th))) - seam * 0.12;
        float wl = aaline(u / (C / 8.0), 0.022, du / (C / 8.0)) * dash(sm / 3.0, 0.6, ds / 3.0); c = mix(c, vec3(1.0), wl * 0.9);
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
const jacket = new THREE.Color().setHSL(R0(), 0.75, 0.55).getHex();
const phong = (color, o = {}) => new THREE.MeshPhongMaterial({ color, shininess: o.s ?? 60, specular: o.sp ?? 0x3a3a3a, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1 });
function roundRect(w, l, r) { const sh = new THREE.Shape(), x = w / 2, y = l / 2; sh.moveTo(-x + r, -y); sh.lineTo(x - r, -y); sh.quadraticCurveTo(x, -y, x, -y + r); sh.lineTo(x, y - r); sh.quadraticCurveTo(x, y, x - r, y); sh.lineTo(-x + r, y); sh.quadraticCurveTo(-x, y, -x, y - r); sh.lineTo(-x, -y + r); sh.quadraticCurveTo(-x, -y, -x + r, -y); return sh; }
const slab = (w, l, r, t, bev) => { const g = new THREE.ExtrudeGeometry(roundRect(w, l, r), { depth: t, bevelEnabled: bev > 0, bevelSize: bev, bevelThickness: bev, bevelSegments: 4, curveSegments: 12 }); g.rotateX(Math.PI / 2); return g; }; // a rounded slab lying flat (w across, l along the tube)
// 🛹 the hoverboard: a rounded deck with a glowing rim and stripe, and two thrusters at the back
const boardMat = phong(0x16122c, { s: 110, sp: 0x8888aa, e: 0x20e3ff, ei: 0.1 }), edgeMat = basic(0x20e3ff);
const board = new THREE.Mesh(slab(0.6, 1.72, 0.29, 0.06, 0.03), boardMat); board.position.y = 0.38;
const boardEdge = new THREE.Mesh(slab(0.7, 1.84, 0.34, 0.03, 0), edgeMat); boardEdge.position.y = 0.325;
const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 1.25), edgeMat); stripe.position.y = 0.415;
const under = new THREE.Sprite(glowMat(0x20e3ff, 0.9)); under.scale.set(1.8, 2.6, 1); under.position.y = 0.12;
const thrMat = phong(0x2c2c3c, { s: 90, sp: 0x777777 }), flames = [], nozzles = [];
for (const sx of [-0.17, 0.17]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.32, 18), thrMat); t.rotation.x = Math.PI / 2; t.position.set(sx, 0.3, 0.8);
  const f = new THREE.Sprite(glowMat(0x20e3ff, 0.95)); f.scale.set(0.45, 0.45, 1); f.position.set(sx, 0.3, 1.0); const nzl = new THREE.Object3D(); nzl.position.set(sx, 0.3, 1.0); flames.push(f); nozzles.push(nzl); rig.add(t, f, nzl); }
// 🧍 the rider: side-on stance, knees in, arms out for balance, helmet with a visor
const body = new THREE.Group(); body.position.y = 0.42; body.rotation.y = 0.35;
const suit = phong(0x24213c, { s: 25 }), jac = phong(jacket, { s: 45, e: jacket, ei: 0.06 }), shell = phong(0xf2f3f8, { s: 120, sp: 0x999999 });
const cap = (r, l, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 8, 16), m);
for (const z of [-0.3, 0.3]) { const leg = cap(0.095, 0.5, suit); leg.position.set(0, 0.35, z * 0.667); leg.rotation.x = z < 0 ? 0.33 : -0.33; const boot = new THREE.Mesh(slab(0.3, 0.17, 0.07, 0.07, 0.025), shell); boot.position.set(0.02, 0.1, z); body.add(leg, boot); }
const hips = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), suit); hips.position.y = 0.66;
const torso = cap(0.19, 0.34, jac); torso.position.set(0.02, 0.98, 0); torso.rotation.z = -0.15;
const arms = []; for (const sg of [-1, 1]) { const sh = new THREE.Group(); sh.position.set(0.02, 1.22, sg * 0.21); const a = cap(0.065, 0.42, jac); a.position.y = -0.26; const hand = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), shell); hand.position.y = -0.52; sh.add(a, hand); sh.rotation.x = -sg * 1.05; sh.userData.s = sg; arms.push(sh); body.add(sh); }
const head = new THREE.Group(); head.position.set(0.04, 1.5, 0); head.rotation.y = 1.2;
const visorMat = phong(0x0b0b16, { s: 160, sp: 0xffffff, e: 0x20e3ff, ei: 0.35 });
head.add(new THREE.Mesh(new THREE.SphereGeometry(0.19, 32, 24), shell), new THREE.Mesh(new THREE.SphereGeometry(0.197, 32, 16, Math.PI - 0.95, 1.9, 1.0, 0.75), visorMat), new THREE.Mesh(new THREE.TorusGeometry(0.193, 0.014, 8, 48, Math.PI), edgeMat));
body.add(hips, torso, head);
const shieldBall = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 16), new THREE.MeshBasicMaterial({ color: 0x20e3ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })); shieldBall.position.y = 0.9; shieldBall.visible = false;
rig.add(under, board, boardEdge, stripe, body, shieldBall);
// ✨ two smooth light trails from the thrusters (ribbons that fade out behind you)
const TRN = 44, ribbonMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { color: { value: new THREE.Color(0x20e3ff) } },
  vertexShader: 'attribute float alpha; attribute float sd; varying float vA; varying float vS; void main(){ vA = alpha; vS = sd; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 color; varying float vA; varying float vS; void main(){ float e = 1.0 - vS * vS; gl_FragColor = vec4(mix(color, vec3(1.0), e * e * 0.6), vA * e); }' });
const RIBS = nozzles.map(() => { const pos = new Float32Array(TRN * 6), al = new Float32Array(TRN * 2), sd = new Float32Array(TRN * 2), idx = []; for (let i = 0; i < TRN; i++) { sd[i * 2] = -1; sd[i * 2 + 1] = 1; } for (let i = 0; i < TRN - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('alpha', new THREE.BufferAttribute(al, 1)); g.setAttribute('sd', new THREE.BufferAttribute(sd, 1)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400); const m = new THREE.Mesh(g, ribbonMat); m.frustumCulled = false; m.renderOrder = 6; scene.add(m); return { g, pos, al, p: new Float32Array(TRN * 3), fresh: true }; });
let ribT = 0, ribFade = 0;
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
const M4 = new THREE.Matrix4(), QI = new THREE.Quaternion(), SL3 = new THREE.Vector3(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), V = new THREE.Vector3(), V2 = new THREE.Vector3(), SC = new THREE.Vector3(1, 1, 1), ZA = new THREE.Vector3(0, 0, 1), YA = new THREE.Vector3(0, 1, 0), XA = new THREE.Vector3(1, 0, 0), QX = new THREE.Quaternion().setFromAxisAngle(XA, Math.PI / 2);
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
  edgeMat.color.set(P.trail); under.material.color.set(P.trail); ribbonMat.uniforms.color.value.set(P.trail).convertLinearToSRGB(); flames.forEach(f => f.material.color.set(P.trail)); visorMat.emissive.set(P.trail); boardMat.emissive.set(P.trail);
}

/* ================= the run ================= */
const S = { running: false, paused: false, dead: false, t: 0, dist: 0, sd: 0, coins: 0, bonus: 0, v: 15, th: 0, w: 0, h: 0, vh: 0, inv: 0, shield: false, magnet: 0, boost: 0, nextSpawn: 0, nextPup: 450, freeTh: 0, deathT: 0, lastMark: 0, shake: 0, jumpBuf: 0, tpCool: 0, camTh: 0, warp: 0, airT: 0, flip: 0, big: false, squash: 0, thump: 0, tp: null };
let keys = {}, token = null, best = 0;
function resetRun() {
  for (const o of active.splice(0)) freeObs(o); coins.forEach(c => { c.on = false; }); pupItems.forEach(p => { p.on = false; p.g.visible = false; });
  Object.assign(S, { running: true, paused: false, dead: false, t: 0, dist: 0, sd: 0, coins: 0, bonus: 0, v: 0, th: 0, w: 0, h: 0, vh: 0, inv: 0, shield: false, magnet: 0, boost: 0, nextSpawn: 150, nextPup: 450 + R0() * 200, freeTh: 0, deathT: 0, lastMark: 0, shake: 0, jumpBuf: 0, tpCool: 0, camTh: 0, warp: 0, airT: 0, flip: 0, big: false, squash: 0, thump: 0, tp: null });
  keys = {}; RIBS.forEach(r => { r.fresh = true; }); ribFade = 0; spLife.fill(0);
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
const hudC = {}; const setT = (id, t) => { if (hudC[id] !== t) { hudC[id] = t; $(id).textContent = t; } };
function hud() {
  setT('#hScore', nf(score())); setT('#hDist', nf(S.dist) + ' m'); setT('#hCoins', '🪙 ' + nf(S.coins)); setT('#hSpd', nf(S.v * 3.6));
  const list = Object.entries(PU).map(([k, P]) => [k, P, k === 'shield' ? (S.shield ? 1 : 0) : clamp(S[k] / P.time, 0, 1)]).filter(x => x[2] > 0), sig = list.map(x => x[0]).join();
  const box = $('#pups'); if (box.dataset.sig !== sig) { box.dataset.sig = sig; box.replaceChildren(); list.forEach(([k, P]) => { const row = el('div', 'pup'); row.style.color = '#' + P.col.toString(16).padStart(6, '0'); row.dataset.k = k; const bar = el('i'); bar.appendChild(el('b')); row.append(el('span', '', P.icon), bar); box.appendChild(row); }); }
  list.forEach(([k, , left]) => { const b = box.querySelector('[data-k="' + k + '"] b'); if (b) b.style.width = (left * 100).toFixed(1) + '%'; });
  const tb = $('#tpBtn'); if (tb) tb.classList.toggle('cool', S.tpCool > 0);
}
const rollQ = th => Q.setFromAxisAngle(ZA, th), V3 = new THREE.Vector3();
let tPrev = 0, tAll = 0, lastHud = 0, menuDist = 0, dtS = 1 / 60, drift = 0, fpsN = 0, fpsT = 0;
// 📈 Auto graphics: learn the screen's refresh rate, then step the picture size and glow down (or back up) to keep up with it
const perf = { hz: [], refresh: 1 / 60, n: 0, t: 0, cool: 3, upWait: 6, fails: {} };
function setTier(t) { tier = t; sizeTargets(); if (gfx === 'auto') lset('nr-tier', t); }
function tune(raw) {
  if (perf.hz.length < 90 && raw > 0.0025 && raw < 0.25) { perf.hz.push(raw); if (perf.hz.length === 90) perf.refresh = Math.min(1 / 60, perf.hz.slice().sort((a, b) => a - b)[9]); } // the quickest frames show the screen's refresh rate (a slow device counts as 60 Hz)
  fpsN++; fpsT += raw; if (fpsT >= 0.5) { if (showFps) $('#fps').textContent = Math.round(fpsN / fpsT) + ' fps · ' + (rtScene ? rtScene.height : 0) + 'p' + (TIERS[tier].glow ? ' · glow' : '') + (gfx === 'auto' ? ' · auto' : ''); fpsN = 0; fpsT = 0; }
  if (gfx !== 'auto' || S.paused || document.hidden || perf.hz.length < 90 || raw > 0.25) { perf.n = 0; perf.t = 0; return; }
  perf.n++; perf.t += raw; perf.cool -= raw; perf.upWait -= raw; if (perf.t < 1) return;
  const fps = perf.n / perf.t, want = 0.88 * Math.min(1 / perf.refresh, 144); perf.n = 0; perf.t = 0;
  if (fps < want) { if (perf.cool <= 0 && tier > 0) { perf.fails[tier] = (perf.fails[tier] || 0) + 1; setTier(tier - 1); perf.cool = 1.2; perf.upWait = 10; } }
  else if (fps >= want * 1.07 && perf.upWait <= 0 && perf.cool <= 0 && tier < TIERS.length - 1 && (perf.fails[tier + 1] || 0) < 2) { const a = TIERS[tier], b = TIERS[tier + 1]; if (effH(tier + 1) > effH(tier) || a.aa !== b.aa || a.glow !== b.glow) { setTier(tier + 1); perf.cool = 1.5; perf.upWait = 6; } }
}
function draw() {
  const T = TIERS[tier], W = WORLDS[world]; renderer.setRenderTarget(rtScene); renderer.render(scene, camera);
  if (T.glow) { mDown.uniforms.th.value.set(W.bloom[1], W.bloom[1] + 0.35); pass(mDown, rtA); pass(bH1, rtB); pass(bV1, rtA); pass(mDown2, rtC); pass(bH2, rtD); pass(bV2, rtC); }
  mComp.uniforms.glow.value = T.glow ? W.bloom[0] : 0;
  mComp.uniforms.blur.value = T.glow && S.running && !S.paused ? clamp((S.v - 35) / 110, 0, 1) * 0.045 + (S.boost > 0 ? 0.025 : 0) + S.warp * 0.05 : 0; // 💨 speed blur towards the middle
  pass(mComp, null);
}
function frame(ts) {
  requestAnimationFrame(frame); if (!renderer || !rtScene) return;
  // smooth out uneven frame times so movement doesn't judder (any time lost is paid back gently)
  const raw = tPrev ? (ts - tPrev) / 1000 : 1 / 60; tPrev = ts; let dt;
  if (raw <= 0 || raw > 0.1) { dt = clamp(raw, 0.001, 0.05); dtS = Math.min(dt, 1 / 30); drift = 0; } else { dtS += (raw - dtS) * 0.12; drift += raw - dtS; const pay = drift * 0.15; drift -= pay; dt = clamp(dtS + pay, 0.0005, 0.05); }
  tAll += dt; tune(raw);
  if (S.running && !S.paused) { const n = Math.ceil(dt * 240 - 1e-6); for (let i = 0; i < n; i++) step(dt / n); } // ⏱ physics in fixed 1/240 s steps
  else if (!S.running && !S.dead) { const m = 16 * dt; wallMat.uniforms.dist.value -= m; menuDist += m; S.th += dt * 0.25; S.camTh = S.th; } // a gentle ride round the tube behind the menu
  const dist = -wallMat.uniforms.dist.value, mv = S.paused ? 0 : (S.running ? S.v : 16) * dt;
  // the rider stands on the wall at angle th, rotated so its "up" points to the middle of the tube
  const bob = S.h > 0 ? 0 : Math.sin(tAll * 7) * 0.04, tk = S.tp ? ease(Math.min(1, S.tp.t / S.tp.dur)) : 0;
  if (S.tp) { tpPos(S.tp, tk, 0.15, player.position); player.rotation.set(0, 0, S.tp.from + Math.PI * tk * S.tp.dir); } else { player.position.copy(onWall(S.th, S.h + 0.15 + bob, 0, V)); player.rotation.set(0, 0, S.th); }
  S.squash *= Math.exp(-dt * 9); S.thump *= Math.exp(-dt * 10);
  const st = S.h > 0 ? clamp(S.vh * 0.025, -0.12, 0.2) : 0; rig.scale.set(1 + S.squash * 0.6 - st * 0.4, 1 - S.squash + st, 1 + S.squash * 0.6 - st * 0.4); rig.rotation.x = -S.flip; rig.position.set(0, 0.8 - 0.8 * Math.cos(S.flip), 0.8 * Math.sin(S.flip)); // spin round the middle of the body, not the feet
  rig.rotation.z = -S.w * 0.035; rig.rotation.y = -S.w * 0.02 + (S.tp ? tk * TAU : 0); body.rotation.z = S.h > 0 ? Math.min(0.5, S.vh * -0.03) : 0;
  const lean = clamp(S.w / 40, -1, 1); for (const a of arms) { const sg = a.userData.s; a.rotation.x = -sg * (1.05 + lean * sg * 0.35) + Math.sin(tAll * 3 + sg) * 0.04; a.rotation.z = S.h > 0 ? -0.45 : 0; }
  body.position.y = 0.42 - S.squash * 0.12; head.rotation.z = -lean * 0.15;
  const fl = 0.35 + Math.min(0.5, S.v / 220) + (S.boost > 0 ? 0.35 : 0); flames.forEach((f, i) => { const k = fl * (0.85 + 0.15 * Math.sin(tAll * 47 + i * 2.1)); f.scale.set(k, k, 1); });
  player.visible = view === 'third' && !(S.inv > 0 && !S.boost && Math.floor(tAll * 14) % 2 === 0) && !(S.dead && S.deathT > 0.05);
  shieldBall.visible = S.shield || S.boost > 0; shieldBall.material.color.set(S.boost > 0 ? 0xffd23f : 0x20e3ff);
  // ✨ thruster light trails
  if (S.tp) { tpPos(S.tp, tk, 0.4, V2); burst(V2, 2, 1.5); }
  player.updateMatrixWorld(true); ribT += dt; const shift = ribT >= 1 / 90; if (shift) ribT %= 1 / 90;
  ribFade += ((S.running && !S.dead && view === 'third' ? 1 : 0) - ribFade) * (1 - Math.exp(-dt * 8)); const ra = (0.5 + Math.min(0.5, S.v / 160)) * ribFade;
  RIBS.forEach((rb, j) => { const P = rb.p; nozzles[j].getWorldPosition(V);
    if (rb.fresh) { for (let i = 0; i < TRN; i++) { P[i * 3] = V.x; P[i * 3 + 1] = V.y; P[i * 3 + 2] = V.z; } rb.fresh = false; }
    for (let i = 0; i < TRN; i++) P[i * 3 + 2] += mv; if (shift) P.copyWithin(3, 0, (TRN - 1) * 3); P[0] = V.x; P[1] = V.y; P[2] = V.z;
    for (let i = 0; i < TRN; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], r = Math.max(0.6, Math.hypot(x, y)), k = i / (TRN - 1), w = 0.075 * (1 - k * 0.7), ox = -y / r * w, oy = x / r * w;
      rb.pos[i * 6] = x - ox; rb.pos[i * 6 + 1] = y - oy; rb.pos[i * 6 + 2] = z; rb.pos[i * 6 + 3] = x + ox; rb.pos[i * 6 + 4] = y + oy; rb.pos[i * 6 + 5] = z; rb.al[i * 2] = rb.al[i * 2 + 1] = ra * Math.pow(1 - k, 1.5); }
    rb.g.attributes.position.needsUpdate = true; rb.g.attributes.alpha.needsUpdate = true; });
  for (let i = 0; i < SP; i++) { if (spLife[i] > 0) { spLife[i] -= dt; spPos[i * 3] += spVel[i * 3] * dt; spPos[i * 3 + 1] += spVel[i * 3 + 1] * dt; spPos[i * 3 + 2] += spVel[i * 3 + 2] * dt + mv; spAl[i] = clamp(spLife[i] * 2, 0, 1); } else spAl[i] = 0; }
  spGeo.attributes.position.needsUpdate = true; spGeo.attributes.alpha.needsUpdate = true;
  // coins and power-ups
  let k = 0; for (const c of coins) { if (!c.on) continue; Q.setFromAxisAngle(ZA, c.th).multiply(Q2.setFromAxisAngle(YA, tAll * 4 + c.z * 0.1)).multiply(QX); M4.compose(onWall(c.th, c.h, c.z, V), Q, SC); coinMesh.setMatrixAt(k++, M4); } coinMesh.count = k; coinMesh.instanceMatrix.needsUpdate = true;
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
  slMat.opacity = clamp((S.v - 20) / 40, 0.12, 0.55) * (S.running ? 1 : 0); const sls = 0.6 + S.v / 45; for (let i = 0; i < SL; i++) { const p = slPos[i]; p.z += (S.paused ? 0 : S.v) * dt * 1.7; if (p.z > 8) { p.z -= 90; p.th = R0() * TAU; p.r = 1.5 + R0() * (RAD - 2); } M4.compose(V.set(Math.sin(p.th) * p.r, -Math.cos(p.th) * p.r, p.z), QI, SL3.set(1, 1, sls)); speedLines.setMatrixAt(i, M4); } speedLines.instanceMatrix.needsUpdate = true;
  // 🎥 camera: rolls with you so the wall under your board is always "down" (third person, or C for first person)
  if (S.tp) S.camTh = S.tp.from + Math.PI * tk * S.tp.dir; else S.camTh += angDiff(S.th, S.camTh) * (1 - Math.exp(-dt * 14)); if (S.warp > 0) S.warp = Math.max(0, S.warp - dt * 2.5);
  const up = outward(S.camTh).negate(), base = S.tp ? tpPos(S.tp, tk, 0, V2) : onWall(S.camTh, S.h * (view === 'first' ? 0.85 : 0.3) - S.thump * 0.6, 0, V2);
  if (view === 'first') { camera.position.copy(base).addScaledVector(up, 1.55); camera.position.z = 0.25; } else { camera.position.copy(base).addScaledVector(up, 2.35); camera.position.z = 3.9; }
  if (S.shake > 0) { S.shake -= dt; camera.position.x += (R0() - 0.5) * S.shake; camera.position.y += (R0() - 0.5) * S.shake; }
  camera.up.copy(up); const look = S.tp ? tpPos(S.tp, tk, 0, V3).addScaledVector(up, 2.3).setZ(-16) : onWall(S.camTh, S.h * (view === 'first' ? 0.85 : 0.3) + (view === 'first' ? 1.35 : 2.3), -16, V3); camera.lookAt(look); // (aimed high so your rider sits low on screen)
  const fov = 68 + clamp(S.v / 70, 0, 1) * 24 + (S.boost > 0 ? 6 : 0) + S.warp * 14; if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * (1 - Math.exp(-dt * 6)); camera.updateProjectionMatrix(); }
  wallMat.uniforms.time.value = tAll; key.position.copy(camera.position);
  if (S.running && ts - lastHud > 90) { lastHud = ts; hud(); }
  draw();
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
  if ((e.key === 'f' || e.key === 'F') && !$('#app').hidden) { $('#fpsBtn').click(); return; }
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
const drawQ = () => document.querySelectorAll('#qSeg button').forEach(b => b.classList.toggle('on', b.dataset.q === gfx));
document.querySelectorAll('#qSeg button').forEach(b => { b.onclick = () => { gfx = b.dataset.q; lset('nr-gfx', gfx); perf.fails = {}; setTier(gfx === 'fast' ? 1 : gfx === 'sharp' ? 4 : autoStart()); drawQ(); }; }); drawQ();
const drawFps = () => { $('#fps').hidden = !showFps; const b = $('#fpsBtn'); b.setAttribute('aria-pressed', String(showFps)); b.textContent = showFps ? 'FPS: on' : 'FPS: off'; };
$('#fpsBtn').onclick = () => { showFps = !showFps; lset('nr-fps', showFps); drawFps(); }; drawFps();
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
window.__nr = { S, camera, player, scene, renderer, get tier() { return tier; }, setTier, get keys() { return keys; }, press, setView, setWorld(w) { world = w; applyWorld(); drawWorlds(); }, sim(sec, k) { if (k) Object.assign(keys, k); for (let t = 0; t < sec && S.running; t += 1 / 120) step(1 / 120); return { t: S.t, v: S.v, dist: S.dist, dead: S.dead, coins: S.coins, score: score(), th: S.th }; } }; // (for testing)

(async () => {
  const me = await api('/api/me'); if (me.status === 401) { location.replace('/?next=arcade'); return; }
  $('#loading').hidden = true;
  const j = window.ecLive ? await window.ecLive() : null;
  if (j && j.study && j.study.study) { $('#closedBox').hidden = false; return; }
  if (!renderer) { $('#noGl').hidden = false; return; }
  if (coarse) $('#stage').classList.add('coarse');
  applyWorld(); drawWorlds(); $('#app').hidden = false; resize(); addEventListener('resize', resize); requestAnimationFrame(frame); loadBoard();
})();
