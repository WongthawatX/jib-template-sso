export const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/template"

export const env = {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || "",
    SSO_BASE_URL: process.env.NEXT_PUBLIC_SSO_BASE_URL || "http://localhost:4001/jib-sso",
    SSO_API_BASE_URL: process.env.NEXT_PUBLIC_SSO_API_BASE_URL || "",
    SSO_CLIENT_ID: process.env.NEXT_PUBLIC_SSO_CLIENT_ID || "jib-template-sso",
    SSO_REDIRECT_URI: process.env.NEXT_PUBLIC_SSO_REDIRECT_URI || `${APP_BASE_PATH}/auth/callback`,
    SSO_SCOPE: process.env.NEXT_PUBLIC_SSO_SCOPE || "openid profile",
}

// เฉพาะ dev เท่านั้น: ข้าม SSO แล้ว seed session ปลอมเพื่อดู layout ภายในตอน backend ยังต่อไม่ได้
// กันสองชั้น (NODE_ENV + flag) ไม่ให้เปิดใน production build เด็ดขาด
export const DEV_AUTH_BYPASS =
    process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true"
