// แผนที่ Pixel Art แบบมองจากด้านบน: หญ้า ทะเลสาบ ทางเดิน ต้นไม้ฤดูใบไม้ร่วง อาคาร และเมฆปกคลุมพื้นที่ที่ยังไม่สำรวจ
const T = 11; // ขนาดช่อง (px) — ค่าน้อย = ภาพขยายใหญ่ขึ้นบนจอ

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }
function disc(g, cx, cy, r, c, q = 2) {
  g.fillStyle = c;
  for (let y = -r; y <= r; y += q) for (let x = -r; x <= r; x += q) if (x * x + y * y <= r * r) g.fillRect(Math.round((cx + x) / q) * q, Math.round((cy + y) / q) * q, q, q);
}
function segDist(px_, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px_ - ax) * dx + (py - ay) * dy) / l));
  return Math.hypot(px_ - ax - t * dx, py - ay - t * dy);
}

const TREE = [
  '....oooooo....',
  '..ooyyyyyyoo..',
  '.oyhhyyyyyyyo.',
  '.oyhyyyyyyyso.',
  'oyyyyyyyysyyso',
  'oyyyyyysyyysso',
  'oyyysyyyyyysso',
  '.oyyyyyyyysso.',
  '.osyysyysssso.',
  '..ossssssooo..',
  '....oottoo....',
  '.....otto.....',
  '.....otto.....',
  '......oo......',
];
const TREE_PAL = [
  { o: '#6b3f12', y: '#f4c431', h: '#ffe680', s: '#e0952a', t: '#8a5a2b' },
  { o: '#6b3412', y: '#f0a336', h: '#ffd07a', s: '#d06a22', t: '#8a5a2b' },
  { o: '#24501a', y: '#5fae3a', h: '#8fd45e', s: '#3f8a2c', t: '#7a4f26' },
];
function tree(g, x, y, pal) {
  g.fillStyle = '#00000022'; g.fillRect(x + 1, y + 11, 13, 4);
  TREE.forEach((row, j) => [...row].forEach((c, i) => { if (c !== '.') px(g, x + i, y + j, 1, 1, pal[c]); }));
}

function cloud(g, cx, cy, r, R) {
  const puffs = [[0, 0, 1], [-0.7, 0.15, 0.7], [0.7, 0.1, 0.75], [-0.3, -0.45, 0.6], [0.35, -0.4, 0.65]];
  for (const [dx, dy, s] of puffs) disc(g, cx + dx * r, cy + dy * r + 4, r * s * 0.62, '#c9d6e8', 4);
  for (const [dx, dy, s] of puffs) disc(g, cx + dx * r, cy + dy * r, r * s * 0.62, '#ffffff', 4);
  for (let k = 0; k < 6; k++) px(g, cx + (R() - 0.5) * r, cy + (R() - 0.5) * r * 0.6, 4, 4, '#eef4fb');
}

// ---------- อาคาร (สถานที่สำคัญของแต่ละโลก) ----------
export function building(g, type, cx, by) {
  const x = Math.round(cx - 20), y = Math.round(by - 40);
  const k = '#3b2414';
  g.fillStyle = '#00000026'; g.fillRect(x + 2, by - 4, 40, 6);
  if (type === 'hut') { // สำนักงานนักสืบ
    px(g, x + 4, y + 18, 32, 20, k); px(g, x + 5, y + 19, 30, 18, '#c08552');
    for (let i = 0; i < 4; i++) px(g, x + 5, y + 22 + i * 4, 30, 1, '#9a6538');
    for (let i = 0; i < 9; i++) px(g, x + 2 + i * 2, y + 17 - i, 36 - i * 4, 2, i % 2 ? '#b8423a' : '#d0574a');
    px(g, x + 16, y + 26, 8, 12, k); px(g, x + 17, y + 27, 6, 11, '#6b3f1f');
    px(g, x + 7, y + 23, 6, 6, k); px(g, x + 8, y + 24, 4, 4, '#ffe08a');
    px(g, x + 27, y + 23, 6, 6, k); px(g, x + 28, y + 24, 4, 4, '#ffe08a');
    px(g, x + 26, y + 31, 10, 6, k); px(g, x + 27, y + 32, 8, 4, '#f4dfb0'); px(g, x + 29, y + 33, 4, 1, '#6b3f1f');
  } else if (type === 'tower') { // หอนาฬิกา
    px(g, x + 11, y - 6, 18, 44, k); px(g, x + 12, y - 5, 16, 42, '#a9b1bc');
    for (let i = 0; i < 10; i++) px(g, x + 12, y - 2 + i * 4, 16, 1, '#8b93a0');
    for (let i = 0; i < 6; i++) px(g, x + 10 + i, y - 12 + i * 1, 20 - i * 2, 1, '#4e64b3');
    px(g, x + 9, y - 7, 22, 3, '#3b4f99');
    disc(g, x + 20, y + 6, 6, k, 1); disc(g, x + 20, y + 6, 5, '#fff7e0', 1);
    px(g, x + 20, y + 2, 1, 4, k); px(g, x + 20, y + 6, 3, 1, k);
    px(g, x + 17, y + 28, 6, 10, '#4a2f1d');
  } else if (type === 'cave') { // ถ้ำยุคหิน
    disc(g, x + 20, y + 30, 20, k, 2); disc(g, x + 20, y + 30, 18, '#a8927a', 2);
    disc(g, x + 14, y + 22, 7, '#c2ac92', 2); disc(g, x + 27, y + 26, 5, '#8d7863', 2);
    disc(g, x + 20, y + 36, 8, '#2a1d14', 2);
    px(g, x + 0, by - 4, 42, 6, '#64b947');
    px(g, x + 8, y + 26, 2, 2, '#b5452f'); px(g, x + 11, y + 24, 2, 2, '#b5452f'); px(g, x + 30, y + 25, 2, 2, '#b5452f');
    px(g, x + 36, y + 32, 6, 5, k); px(g, x + 37, y + 33, 4, 3, '#9aa0a6');
  } else if (type === 'stupa') { // ศาสนสถาน
    px(g, x + 4, y + 30, 32, 8, k); px(g, x + 5, y + 31, 30, 6, '#b8573a');
    px(g, x + 8, y + 24, 24, 7, k); px(g, x + 9, y + 25, 22, 5, '#c96a45');
    disc(g, x + 20, y + 20, 9, k, 1); disc(g, x + 20, y + 20, 8, '#e0b347', 1);
    px(g, x + 11, y + 20, 18, 4, '#e0b347');
    for (let i = 0; i < 12; i++) px(g, x + 19 - (i < 6 ? 2 : 1), y + 1 + i, i < 6 ? 4 : 2, 1, i % 3 ? '#f2c94c' : '#c89526');
    px(g, x + 19, y - 3, 2, 4, '#ffe680');
  } else if (type === 'city') { // กำแพงเมือง
    px(g, x, y + 16, 40, 22, k); px(g, x + 1, y + 17, 38, 20, '#d1b780');
    for (let i = 0; i < 5; i++) { px(g, x + 1 + i * 8, y + 12, 5, 5, k); px(g, x + 2 + i * 8, y + 13, 3, 4, '#d1b780'); }
    for (let i = 0; i < 4; i++) px(g, x + 1, y + 21 + i * 4, 38, 1, '#b39a63');
    px(g, x + 14, y + 24, 12, 14, k); px(g, x + 15, y + 25, 10, 13, '#5a3a22');
    px(g, x + 19, y + 2, 1, 12, k); px(g, x + 20, y + 2, 8, 5, '#d64541');
  } else { // หอจดหมายเหตุ
    px(g, x, y + 14, 40, 24, k); px(g, x + 1, y + 15, 38, 22, '#e9dfc7');
    for (let i = 0; i < 5; i++) px(g, x + 4 + i * 8, y + 17, 3, 20, '#c9bc9c');
    for (let i = 0; i < 8; i++) px(g, x + i * 2.5, y + 13 - i, 40 - i * 5, 1, i % 2 ? '#e8b33a' : '#c99224');
    px(g, x - 2, y + 13, 44, 2, k);
    px(g, x + 16, y + 26, 8, 12, '#5a3a22');
  }
}

// สร้างแผนที่ ส่งคืน canvas ขนาด w×h ช่อง
// spec: { w, h, seed, lakes:[{x,y,rx,ry}], nodes:[{x,y}], buildings:[{x,y,type}], fog:[{x,y,r}] } (หน่วยช่อง)
export function drawMap(spec) {
  const W = spec.w * T, H = spec.h * T, R = rng(spec.seed || 7);
  const c = document.createElement('canvas'); c.width = W; c.height = H; c.className = 'mapcanvas';
  const g = c.getContext('2d');
  const nodes = (spec.nodes || []).map(n => ({ x: n.x * T, y: n.y * T }));
  const lakes = (spec.lakes || []).map(l => ({ x: l.x * T, y: l.y * T, rx: l.rx * T, ry: l.ry * T }));
  const lakeD = (x, y) => Math.min(...lakes.map(l => ((x - l.x) / l.rx) ** 2 + ((y - l.y) / l.ry) ** 2), 99);

  // หญ้า
  px(g, 0, 0, W, H, '#64b947');
  for (let i = 0; i < W * H / 90; i++) {
    const x = Math.floor(R() * W / 2) * 2, y = Math.floor(R() * H / 2) * 2;
    px(g, x, y, 2, 2, R() < 0.5 ? '#72c754' : '#58aa3e');
  }
  for (let i = 0; i < W * H / 400; i++) { const x = R() * W, y = R() * H; px(g, x, y, 1, 3, '#4c9a35'); px(g, x + 2, y + 1, 1, 2, '#4c9a35'); }

  // ทะเลสาบ + ชายหาด (บล็อก 4px)
  for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) {
    const d = lakeD(x + 2, y + 2) + (R() - 0.5) * 0.08;
    if (d < 1) px(g, x, y, 4, 4, d < 0.45 ? '#3f8fd6' : '#4da6e8');
    else if (d < 1.22) px(g, x, y, 4, 4, d < 1.1 ? '#ecd38f' : '#d8bb72');
  }
  for (let i = 0; i < W * H / 500; i++) {
    const x = Math.floor(R() * W), y = Math.floor(R() * H);
    if (lakeD(x, y) < 0.8 && lakeD(x + 8, y) < 0.8) { px(g, x, y, 6, 1, '#9bd6f8'); px(g, x + 2, y - 1, 3, 1, '#cdeeff'); }
  }

  // ทางเดิน
  const seg = [];
  for (let i = 1; i < nodes.length; i++) seg.push([nodes[i - 1], nodes[i]]);
  for (const [color, r] of [['#b8914c', 9], ['#d8b66a', 7], ['#e6c983', 4]]) {
    for (const [a, b] of seg) {
      const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3);
      for (let k = 0; k <= n; k++) disc(g, a.x + (b.x - a.x) * k / n, a.y + (b.y - a.y) * k / n, r, color, 2);
    }
  }
  for (const n of nodes) { disc(g, n.x, n.y, 13, '#b8914c', 2); disc(g, n.x, n.y, 11, '#e6c983', 2); }
  const nearPath = (x, y, m) => seg.some(([a, b]) => segDist(x, y, a.x, a.y, b.x, b.y) < m) || nodes.some(n => Math.hypot(n.x - x, n.y - y) < m + 8);

  // ดอกไม้และก้อนหิน
  for (let i = 0; i < W * H / 1400; i++) {
    const x = R() * W, y = R() * H;
    if (lakeD(x, y) < 1.3 || nearPath(x, y, 10)) continue;
    if (R() < 0.7) { const col = ['#ffffff', '#ff6b6b', '#ffd84d', '#c78bff'][Math.floor(R() * 4)]; px(g, x, y, 2, 2, col); px(g, x + 3, y + 2, 2, 2, col); }
    else { px(g, x, y, 6, 4, '#3b2414'); px(g, x + 1, y, 4, 3, '#a7a9ad'); }
  }

  // ต้นไม้ (เรียงตามแนวตั้งให้ซ้อนกันถูก)
  const blocked = (spec.buildings || []).map(b => ({ x: b.x * T, y: b.y * T }));
  const trees = [];
  for (let y = -6; y < H; y += 11) for (let x = -6 + (y % 22 ? 6 : 0); x < W; x += 13) {
    const tx = x + (R() - 0.5) * 8, ty = y + (R() - 0.5) * 6;
    if (R() > (spec.density ?? 0.5)) continue;
    if (lakeD(tx + 7, ty + 12) < 1.5 || nearPath(tx + 7, ty + 12, 18)) continue;
    if (blocked.some(b => Math.abs(b.x - tx - 7) < 34 && ty + 14 > b.y - 50 && ty < b.y + 10)) continue;
    trees.push({ x: tx, y: ty, p: TREE_PAL[R() < 0.15 ? 2 : R() < 0.35 ? 1 : 0] });
  }
  const drawables = [...trees.map(t => ({ y: t.y + 14, f: () => tree(g, Math.round(t.x), Math.round(t.y), t.p) })),
    ...blocked.map((b, i) => ({ y: b.y, f: () => building(g, spec.buildings[i].type, b.x, b.y) }))];
  drawables.sort((a, b) => a.y - b.y).forEach(d => d.f());

  // เมฆปกคลุมพื้นที่ที่ยังไม่ปลดล็อก
  for (const f of spec.fog || []) {
    const fx = f.x * T, fy = f.y * T, r = f.r * T;
    for (let k = 0; k < 7; k++) cloud(g, fx + (R() - 0.5) * r * 1.2, fy + (R() - 0.5) * r * 0.9, r * (0.45 + R() * 0.25), R);
  }
  return c;
}

// ---------- ไอคอน Pixel 10×10 ----------
const ICONS = {
  map: ['kkkkkkkkkk', 'kggbbgggyk', 'kgbbbggyyk', 'kgbbggyyyk', 'kggggyyggk', 'kgrgyyggrk', 'kggyygggrk', 'kgyygrgggk', 'kggggggggk', 'kkkkkkkkkk'],
  hero: ['...kkkk...', '..kyyyyk..', '.kkkkkkkk.', '..kssssk..', '..kskskk..', '...kssk...', '.kbbbbbbk.', '.kbbbbbbk.', '..kpkkpk..', '..kk..kk..'],
  bag: ['...kkkk...', '..k....k..', '.kkkkkkkk.', 'kwwwwwwwwk', 'kwwwyywwwk', 'kwwwyywwwk', 'kwwwwwwwwk', 'kwwwwwwwwk', '.kkkkkkkk.', '..........'],
  skill: ['....kk....', '...kyyk...', '...kyyk...', 'kkkkyykkkk', 'kyyyyyyyyk', '.kyyyyyyk.', '..kyyyyk..', '.kyykkyyk.', '.kyk..kyk.', '.kk....kk.'],
  book: ['.kkkkkkkk.', 'kbbbbbbbwk', 'kbyybbbbwk', 'kbbbbbbbwk', 'kbyyybbbwk', 'kbbbbbbbwk', 'kbbbbbbbwk', 'kbbbbbbbwk', 'kwwwwwwwwk', '.kkkkkkkk.'],
  shelf: ['kkkkkkkkkk', 'krrbbyyggk', 'krrbbyyggk', 'krrbbyyggk', 'kwwwwwwwwk', 'kkkkkkkkkk', 'kbbggrryyk', 'kbbggrryyk', 'kwwwwwwwwk', 'kkkkkkkkkk'],
  chest: ['..........', '.kkkkkkkk.', 'kwwwwwwwwk', 'kwwwwwwwwk', 'kkkkyykkkk', 'kwwwykwwwk', 'kwwwwwwwwk', 'kwwwwwwwwk', 'kkkkkkkkkk', '..........'],
  door: ['.kkkkkkk..', '.kwwwwwk..', '.kwwwwwk..', '.kwwwwwk.y', '.kwwwywkyy', '.kwwwwwk.y', '.kwwwwwk..', '.kwwwwwk..', '.kwwwwwk..', 'kkkkkkkkk.'],
  coin: ['..........', '...kkkk...', '..kyyyyk..', '.kyywyyyk.', '.kywyyyyk.', '.kyyyyysk.', '.kyyyyssk.', '..ksssk...', '...kkkk...', '..........'],
  pick: ['..kkkkk...', '.kwwwwwk..', 'kwk...kwk.', 'k..kk..k..', '...kbk....', '....kbk...', '.....kbk..', '......kbk.', '.......kbk', '........kk'],
  gem: ['..........', '..kkkkkk..', '.kcwcccck.', 'kcwccccbck', 'kccccccbbk', '.kccccbbk.', '..kccbbk..', '...kcbk...', '....kk....', '..........'],
};
const ICON_PAL = { k: '#3b2414', g: '#6cc04a', b: '#4da6e8', y: '#f4c431', r: '#d64541', s: '#d08a24', w: '#c08552', p: '#3d4a6b', c: '#7fe0ff' };
const ICON_OVR = { hero: { b: '#5b4bd1', s: '#f1c49b' }, book: { b: '#b8423a', w: '#f4dfb0' }, bag: { w: '#a46a3a' }, door: { w: '#9a6538' }, gem: { b: '#3aa6d0' }, pick: { w: '#a7a9ad', b: '#8a5a2b' } };
export function icon(name, scale = 3) {
  const grid = ICONS[name], pal = { ...ICON_PAL, ...(ICON_OVR[name] || {}) };
  const c = document.createElement('canvas'); c.width = 10 * scale; c.height = 10 * scale; c.className = 'px icon';
  const g = c.getContext('2d');
  grid.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') px(g, x * scale, y * scale, scale, scale, pal[ch]); }));
  return c;
}
