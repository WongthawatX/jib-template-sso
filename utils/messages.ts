/** ข้อความสำรองของ getErrorMessage เมื่อผู้เรียกไม่ได้ระบุเอง */
export const ERROR_FALLBACKS = {
    generic: "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง",
    unauthorized: "Token ของ API เดิมไม่ถูกต้องหรือหมดอายุ กรุณาตั้งค่า Token ในหน้าโปรไฟล์",
    forbidden: "บัญชีนี้ไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
    gateway: "เชื่อมต่อ API เดิมไม่สำเร็จ กรุณาลองโหลดข้อมูลอีกครั้ง",
    network: "เชื่อมต่อ API ไม่สำเร็จ",
}

/** เข้าสู่ระบบ / SSO / เซสชัน */
export const AUTH_MESSAGES = {
    SSO_CONNECT_FAILED: "ไม่สามารถเชื่อมต่อ JIB SSO ได้ กรุณาลองอีกครั้ง",
    SSO_LOGIN_FAILED: "ไม่สามารถเข้าสู่ระบบได้ กรุณาเริ่มใหม่",
    LOGIN_FAILED_TITLE: "เข้าสู่ระบบไม่สำเร็จ",
    LOGIN_REDIRECT_TITLE: "ยินดีต้อนรับ",
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
