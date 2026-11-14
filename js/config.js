// เชื่อม Google Sheets: วาง URL เว็บแอปจาก Apps Script (ลงท้าย /exec) — ดูวิธีใน apps-script/Code.gs
// เว้นว่างไว้ = โหมดทดลอง เก็บข้อมูลในเบราว์เซอร์เครื่องนี้เท่านั้น
export const CONFIG = {
  sheetUrl: 'https://script.google.com/macros/s/AKfycbxsw0WHeAedqqmu1aQrwdNGNjqCk8Y07HVDHK67Z1jIIltWC_uMuJohh3ET26Kj4jIV/exec',
  // รหัสครูตั้งในชีต Settings แถว teacherKey เท่านั้น ห้ามใส่ในไฟล์นี้ เพราะไฟล์นี้ใครก็เปิดดูได้
  teacherPin: '1234', // รหัสหน้าครูในโหมดทดลอง (ยังไม่เชื่อมชีต)
};
