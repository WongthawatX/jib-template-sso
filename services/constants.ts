import { env } from "@/config/env"

const SSO_API = ( env.SSO_API_BASE_URL || env.SSO_BASE_URL ).replace(/\/$/, "")

export const path = {
    SSO_AUTHORIZE: `${SSO_API}/authorize`,
    SSO_TOKEN: `${SSO_API}/token`,
    SSO_REFRESH: `${SSO_API}/token/refresh`,
    SSO_USERINFO: `${SSO_API}/userinfo`,
}
