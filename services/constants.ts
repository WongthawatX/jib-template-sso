import { env } from "@/config/env"

export const BASE_API_URL = env.API_BASE_URL + '/api/v1/'
export const BASE_API_URL_UPLOAD = env.API_BASE_URL + '/intranet-api/'

const SSO_API = ( env.SSO_API_BASE_URL || env.SSO_BASE_URL ).replace(/\/$/, "")

export const path = {
    SSO_AUTHORIZE: `${SSO_API}/authorize`,
    SSO_TOKEN: `${SSO_API}/token`,
    SSO_REFRESH: `${SSO_API}/token/refresh`,
    SSO_USERINFO: `${SSO_API}/userinfo`,
    SSO_CHANGE_PASSWORD: `${SSO_API}/me/password`,
    SSO_LOGOUT: `${SSO_API}/logout`,

    UPLOAD_MANY: `storage/upload-many`,
    ATTACH: `procon/attach`,
}
