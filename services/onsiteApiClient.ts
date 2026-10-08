import axios from "axios"

import { APP_BASE_PATH, env, USE_LEGACY_ONSITE_API } from "@/config/env"
import { createSsoApiClient } from "@/services/apiServices"
import { getLegacyOnsiteToken, useLegacyOnsiteStore } from "@/store/useLegacyOnsiteStore"

const baseURL = USE_LEGACY_ONSITE_API
    ? `${APP_BASE_PATH}/api/legacy-onsite/`
    : `${env.ONSITE_API_BASE_URL}/`

export const onsiteAPI = USE_LEGACY_ONSITE_API
    ? axios.create({ baseURL, timeout: 15000 })
    : createSsoApiClient(baseURL)

if ( USE_LEGACY_ONSITE_API ) {
    onsiteAPI.interceptors.request.use(( config ) => {
        const token = getLegacyOnsiteToken()
        if ( !token ) throw new Error("กรุณาใส่ token ระบบเดิมในหน้าข้อมูลผู้ใช้ เพื่อเรียก API Onsite ระหว่างพัฒนา UI")
        config.headers.Authorization = `Bearer ${token}`
        return config
    })
    onsiteAPI.interceptors.response.use(
        ( response ) => response,
        ( error: unknown ) => {
            if ( axios.isAxiosError(error) && error.response?.status === 401 ) {
                const rejectedToken = error.config?.headers.Authorization
                if ( rejectedToken === `Bearer ${getLegacyOnsiteToken()}` ) {
                    useLegacyOnsiteStore.getState().disconnect()
                }
            }
            // API เดิมไม่มี refresh ด้วย SSO และไม่เปลี่ยน session ของ SSO
            return Promise.reject(error)
        },
    )
}

// ไม่ส่ง token ไปยัง URL นอก API ที่ตั้งค่าไว้ แม้ caller จะส่ง absolute URL มา
onsiteAPI.interceptors.request.use(( config ) => {
    const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin
    const allowed = new URL(baseURL, origin)
    const destination = new URL(config.url ?? "", new URL(config.baseURL ?? baseURL, origin))
    if ( destination.origin !== allowed.origin || !destination.pathname.startsWith(allowed.pathname) || destination.username || destination.password ) {
        throw new Error("ปลายทาง API Onsite ไม่ตรงกับ URL ที่ตั้งค่าไว้")
    }
    return config
})
