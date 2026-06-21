// ============================================================
// Voice Attendance System — Google Apps Script
// ระบบเรียกชื่อเช็คชื่อด้วยเสียง
// บันทึกแยกรายวิชา: Sheet "[บันทึก] วิชา | DD/MM/BBBB"
// ============================================================

const SHEET_ID  = 'YOUR_SPREADSHEET_ID';  // ← ใส่ ID ของ Spreadsheet
const NAME_COL  = 1;   // คอลัมน์ A = ชื่อนักเรียน
const DATA_START = 1;  // แถวเริ่มต้นข้อมูล (1 = ไม่มี header ในชีทวิชา)
const LOG_MARK  = '[บันทึก]'; // prefix ของ Sheet บันทึก

// ──────────────────────────────────────────────────────────
// ENTRY POINT
// ──────────────────────────────────────────────────────────

function doGet() {
  try {
    return HtmlService
      .createHtmlOutputFromFile('Index')
      .setTitle('ระบบเรียกชื่อเช็คชื่อ')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch(e) {
    return HtmlService.createHtmlOutput(
      '<p style="color:red;font-family:sans-serif;padding:20px">Error: ' + e.message + '</p>'
    );
  }
}

// ──────────────────────────────────────────────────────────
// UTILS
// ──────────────────────────────────────────────────────────

function getSS() {
  return SHEET_ID !== 'YOUR_SPREADSHEET_ID'
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function thaiDate() {
  const now = new Date();
  const dd   = Utilities.formatDate(now, 'Asia/Bangkok', 'dd');
  const mm   = Utilities.formatDate(now, 'Asia/Bangkok', 'MM');
  const yyyy = (parseInt(Utilities.formatDate(now, 'Asia/Bangkok', 'yyyy')) + 543).toString();
  return dd + '/' + mm + '/' + yyyy;
}

function thaiTime() {
  return Utilities.formatDate(new Date(), 'Asia/Bangkok', 'HH:mm:ss');
}

// ชื่อ Sheet บันทึก: "[บันทึก] วิชา | DD/MM/BBBB"
function logSheetName(subject) {
  return LOG_MARK + ' ' + subject + ' | ' + thaiDate();
}

// ──────────────────────────────────────────────────────────
// GET SUBJECTS — คืนรายชื่อวิชา (Sheet ที่ไม่ใช่ Sheet บันทึก)
// ──────────────────────────────────────────────────────────

function getSubjects() {
  try {
    return getSS().getSheets()
      .map(sh => sh.getName())
      .filter(n => !n.startsWith(LOG_MARK))
      .map((n, i) => ({ name: n, index: i }));
  } catch(e) { return []; }
}

// ──────────────────────────────────────────────────────────
// GET STUDENTS จาก Sheet วิชา
// ──────────────────────────────────────────────────────────

function getStudentsBySubject(subject) {
  try {
    const sh = getSS().getSheetByName(subject);
    if (!sh) return { students: [], error: 'ไม่พบ Sheet: ' + subject };
    const last = sh.getLastRow();
    if (last < DATA_START) return { students: [], error: null };
    const vals = sh.getRange(DATA_START, NAME_COL, last - DATA_START + 1, 1).getValues();
    return {
      students: vals
        .map((r, i) => ({ no: i + 1, name: r[0].toString().trim() }))
        .filter(s => s.name !== ''),
      error: null
    };
  } catch(e) { return { students: [], error: e.message }; }
}

// ──────────────────────────────────────────────────────────
// ENSURE LOG SHEET — สร้าง Sheet บันทึกถ้ายังไม่มี
// ──────────────────────────────────────────────────────────

function ensureLogSheet(ss, subject) {
  const name = logSheetName(subject);
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    ss.moveActiveSheet(ss.getNumSheets()); // ย้ายไปท้ายสุด

    // Header row
    const h = sh.getRange(1, 1, 1, 4);
    h.setValues([['เวลา', 'ชื่อ-นามสกุล', 'สถานะ', 'หมายเหตุ']]);
    h.setFontWeight('bold')
     .setBackground('#1a73e8')
     .setFontColor('#ffffff')
     .setFontSize(11);
    sh.setFrozenRows(1);

    // Column widths
    sh.setColumnWidth(1,  80);
    sh.setColumnWidth(2, 240);
    sh.setColumnWidth(3,  90);
    sh.setColumnWidth(4, 220);

    // วิชา+วันที่ที่ F1
    sh.getRange('F1')
      .setValue(subject + ' | ' + thaiDate())
      .setFontWeight('bold')
      .setFontSize(11)
      .setFontColor('#555555');
  }
  return sh;
}

// ──────────────────────────────────────────────────────────
// LOG ATTENDANCE — บันทึกการเช็คชื่อลง Sheet
// ──────────────────────────────────────────────────────────

function logAttendance(subject, name, status, note) {
  try {
    const ss = getSS();
    const sh = ensureLogSheet(ss, subject);

    const statusMap = { present: '✓ มา', absent: '✗ ขาด', leave: '🏥 ลา' };
    const colorMap  = { present: '#e6f4ea', absent: '#fce8e6', leave: '#f3e5f5' };

    sh.appendRow([thaiTime(), name, statusMap[status] || status, note || '']);

    const r = sh.getLastRow();
    sh.getRange(r, 1, 1, 4)
      .setBackground(colorMap[status] || '#ffffff')
      .setFontSize(10);

    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

// ──────────────────────────────────────────────────────────
// GET TODAY LOG — คืนบันทึกวันนี้ของวิชา (ล่าสุดก่อน)
// ──────────────────────────────────────────────────────────

function getTodayLog(subject) {
  try {
    const sh = getSS().getSheetByName(logSheetName(subject));
    if (!sh || sh.getLastRow() < 2) return [];
    return sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues()
      .filter(r => r[1] !== '')
      .map(r => ({ time: r[0], name: r[1], status: r[2], note: r[3] }))
      .reverse();
  } catch(e) { return []; }
}

// ──────────────────────────────────────────────────────────
// GET LOG SHEETS — คืนรายชื่อ Sheet บันทึกทั้งหมด
// ──────────────────────────────────────────────────────────

function getLogSheets() {
  try {
    return getSS().getSheets()
      .map(sh => sh.getName())
      .filter(n => n.startsWith(LOG_MARK))
      .reverse();
  } catch(e) { return []; }
}

// ──────────────────────────────────────────────────────────
// GET SUMMARY — สรุปผลจาก Sheet บันทึกที่ระบุ
// ──────────────────────────────────────────────────────────

function getSummaryBySheet(sheetName) {
  try {
    const sh = getSS().getSheetByName(sheetName);
    if (!sh || sh.getLastRow() < 2) return { rows: [], subject: '', date: '' };

    const data = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();

    // เอาสถานะล่าสุดของแต่ละคน (กรณีแก้ไขหลายครั้ง)
    const map = {};
    data.filter(r => r[1] !== '').forEach(r => { map[r[1]] = r[2]; });
    const rows = Object.entries(map).map(([name, status]) => ({ name, status }));

    // แยกชื่อวิชา+วัน จากชื่อ Sheet
    const inner = sheetName.replace(LOG_MARK + ' ', '');
    const parts = inner.split(' | ');
    return { rows, subject: parts[0] || '', date: parts[1] || '' };
  } catch(e) { return { rows: [], subject: '', date: '' }; }
}

// ──────────────────────────────────────────────────────────
// CLEAR TODAY LOG — ลบบันทึกวันนี้ของวิชา
// ──────────────────────────────────────────────────────────

function clearTodayLog(subject) {
  try {
    const sh = getSS().getSheetByName(logSheetName(subject));
    if (!sh || sh.getLastRow() < 2) return { success: true };
    const last = sh.getLastRow();
    if (last > 1) sh.deleteRows(2, last - 1);
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
}

// ──────────────────────────────────────────────────────────
// UTILITIES
// ──────────────────────────────────────────────────────────

function getSpreadsheetUrl() {
  try { return getSS().getUrl(); } catch(e) { return ''; }
}

function ping() {
  return { ok: true, time: thaiTime(), date: thaiDate() };
}

// รัน setup() ครั้งแรกเพื่อตรวจ Spreadsheet URL
function setup() {
  Logger.log('SS URL: ' + getSS().getUrl());
}
