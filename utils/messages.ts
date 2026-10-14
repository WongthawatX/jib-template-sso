// แหล่งรวมข้อความที่ผู้ใช้เห็นทั้งแอป — แก้คำพูดที่ไฟล์นี้ที่เดียว ไม่ประกาศ literal ซ้ำในแต่ละหน้า
// ไฟล์นี้ต้องไม่ import อะไรตอน runtime (มีแต่ type ที่ถูกลบตอน compile) เพื่อให้ทุก layer import ได้โดยไม่เกิดวงจร
// ยกเว้นเดียว: ข้อความ validation ของฟอร์มเพิ่มงานอยู่ใน VALIDATION_MESSAGES ที่ utils/jobCreate.ts
// เพราะผูกกับ schema ของฟอร์ม (label + กฎ + ข้อความ อยู่ด้วยกัน ทำให้เพิ่ม field ใหม่แก้ไฟล์เดียว)

import type { GetErrorMessageOptions } from "@/functions/functions"

/** ข้อความสำรองของ getErrorMessage เมื่อผู้เรียกไม่ได้ระบุเอง */
export const ERROR_FALLBACKS = {
    generic: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
    unauthorized: "Token ของ API เดิมไม่ถูกต้องหรือหมดอายุ กรุณาตั้งค่า Token ในหน้าโปรไฟล์",
    forbidden: "บัญชีนี้ไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
    gateway: "เชื่อมต่อ API เดิมไม่สำเร็จ กรุณาลองโหลดข้อมูลอีกครั้ง",
    network: "เชื่อมต่อ API ไม่สำเร็จ",
}

/** ชุดข้อความต่อการเรียก API หนึ่งอย่าง — ส่งเข้า getErrorMessage โดยตรง */
export const API_ERROR_MESSAGES = {
    ONSITE_JOBS: {
        fallback: "โหลดรายการงานไม่สำเร็จ",
        forbidden: "บัญชีนี้ไม่มีสิทธิ์เรียกข้อมูลรายการงาน",
    },
    SERVICE_TIMES: {
        fallback: "โหลดรายการรอบเวลาให้บริการไม่สำเร็จ",
        forbidden: "บัญชีนี้ไม่มีสิทธิ์เรียกข้อมูลรอบเวลาให้บริการ",
    },
    JOB_TYPES: {
        fallback: "โหลดรายการลักษณะงานไม่สำเร็จ",
        forbidden: "บัญชีนี้ไม่มีสิทธิ์เรียกข้อมูลลักษณะงาน",
    },
    BROKEN_ITEMS: {
        fallback: "โหลดรายการอาการเสียไม่สำเร็จ",
        forbidden: "บัญชีนี้ไม่มีสิทธิ์เรียกข้อมูลอาการเสีย",
    },
    ADDRESS_MASTER: {
        fallback: "โหลดข้อมูลที่อยู่ไม่สำเร็จ",
        forbidden: "บัญชีนี้ไม่มีสิทธิ์เรียกข้อมูลที่อยู่",
    },
    TECHNICIAN_VISITS: {
        fallback: "โหลดข้อมูลใบงานช่างไม่สำเร็จ",
    },
    JOB_STATUS_UPDATE: {
        fallback: "อัปเดตสถานะงานไม่สำเร็จ",
    },
    JOB_CREATE: {
        fallback: "สร้างงานใหม่ไม่สำเร็จ",
        forbidden: "บัญชีนี้ไม่มีสิทธิ์สร้างงานใหม่",
    },
    USERS: {
        fallback: "โหลดรายชื่อผู้ใช้งานไม่สำเร็จ",
    },
    USER_DETAIL: {
        fallback: "โหลดข้อมูลผู้ใช้งานไม่สำเร็จ",
    },
    USER_SAVE: {
        fallback: "บันทึกข้อมูลผู้ใช้งานไม่สำเร็จ",
    },
    USER_DELETE: {
        fallback: "ลบผู้ใช้งานไม่สำเร็จ",
    },
    USER_PASSWORD: {
        fallback: "เปลี่ยนรหัสผ่านไม่สำเร็จ",
    },
} satisfies Record<string, GetErrorMessageOptions>

/** ข้อความยืนยันเมื่อทำงานสำเร็จ (toast) */
export const SUCCESS_MESSAGES = {
    JOB_CREATED: "สร้างงานใหม่สำเร็จ",
    JOB_STATUS_UPDATED: "อัปเดตสถานะสำเร็จ",
    USER_CREATED: "เพิ่มผู้ใช้งานแล้ว",
    USER_SAVED: "บันทึกข้อมูลผู้ใช้งานแล้ว",
    USER_DELETED: "ลบผู้ใช้งานแล้ว",
    USER_PASSWORD_CHANGED: "เปลี่ยนรหัสผ่าน Onsite แล้ว",
}

/** เหตุผลที่ปุ่ม/ฟอร์มถูกปิดใช้งาน — ใช้เป็น title/aria-label และข้อความใน Alert */
export const BLOCKED_MESSAGES = {
    JOB_CREATE_NO_PERMISSION: "บัญชีนี้ไม่มีสิทธิ์สร้างงานใหม่",
    JOB_CREATE_OPTIONS_FAILED: "ยังโหลดข้อมูลตัวเลือกไม่สำเร็จ จึงยังบันทึกงานไม่ได้",
    NO_PERMISSION: "ไม่มีสิทธิ์",
}

/** สถานะว่าง (ไม่ใช่ความผิดพลาด) */
export const EMPTY_MESSAGES = {
    USERS: "ไม่พบผู้ใช้งานที่ตรงกับตัวกรอง",
    MAP_SEARCH: "ไม่พบทีมช่าง รหัสงาน หรือสถานที่ที่ค้นหา",
}

/** เข้าสู่ระบบ / SSO / เซสชัน */
export const AUTH_MESSAGES = {
    SSO_CONNECT_FAILED: "ไม่สามารถเชื่อมต่อ JIB SSO ได้ กรุณาลองอีกครั้ง",
    SSO_LOGIN_FAILED: "ไม่สามารถเข้าสู่ระบบได้ กรุณาเริ่มใหม่",
    LOGIN_FAILED_TITLE: "เข้าสู่ระบบไม่สำเร็จ",
    LOGIN_REDIRECT_TITLE: "กำลังไปยัง JIB SSO",
    LOGIN_HINT: "เข้าสู่ระบบด้วยบัญชีพนักงานผ่าน JIB SSO",
    LOGOUT_DONE_TITLE: "ออกจากระบบแล้ว",
    LOGOUT_SSO_FAILED: "ล้างเซสชันในแอปแล้ว แต่ไม่สามารถออกจากระบบ SSO กลางได้ กรุณาลองอีกครั้งภายหลัง",
    PASSWORD_CHANGED_TITLE: "เปลี่ยนรหัสผ่านสำเร็จ",
    PASSWORD_CHANGED_HINT: "กรุณาเข้าสู่ระบบอีกครั้งด้วยรหัสผ่านใหม่",
    CALLBACK_CHECKING_TITLE: "กำลังตรวจสอบ JIB SSO",
    CALLBACK_CHECKING_HINT: "กรุณารอสักครู่ ระบบกำลังแลก Authorization Code และโหลดข้อมูลผู้ใช้",
    SESSION_EXPIRED: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
    PASSWORD_CHANGE_FAILED: "ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองอีกครั้ง",
    INSECURE_ORIGIN: "กรุณาเปิดผ่าน localhost หรือ HTTPS เพื่อเข้าสู่ระบบอย่างปลอดภัย",
    SESSION_STORAGE_BLOCKED: "กรุณาอนุญาต session storage ในเบราว์เซอร์ แล้วลองอีกครั้ง",
    AUTHORIZATION_EXPIRED: "ข้อมูลการเข้าสู่ระบบหมดอายุ กรุณาเริ่มใหม่",
    STATE_MISMATCH: "ตรวจสอบ state ไม่สำเร็จ กรุณาเริ่มใหม่",
    LOGIN_CANCELED: "ยกเลิกการเข้าสู่ระบบแล้ว",
    SSO_PROVIDER_FAILED: "ระบบ SSO ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง",
    AUTHORIZATION_CODE_MISSING: "ไม่พบ Authorization Code จากระบบ SSO",
    TOKEN_EXPIRATION_MISSING: "ไม่พบเวลาหมดอายุใน Token",
    SESSION_EXPIRED_SHORT: "Session หมดอายุแล้ว",
}

/** token ของ API เดิมที่ใช้ระหว่างพัฒนา UI */
export const LEGACY_TOKEN_MESSAGES = {
    MISSING: "กรุณาใส่ token ระบบเดิมในหน้าข้อมูลผู้ใช้ เพื่อเรียก API Onsite ระหว่างพัฒนา UI",
    ENDPOINT_MISMATCH: "ปลายทาง API Onsite ไม่ตรงกับ URL ที่ตั้งค่าไว้",
    SAVE_FAILED: "ไม่สามารถเก็บ token ได้",
    CONNECTED: "เก็บ token แล้ว พร้อมแนบในการเรียก API เดิม",
    NOT_CONNECTED: "ยังไม่มี token ระบบเดิม",
}

/** แผนที่หน้า dashboard */
export const MAP_MESSAGES = {
    LOAD_FAILED: "ไม่สามารถโหลดแผนที่ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วโหลดหน้าใหม่",
    INIT_FAILED: "ไม่สามารถเริ่มแผนที่ได้ กรุณาตรวจสอบว่าเบราว์เซอร์รองรับ WebGL แล้วโหลดหน้าใหม่",
}

/** ฟอร์มผู้ใช้งาน Onsite */
export const USER_FORM_MESSAGES = {
    USERNAME_REQUIRED: "กรุณาระบุรหัสพนักงาน / ชื่อผู้ใช้",
    FULL_NAME_REQUIRED: "กรุณาระบุชื่อ - นามสกุล",
    PHONE_REQUIRED: "กรุณาระบุเบอร์โทรศัพท์",
    EMAIL_INVALID: "รูปแบบอีเมลไม่ถูกต้อง",
    ROLE_REQUIRED: "กรุณาเลือกบทบาทผู้ใช้",
    PASSWORD_TOO_SHORT: "กรุณากำหนดรหัสผ่านตั้งต้นอย่างน้อย 8 ตัวอักษร",
}

/** route /api/onsite-address (ฝั่ง server) — ข้อความที่ส่งกลับไปแสดงบนหน้า */
export const ADDRESS_PROXY_MESSAGES = {
    LOGIN_REQUIRED: "ต้องเข้าสู่ระบบก่อนเรียกข้อมูลที่อยู่",
    SSO_NOT_CONFIGURED: "ยังไม่ได้ตั้งค่า SSO API สำหรับตรวจสิทธิ์ข้อมูลที่อยู่",
    SESSION_EXPIRED: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
    TOKEN_NOT_CONFIGURED: "ยังไม่ได้ตั้งค่า token ของ API ข้อมูลที่อยู่ (ONSITE_ADDRESS_API_TOKEN)",
    URL_NOT_CONFIGURED: "ยังไม่ได้ตั้งค่า URL ของ API ข้อมูลที่อยู่ให้ถูกต้อง (ONSITE_ADDRESS_API_URL)",
    UNEXPECTED_REDIRECT: "API ข้อมูลที่อยู่ตอบ redirect ที่ไม่คาดหมาย",
    REQUEST_FAILED: "เรียกข้อมูลที่อยู่จาก API ไม่สำเร็จ",
    TIMEOUT: "API ข้อมูลที่อยู่ตอบกลับช้าเกินกำหนด",
    CONNECT_FAILED: "เชื่อมต่อ API ข้อมูลที่อยู่ไม่สำเร็จ",
}

/** ข้อมูลจาก API ผิดรูปแบบ — โยนจาก parser ของแต่ละโดเมน */
export const DATA_FORMAT_MESSAGES = {
    ADDRESS_MASTER: "ข้อมูลที่อยู่จาก API ไม่ถูกต้อง",
    SERVICE_TIMES: "API ส่งข้อมูลรอบเวลาให้บริการกลับมาไม่ถูกต้อง",
    JOB_TYPES: "API ส่งข้อมูลลักษณะงานกลับมาไม่ถูกต้อง",
    BROKEN_ITEMS: "API ส่งข้อมูลอาการเสียกลับมาไม่ถูกต้อง",
    ONSITE_JOBS: "API ส่งข้อมูลรายการงานกลับมาไม่ถูกต้อง",
    TECHNICIAN_VISITS: "API ส่งข้อมูลใบงานช่างกลับมาไม่ถูกต้อง",
    TECHNICIAN_VISIT_ROW: "ข้อมูลใบงานช่างไม่ถูกต้อง",
    USERS: "รูปแบบข้อมูลผู้ใช้งานไม่ถูกต้อง",
    USER_NOT_FOUND: "ไม่พบข้อมูลผู้ใช้งาน",
    REQUEST_REJECTED: "ดำเนินการไม่สำเร็จ",
}
