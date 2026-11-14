import { TOPICS, WORLDS, STAGES, BOSSES, MINIGAMES, BOOKS } from './content.js';
import { ITEMS, RARITY, SLOTS, CHESTS } from './items.js';
import * as G from './game.js';
import * as PX from './pixel.js';
import { drawMap, icon } from './map.js';
import { store, sheetMode, EDIT } from './store.js';

const app = document.getElementById('app');
const modal = document.getElementById('modal');
const S = { p: null, settings: store.settings(), screen: 'login', arg: null };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const save = () => S.p && store.save(S.p);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function gearOf(p) {
  const g = {};
  for (const [slot, uid] of Object.entries(p.equipped)) {
    const it = p.inventory.find(i => i.uid === uid); if (it) g[slot] = G.itemDef(it.id).r;
  }
  return g;
}
function mountSprites(root = app) {
  root.querySelectorAll('[data-hero]').forEach(el => {
    const p = el.dataset.pid ? store.get(el.dataset.pid) : S.p;
    const cls = el.dataset.hero || p.cls;
    el.replaceChildren(PX.hero(cls, el.dataset.nogear ? {} : (p ? gearOf(p) : {}), Number(el.dataset.scale || 6)));
  });
  root.querySelectorAll('[data-boss]').forEach(el => el.replaceChildren(PX.boss(el.dataset.boss, Number(el.dataset.scale || 7))));
  root.querySelectorAll('[data-chest]').forEach(el => el.replaceChildren(PX.chest(CHESTS[el.dataset.chest].color, Number(el.dataset.scale || 5))));
  root.querySelectorAll('[data-icon]').forEach(el => { if (!el.querySelector(':scope > canvas.icon')) el.prepend(icon(el.dataset.icon, Number(el.dataset.scale || 3))); });
  root.querySelectorAll('[data-map]').forEach(el => { if (!el.querySelector(':scope > canvas.mapcanvas')) el.prepend(drawMap(MAPS[el.dataset.map]())); });
}

// ================= แผนที่ =================
const MW = 48, MH = 28;
const WORLD_POS = [
  { x: 8, y: 9, type: 'hut' }, { x: 18, y: 6, type: 'tower' }, { x: 27, y: 13, type: 'cave' },
  { x: 37, y: 8, type: 'stupa' }, { x: 41, y: 20, type: 'city' }, { x: 25, y: 23, type: 'archive' },
];
function stagePositions(n) {
  const rows = 3, per = Math.ceil(n / rows), pos = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / per), k = i % per, cols = Math.min(per, n - r * per);
    const t = cols === 1 ? 0.5 : k / (cols - 1);
    const x = 6 + (r % 2 ? 1 - t : t) * 36;
    pos.push({ x, y: 5 + r * 9 + (k % 2 ? 1.2 : 0) });
  }
  return pos;
}
const MAPS = {
  world: () => ({
    w: MW, h: MH, seed: 11, nodes: WORLD_POS,
    buildings: WORLD_POS.map(p => ({ x: p.x, y: p.y + 0.7, type: p.type })),
    lakes: [{ x: 13, y: 19, rx: 6, ry: 3.4 }, { x: 33, y: 16.5, rx: 3.5, ry: 2 }],
    fog: WORLDS.filter(w => S.p ? !G.worldUnlock(S.p, w, S.settings).ok : w.id > 1).map(w => ({ ...WORLD_POS[w.id - 1], r: 4 })),
  }),
  stages: () => {
    const n = G.worldStages(S.arg).length + 1;
    return { w: MW, h: MH, seed: 30 + S.arg, nodes: stagePositions(n), density: 0.55,
      lakes: [{ x: 24, y: 9.5, rx: 6, ry: 1.7 }, { x: 13, y: 18.6, rx: 4, ry: 1.6 }, { x: 38, y: 18.6, rx: 3, ry: 1.4 }] };
  },
};

function go(screen, arg = null) { S.screen = screen; S.arg = arg; render(); window.scrollTo(0, 0); }

// ================= ส่วนหัวและเมนู =================
let syncState = '';
function syncBadge() {
  if (!sheetMode) return '<span class="sync local" title="ยังไม่เชื่อม Google Sheets">โหมดทดลอง</span>';
  const t = { pending: 'รอบันทึก', saving: 'กำลังบันทึก…', saved: 'บันทึกลงชีตแล้ว', error: 'บันทึกไม่สำเร็จ จะลองใหม่' }[syncState] || 'เชื่อมชีตแล้ว';
  return `<span class="sync ${syncState}">${t}</span>`;
}
function header() {
  const p = S.p, L = G.levelInfo(p.xp);
  return `<header class="top"><div class="topin">
    <div class="me"><span class="avatar" data-hero data-scale="3"></span>
      <div class="who"><b>${esc(p.name)}</b> <span class="small">${esc(p.room)} เลขที่ ${p.number}</span>
      <div class="lvrow"><span class="lv">LV.${L.level}</span><div class="bar xp"><i style="width:${100 * L.into / L.need}%"></i></div><span class="small">${L.into}/${L.need}</span></div></div></div>
    <div class="wallet">
      <span class="res" title="เหรียญ" data-icon="coin" data-scale="2"><b>${p.coins}</b></span>
      <span class="res" title="วัสดุตีเหล็ก" data-icon="pick" data-scale="2"><b>${p.materials}</b></span>
      <span class="res" title="ผลึกแห่งความทรงจำ" data-icon="gem" data-scale="2"><b>${p.crystals.length}</b></span>
      ${syncBadge()}
    </div></div></header>`;
}
function dock() {
  const p = S.p, due = G.dueTopics(p).length;
  const tabs = [['map', 'แผนที่', 'map'], ['library', 'อ่านหนังสือ', 'shelf'], ['char', 'ตัวละคร', 'hero', p.statPoints], ['bag', 'กระเป๋า', 'bag'], ['skills', 'สกิล', 'skill', p.skillPoints], ['review', 'ทบทวน', 'book', due], ['chests', 'หีบ', 'chest', p.chests.length]];
  return `<nav class="dock">${tabs.map(([k, n, ic, b]) => `<button class="slot ${S.screen === k || (k === 'map' && S.screen === 'world') || (k === 'library' && S.screen === 'reader') ? 'on' : ''}" data-go="${k}" data-icon="${ic}" data-scale="3"><span>${n}</span>${b ? `<em>${b}</em>` : ''}</button>`).join('')}
    <button class="slot" data-act="logout" data-icon="door" data-scale="3"><span>ออก</span></button></nav>`;
}

// ================= เข้าสู่ระบบ / สร้างตัวละคร =================
function viewLogin() {
  return `<div class="loginbg" data-map="world"><div class="loginbox">
    <div class="logo"><h1>HISTORIA QUEST</h1><p>นักสืบประวัติศาสตร์ ม.1</p></div>
    <form id="loginForm" class="panel wood">
      <label>รหัสนักเรียน <input name="sid" required autocomplete="username" inputmode="numeric" maxlength="20" placeholder="เช่น 66001"></label>
      <label>รหัสผ่าน <input name="pw" type="password" autocomplete="current-password" maxlength="30" placeholder="${sheetMode ? 'ถ้าครูกำหนดไว้' : 'ไม่บังคับในโหมดทดลอง'}"></label>
      <button class="btn primary big" type="submit">เข้าสู่การผจญภัย</button>
      <p class="err" id="loginErr" hidden></p>
      <p class="small">${sheetMode ? 'ข้อมูลบันทึกลง Google Sheets ของครู เล่นต่อได้ทุกเครื่อง' : 'โหมดทดลอง: ยังไม่เชื่อม Google Sheets ข้อมูลอยู่ในเบราว์เซอร์นี้'}</p>
      <a class="small" href="teacher.html">หน้าครู</a>
    </form>
    <a class="btn ghost homelink" href="https://kruguitar.netlify.app/#training" target="_blank" rel="noopener">← ไปเว็บไซต์ครู</a>
    </div></div>`;
}

function viewCreate() {
  const sel = S.arg?.cls || 'balanced';
  const c = G.CLASSES[sel], st = S.arg?.student || {};
  return `<section class="panel"><h2>สร้างนักสืบกาลเวลา</h2>
  ${st.name ? `<p>สวัสดี <b>${esc(st.name)}</b> (${esc(st.room)} เลขที่ ${st.number} · รหัส ${esc(st.sid)}) เลือกสายตัวละครเพื่อเริ่มผจญภัย</p>`
    : `<p class="small">รหัสนักเรียน ${esc(st.sid)} ยังไม่มีข้อมูลในเครื่องนี้ กรอกข้อมูลเพื่อสร้างตัวละคร</p>
  <form id="createForm" class="form">
    <label>ชื่อเล่น <input name="name" required maxlength="20" placeholder="เช่น ต้น"></label>
    <label>ห้อง <input name="room" required maxlength="10" placeholder="ม.1/1"></label>
    <label>เลขที่ <input name="number" required type="number" min="1" max="60"></label>
  </form>`}
  <h3>เลือกสายตัวละคร</h3>
  <div class="grid classes">${Object.entries(G.CLASSES).map(([k, v]) => `<button class="card cls ${k === sel ? 'on' : ''}" data-act="cls" data-cls="${k}"><span data-hero="${k}" data-nogear="1" data-scale="5"></span><b>${v.name}</b><span class="muted small">${v.desc}</span></button>`).join('')}</div>
  <div class="statline">${['hp', 'atk', 'def', 'mp', 'crit'].map(k => `<span>${k.toUpperCase()} <b>${c.base[k]}</b></span>`).join('')}</div>
  <div class="row"><button class="btn ghost" data-go="login">ย้อนกลับ</button><button class="btn primary" data-act="create">เริ่มผจญภัย</button></div>
  </section>`;
}

// ================= แผนที่โลก =================
function viewMap() {
  const p = S.p;
  const pin = (x, y) => `left:${100 * x / MW}%;top:${100 * y / MH}%`;
  return `<div class="mapwrap" data-map="world">
    ${WORLDS.map((w, i) => { const u = G.worldUnlock(p, w, S.settings); const P = WORLD_POS[i];
      return `<button class="mnode world-pin ${u.ok ? 'open' : 'locked'}" style="${pin(P.x, P.y + 1.6)}" data-act="world" data-id="${w.id}" ${u.ok ? '' : 'aria-disabled="true"'}><span class="lbl">${u.ok ? '' : '🔒 '}โลกที่ ${w.id} ${w.name}</span></button>`; }).join('')}
  </div>
  <section class="panel"><h2>แผนที่โลกประวัติศาสตร์</h2><p class="muted">ผ่านด่านและทบทวนให้ครบเงื่อนไขเพื่อปัดเมฆและเปิดโลกถัดไป</p>
  <div class="worlds">${WORLDS.map(w => {
    const u = G.worldUnlock(p, w, S.settings);
    const st = w.playable ? G.worldStages(w.id) : [];
    const done = st.filter(s => G.stageDone(p, s.id)).length;
    return `<button class="world ${u.ok ? 'open' : 'locked'}" data-act="world" data-id="${w.id}" ${u.ok ? '' : 'aria-disabled="true"'}>
      ${w.cover ? `<img src="${w.cover}" alt="" loading="lazy">` : '<div class="nocover">?</div>'}
      <div class="wbody"><span class="muted small">โลกที่ ${w.id}</span><b>${w.name}</b><span class="small">${w.sub}</span>
      ${u.ok ? `<div class="bar"><i style="width:${st.length ? 100 * done / st.length : 0}%"></i></div><span class="small">ผ่าน ${done}/${st.length} ด่าน · ความเชี่ยวชาญ ${G.worldMastery(p, w.id)}%${p.bossWins[w.boss] ? ' · ชนะบอสแล้ว' : ''}</span>`
        : `<ul class="checks">${u.checks.map(c => `<li class="${c.ok ? 'ok' : ''}">${c.ok ? '✔' : '🔒'} ${esc(c.label)}</li>`).join('')}</ul>`}</div></button>`;
  }).join('')}</div></section>`;
}

const KIND = { manga: 'มังงะ', sheet: 'ใบความรู้', game: 'มินิเกม' };
function viewWorld() {
  const p = S.p, w = WORLDS.find(x => x.id === S.arg);
  const stages = G.worldStages(w.id), b = BOSSES[w.boss];
  const pos = stagePositions(stages.length + 1);
  const cur = stages.findIndex(s => G.stageOpen(p, s) && !G.stageDone(p, s.id));
  const here = cur < 0 ? stages.length : cur;
  const pin = q => `left:${100 * q.x / MW}%;top:${100 * q.y / MH}%`;
  return `<div class="mapwrap" data-map="stages">
    ${stages.map((s, i) => { const open = G.stageOpen(p, s), done = G.stageDone(p, s.id);
      return `<button class="mnode ${done ? 'done' : open ? 'open' : 'locked'}" style="${pin(pos[i])}" data-act="stage" data-id="${s.id}" ${open ? '' : 'disabled'} title="${esc(s.title)}"><i>${done ? '✔' : i + 1}</i><span class="lbl">${esc(s.title)}</span></button>`; }).join('')}
    <button class="mnode bossnode ${G.bossOpen(p, w.id) ? 'open' : 'locked'}" style="${pin(pos[stages.length])}" data-act="boss" data-id="${w.boss}" ${G.bossOpen(p, w.id) ? '' : 'disabled'}><span data-boss="${b.sprite}" data-scale="2"></span><span class="lbl">บอส: ${b.name}</span></button>
    <span class="herohere" style="${pin({ x: pos[here].x, y: pos[here].y - 2.2 })}" data-hero data-scale="2"></span>
  </div>
  <section class="panel"><button class="btn ghost small" data-go="map">← แผนที่โลก</button>
  <h2>โลกที่ ${w.id}: ${w.name}</h2>
  <div class="mastery">${w.topics.map(t => `<div><span class="small">${TOPICS[t].name}</span><div class="bar m"><i style="width:${G.mastery(p, t)}%"></i></div><span class="small muted">${G.mastery(p, t)}%</span></div>`).join('')}</div>
  <ol class="path">${stages.map((s, i) => {
    const open = G.stageOpen(p, s), done = G.stageDone(p, s.id);
    return `<li><button class="node ${done ? 'done' : open ? 'open' : 'locked'}" data-act="stage" data-id="${s.id}" ${open ? '' : 'disabled'}>
      <span class="num">${done ? '✔' : i + 1}</span><span><span class="tag t-${s.kind}">${KIND[s.kind]}</span> ${esc(s.title)}${done ? `<span class="muted small"> · ดีที่สุด ${p.progress[s.id].best}%</span>` : ''}</span></button></li>`;
  }).join('')}
    <li><button class="node boss ${G.bossOpen(p, w.id) ? 'open' : 'locked'}" data-act="boss" data-id="${w.boss}" ${G.bossOpen(p, w.id) ? '' : 'disabled'}>
      <span data-boss="${b.sprite}" data-scale="2"></span><span><b>บอส: ${b.name}</b> <span class="muted small">LV.${b.lv}${p.bossWins[w.boss] ? ' · ชนะแล้ว' : ' · ผ่านทุกด่านเพื่อท้าทาย'}</span></span></button></li>
  </ol></section>`;
}

// ================= คำถาม (ใช้ร่วมกันทุกที่) =================
function ask(q, opt = {}) {
  return new Promise(resolve => {
    let elim = opt.eliminate || 0;
    const removed = new Set();
    const draw = (picked) => {
      const answered = picked != null;
      const ok = answered && picked === q.ans;
      modal.innerHTML = `<div class="sheet q">
        ${opt.title ? `<div class="qtitle">${esc(opt.title)}</div>` : ''}
        <p class="question">${esc(q.q)}</p>
        <div class="choices">${q.c.map((c, i) => `<button class="choice ${answered && i === q.ans ? 'right' : ''} ${answered && i === picked && !ok ? 'wrong' : ''}" data-i="${i}" ${answered || removed.has(i) ? 'disabled' : ''} ${removed.has(i) ? 'style="opacity:.25"' : ''}>${'กขคง'[i]}. ${esc(c)}</button>`).join('')}</div>
        ${!answered && elim > 0 ? `<button class="btn small" data-elim>สายตานักสืบ: ตัดตัวเลือกผิด (${elim})</button>` : ''}
        ${answered ? `<div class="feedback ${ok ? 'ok' : 'no'}"><b>${ok ? 'ถูกต้อง!' : 'ยังไม่ถูก'}</b> ${esc(q.why)}${!ok ? `<div class="small">ทบทวนได้ที่: ${esc(G.worldStages(TOPICS[q.topic].world).find(s => s.id === TOPICS[q.topic].stage)?.title || TOPICS[q.topic].name)}</div>` : ''}</div><button class="btn primary" data-next>ต่อไป</button>` : ''}
      </div>`;
      modal.hidden = false;
      modal.querySelectorAll('.choice').forEach(b => b.onclick = () => draw(Number(b.dataset.i)));
      const e = modal.querySelector('[data-elim]');
      if (e) e.onclick = () => {
        const wrong = q.c.map((_, i) => i).filter(i => i !== q.ans && !removed.has(i));
        if (wrong.length > 1) { removed.add(wrong[Math.floor(Math.random() * wrong.length)]); elim--; opt.onEliminate?.(); }
        draw(null);
      };
      const n = modal.querySelector('[data-next]');
      if (n) n.onclick = () => { modal.hidden = true; G.recordAnswer(S.p, q, ok, opt.where || ''); save(); resolve(ok); };
    };
    draw(null);
  });
}

function showModal(html) {
  return new Promise(res => {
    modal.innerHTML = `<div class="sheet">${html}<button class="btn primary" data-close>ตกลง</button></div>`;
    modal.hidden = false; mountSprites(modal);
    modal.querySelector('[data-close]').onclick = () => { modal.hidden = true; res(); };
  });
}
function rewardHtml(r, ev = [], extra = '') {
  const parts = [];
  if (r.xp) parts.push(`+${Math.round(r.xp)} XP`);
  if (r.coins) parts.push(`+${r.coins} เหรียญ`);
  if (r.materials) parts.push(`+${r.materials} วัสดุ`);
  if (r.kn) parts.push(`+${r.kn} KNOWLEDGE`);
  if (r.skillPoints) parts.push(`+${r.skillPoints} แต้มสกิล`);
  if (r.crystal) parts.push('ผลึกแห่งความทรงจำ 1 ชิ้น');
  if (r.chest) parts.push(`${CHESTS[r.chest].name} 1 ใบ`);
  return `${extra}<div class="rewards">${parts.map(x => `<span>${x}</span>`).join('') || '<span class="muted">เล่นซ้ำ: ไม่ได้รางวัลเพิ่ม ลองไปทบทวนหรือด่านใหม่</span>'}</div>
    ${ev.map(e => `<div class="levelup">LEVEL UP! เลเวล ${e.level} · +3 แต้มค่าสถานะ +1 แต้มสกิล</div>`).join('')}`;
}

// ================= ด่าน: มังงะ / ใบความรู้ =================
function viewStage() {
  const s = STAGES.find(x => x.id === S.arg);
  if (s.kind === 'game') return viewGame(s);
  return `<section class="panel reader"><button class="btn ghost small" data-act="world" data-id="${s.world}">← โลกที่ ${s.world}</button>
    <h2>${esc(s.title)}</h2><p class="muted small">ที่มา: ${esc(s.src)} · วิชชากร คำสุข</p>
    <div class="page"><img src="${s.img}" alt="${esc(s.title)}" data-act="zoom"></div>
    <p class="muted small center">แตะภาพเพื่อขยาย · ${s.kind === 'manga' ? 'ภาพอดีตในเรื่องเป็นภาพจำลองเพื่อช่วยอธิบาย' : 'อ่านให้ครบทุกกล่องก่อนทำภารกิจ'}</p>
    <div class="row center"><button class="btn primary big" data-act="startMission" data-id="${s.id}">${s.kind === 'manga' ? 'อ่านจบแล้ว ไปไขปริศนา' : 'ศึกษาแล้ว ไปทำภารกิจ'}</button></div>
  </section>`;
}

async function runMission(s) {
  const p = S.p;
  // ปริศนาคั่นหน้า: ต้องตอบถูกจึงผ่าน (เปลี่ยนคำถามเมื่อผิด สูงสุด 3 ครั้ง)
  const used = new Set();
  for (let t = 0; t < 3; t++) {
    const [q] = G.pickQuestions(p, [s.topic], 1, { exclude: used, lv: 1 });
    if (!q) break; used.add(q.id);
    const ok = await ask(q, { title: t ? 'ลองใหม่ด้วยคำถามใหม่' : 'ปริศนาคั่นหน้า', where: s.id });
    if (ok) break;
  }
  // ภารกิจนักสืบ 3 ข้อ (หัวข้อของด่าน + หัวข้อในโลกเดียวกันที่เคยเรียน)
  const w = WORLDS.find(x => x.id === s.world);
  const learned = w.topics.filter(t => t === s.topic || STAGES.some(st => st.topic === t && st.world === s.world && G.stageDone(p, st.id)));
  const qs = [...G.pickQuestions(p, [s.topic], 2, { exclude: used }), ...G.pickQuestions(p, learned, 1, { exclude: used })];
  let correct = 0;
  for (let i = 0; i < qs.length; i++) { if (await ask(qs[i], { title: `ภารกิจนักสืบ ${i + 1}/${qs.length}`, where: s.id })) correct++; }
  const res = G.completeStage(p, s, { correct, total: qs.length });
  save();
  await showModal(`<h2>ภารกิจสำเร็จ!</h2><p>ตอบถูก ${correct}/${qs.length} ข้อ</p>${rewardHtml(res.r, res.ev)}<p class="muted small">ระบบจะชวนกลับมาทบทวนหัวข้อ "${TOPICS[s.topic].name}" ในวันพรุ่งนี้</p>`);
  go('world', s.world);
}

// ================= มินิเกม =================
function viewGame(s) {
  const g = MINIGAMES[s.game];
  return `<section class="panel"><button class="btn ghost small" data-act="world" data-id="${s.world}">← โลกที่ ${s.world}</button>
    <h2>${esc(s.title)}</h2><p>${esc(g.intro)}</p><div id="mg"></div></section>`;
}
function startGame(s) {
  const g = MINIGAMES[s.game], box = document.getElementById('mg');
  const finish = async (score, note = '') => {
    const res = G.completeStage(S.p, s, { score }); save();
    await showModal(`<h2>คะแนน ${score}%</h2>${note}${score >= 80 ? '<p>ยอดเยี่ยม! ได้หีบเงินเมื่อผ่านครั้งแรก</p>' : '<p>ได้ต่ำกว่า 80% ลองเล่นใหม่เพื่อรับหีบเงิน</p>'}${rewardHtml(res.r, res.ev)}`);
    go('world', s.world);
  };
  if (g.type === 'sort') {
    const items = g.items.map(x => x).sort(() => Math.random() - 0.5);
    let i = 0, right = 0; const wrong = [];
    const step = () => {
      if (i >= items.length) {
        const score = Math.round(100 * right / items.length);
        return finish(score, wrong.length ? `<p class="small">ข้อที่พลาด:</p><ul class="small">${wrong.map(([t, b]) => `<li>${esc(t)} → <b>${g.bins[b]}</b></li>`).join('')}</ul>` : '');
      }
      const [text, bin] = items[i];
      box.innerHTML = `<div class="sortcard"><span class="muted small">${i + 1}/${items.length}</span><p>${esc(text)}</p></div>
        <div class="bins">${g.bins.map((b, k) => `<button class="btn bin" data-b="${k}">${b}</button>`).join('')}</div>`;
      box.querySelectorAll('[data-b]').forEach(btn => btn.onclick = async () => {
        const ok = Number(btn.dataset.b) === bin;
        btn.classList.add(ok ? 'right' : 'wrong'); if (ok) right++; else { wrong.push(items[i]); box.querySelector(`[data-b="${bin}"]`).classList.add('right'); }
        box.querySelectorAll('[data-b]').forEach(b => b.disabled = true);
        await sleep(ok ? 450 : 1100); i++; step();
      });
    };
    step();
  } else {
    const order = g.items.map((t, k) => ({ t, k })).sort(() => Math.random() - 0.5);
    let next = 0, mistakes = 0;
    const draw = () => {
      box.innerHTML = `<ol class="ordered">${g.items.slice(0, next).map(t => `<li>${esc(t)}</li>`).join('')}</ol>
        <div class="orderpool">${order.filter(o => o.k >= next).map(o => `<button class="btn chip" data-k="${o.k}">${esc(o.t)}</button>`).join('')}</div>
        <p class="muted small">พลาด ${mistakes} ครั้ง</p>`;
      box.querySelectorAll('[data-k]').forEach(b => b.onclick = async () => {
        if (Number(b.dataset.k) === next) { next++; if (next === g.items.length) { draw(); return finish(Math.max(0, 100 - mistakes * 15), g.outro ? `<p>${esc(g.outro)}</p>` : ''); } draw(); }
        else { mistakes++; b.classList.add('wrong', 'shake'); await sleep(500); draw(); }
      });
    };
    draw();
  }
}

// ================= ต่อสู้บอส =================
let B = null;
function viewBoss() {
  const b = BOSSES[S.arg], p = S.p, s = G.stats(p);
  const hp = Math.round(b.hp * S.settings.bossHp / 100);
  B = { id: S.arg, b, bhp: hp, bmax: hp, php: s.hp, pmax: s.hp, pmp: s.mp, mmax: s.mp, s, turn: 1, combo: 0, shield: 0, elim: p.skills.includes('wis1') ? 2 : 0, used: new Set(), wrongTopics: new Set(), busy: false, log: [b.intro] };
  return battleHtml();
}
function battleHtml() {
  const p = S.p, a = G.battleActions(p);
  return `<section class="panel battle"><div class="arena">
    <div class="side boss-side"><div class="nm">${B.b.name} <span class="muted">LV.${B.b.lv}</span></div><div class="bar hp"><i style="width:${100 * B.bhp / B.bmax}%"></i></div><span class="small">${B.bhp}/${B.bmax} HP</span><div id="bossSpr" data-boss="${B.b.sprite}" data-scale="7"></div></div>
    <div class="side me-side"><div id="heroSpr" data-hero data-scale="7"></div><div class="nm">${esc(p.name)} <span class="muted">รอบที่ ${B.turn}</span></div>
      <div class="bar hp"><i style="width:${100 * B.php / B.pmax}%"></i></div><span class="small">HP ${B.php}/${B.pmax}</span>
      <div class="bar mp"><i style="width:${100 * B.pmp / B.mmax}%"></i></div><span class="small">MP ${B.pmp}/${B.mmax}${B.shield ? ' · 🛡 โล่ศิลา' : ''}${B.combo > 1 ? ` · คอมโบ ${B.combo}` : ''}</span></div>
  </div>
  <div class="blog">${B.log.slice(-3).map(l => `<div>${esc(l)}</div>`).join('')}</div>
  <div class="actions">${a.map(x => `<button class="btn act ${x.q === 2 ? 'ult' : ''}" data-act="battle" data-id="${x.id}" ${B.busy || B.pmp < (x.mp || 0) ? 'disabled' : ''}><b>${x.name}</b><span class="small">${x.mp ? x.mp + ' MP' : '0 MP'}${x.q ? ` · คำถาม${x.q === 2 ? 'ยาก' : ''}` : ''}</span></button>`).join('')}</div>
  <p class="muted small">ท่าที่ต้องตอบคำถาม: ตอบถูกได้พลังเต็มและโบนัสความรู้ ตอบผิดเหลือ 40% พร้อมคำอธิบาย</p></section>`;
}
function rerenderBattle() { app.querySelector('.battle').outerHTML = battleHtml(); mountSprites(); }
function fx(id, cls) { const el = document.getElementById(id); if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function floatText(id, text, kind) {
  const el = document.getElementById(id); if (!el) return;
  const f = document.createElement('span'); f.className = 'float ' + kind; f.textContent = text; el.appendChild(f); setTimeout(() => f.remove(), 1100);
}

async function battleAct(id) {
  if (B.busy) return;
  const p = S.p, act = G.battleActions(p).find(x => x.id === id);
  if (B.pmp < (act.mp || 0)) return;
  B.busy = true; B.pmp -= act.mp || 0;
  const w = WORLDS.find(x => x.id === B.b.world);
  let ok = true;
  if (act.q) {
    const [q] = G.pickQuestions(p, w.topics, 1, { lv: act.q, exclude: B.used });
    if (q) {
      B.used.add(q.id);
      ok = await ask(q, { title: act.name, eliminate: B.elim, onEliminate: () => B.elim--, where: B.id });
      if (!ok) B.wrongTopics.add(q.topic);
    }
    B.combo = ok ? B.combo + 1 : 0;
  }
  const s = B.s, knB = 1 + Math.min(0.8, s.kn * 0.02 * G.CLASSES[p.cls].knMult);
  const crit = () => Math.random() * 100 < s.crit;
  if (act.heal) {
    const h = Math.round(B.pmax * (ok ? act.heal : 0.15)); B.php = Math.min(B.pmax, B.php + h);
    B.log.push(`${act.name}: ฟื้น HP ${h}`); floatText('heroSpr', '+' + h, 'heal');
  } else if (act.shield) {
    B.shield = ok ? act.shield : 0.3; B.log.push(`${act.name}: ลดความเสียหายครั้งถัดไป ${Math.round(B.shield * 100)}%`);
  } else {
    let total = 0; const hits = act.hits || 1;
    for (let h = 0; h < hits; h++) {
      let d = act.kn ? s.atk * 2 + s.kn * 6 * G.CLASSES[p.cls].knMult : s.atk * act.mult;
      if (act.q) {
        d *= ok ? knB : 0.4;
        if (ok && p.skills.includes('atk1')) d *= 1.2;
        if (ok && p.skills.includes('wis2')) d *= 1 + Math.min(0.6, 0.15 * Math.max(0, B.combo - 1));
      }
      d = d * (0.9 + Math.random() * 0.2) - B.b.def * 0.5;
      const c = crit(); if (c) d *= 1.5;
      d = Math.max(1, Math.round(d)); total += d;
      fx('heroSpr', 'lunge'); fx('bossSpr', 'hit'); floatText('bossSpr', (c ? 'คริติคอล! ' : '') + d, c ? 'crit' : 'dmg');
      if (hits > 1) await sleep(350);
    }
    B.bhp = Math.max(0, B.bhp - total);
    B.log.push(`${act.name}${act.q ? (ok ? ' (ตอบถูก)' : ' (ตอบผิด พลังลดลง)') : ''}: ความเสียหาย ${total}`);
  }
  rerenderBattle();
  if (B.bhp <= 0) return endBattle(true);
  await sleep(700);
  // ตาบอส
  const special = B.turn % 3 === 0;
  let d = B.b.atk * (special ? 1.8 : 1) * (0.9 + Math.random() * 0.2) - s.def * 0.4;
  d = Math.max(5, Math.round(d * (1 - B.shield))); B.shield = 0;
  B.php = Math.max(0, B.php - d);
  B.log.push(`${B.b.name} ${special ? 'ใช้ท่าพิเศษ' : 'โจมตี'}: ความเสียหาย ${d}`);
  B.turn++; B.pmp = Math.min(B.mmax, B.pmp + 8);
  B.busy = false;
  rerenderBattle(); fx('bossSpr', 'lunge-l'); fx('heroSpr', 'hit'); floatText('heroSpr', '-' + d, 'dmg');
  if (B.php <= 0) return endBattle(false);
}
async function endBattle(win) {
  const res = G.bossResult(S.p, B.id, win); save();
  const tips = [...B.wrongTopics].map(t => `<li>${TOPICS[t].name}</li>`).join('');
  await showModal(win
    ? `<h2>ชนะ ${B.b.name}!</h2>${res.first ? '<p>พิชิตบอสครั้งแรก ได้หีบบอสและแต้มสกิล</p>' : ''}${rewardHtml(res.r, res.ev)}${tips ? `<p class="small">หัวข้อที่ยังพลาด ควรทบทวน:</p><ul class="small">${tips}</ul>` : ''}`
    : `<h2>พ่ายแพ้... แต่ยังไม่จบ!</h2><p>นักสืบไม่เสียอะไรเลย ลองเพิ่มพลังด้วยการทบทวน อัปค่าสถานะ หรือตีเหล็กอาวุธ</p>${tips ? `<p class="small">ทบทวนหัวข้อเหล่านี้ก่อนกลับมา:</p><ul class="small">${tips}</ul>` : ''}${rewardHtml(res.r, res.ev)}`);
  go('world', B.b.world);
}

// ================= ตัวละคร =================
function viewChar() {
  const p = S.p, s = G.stats(p), c = G.CLASSES[p.cls];
  return `<section class="panel"><h2>ตัวละคร</h2><div class="charwrap">
    <div class="charcard"><span data-hero data-scale="9"></span><b>${esc(p.name)}</b><span class="muted">${c.name} · LV.${G.levelInfo(p.xp).level}</span>
      <div class="small muted">เรียนต่อเนื่อง ${p.days.streak} วัน · ทบทวนต่อเนื่อง ${p.days.reviewStreak} วัน</div></div>
    <div><table class="stats">${['hp', 'atk', 'def', 'mp', 'crit', 'kn'].map(k => `<tr><td>${G.STAT_NAME[k]}</td><td><b>${s[k]}${k === 'crit' ? '%' : ''}</b></td><td>${k !== 'kn' && p.statPoints ? `<button class="btn small" data-act="alloc" data-k="${k}">+${G.STAT_POINT[k]}</button>` : ''}</td></tr>`).join('')}</table>
    <p class="small muted">${p.statPoints ? `เหลือ ${p.statPoints} แต้ม กดเพื่ออัปค่าสถานะ` : 'ได้ 3 แต้มทุกครั้งที่เลเวลอัป'} · KNOWLEDGE เพิ่มจากการอ่านมังงะ ใบความรู้ และไอเทมพิเศษ ใช้เพิ่มพลังเมื่อตอบถูก</p>
    <h3>อุปกรณ์ที่สวมใส่</h3><ul class="slots">${Object.entries(SLOTS).map(([k, n]) => { const it = p.inventory.find(i => i.uid === p.equipped[k]); const d = it && G.itemDef(it.id); return `<li><span class="muted small">${n}</span> ${d ? `<b style="color:${RARITY[d.r].color}">${d.name}${it.plus ? ' +' + it.plus : ''}</b>` : '<span class="muted">ว่าง</span>'}</li>`; }).join('')}</ul></div>
  </div>
  <h3>บันทึกการผจญภัย</h3><ul class="log small">${p.log.slice(0, 8).map(l => `<li>${esc(l.text)}</li>`).join('') || '<li class="muted">ยังไม่มี</li>'}</ul></section>`;
}

// ================= กระเป๋าและโรงตีเหล็ก =================
function viewBag() {
  const p = S.p, sel = p.inventory.find(i => i.uid === S.arg);
  const sorted = p.inventory.slice().sort((a, b) => G.itemDef(b.id).r - G.itemDef(a.id).r);
  let detail = '<p class="muted">เลือกอุปกรณ์เพื่อดูรายละเอียด สวมใส่ หรือตีเหล็ก</p>';
  if (sel) {
    const d = G.itemDef(sel.id), eq = p.equipped[d.slot] === sel.uid, f = G.canForge(p, sel.uid), cost = G.forgeCost(sel);
    detail = `<h3 style="color:${RARITY[d.r].color}">${d.name}${sel.plus ? ' +' + sel.plus : ''}</h3>
      <p class="small">${SLOTS[d.slot]} · ${RARITY[d.r].name}</p>
      <p>${Object.entries(d.st).map(([k, v]) => `${k.toUpperCase()} +${Math.round(v * (1 + 0.1 * (sel.plus || 0)))}`).join(' · ')}</p>
      <p class="small note">${esc(d.note)}</p>
      <div class="row">${eq ? `<button class="btn" data-act="unequip" data-slot="${d.slot}">ถอด</button>` : `<button class="btn primary" data-act="equip" data-uid="${sel.uid}">สวมใส่</button>`}
      <button class="btn" data-act="salvage" data-uid="${sel.uid}" ${eq ? 'disabled' : ''}>หลอมเป็นวัสดุ</button></div>
      <h4>โรงตีเหล็กประวัติศาสตร์</h4>
      <p class="small">+${(sel.plus || 0) + 1}: ${cost.coins} เหรียญ · ${cost.materials} วัสดุ${cost.crystals ? ` · ผลึก 3 ชิ้นจาก 3 วันต่างกัน` : ''}</p>
      <button class="btn primary" data-act="forge" data-uid="${sel.uid}" ${f.ok ? '' : 'disabled'}>ตีเหล็ก</button>${f.ok ? '' : `<p class="small warn">${esc(f.why)}</p>`}
      <p class="muted small">ตั้งแต่ +6 ขึ้นไปต้องใช้ผลึกแห่งความทรงจำ ซึ่งได้จากภารกิจทบทวนเท่านั้น</p>`;
  }
  return `<section class="panel"><h2>กระเป๋าอุปกรณ์</h2><div class="bag">
    <div class="items">${sorted.map(i => { const d = G.itemDef(i.id); const eq = Object.values(p.equipped).includes(i.uid); return `<button class="item ${i.uid === S.arg ? 'on' : ''}" style="--rc:${RARITY[d.r].color}" data-act="item" data-uid="${i.uid}"><b>${d.name}${i.plus ? ' +' + i.plus : ''}</b><span class="small">${SLOTS[d.slot]}${eq ? ' · สวมอยู่' : ''}</span></button>`; }).join('') || '<p class="muted">ยังไม่มีอุปกรณ์ เปิดหีบสมบัติเพื่อรับของ</p>'}</div>
    <div class="detail">${detail}</div></div></section>`;
}

// ================= สกิล =================
function viewSkills() {
  const p = S.p;
  return `<section class="panel"><h2>ผังสกิล</h2><p>แต้มสกิลคงเหลือ <b>${p.skillPoints}</b> · ได้จากเลเวลอัป ชนะบอสครั้งแรก และทบทวนจนเชี่ยวชาญหัวข้อ</p>
  <div class="trees">${Object.entries(G.TREES).map(([t, n]) => `<div class="tree"><h3>${n}</h3>${G.SKILLS.filter(s => s.tree === t).map(sk => {
    const has = p.skills.includes(sk.id), c = G.canLearn(p, sk);
    return `<div class="skill ${has ? 'has' : ''}"><b>${sk.name}</b><span class="small">${sk.desc}</span><span class="small muted">${sk.passive ? 'ติดตัว' : 'ใช้ในการต่อสู้'} · ${sk.cost} แต้ม</span>
      ${has ? '<span class="pill">ปลดล็อกแล้ว</span>' : `<button class="btn small ${c.ok ? 'primary' : ''}" data-act="learn" data-id="${sk.id}" ${c.ok ? '' : 'disabled'}>ปลดล็อก</button>${c.ok ? '' : `<span class="small muted">${esc(c.why)}</span>`}`}</div>`;
  }).join('')}</div>`).join('')}</div></section>`;
}

// ================= ทบทวน =================
function viewReview() {
  const p = S.p, plan = G.reviewPlan(p);
  const upcoming = Object.entries(p.reviews).filter(([t]) => !plan.due.includes(t)).sort((a, b) => a[1].due.localeCompare(b[1].due));
  return `<section class="panel"><h2>ภารกิจทบทวน</h2>
  <p>ทบทวนวันละ 5 ข้อ (3–5 นาที) เพื่อรับ <b>หีบสมบัติประจำวัน</b> และ <b>ผลึกแห่งความทรงจำ</b> (ตอบถูก 3 ข้อขึ้นไป) ผลึกใช้ตีอาวุธ +6 ขึ้นไป</p>
  ${plan.topics.length ? `<div class="cards3">
    ${plan.due.length ? `<div class="card"><b>ความทรงจำที่ถึงกำหนด</b><ul class="small">${plan.due.map(t => `<li>${TOPICS[t].name} <span class="muted">(รอบที่ ${p.reviews[t].step + 1}/4)</span></li>`).join('')}</ul></div>` : ''}
    ${plan.weak.length ? `<div class="card"><b>ภารกิจแก้ไขจุดอ่อน</b><ul class="small">${plan.weak.map(t => `<li>${TOPICS[t].name} <span class="muted">${G.mastery(p, t)}%</span></li>`).join('')}</ul><span class="small muted">คำถามใหม่ในหัวข้อที่เคยตอบผิด</span></div>` : ''}
  </div><button class="btn primary big" data-act="startReview">เริ่มทบทวน 5 ข้อ</button>${plan.dailyAvailable ? '' : '<p class="small muted">วันนี้รับหีบประจำวันแล้ว ทบทวนต่อได้ แต่รางวัลลดลง</p>'}`
  : `<p class="muted">ยังไม่มีหัวข้อที่ถึงกำหนดทบทวน ${p.days.dailyDone === G.dayKey() ? 'วันนี้ทบทวนครบแล้ว เก่งมาก!' : 'ผ่านด่านแรกแล้วกลับมาพรุ่งนี้นะ'}</p>`}
  <h3>กำหนดทบทวนครั้งต่อไป</h3><table class="tbl small"><tr><th>หัวข้อ</th><th>รอบ</th><th>วันที่</th><th>ความเชี่ยวชาญ</th></tr>
  ${upcoming.map(([t, v]) => `<tr><td>${TOPICS[t].name}</td><td>${v.step >= 4 ? 'เชี่ยวชาญแล้ว' : v.step + 1 + '/4'}</td><td>${v.step >= 4 ? '-' : v.due}</td><td>${G.mastery(p, t)}%</td></tr>`).join('') || '<tr><td colspan="4" class="muted">-</td></tr>'}</table>
  </section>`;
}
async function runReview() {
  const p = S.p, qs = G.reviewQuestions(p);
  if (!qs.length) return;
  const results = [];
  for (let i = 0; i < qs.length; i++) results.push({ topic: qs[i].topic, ok: await ask(qs[i], { title: `ทบทวน ${i + 1}/${qs.length}`, where: 'review' }) });
  const res = G.completeReview(p, results); save();
  await showModal(`<h2>ทบทวนเสร็จแล้ว</h2><p>ตอบถูก ${res.correct}/${results.length}</p><ul class="small">${res.msgs.map(m => `<li>${esc(m)}</li>`).join('')}</ul>${rewardHtml(res.r, res.ev)}`);
  go('review');
}

// ================= หีบสมบัติ =================
function viewChests() {
  const p = S.p;
  return `<section class="panel"><h2>หีบสมบัติ</h2>
  <div class="chests">${p.chests.map((c, i) => `<button class="card chestc" data-act="open" data-i="${i}"><span data-chest="${c}" data-scale="6"></span><b>${CHESTS[c].name}</b><span class="small">แตะเพื่อเปิด</span></button>`).join('') || '<p class="muted">ยังไม่มีหีบ ทำกิจกรรมเพื่อรับหีบ</p>'}</div>
  <h3>ได้หีบจากไหน</h3><table class="tbl small"><tr><th>กิจกรรม</th><th>หีบ</th></tr>
  <tr><td>อ่านมังงะครบตอน (ครั้งแรก)</td><td>หีบไม้</td></tr><tr><td>ศึกษาใบความรู้และตอบคำถาม</td><td>หีบเหล็ก</td></tr><tr><td>ทบทวนประจำวันครบ 5 ข้อ</td><td>หีบเหล็ก</td></tr>
  <tr><td>มินิเกมได้ 80% ขึ้นไป</td><td>หีบเงิน</td></tr><tr><td>ทบทวนต่อเนื่องครบ 7 วัน</td><td>หีบทอง</td></tr><tr><td>พิชิตบอสประจำโลก</td><td>หีบบอส</td></tr></table>
  <p class="small muted">อัตราดรอปพื้นฐาน: ธรรมดา 50% · หายาก 30% · มหากาพย์ 15% · ตำนาน 5% · เปิดครบ 10 หีบรับประกันมหากาพย์ขึ้นไป (ตอนนี้ ${p.pity}/10) · ของซ้ำหลอมเป็นวัสดุได้</p></section>`;
}
async function openChestUI(i) {
  const r = G.openChest(S.p, i, S.settings); if (!r) return; save();
  modal.innerHTML = `<div class="sheet center"><div class="chestopen" data-chest="${r.type}" data-scale="9"></div><p class="muted">กำลังเปิด...</p></div>`;
  modal.hidden = false; mountSprites(modal);
  await sleep(900);
  await showModal(`<div class="reveal" style="--rc:${RARITY[r.def.r].color}"><span class="small">${RARITY[r.def.r].name}</span><h2>${r.def.name}</h2><p>${Object.entries(r.def.st).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(' · ')}</p><p class="small note">${esc(r.def.note)}</p>${r.dup ? '<p class="small muted">มีชิ้นนี้แล้ว หลอมเป็นวัสดุได้ในกระเป๋า</p>' : ''}</div>`);
  render();
}

// ================= ห้องสมุด: อ่านมังงะ 4 เล่ม =================
function viewLibrary() {
  const p = S.p, R = p.reading || {};
  return `<section class="panel"><h2>ห้องสมุดนักสืบ: อ่านมังงะ "นักสืบอดีต"</h2>
  <p class="small">อ่านได้ทุกเล่มทุกหน้า ไม่ต้องรอปลดล็อก · อ่านครบเล่มครั้งแรกได้ <b>หีบไม้ + 30 XP + KNOWLEDGE</b></p>
  <div class="books">${BOOKS.map(b => { const r = R[b.id] || { seen: [] }; const n = r.seen.length, T = b.pages.length;
    return `<button class="book" data-act="read" data-id="${b.id}" data-page="${n && n < T ? r.last : 0}">
      <img src="${b.pages[0].img}" alt="ปกนักสืบอดีต เล่ม ${b.no}" loading="lazy">
      <span class="small">เล่มที่ ${b.no}</span><b>${esc(b.title)}</b><span class="small">${esc(b.sub)} · ${T} หน้า</span>
      <div class="bar"><i style="width:${100 * n / T}%"></i></div>
      <span class="small">${r.done ? '✔ อ่านครบแล้ว' : n ? `อ่านแล้ว ${n}/${T} หน้า · อ่านต่อ` : 'ยังไม่ได้อ่าน'}</span></button>`; }).join('')}</div></section>`;
}
function viewReader() {
  const { id, page } = S.arg, b = BOOKS.find(x => x.id === id), pg = b.pages[page], T = b.pages.length;
  return `<section class="panel reader book-reader">
    <div class="row" style="justify-content:space-between;margin-top:0"><button class="btn ghost small" data-go="library">← ห้องสมุด</button>
      <span class="small">นักสืบอดีต เล่ม ${b.no} · หน้า ${page + 1}/${T}</span></div>
    <h2>${esc(pg.title)}</h2>
    <div class="row center" style="margin:0 0 8px"><button class="btn small" data-act="turn" data-d="-1" ${page ? '' : 'disabled'}>← ก่อน</button><button class="btn small primary" data-act="turn" data-d="1" ${page < T - 1 ? '' : 'disabled'}>ถัดไป →</button></div>
    <div class="page"><img src="${pg.img}" alt="${esc(pg.title)}" data-act="zoom"></div>
    <div class="row center"><button class="btn" data-act="turn" data-d="-1" ${page ? '' : 'disabled'}>← หน้าก่อน</button>
      <select data-act="jump" aria-label="ไปที่หน้า">${b.pages.map((x, i) => `<option value="${i}" ${i === page ? 'selected' : ''}>${i + 1}. ${esc(x.title)}</option>`).join('')}</select>
      <button class="btn primary" data-act="turn" data-d="1" ${page < T - 1 ? '' : 'disabled'}>หน้าถัดไป →</button></div>
    <p class="muted small center">แตะภาพเพื่อขยาย · ปุ่มลูกศรซ้าย/ขวาบนแป้นพิมพ์ใช้เปลี่ยนหน้าได้ · ภาพอดีตในเรื่องเป็นภาพจำลองเพื่อช่วยอธิบาย</p>
  </section>`;
}
async function openPage(id, page) {
  const b = BOOKS.find(x => x.id === id);
  page = Math.max(0, Math.min(b.pages.length - 1, page));
  go('reader', { id, page });
  const res = G.markRead(S.p, b, page); save();
  if (res) { await showModal(`<h2>อ่านครบเล่ม ${b.no} แล้ว!</h2><p>${esc(b.title)}</p>${rewardHtml(res.r, res.ev)}`); render(); }
}
addEventListener('keydown', e => {
  if (S.screen !== 'reader' || !modal.hidden || /input|select|textarea/i.test(e.target.tagName)) return;
  if (e.key === 'ArrowRight') openPage(S.arg.id, S.arg.page + 1);
  if (e.key === 'ArrowLeft') openPage(S.arg.id, S.arg.page - 1);
});
app.addEventListener('change', e => { if (e.target.dataset.act === 'jump') openPage(S.arg.id, Number(e.target.value)); });

// ================= render และเหตุการณ์ =================
const VIEWS = { login: viewLogin, create: viewCreate, map: viewMap, world: viewWorld, stage: viewStage, boss: viewBoss, char: viewChar, bag: viewBag, skills: viewSkills, review: viewReview, chests: viewChests, library: viewLibrary, reader: viewReader };
function render() {
  const inGame = S.p && !['login', 'create'].includes(S.screen);
  app.innerHTML = (inGame ? header() : '') + `<main class="scr-${S.screen}">${VIEWS[S.screen]()}</main>` + (inGame ? dock() : '');
  mountSprites();
  if (S.screen === 'stage') { const s = STAGES.find(x => x.id === S.arg); if (s.kind === 'game') startGame(s); }
}

app.addEventListener('click', async e => {
  const t = e.target.closest('[data-go],[data-act]'); if (!t || t.disabled || t.getAttribute('aria-disabled') === 'true') return;
  if (t.dataset.go) return go(t.dataset.go);
  const a = t.dataset.act, p = S.p;
  switch (a) {
    case 'cls': {
      S.arg = { ...S.arg, cls: t.dataset.cls };
      app.querySelectorAll('.cls').forEach(b => b.classList.toggle('on', b === t));
      const c = G.CLASSES[t.dataset.cls];
      app.querySelector('.statline').innerHTML = ['hp', 'atk', 'def', 'mp', 'crit'].map(k => `<span>${k.toUpperCase()} <b>${c.base[k]}</b></span>`).join('');
      return;
    }
    case 'create': {
      const st = S.arg.student, f = document.getElementById('createForm');
      let info = st;
      if (f) {
        if (!f.reportValidity()) return;
        const d = Object.fromEntries(new FormData(f));
        info = { ...st, name: d.name.trim(), room: d.room.trim(), number: d.number };
      }
      const pl = G.newPlayer({ ...info, pw: sheetMode ? '' : S.arg.pw, cls: S.arg.cls || 'balanced' });
      const vals = S.arg.values || {};
      for (const k of EDIT) { if (vals[k] != null) pl[k] = vals[k]; pl.base[k] = pl[k]; }
      return enter(pl, true);
    }
    case 'logout': await store.flush(); S.p = null; store.setSession(null); return go('login');
    case 'world': {
      const w = WORLDS.find(x => x.id === Number(t.dataset.id));
      if (!G.worldUnlock(p, w, S.settings).ok) return;
      return go('world', w.id);
    }
    case 'stage': return go('stage', t.dataset.id);
    case 'read': return openPage(t.dataset.id, Number(t.dataset.page));
    case 'turn': return openPage(S.arg.id, S.arg.page + Number(t.dataset.d));
    case 'zoom': { modal.innerHTML = `<div class="zoom"><img src="${t.src}" alt=""><button class="btn" data-close>ปิด</button></div>`; modal.hidden = false; modal.querySelector('[data-close]').onclick = () => modal.hidden = true; return; }
    case 'startMission': return runMission(STAGES.find(x => x.id === t.dataset.id));
    case 'boss': return go('boss', t.dataset.id);
    case 'battle': return battleAct(t.dataset.id);
    case 'alloc': G.allocate(p, t.dataset.k); save(); return render();
    case 'item': return go('bag', t.dataset.uid);
    case 'equip': G.equip(p, t.dataset.uid); save(); return render();
    case 'unequip': G.unequip(p, t.dataset.slot); save(); return render();
    case 'salvage': { const g = G.salvage(p, t.dataset.uid); save(); if (g) alert(`ได้วัสดุ ${g} ชิ้น`); return go('bag'); }
    case 'forge': { const r = G.forge(p, t.dataset.uid); save(); if (r.ok) await showModal(`<h2>ตีเหล็กสำเร็จ!</h2><p>อุปกรณ์เป็น +${r.plus} แล้ว</p>`); return render(); }
    case 'learn': { const r = G.learn(p, t.dataset.id); save(); if (!r.ok) alert(r.why); return render(); }
    case 'startReview': return runReview();
    case 'open': return openChestUI(Number(t.dataset.i));
  }
});

app.addEventListener('submit', async e => {
  if (e.target.id !== 'loginForm') return;
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target)), err = document.getElementById('loginErr');
  const btn = e.target.querySelector('button'); btn.disabled = true; btn.textContent = 'กำลังตรวจสอบ…'; err.hidden = true;
  try { await tryLogin(d.sid.trim(), d.pw); }
  catch (x) { err.textContent = x.message; err.hidden = false; btn.disabled = false; btn.textContent = 'เข้าสู่การผจญภัย'; }
});

async function tryLogin(sid, pw) {
  const r = await store.login(sid, pw);
  store.setSession({ sid, pw });
  if (r.player) return enter(r.player);
  go('create', { student: r.student, values: r.values, pw, cls: 'balanced' });
}

// สรุปข้อมูลที่ส่งขึ้นชีตให้ครูอ่านง่าย
store.summary = p => {
  const topics = {};
  for (const [k, t] of Object.entries(TOPICS)) topics[t.name] = p.answers.some(a => a.topic === k) ? G.mastery(p, k) : '';
  const flags = [];
  if (G.levelInfo(p.xp).level >= 5 && (G.worldMastery(p, 1) + G.worldMastery(p, 3)) / 2 < 60) flags.push('เลเวลสูงแต่ความเชี่ยวชาญต่ำ');
  if (G.weakTopics(p).length >= 2) flags.push(`จุดอ่อน ${G.weakTopics(p).length} หัวข้อ`);
  return { cls: G.CLASSES[p.cls].name, level: G.levelInfo(p.xp).level, crystals: p.crystals.length,
    stages: STAGES.filter(s => G.stageDone(p, s.id)).length, m1: G.worldMastery(p, 1), m3: G.worldMastery(p, 3),
    due: G.dueTopics(p).length, flags, topics };
};
store.onStatus = (s, info) => {
  syncState = s;
  const el = app.querySelector('.sync'); if (el) el.outerHTML = syncBadge();
  if (s === 'saved' && info === true && S.p) render(); // ครูแก้ค่าในชีต
};

async function enter(pl, isNew = false) {
  S.p = pl;
  S.settings = store.settings();
  const t = G.touchDay(pl); store.save(pl, true);
  go('map');
  if (isNew) await showModal(`<span data-hero data-scale="6"></span><h2>ยินดีต้อนรับ นักสืบ${esc(pl.name)}!</h2><p>ภารกิจของคุณ: เดินทางข้ามกาลเวลา รวบรวมความรู้ และฟื้นฟูหอจดหมายเหตุที่สูญหาย</p><p class="small">เริ่มที่โลกที่ 1 อ่านมังงะ ไขปริศนา แล้วเปิดหีบไม้ใบแรกที่แท็บหีบสมบัติ</p>`);
  else if (t) await showModal(`<h2>กลับมาแล้ว!</h2><p>เรียนต่อเนื่อง ${t.streak} วัน</p>${rewardHtml({ xp: 20, coins: 5 }, t.ev)}${G.dueTopics(pl).length ? '<p>มีหัวข้อถึงกำหนดทบทวน ไปที่แท็บ "ทบทวน" เพื่อรับผลึก</p>' : ''}`);
  render();
}

// เริ่มต้น: กลับเข้าเกมอัตโนมัติถ้ายังไม่ได้กดออก
const ses = store.session();
if (ses?.sid) tryLogin(ses.sid, ses.pw || '').catch(() => { store.setSession(null); render(); });
else render();
