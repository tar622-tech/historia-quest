// ชั้นข้อมูล: เก็บในเครื่องเสมอ และซิงก์กับ Google Sheets เมื่อใส่ sheetUrl ใน js/config.js
import { DEFAULT_SETTINGS, levelInfo } from './game.js';
import { CONFIG } from './config.js';

const KEY = 'hq_players', SES = 'hq_session', SET = 'hq_settings';
export const EDIT = ['xp', 'coins', 'materials', 'statPoints', 'skillPoints', 'kn'];
export const sheetMode = !!CONFIG.sheetUrl;

function read(k, d, s = localStorage) { try { const v = s.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function write(k, v, s = localStorage) { try { s.setItem(k, JSON.stringify(v)); } catch (e) {} }

async function api(body) {
  // text/plain เพื่อไม่ให้เบราว์เซอร์ส่ง preflight (Apps Script ไม่รองรับ)
  const res = await fetch(CONFIG.sheetUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
  const out = await res.json();
  if (!out.ok) throw new Error(out.error || 'เชื่อมต่อชีตไม่สำเร็จ');
  return out;
}

// เลเวลที่เพิ่มจาก XP ที่ครูให้ ได้แต้มเหมือนเลเวลอัปในเกม
function levelBonus(p, xpBefore) {
  const n = levelInfo(p.xp).level - levelInfo(xpBefore).level;
  if (n > 0) { p.statPoints += 3 * n; p.skillPoints += n; }
}
// ค่าที่ครูแก้ในชีต: ส่วนต่างจากค่าที่ซิงก์ล่าสุด
function applySheetValues(p, values) {
  p.base = p.base || {};
  const xp0 = p.xp;
  for (const k of EDIT) {
    if (values[k] == null) continue;
    const base = p.base[k] ?? values[k];
    if (values[k] !== base) p[k] = Math.max(0, (p[k] || 0) + values[k] - base);
    p.base[k] = values[k];
  }
  levelBonus(p, xp0);
}

let timer = null, pending = null;
export const store = {
  onStatus: () => {},
  summary: () => ({}),
  players() { return read(KEY, {}); },
  get(sid) { return this.players()[sid] || null; },
  session() { return read(SES, null, sessionStorage) || read(SES, null); },
  setSession(s) {
    if (!s) { sessionStorage.removeItem(SES); localStorage.removeItem(SES); return; }
    write(SES, s, sessionStorage);
    if (!sheetMode) write(SES, { sid: s.sid }); // โหมดทดลอง: จำผู้เล่นล่าสุดไว้ในเครื่อง
  },
  settings() { return { ...DEFAULT_SETTINGS, ...read(SET, {}) }; },
  saveSettings(s) { write(SET, s); },

  // คืน { student, player } — player = null แปลว่าเข้าครั้งแรก ต้องเลือกสายตัวละคร
  async login(sid, pw) {
    sid = String(sid).trim();
    if (!sheetMode) {
      const p = this.get(sid);
      if (p && p.pw && p.pw !== pw) throw new Error('รหัสผ่านไม่ถูกต้อง');
      return { student: p ? { sid, name: p.name, room: p.room, number: p.number } : { sid }, player: p };
    }
    const out = await api({ action: 'login', id: sid, pw });
    write(SET, out.settings || {});
    let p = out.data;
    if (p) {
      Object.assign(p, { sid: out.student.sid, name: out.student.name, room: out.student.room, number: out.student.number });
      applySheetValues(p, out.values);
      const all = this.players(); all[p.sid] = p; write(KEY, all);
    }
    return { student: out.student, player: p, values: out.values };
  },

  save(p, now = false) {
    const all = this.players(); all[p.sid] = p; write(KEY, all);
    if (!sheetMode) return;
    pending = p; clearTimeout(timer);
    this.onStatus('pending');
    timer = setTimeout(() => this.flush(), now ? 0 : 2500);
  },
  async flush() {
    if (!sheetMode || !pending) return;
    const p = pending; pending = null;
    const s = this.session();
    const sent = Object.fromEntries(EDIT.map(k => [k, p[k]]));
    this.onStatus('saving');
    try {
      const out = await api({ action: 'save', id: p.sid, pw: s?.pw || '', data: JSON.parse(JSON.stringify(p)), base: p.base || {}, summary: this.summary(p) });
      const xp0 = p.xp, changed = EDIT.some(k => out.values[k] !== sent[k]);
      for (const k of EDIT) { p[k] = Math.max(0, p[k] + out.values[k] - sent[k]); }
      p.base = { ...out.values };
      levelBonus(p, xp0);
      const all = this.players(); all[p.sid] = p; write(KEY, all);
      if (changed && p.xp !== xp0) this.save(p); // ส่งแต้มที่ได้จากเลเวลกลับขึ้นชีต
      this.onStatus('saved', changed);
    } catch (e) {
      pending = pending || p; this.onStatus('error', e.message);
      clearTimeout(timer); timer = setTimeout(() => this.flush(), 15000);
    }
  },

  // หน้าครู
  async pullAll(key) {
    if (!sheetMode) return { students: Object.values(this.players()), settings: this.settings() };
    const out = await api({ action: 'all', key });
    write(SET, out.settings || {});
    return { students: out.students, settings: this.settings() };
  },
  remove(sid) { const all = this.players(); delete all[sid]; write(KEY, all); },
};

// ส่งข้อมูลที่ค้างก่อนปิดหน้า
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') store.flush(); });
