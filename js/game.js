// กติกาของเกมทั้งหมด (ไม่มีโค้ดหน้าจอในไฟล์นี้)
import { TOPICS, WORLDS, STAGES, BOSSES, QUESTIONS } from './content.js';
import { ITEMS, CHESTS } from './items.js';

export const DEFAULT_SETTINGS = { masteryGate: 80, w3Xp: 600, bossHp: 100, dropBoost: 0 };

export const CLASSES = {
  balanced: { name: 'นักผจญภัยสมดุล', desc: 'ทุกค่าเติบโตเท่ากัน เล่นง่าย', sprite: 'balanced',
    base: { hp: 120, atk: 20, def: 14, mp: 60, crit: 8 }, g: { hp: 10, atk: 4, def: 3, mp: 5 }, knMult: 1 },
  warrior: { name: 'นักรบโบราณ', desc: 'โจมตีและพลังชีวิตสูง', sprite: 'warrior',
    base: { hp: 140, atk: 24, def: 13, mp: 45, crit: 8 }, g: { hp: 14, atk: 5, def: 2, mp: 3 }, knMult: 1 },
  mage: { name: 'จอมเวทแห่งปัญญา', desc: 'พลังสกิลแรง ได้โบนัสจากความรู้มากที่สุด', sprite: 'mage',
    base: { hp: 100, atk: 17, def: 10, mp: 90, crit: 10 }, g: { hp: 8, atk: 3, def: 2, mp: 8 }, knMult: 1.5 },
  guardian: { name: 'ผู้พิทักษ์หลักฐาน', desc: 'ป้องกันสูง ทนทาน', sprite: 'guardian',
    base: { hp: 155, atk: 16, def: 21, mp: 50, crit: 5 }, g: { hp: 15, atk: 3, def: 5, mp: 4 }, knMult: 1 },
};

export const STAT_POINT = { hp: 12, atk: 3, def: 3, mp: 8, crit: 1 };
export const STAT_NAME = { hp: 'HP พลังชีวิต', atk: 'ATK พลังโจมตี', def: 'DEF พลังป้องกัน', mp: 'MP พลังสกิล', crit: 'CRIT โอกาสคริติคอล', kn: 'KNOWLEDGE พลังความรู้' };

export const BASE_ACTIONS = [
  { id: 'basic', name: 'โจมตีธรรมดา', mp: 0, mult: 1, q: 0 },
  { id: 'evidence', name: 'พลังแห่งหลักฐาน', mp: 25, mult: 2.2, q: 1 },
  { id: 'timeburst', name: 'พลังข้ามกาลเวลา', mp: 60, mult: 4, q: 2 },
];

export const SKILLS = [
  { id: 'atk1', tree: 'atk', tier: 1, cost: 1, name: 'ดาบแห่งความรู้', desc: 'ท่าที่ต้องตอบคำถามแรงขึ้น 20%', passive: true },
  { id: 'atk2', tree: 'atk', tier: 2, cost: 2, name: 'ฟันทะลุยุคสมัย', desc: 'โจมตี 2 ครั้ง ครั้งละ 140% (35 MP)', mp: 35, mult: 1.4, hits: 2, q: 1 },
  { id: 'atk3', tree: 'atk', tier: 3, cost: 3, name: 'มหาพายุประวัติศาสตร์', desc: 'ท่าไม้ตาย 600% ต้องตอบคำถามยาก (80 MP)', mp: 80, mult: 6, q: 2 },
  { id: 'wis1', tree: 'wis', tier: 1, cost: 1, name: 'สายตานักสืบ', desc: 'ตัดตัวเลือกผิด 1 ข้อ ได้ 2 ครั้งต่อการต่อสู้', passive: true },
  { id: 'wis2', tree: 'wis', tier: 2, cost: 2, name: 'หลักฐานซ้อน', desc: 'ตอบถูกติดกันได้โบนัส +15% ต่อครั้ง (สูงสุด +60%)', passive: true },
  { id: 'wis3', tree: 'wis', tier: 3, cost: 3, name: 'ประทีปแห่งความจริง', desc: 'ความเสียหายตามค่า KNOWLEDGE (50 MP)', mp: 50, q: 2, kn: true },
  { id: 'gd1', tree: 'gd', tier: 1, cost: 1, name: 'โล่ศิลา', desc: 'ลดความเสียหายครั้งถัดไป 60% (15 MP)', mp: 15, q: 1, shield: 0.6 },
  { id: 'gd2', tree: 'gd', tier: 2, cost: 2, name: 'ฟื้นฟูจดหมายเหตุ', desc: 'ฟื้น HP 35% (30 MP)', mp: 30, q: 1, heal: 0.35 },
  { id: 'gd3', tree: 'gd', tier: 3, cost: 3, name: 'กำแพงเมืองโบราณ', desc: 'DEF เพิ่มถาวร 25%', passive: true },
];
export const TREES = { atk: 'พลังโจมตี', wis: 'ปัญญา', gd: 'ผู้พิทักษ์' };

const REVIEW_DAYS = [1, 3, 7, 14];
const REPLAY = [1, 0.5, 0.2, 0];

// ---------- เวลา (ครูเลื่อนวันเพื่อทดสอบได้จากหน้าครู) ----------
export function now() {
  let off = 0;
  try { off = Number(localStorage.getItem('hq_dayOffset') || 0); } catch (e) {}
  return Date.now() + off * 864e5;
}
export function dayKey(t = now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n, 12).getTime());
}
function dayDiff(a, b) {
  const p = k => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
  return p(b) - p(a);
}

// ---------- ผู้เล่น ----------
export function newPlayer({ sid, name, room, number, pw, cls }) {
  return {
    id: sid, sid, name, room, number: Number(number) || 0, pw: pw || '', base: {},
    cls, createdAt: now(), xp: 0, coins: 30, materials: 0, kn: 0,
    statPoints: 0, skillPoints: 0, alloc: { hp: 0, atk: 0, def: 0, mp: 0, crit: 0 },
    skills: [], inventory: [], equipped: {}, crystals: [], chests: ['wood'], pity: 0,
    progress: {}, bossWins: {}, bossTries: {}, answers: [], reviews: {},
    days: { last: null, streak: 0, reviewLast: null, reviewStreak: 0, dailyDone: null },
    log: [],
  };
}

export function xpNeed(level) { return 100 + 40 * (level - 1); }
export function levelInfo(xp) {
  let level = 1, rest = xp;
  while (rest >= xpNeed(level)) { rest -= xpNeed(level); level++; }
  return { level, into: rest, need: xpNeed(level) };
}

export function itemDef(id) { return ITEMS.find(i => i.id === id); }
function invItem(p, uid) { return p.inventory.find(i => i.uid === uid); }

export function stats(p) {
  const c = CLASSES[p.cls];
  const L = levelInfo(p.xp).level - 1;
  const s = {
    hp: c.base.hp + c.g.hp * L + p.alloc.hp * STAT_POINT.hp,
    atk: c.base.atk + c.g.atk * L + p.alloc.atk * STAT_POINT.atk,
    def: c.base.def + c.g.def * L + p.alloc.def * STAT_POINT.def,
    mp: c.base.mp + c.g.mp * L + p.alloc.mp * STAT_POINT.mp,
    crit: c.base.crit + p.alloc.crit * STAT_POINT.crit,
    kn: p.kn,
  };
  for (const uid of Object.values(p.equipped)) {
    const it = invItem(p, uid); if (!it) continue;
    const d = itemDef(it.id); const mult = 1 + 0.1 * (it.plus || 0);
    for (const [k, v] of Object.entries(d.st)) s[k] += Math.round(v * mult);
  }
  if (p.skills.includes('gd3')) s.def = Math.round(s.def * 1.25);
  return s;
}

function log(p, text) { p.log.unshift({ t: now(), text }); p.log.length = Math.min(p.log.length, 60); }

// มอบรางวัล คืนค่ารายการเหตุการณ์ที่ต้องแจ้งผู้เล่น
export function grant(p, r, reason) {
  const ev = [];
  if (r.xp) {
    const before = levelInfo(p.xp).level;
    p.xp += Math.round(r.xp);
    const after = levelInfo(p.xp).level;
    for (let l = before + 1; l <= after; l++) {
      p.statPoints += 3; p.skillPoints += 1;
      ev.push({ type: 'level', level: l });
    }
  }
  if (r.coins) p.coins += Math.round(r.coins);
  if (r.materials) p.materials += r.materials;
  if (r.kn) p.kn += r.kn;
  if (r.skillPoints) p.skillPoints += r.skillPoints;
  if (r.crystal) p.crystals.push({ day: dayKey() });
  if (r.chest) p.chests.push(r.chest);
  if (reason) log(p, `${reason}: ${[r.xp && `+${Math.round(r.xp)} XP`, r.coins && `+${r.coins} เหรียญ`, r.chest && CHESTS[r.chest].name, r.crystal && 'ผลึก', r.skillPoints && `+${r.skillPoints} แต้มสกิล`].filter(Boolean).join(' ')}`);
  return ev;
}

// เข้าเกมวันละครั้ง: +20 XP เรียนต่อเนื่อง
export function touchDay(p) {
  const today = dayKey();
  if (p.days.last === today) return null;
  const cont = p.days.last && dayDiff(p.days.last, today) === 1;
  p.days.streak = cont ? p.days.streak + 1 : 1;
  const first = p.days.last === null;
  p.days.last = today;
  if (first) return null;
  return { streak: p.days.streak, ev: grant(p, { xp: 20, coins: 5 }, `เข้าเรียนวันที่ ${p.days.streak} ติดต่อกัน`) };
}

// ---------- คำตอบและความเชี่ยวชาญ ----------
export function recordAnswer(p, q, correct, where) {
  p.answers.push({ q: q.id, topic: q.topic, ok: !!correct, t: now(), where });
  if (p.answers.length > 500) p.answers.splice(0, p.answers.length - 500);
}
export function mastery(p, topic) {
  const a = p.answers.filter(x => x.topic === topic).slice(-8);
  if (!a.length) return 0;
  return Math.round(100 * a.filter(x => x.ok).length / Math.max(a.length, 4));
}
export function worldMastery(p, worldId) {
  const w = WORLDS.find(x => x.id === worldId);
  const ts = w.topics || [];
  return ts.length ? Math.round(ts.reduce((s, t) => s + mastery(p, t), 0) / ts.length) : 0;
}
export function weakTopics(p) {
  return Object.keys(TOPICS).filter(t => {
    const n = p.answers.filter(x => x.topic === t).length;
    return n >= 3 && mastery(p, t) < 60;
  });
}

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// เลือกคำถามใหม่ที่ไม่ได้เพิ่งเห็น ให้หัวข้อที่อ่อนมาก่อน
export function pickQuestions(p, topics, n, opt = {}) {
  const ex = opt.exclude || new Set();
  const recent = new Set(p.answers.slice(-25).map(a => a.q));
  const weak = new Set(weakTopics(p));
  let pool = QUESTIONS.filter(q => topics.includes(q.topic) && !ex.has(q.id));
  if (opt.lv) { const f = pool.filter(q => q.lv === opt.lv); if (f.length) pool = f; }
  const scored = shuffle(pool.slice()).map(q => ({ q, s: (recent.has(q.id) ? -2 : 0) + (weak.has(q.topic) ? 1 : 0) + Math.random() }));
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, n).map(x => shuffleChoices(x.q));
}
export function shuffleChoices(q) {
  const order = shuffle(q.c.map((_, i) => i));
  return { ...q, c: order.map(i => q.c[i]), ans: order.indexOf(q.ans) };
}

// ---------- ด่านและโลก ----------
export function stageState(p, id) { return p.progress[id] || { plays: 0 }; }
export function stageDone(p, id) { return (p.progress[id]?.plays || 0) > 0; }
export function worldStages(worldId) { return STAGES.filter(s => s.world === worldId); }

export function stageOpen(p, stage) {
  const list = worldStages(stage.world);
  const i = list.indexOf(stage);
  return i === 0 || stageDone(p, list[i - 1].id);
}
export function bossOpen(p, worldId) { return worldStages(worldId).every(s => stageDone(p, s.id)); }

export function worldUnlock(p, world, settings) {
  if (!world.playable) return { ok: false, checks: [{ label: world.note, ok: false }] };
  if (!world.unlock) return { ok: true, checks: [] };
  const prev = world.unlock.world;
  const checks = [
    { label: `XP สะสม ${settings.w3Xp.toLocaleString()} ขึ้นไป (ตอนนี้ ${p.xp.toLocaleString()})`, ok: p.xp >= settings.w3Xp },
    { label: `ชนะบอสโลกที่ ${prev}`, ok: !!p.bossWins['boss' + prev] },
    { label: `ความเชี่ยวชาญโลกที่ ${prev} อย่างน้อย ${settings.masteryGate}% (ตอนนี้ ${worldMastery(p, prev)}%)`, ok: worldMastery(p, prev) >= settings.masteryGate },
  ];
  return { ok: checks.every(c => c.ok), checks };
}

// สรุปผลด่าน: correct = จำนวนข้อที่ถูกในภารกิจ, score = % มินิเกม
export function completeStage(p, stage, { correct = 0, total = 0, score = 0 }) {
  const st = p.progress[stage.id] || { plays: 0, best: 0 };
  const f = REPLAY[Math.min(st.plays, REPLAY.length - 1)];
  let r;
  if (stage.kind === 'game') {
    const good = score >= 80;
    r = { xp: (good ? 60 : 30) * f, coins: Math.round((good ? 15 : 5) * f), chest: good && st.plays === 0 ? 'silver' : null, materials: f > 0 ? 1 : 0 };
  } else {
    const base = stage.kind === 'manga' ? 50 : 40;
    r = { xp: (base + 30 * correct) * f, coins: Math.round((10 + 5 * correct) * f), materials: f > 0 ? 1 : 0,
      kn: st.plays === 0 ? (stage.kind === 'sheet' ? 2 : 1) : 0,
      chest: st.plays === 0 ? (stage.kind === 'sheet' ? 'iron' : 'wood') : null };
  }
  st.plays++; st.best = Math.max(st.best || 0, stage.kind === 'game' ? score : Math.round(100 * correct / Math.max(total, 1)));
  st.last = dayKey();
  p.progress[stage.id] = st;
  if (!p.reviews[stage.topic]) p.reviews[stage.topic] = { step: 0, due: addDays(dayKey(), REVIEW_DAYS[0]) };
  const ev = grant(p, r, stage.title);
  return { r, ev, replay: f };
}

export function bossResult(p, bossId, win) {
  const tries = (p.bossTries[bossId] = (p.bossTries[bossId] || 0) + 1);
  if (win) {
    const first = !p.bossWins[bossId];
    p.bossWins[bossId] = (p.bossWins[bossId] || 0) + 1;
    const r = first ? { xp: 150, coins: 50, chest: 'boss', skillPoints: 1, materials: 3 } : { xp: 40, coins: 15, chest: 'wood', materials: 1 };
    return { r, ev: grant(p, r, `ชนะ${BOSSES[bossId].name}`), first };
  }
  const r = tries <= 3 ? { xp: 20 } : {};
  return { r, ev: grant(p, r, `ท้าทาย${BOSSES[bossId].name}`), first: false };
}

// ---------- ห้องสมุด: อ่านมังงะครบเล่มครั้งแรก ได้หีบไม้ ----------
export function markRead(p, book, idx) {
  p.reading = p.reading || {};
  const r = p.reading[book.id] = p.reading[book.id] || { seen: [], last: 0, done: false };
  if (!r.seen.includes(idx)) r.seen.push(idx);
  r.last = idx;
  if (!r.done && r.seen.length >= book.pages.length) {
    r.done = true;
    const rw = { xp: 30, coins: 10, kn: 1, chest: 'wood' };
    return { r: rw, ev: grant(p, rw, `อ่านมังงะนักสืบอดีต เล่ม ${book.no} ครบเล่ม`) };
  }
  return null;
}

// ---------- ทบทวนเว้นระยะ ----------
export function dueTopics(p) {
  const today = dayKey();
  return Object.entries(p.reviews).filter(([, v]) => v.step < 4 && v.due <= today).map(([t]) => t);
}
export function reviewPlan(p) {
  const due = dueTopics(p), weak = weakTopics(p).filter(t => !due.includes(t));
  const topics = [...due, ...weak];
  return { due, weak, topics, dailyAvailable: p.days.dailyDone !== dayKey() };
}
export function reviewQuestions(p) {
  const { topics } = reviewPlan(p);
  if (!topics.length) return [];
  const qs = [], ex = new Set();
  let i = 0;
  while (qs.length < 5 && i < 20) {
    const t = topics[i % topics.length];
    const [q] = pickQuestions(p, [t], 1, { exclude: ex });
    if (q) { qs.push(q); ex.add(q.id); }
    i++;
  }
  return qs;
}
// results: [{topic, ok}]
export function completeReview(p, results) {
  const today = dayKey();
  const { due, weak } = reviewPlan(p);
  const msgs = [];
  let mastered = 0;
  for (const t of due) {
    const rs = results.filter(r => r.topic === t);
    const v = p.reviews[t];
    if (rs.length && rs.every(r => r.ok)) {
      v.step++;
      if (v.step >= 4) { mastered++; msgs.push(`เชี่ยวชาญ "${TOPICS[t].name}" แล้ว! +1 แต้มสกิล`); }
      else { v.due = addDays(today, REVIEW_DAYS[v.step]); msgs.push(`"${TOPICS[t].name}" ทบทวนครั้งต่อไปอีก ${REVIEW_DAYS[v.step]} วัน`); }
    } else { v.due = addDays(today, 1); msgs.push(`"${TOPICS[t].name}" ยังมีข้อผิด มาทบทวนอีกครั้งพรุ่งนี้`); }
  }
  const correct = results.filter(r => r.ok).length;
  const firstToday = p.days.dailyDone !== today;
  let xp = 0;
  if (due.length) xp += 40 + (due.some(t => p.reviews[t].step >= 2) ? 20 : 0);
  if (weak.length) xp += 20;
  if (!firstToday) xp = Math.round(xp * 0.25);
  xp = Math.min(xp, 80);
  const r = { xp, coins: correct * 3, skillPoints: mastered };
  if (firstToday && results.length >= 5) {
    r.chest = 'iron';
    if (correct >= 3) r.crystal = true;
    p.days.dailyDone = today;
    const cont = p.days.reviewLast && dayDiff(p.days.reviewLast, today) === 1;
    p.days.reviewStreak = cont ? p.days.reviewStreak + 1 : 1;
    p.days.reviewLast = today;
    if (p.days.reviewStreak % 7 === 0) { p.chests.push('gold'); msgs.push('ทบทวนต่อเนื่องครบ 7 วัน! ได้หีบทอง'); }
  }
  return { r, ev: grant(p, r, 'ภารกิจทบทวน'), msgs, correct };
}

// ---------- หีบและอุปกรณ์ ----------
export function openChest(p, index, settings = DEFAULT_SETTINGS) {
  const type = p.chests[index];
  if (!type) return null;
  p.chests.splice(index, 1);
  const w = CHESTS[type].w.slice();
  if (settings.dropBoost) { w[2] += settings.dropBoost; w[3] += settings.dropBoost / 2; }
  p.pity++;
  let rar;
  if (p.pity >= 10) { rar = Math.random() < 0.3 ? 3 : 2; }
  else {
    let x = Math.random() * w.reduce((a, b) => a + b, 0);
    rar = 0; while (x >= w[rar]) { x -= w[rar]; rar++; }
  }
  if (rar >= 2) p.pity = 0;
  const pool = ITEMS.filter(i => i.r === rar);
  const def = pool[Math.floor(Math.random() * pool.length)];
  const dup = p.inventory.some(i => i.id === def.id);
  const item = { uid: 'i' + Math.random().toString(36).slice(2, 9), id: def.id, plus: 0 };
  p.inventory.push(item);
  log(p, `เปิด${CHESTS[type].name} ได้ ${def.name}`);
  return { item, def, dup, type };
}
export function equip(p, uid) { const it = invItem(p, uid); if (it) p.equipped[itemDef(it.id).slot] = uid; }
export function unequip(p, slot) { delete p.equipped[slot]; }
export function salvage(p, uid) {
  if (Object.values(p.equipped).includes(uid)) return 0;
  const i = p.inventory.findIndex(x => x.uid === uid); if (i < 0) return 0;
  const it = p.inventory[i]; const gain = (itemDef(it.id).r + 1) * 2 + (it.plus || 0);
  p.inventory.splice(i, 1); p.materials += gain;
  return gain;
}
export function forgeCost(it) {
  const n = (it.plus || 0) + 1;
  return { coins: 20 * n, materials: n, crystals: n >= 6 ? 3 : 0 };
}
// ผลึก 3 ชิ้นต้องมาจาก 3 วันต่างกัน
function crystalDays(p) { return [...new Set(p.crystals.map(c => c.day))]; }
export function canForge(p, uid) {
  const it = invItem(p, uid); if (!it) return { ok: false, why: 'ไม่พบอุปกรณ์' };
  if ((it.plus || 0) >= 10) return { ok: false, why: 'อัปเกรดสูงสุดแล้ว' };
  const c = forgeCost(it);
  if (p.coins < c.coins) return { ok: false, why: `เหรียญไม่พอ (ต้องใช้ ${c.coins})`, c };
  if (p.materials < c.materials) return { ok: false, why: `วัสดุไม่พอ (ต้องใช้ ${c.materials})`, c };
  if (c.crystals && crystalDays(p).length < 3) return { ok: false, why: `ต้องมีผลึกแห่งความทรงจำจากการทบทวน 3 วันต่างกัน (มี ${crystalDays(p).length} วัน)`, c };
  return { ok: true, c };
}
export function forge(p, uid) {
  const chk = canForge(p, uid); if (!chk.ok) return chk;
  const it = invItem(p, uid);
  p.coins -= chk.c.coins; p.materials -= chk.c.materials;
  if (chk.c.crystals) {
    for (const d of crystalDays(p).slice(0, 3)) p.crystals.splice(p.crystals.findIndex(c => c.day === d), 1);
  }
  it.plus = (it.plus || 0) + 1;
  log(p, `ตีเหล็ก ${itemDef(it.id).name} เป็น +${it.plus}`);
  return { ok: true, plus: it.plus };
}

// ---------- สกิลและแต้ม ----------
export function canLearn(p, sk) {
  if (p.skills.includes(sk.id)) return { ok: false, why: 'เรียนแล้ว' };
  const prev = SKILLS.find(s => s.tree === sk.tree && s.tier === sk.tier - 1);
  if (prev && !p.skills.includes(prev.id)) return { ok: false, why: `ต้องเรียน "${prev.name}" ก่อน` };
  if (p.skillPoints < sk.cost) return { ok: false, why: `ต้องใช้ ${sk.cost} แต้มสกิล` };
  return { ok: true };
}
export function learn(p, id) {
  const sk = SKILLS.find(s => s.id === id);
  const c = canLearn(p, sk); if (!c.ok) return c;
  p.skillPoints -= sk.cost; p.skills.push(id); log(p, `เรียนสกิล ${sk.name}`);
  return { ok: true };
}
export function allocate(p, stat) {
  if (p.statPoints <= 0) return false;
  p.statPoints--; p.alloc[stat]++; return true;
}

export function battleActions(p) {
  return [...BASE_ACTIONS, ...SKILLS.filter(s => !s.passive && p.skills.includes(s.id))];
}
