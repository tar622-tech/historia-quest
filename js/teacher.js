import { TOPICS, WORLDS, STAGES } from './content.js';
import * as G from './game.js';
import { store, sheetMode } from './store.js';
import { CONFIG } from './config.js';

const root = document.getElementById('t');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
let players = [], room = '', settings = store.settings(), key = '';

function heat(v, n) {
  if (!n) return 'background:#0003;color:var(--muted)';
  const c = v >= 80 ? '#2f8a46' : v >= 60 ? '#a07a1a' : '#a8332b';
  return `background:${c};color:#fff`;
}
function lastActive(p) { const t = Math.max(p.createdAt || 0, ...p.answers.map(a => a.t)); return t; }
function row(p) {
  const L = G.levelInfo(p.xp).level;
  const m1 = G.worldMastery(p, 1), m3 = G.worldMastery(p, 3);
  const answered = p.answers.length;
  const avg = Math.round(Object.keys(TOPICS).filter(t => p.answers.some(a => a.topic === t)).reduce((s, t, _, arr) => s + G.mastery(p, t) / arr.length, 0));
  const flags = [];
  if (L >= 5 && avg < 60) flags.push('เลเวลสูงแต่ความเชี่ยวชาญต่ำ');
  if (G.weakTopics(p).length >= 2) flags.push(`จุดอ่อน ${G.weakTopics(p).length} หัวข้อ`);
  if (G.dueTopics(p).length >= 3) flags.push('ทบทวนค้าง');
  if (G.now() - lastActive(p) > 7 * 864e5) flags.push('ไม่ได้เข้าเรียน 7 วัน');
  return { p, L, m1, m3, avg, answered, flags, stages: STAGES.filter(s => G.stageDone(p, s.id)).length };
}

async function load() {
  const r = await store.pullAll(key);
  players = r.students; settings = r.settings;
  draw();
}

function draw() {
  const rooms = [...new Set(players.map(p => p.room))].sort();
  const list = players.filter(p => !room || p.room === room).sort((a, b) => (a.room + String(a.number).padStart(3, '0')).localeCompare(b.room + String(b.number).padStart(3, '0')));
  const R = list.map(row);
  const active7 = list.filter(p => G.now() - lastActive(p) <= 7 * 864e5).length;
  const avgM = R.length ? Math.round(R.reduce((s, r) => s + r.avg, 0) / R.length) : 0;
  const help = R.filter(r => r.flags.length).length;
  const topicAvg = Object.keys(TOPICS).map(t => {
    const who = list.filter(p => p.answers.some(a => a.topic === t));
    return { t, n: who.length, v: who.length ? Math.round(who.reduce((s, p) => s + G.mastery(p, t), 0) / who.length) : 0 };
  });
  const off = Number(localStorage.getItem('hq_dayOffset') || 0);

  root.innerHTML = `
  <div class="row" style="justify-content:space-between"><h1 style="color:var(--gold);margin:12px 0 0">หน้าครู · HISTORIA QUEST</h1><a class="btn ghost" href="index.html">← กลับเกม</a></div>
  <p class="small">${sheetMode ? 'ข้อมูลจาก Google Sheets: แก้ XP เหรียญ วัสดุ แต้ม และ KNOWLEDGE ได้ในชีต Students (คอลัมน์ ✎) ตั้งค่าเกมในชีต Settings' : 'โหมดทดลอง: เห็นเฉพาะนักเรียนที่เล่นบนเบราว์เซอร์นี้ ใส่ URL เว็บแอปใน js/config.js เพื่อเชื่อม Google Sheets'}</p>
  <section class="panel">
    <div class="row"><label>ห้อง <select id="room"><option value="">ทุกห้อง</option>${rooms.map(r => `<option ${r === room ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></label>
    <button class="btn" id="csv">ส่งออก CSV (เปิดใน Excel / Google Sheets)</button><button class="btn ghost" id="reload">โหลดใหม่</button></div>
    <div class="kpis" style="margin-top:12px">
      <div class="kpi"><b>${list.length}</b>นักเรียนทั้งหมด</div>
      <div class="kpi"><b>${active7}</b>เรียนใน 7 วันที่ผ่านมา</div>
      <div class="kpi"><b>${avgM}%</b>ความเชี่ยวชาญเฉลี่ย</div>
      <div class="kpi"><b>${help}</b>ควรได้รับการช่วยเหลือ</div>
    </div>
  </section>
  <section class="panel"><h2>ความเชี่ยวชาญเฉลี่ยรายหัวข้อ</h2><p class="muted small">ใช้เลือกหัวข้อที่ควรสอนซ่อมทั้งห้อง (คิดจากนักเรียนที่เคยตอบหัวข้อนั้น)</p>
    <table class="tbl small">${topicAvg.map(x => `<tr><td>โลก ${TOPICS[x.t].world}</td><td>${TOPICS[x.t].name}</td><td style="width:45%"><div class="bar m"><i style="width:${x.v}%"></i></div></td><td>${x.n ? x.v + '%' : '-'}</td><td class="muted">${x.n} คน</td></tr>`).join('')}</table>
  </section>
  <section class="panel"><h2>รายชื่อนักเรียน</h2><div class="scroll"><table class="tbl small heat">
    <tr><th>ห้อง</th><th>เลขที่</th><th>รหัส</th><th>ชื่อ</th><th>LV</th><th>XP</th><th>ด่าน</th><th>โลก 1</th><th>โลก 3</th>${Object.keys(TOPICS).map(t => `<th title="${TOPICS[t].name}">${TOPICS[t].name.slice(0, 8)}</th>`).join('')}<th>ข้อสังเกต</th><th></th></tr>
    ${R.map(r => `<tr><td>${esc(r.p.room)}</td><td>${r.p.number}</td><td>${esc(r.p.sid)}</td><td>${esc(r.p.name)}<div class="muted">${G.CLASSES[r.p.cls].name}</div></td><td>${r.L}</td><td>${r.p.xp}</td><td>${r.stages}/${STAGES.length}</td><td>${r.m1}%</td><td>${r.m3}%</td>
      ${Object.keys(TOPICS).map(t => { const n = r.p.answers.filter(a => a.topic === t).length; return `<td class="h" style="${heat(G.mastery(r.p, t), n)}">${n ? G.mastery(r.p, t) : '·'}</td>`; }).join('')}
      <td class="flag">${r.flags.join(', ')}</td><td>${sheetMode ? '' : `<button class="btn small ghost" data-del="${r.p.sid}" title="ลบจากเครื่องนี้">ลบ</button>`}</td></tr>`).join('') || `<tr><td colspan="20" class="muted">ยังไม่มีนักเรียน</td></tr>`}
  </table></div><p class="muted small">ตัวเลขในช่องหัวข้อ = ความเชี่ยวชาญ % จากคำตอบล่าสุด 8 ข้อ · เขียว ≥ 80 · เหลือง 60–79 · แดง &lt; 60</p></section>
  ${sheetMode ? '' : `<section class="panel"><h2>ตั้งค่าสมดุลเกม</h2><form id="set" class="settings">
    <label>เกณฑ์ความเชี่ยวชาญเพื่อเปิดโลกถัดไป (%) <input name="masteryGate" type="number" min="0" max="100" value="${settings.masteryGate}"></label>
    <label>XP ที่ต้องมีเพื่อเปิดโลกที่ 3 <input name="w3Xp" type="number" min="0" step="50" value="${settings.w3Xp}"></label>
    <label>พลังชีวิตบอส (% ของค่าปกติ) <input name="bossHp" type="number" min="30" max="300" step="10" value="${settings.bossHp}"></label>
    <label>เพิ่มโอกาสของหายาก (0–20) <input name="dropBoost" type="number" min="0" max="20" value="${settings.dropBoost}"></label>
  </form><div class="row"><button class="btn primary" id="saveSet">บันทึกการตั้งค่า</button></div></section>`}
  <section class="panel"><h2>ทดสอบระบบทบทวน</h2><p class="small">เลื่อนวันในเครื่องนี้เพื่อทดลองว่าภารกิจทบทวนวันที่ 1, 3, 7, 14 ทำงานอย่างไร (มีผลเฉพาะเบราว์เซอร์นี้) ตอนนี้เลื่อนไป ${off} วัน</p>
    <div class="row"><button class="btn" data-off="1">+1 วัน</button><button class="btn" data-off="3">+3 วัน</button><button class="btn" data-off="0">กลับวันจริง</button></div></section>
  <section class="panel"><p class="small muted">รหัสหน้าครูตั้งใน js/config.js · คำถามและด่านแก้ได้ใน js/content.js</p></section>`;

  document.getElementById('room').onchange = e => { room = e.target.value; draw(); };
  document.getElementById('reload').onclick = load;
  document.getElementById('csv').onclick = () => exportCsv(R);
  if (!sheetMode) document.getElementById('saveSet').onclick = () => {
    const d = Object.fromEntries(new FormData(document.getElementById('set')));
    settings = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, Number(v)]));
    store.saveSettings(settings); alert('บันทึกแล้ว');
  };
  root.querySelectorAll('[data-off]').forEach(b => b.onclick = () => {
    const n = Number(b.dataset.off); localStorage.setItem('hq_dayOffset', n ? off + n : 0); draw();
  });
  root.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    const p = players.find(x => x.sid === b.dataset.del);
    if (confirm(`ลบข้อมูลของ ${p.name} (${p.room} เลขที่ ${p.number}) ออกจากเครื่องนี้? กู้คืนไม่ได้`)) { store.remove(p.sid); players = players.filter(x => x !== p); draw(); }
  });
}

function exportCsv(R) {
  const head = ['ห้อง', 'เลขที่', 'รหัสนักเรียน', 'ชื่อ', 'สาย', 'เลเวล', 'XP', 'ด่านที่ผ่าน', 'เชี่ยวชาญโลก1', 'เชี่ยวชาญโลก3', ...Object.values(TOPICS).map(t => t.name), 'คำตอบทั้งหมด', 'ข้อสังเกต'];
  const rows = R.map(r => [r.p.room, r.p.number, r.p.sid, r.p.name, G.CLASSES[r.p.cls].name, r.L, r.p.xp, r.stages, r.m1, r.m3, ...Object.keys(TOPICS).map(t => G.mastery(r.p, t)), r.answered, r.flags.join(' / ')]);
  const csv = '﻿' + [head, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `historia-quest-${G.dayKey()}.csv`; a.click();
}

// เข้าหน้าครูด้วยรหัส
root.innerHTML = `<section class="panel" style="max-width:420px;margin:60px auto"><h2>หน้าครู</h2><form id="gate" class="form"><label>รหัสครู <input name="pin" type="password" required autofocus></label></form><div class="row"><button class="btn primary" id="enter">เข้าสู่หน้าครู</button><a class="btn ghost" href="index.html">กลับเกม</a></div></section>`;
const enter = async () => {
  const pin = new FormData(document.getElementById('gate')).get('pin');
  if (!sheetMode && pin !== CONFIG.teacherPin) return alert('รหัสไม่ถูกต้อง');
  key = pin;
  try { await load(); } catch (e) { alert(e.message); }
};
document.getElementById('enter').onclick = enter;
document.getElementById('gate').onsubmit = e => { e.preventDefault(); enter(); };
