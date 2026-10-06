import axios from "axios"

import { APP_BASE_PATH } from "@/config/env"
import { useAppStore } from "@/store/useAppStore"
import { jwtDecode } from "jwt-decode"
import { BASE_API_URL, BASE_API_URL_UPLOAD, path } from "./constants";
import { getStoredAccessToken, sessionStorageStore, storage } from "@/lib/storage"
// import { cleanParams } from "@/functions/functions"
import { logoutSso, refreshSsoToken } from "./apiSSOService"

export const isTokenExpired = ( token: string ): boolean => {
    if ( !token ) return true;

    try {
        const decoded = jwtDecode<{ exp?: number }>(token)

        return typeof decoded.exp !== "number" || decoded.exp <= Date.now() / 1000
    } catch {
        return true;
    }
};

const authAPI = axios.create({ baseURL: BASE_API_URL });
const uploadAPI = axios.create({ baseURL: BASE_API_URL_UPLOAD })

const redirectToLogin = () => {
    storage.clear()
    sessionStorageStore.clear()
    window.location.replace(new URL(`${APP_BASE_PATH}/login?loggedOut=1`, window.location.origin).toString())
}

const requestSsoLogout = (): Promise<void> => logoutSso(getStoredAccessToken() ?? "")

// single-flight: หลายรีเควสต์ที่เจอ token หมดอายุพร้อมกันจะรอ refresh ครั้งเดียว
let ssoRefreshPromise: Promise<string | null> | null = null

const runSsoRefresh = async (): Promise<string | null> => {
    const refreshToken = sessionStorageStore.getItem("refreshToken")
    if ( !refreshToken ) return null

    try {
        const result = await refreshSsoToken( refreshToken )

        const user = useAppStore.getState().userDetail
        if ( user ) useAppStore.getState().setSsoSession(result.access_token, user, result.refresh_token ?? refreshToken, result.expires_in)
        sessionStorageStore.setItem("accessToken", result.access_token)
        if ( result.refresh_token ) sessionStorageStore.setItem("refreshToken", result.refresh_token)

        return result.access_token
    } catch {
        return null
    }
}

// เรียก refresh แบบ single-flight — ถ้ากำลัง refresh อยู่แล้วให้รอ promise เดิม
const ensureFreshSsoToken = (): Promise<string | null> => {
    if ( !ssoRefreshPromise ) {
        ssoRefreshPromise = runSsoRefresh().finally(() => { ssoRefreshPromise = null })
    }

    return ssoRefreshPromise
}

authAPI.interceptors.request.use(async (config) => {
    let token = getStoredAccessToken()

    if ( token && isTokenExpired( token ) ) {
        const refreshed = await ensureFreshSsoToken()

        if ( refreshed ) {
            token = refreshed
        } else {
            // ไม่มี refresh token หรือ refresh ไม่สำเร็จ → logout
            void requestSsoLogout().catch(() => undefined).finally(redirectToLogin)

            return Promise.reject(new Error("Token expired"))
        }
    }

    if ( token ) config.headers['Authorization'] = `Bearer ${token}`

    return config
})

authAPI.interceptors.response.use(
    ( response ) => response,
    async ( error: unknown ) => {
        if ( !axios.isAxiosError(error) ) return Promise.reject(error)
        const originalRequest = error.config as (typeof error.config & { _retry?: boolean })

        if ( error.response?.status === 401 && originalRequest && !originalRequest._retry ) {
            originalRequest._retry = true

            // ลอง refresh แล้วยิงซ้ำหนึ่งครั้ง
            const refreshed = await ensureFreshSsoToken()

            if ( refreshed ) {
                originalRequest.headers['Authorization'] = `Bearer ${refreshed}`

                return authAPI( originalRequest )
            }

            storage.removeItem("accessToken")
            redirectToLogin()
        }

        return Promise.reject(error)
    }
)

export const logout = async (): Promise<void> => {
    try {
        const accessToken = getStoredAccessToken()
        if ( accessToken && isTokenExpired( accessToken ) ) await ensureFreshSsoToken()

        const response = await requestSsoLogout()

        storage.clear()
        sessionStorageStore.clear()

        return response
    } catch (error) {
        throw error
    }
}

////////////////////////////// POST //////////////////////////////
export type UploadedFile = { object: string; url: string }

export const postUploadFile = async ( files: File | File[], bucket: string, filePath: string ): Promise<UploadedFile[]> => {
    try {
        const fileList = Array.isArray(files) ? files : [files]

        const formData = new FormData()
        formData.append('bucket', bucket)
        formData.append('path', filePath)
        fileList.forEach(( file ) => formData.append('files', file))

        const response = await uploadAPI.post( path.UPLOAD_MANY, formData )

        return response?.data?.files ?? []
    } catch (error) {
        throw error
    }
}

export const postAttachFile = async ( object: object ) => {
    try {
        const response = await authAPI.post( path.ATTACH, object )

        return response
    } catch (error) {
        throw error
    }
}