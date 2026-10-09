import { jwtDecode } from "jwt-decode"

import { DEV_AUTH_BYPASS, env } from "@/config/env"
import { path } from "@/services/constants"

import { normalizePermissions } from "@/utils/permissions"

import type { Permission } from "@/utils/permissions"

const request = async ( url: string, options?: RequestInit ): Promise<{ data: unknown }> => {
    const response = await fetch(url, { ...options, cache: "no-store", signal: AbortSignal.timeout(15000) })
    const data: unknown = await response.json().catch(() => null)
    if ( !response.ok ) {
        const message = isRecord(data) ? [ data.message, data.detail, data.error ].find(( value ): value is string => typeof value === "string") : undefined
        throw new Error(message ?? `SSO request failed (${response.status})`)
    }
    return { data }
}

export type SsoTokenResponse = {
    access_token: string;
    token_type: string;
    expires_in?: number;
    scope?: string;
    refresh_token?: string;
}

export type SsoUserInfo = {
    sub: string;
    user_id?: string;
    employee_id?: string;
    preferred_username?: string;
    name?: string;
    email?: string;
    phone?: string;
    department?: string;
    branch?: string;
    system_role?: string;
    roles?: string[];
    permissions?: Permission[];
}

export type SsoAuthorizationRequestInput = {
    clientId: string;
    redirectUri: string;
    scope: string;
    state: string;
    nonce: string;
    codeChallenge: string;
}

export type SsoAuthorizationRequestResult =
    | {
        action: "signin";
        authorizationRequestId: string;
        expiresIn?: number;
    }
    | {
        action: "redirect";
        redirectUrl: string;
    }

export type ChangeOwnPasswordInput = {
    currentPassword: string;
    newPassword: string;
}

export type ChangeOwnPasswordResult = {
    success: true;
    reauthenticationRequired: boolean;
}

const isRecord = ( value: unknown ): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

const readOptionalString = ( data: Record<string, unknown>, key: string ): string | undefined =>
    typeof data[key] === "string" ? data[key] : undefined

const parseSsoTokenResponse = ( data: unknown, errorMessage: string ): SsoTokenResponse => {
    if (
        !isRecord(data) ||
        typeof data.access_token !== "string" ||
        data.access_token.length === 0 ||
        typeof data.token_type !== "string"
    ) {
        throw new Error(errorMessage)
    }

    return {
        access_token: data.access_token,
        token_type: data.token_type,
        ...(typeof data.expires_in === "number" ? { expires_in: data.expires_in } : {}),
        ...(typeof data.scope === "string" ? { scope: data.scope } : {}),
        ...(typeof data.refresh_token === "string" ? { refresh_token: data.refresh_token } : {}),
    }
}

export const exchangeSsoAuthorizationCode = async (
    code: string,
    codeVerifier: string,
    redirectUri: string,
): Promise<SsoTokenResponse> => {
    const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: env.SSO_CLIENT_ID,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
    })

    const response = await request(path.SSO_TOKEN, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })

    return parseSsoTokenResponse(response.data, "Invalid SSO token response")
}

export const refreshSsoToken = async ( refreshToken: string ): Promise<SsoTokenResponse> => {
    const response = await request(path.SSO_REFRESH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            grant_type: "refresh_token",
            client_id: env.SSO_CLIENT_ID,
            refresh_token: refreshToken,
        }),
    })

    return parseSsoTokenResponse(response.data, "Invalid SSO refresh response")
}

export const changeOwnSsoPassword = async ( accessToken: string, input: ChangeOwnPasswordInput ): Promise<ChangeOwnPasswordResult> => {
    const response = await request(path.SSO_CHANGE_PASSWORD, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            current_password: input.currentPassword,
            new_password: input.newPassword,
        }),
    })

    if (
        !isRecord(response.data) ||
        response.data.success !== true ||
        typeof response.data.reauthentication_required !== "boolean"
    ) {
        throw new Error("Invalid SSO change password response")
    }

    return {
        success: true,
        reauthenticationRequired: response.data.reauthentication_required,
    }
}

////////////////////////////// GET //////////////////////////////
export const createSsoAuthorizationRequest = async ( input: SsoAuthorizationRequestInput ): Promise<SsoAuthorizationRequestResult> => {
    const query = new URLSearchParams({
        client_id: input.clientId,
        redirect_uri: input.redirectUri,
        response_type: "code",
        scope: input.scope,
        state: input.state,
        nonce: input.nonce,
        code_challenge: input.codeChallenge,
        code_challenge_method: "S256",
    })
    const response = await request(`${path.SSO_AUTHORIZE}?${query}`)

    if ( !isRecord(response.data) ) throw new Error("Invalid SSO authorization response")

    if (
        response.data.error === "login_required" &&
        typeof response.data.authorizationRequestId === "string" &&
        response.data.authorizationRequestId.length > 0
    ) {
        return {
            action: "signin",
            authorizationRequestId: response.data.authorizationRequestId,
            ...(typeof response.data.expiresIn === "number" ? { expiresIn: response.data.expiresIn } : {}),
        }
    }

    if ( typeof response.data.redirectUrl === "string" ) {
        return { action: "redirect", redirectUrl: response.data.redirectUrl }
    }

    throw new Error("Invalid SSO authorization response")
}

export const getSsoUserInfo = async ( accessToken: string ): Promise<SsoUserInfo> => {
    const response = await request(path.SSO_USERINFO, { headers: { Authorization: `Bearer ${accessToken}` } })

    if ( !isRecord( response.data )) throw new Error("Invalid SSO userinfo response")

    const sub = readOptionalString(response.data, "sub") ?? readOptionalString(response.data, "user_id")
    if ( !sub ) throw new Error("Invalid SSO userinfo response")

    return {
        sub,
        user_id: readOptionalString(response.data, "user_id"),
        employee_id: readOptionalString(response.data, "employee_id"),
        preferred_username: readOptionalString(response.data, "preferred_username"),
        name: readOptionalString(response.data, "name"),
        email: readOptionalString(response.data, "email"),
        phone: readOptionalString(response.data, "phone"),
        department: readOptionalString(response.data, "department"),
        branch: readOptionalString(response.data, "branch"),
        system_role: readOptionalString(response.data, "system_role"),
        roles: Array.isArray(response.data.roles) ? response.data.roles.filter(( role ): role is string => typeof role === "string") : [],
        permissions: normalizePermissions(response.data.permissions),
    }
}

export const logoutSso = async ( accessToken = "" ): Promise<void> => {
    if ( DEV_AUTH_BYPASS ) return
    let canSendToken = false
    try {
        const { exp } = jwtDecode<{ exp?: number }>(accessToken)
        canSendToken = typeof exp === "number" && Number.isFinite(exp) && exp > Date.now() / 1000
    } catch {
        // The central session cookie can log out even without a valid JWT.
    }
    await request(env.SSO_LOGOUT_URL, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(canSendToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({}),
    })
}
