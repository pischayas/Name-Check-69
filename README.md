# 📢 ระบบเรียกชื่อเช็คชื่อด้วยเสียง — GitHub Pages Edition

ระบบเช็คชื่อนักเรียนด้วยเสียง ทำงานบน GitHub Pages โดยดึงข้อมูลจาก Google Sheets ผ่าน Apps Script API

---

## 🗂️ ไฟล์ในโปรเจกต์

```
├── index.html     ← หน้าเว็บหลัก (deploy บน GitHub Pages)
├── code.gs        ← Google Apps Script Backend
└── README.md      ← คู่มือนี้
```

---

## 🚀 วิธีตั้งค่า (ทำครั้งเดียว)

### ขั้นตอนที่ 1 — เตรียม Google Spreadsheet

1. สร้าง Google Spreadsheet ใหม่
2. ตั้งชื่อ Sheet ตามรายวิชา เช่น `คณิตศาสตร์`, `ภาษาไทย`
3. ใส่ชื่อนักเรียนในคอลัมน์ A (ไม่ต้องมี header)
4. คัดลอก **Spreadsheet ID** จาก URL:
   ```
   https://docs.google.com/spreadsheets/d/  [SPREADSHEET_ID]  /edit
   ```

### ขั้นตอนที่ 2 — ตั้งค่า Google Apps Script

1. เปิด [script.google.com](https://script.google.com) → **New project**
2. ลบโค้ดเดิมออก แล้วคัดลอกโค้ดจาก `code.gs` ใส่ทั้งหมด
3. แก้ค่า `SHEET_ID` บรรทัดที่ 7:
   ```javascript
   const SHEET_ID = 'ใส่ Spreadsheet ID ของคุณที่นี่';
   ```
4. บันทึก (Ctrl+S)

### ขั้นตอนที่ 3 — Deploy Apps Script เป็น Web App

1. คลิก **Deploy** → **New deployment**
2. คลิก ⚙️ → เลือก **Web app**
3. ตั้งค่า:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. คลิก **Deploy** → **Authorize access** → อนุญาตสิทธิ์
5. **คัดลอก Web App URL** ที่ได้ (จะหน้าตาแบบนี้):
   ```
   https://script.google.com/macros/s/AKfycbz.../exec
   ```

### ขั้นตอนที่ 4 — ตั้งค่า index.html

เปิดไฟล์ `index.html` แล้วแก้บรรทัดนี้:

```javascript
const WEB_APP_URL = "YOUR_WEB_APP_URL_HERE";
```

เปลี่ยนเป็น URL ที่ได้จากขั้นตอนที่ 3:

```javascript
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz.../exec";
```

### ขั้นตอนที่ 5 — Deploy บน GitHub Pages

1. สร้าง GitHub Repository ใหม่
2. อัปโหลด `index.html` ขึ้นไป
3. ไปที่ **Settings** → **Pages**
4. Source: **Deploy from a branch** → Branch: `main` → `/root`
5. รอสักครู่ แล้วเข้าใช้งานที่ URL: `https://[username].github.io/[repo-name]/`

---

## 🔄 เมื่อแก้ไข Apps Script

> ⚠️ **สำคัญ:** ทุกครั้งที่แก้ไขโค้ดใน Apps Script ต้อง **Deploy ใหม่** เสมอ

1. Apps Script → **Deploy** → **Manage deployments**
2. คลิกไอคอนดินสอ (Edit) → **New version** → **Deploy**
3. URL จะยังเหมือนเดิม ไม่ต้องแก้ `index.html`

---

## 🌐 วิธีการทำงาน

```
GitHub Pages (index.html)
        ↓  fetch() REST API
Google Apps Script (?action=...)
        ↓  SpreadsheetApp
Google Sheets (ข้อมูลนักเรียน + บันทึกการเข้าเรียน)
```

- **GET** requests → ดึงข้อมูล (วิชา, รายชื่อ, บันทึก)
- **POST** requests → บันทึกการเช็คชื่อ, รีเซ็ต

---

## 🎤 การใช้งาน

| อุปกรณ์ | วิธีใช้ |
|---|---|
| **PC / Mac** (Chrome/Edge) | กด ▶ → ระบบฟังเสียงอัตโนมัติ |
| **Android** (Chrome) | กด ▶ → กดค้างปุ่ม 🎤 ขณะนักเรียนพูด |
| **iPhone/iPad** (Safari) | กด ▶ → กดค้างปุ่ม 🎤 ขณะนักเรียนพูด |

**คำที่รู้จัก:**
- ✅ มา: `มาครับ`, `มาค่ะ`, `ครับ`, `ค่ะ`, `here`
- ❌ ขาด: `ขาด`, `ไม่มา`, `absent`
- 🏥 ลา: `ลา`, `ป่วย`, `ไม่สบาย`, `leave`

---

## ❓ แก้ปัญหาที่พบบ่อย

**ขึ้น "เชื่อมต่อไม่ได้"**
- ตรวจสอบ `WEB_APP_URL` ว่าถูกต้อง
- ตรวจสอบว่า Deploy แล้ว และ Access = Anyone

**ไม่พบรายวิชา**
- ตรวจสอบว่า Sheet ใน Spreadsheet ไม่ได้ชื่อขึ้นต้นด้วย `[บันทึก]`
- ตรวจสอบ `SHEET_ID` ใน `code.gs`

**ไมค์ไม่ทำงาน**
- ใช้ Chrome หรือ Safari เท่านั้น
- เปิดผ่าน https:// (GitHub Pages รองรับแล้ว)
- อนุญาตสิทธิ์ไมโครโฟนในเบราว์เซอร์
