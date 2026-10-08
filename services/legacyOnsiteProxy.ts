import { env, USE_LEGACY_ONSITE_API } from "@/config/env"

const ALLOWED_RESOURCES = new Set([ "onsiteServiceJob", "techService", "users", "broken_list", "serviceTime" ])

const errorResponse = ( message: string, status: number ): Response =>
    Response.json({ message }, { status, headers: { "Cache-Control": "no-store" } })

/** Proxy ชั่วคราวสำหรับ API เดิมระหว่างพัฒนา UI; backend ยังตรวจ Bearer token ตามเดิม */
export async function forwardLegacyOnsiteRequest(request: Request, segments: string[]): Promise<Response> {
    if ( !USE_LEGACY_ONSITE_API ) return errorResponse("Not found", 404)

    const requestUrl = new URL(request.url)
    const origin = request.headers.get("origin")
    if ( ( origin && origin !== requestUrl.origin ) || request.headers.get("sec-fetch-site") === "cross-site" ) {
        return errorResponse("Origin not allowed", 403)
    }

    const authorization = request.headers.get("authorization")
    if ( !authorization || !/^Bearer [A-Za-z0-9._~-]+$/.test(authorization) ) {
        return errorResponse("Legacy Onsite token required", 401)
    }

    const isAllowedResource = ALLOWED_RESOURCES.has(segments[0]) ||
        ( segments.length === 2 && segments[0] === "auth" && segments[1] === "get_loglogin" && request.method === "GET" )
    if ( !segments.length || !isAllowedResource || segments.some(( part ) =>
        !part || part === "." || part === ".." || /[\\/%?#\u0000-\u0020]/.test(part)
    ) ) {
        return errorResponse("Onsite API path not allowed", 400)
    }

    let upstream: URL
    try {
        const base = new URL(`${env.ONSITE_API_BASE_URL}/`)
        // จำกัด proxy ไว้ที่ API เดิมจริง ไม่รับ URL ปลายทางจากผู้เรียก
        if ( base.origin !== "https://service.jib.co.th" || base.pathname !== "/3010/api-onsite/api/v1/" ||
            base.username || base.password || base.search || base.hash ) {
            return errorResponse("Legacy Onsite proxy URL is not configured correctly", 503)
        }
        upstream = new URL(segments.map(encodeURIComponent).join("/"), base)
        upstream.search = requestUrl.search
    } catch {
        return errorResponse("Legacy Onsite proxy URL is not configured correctly", 503)
    }

    const headers = new Headers({ Authorization: authorization, Accept: "application/json" })
    const contentType = request.headers.get("content-type")
    if ( contentType ) headers.set("Content-Type", contentType)

    try {
        const response = await fetch(upstream, {
            method: request.method,
            headers,
            body: [ "GET", "HEAD" ].includes(request.method) ? undefined : await request.arrayBuffer(),
            cache: "no-store",
            redirect: "manual",
            signal: AbortSignal.timeout(12000),
        })
        // ไม่ส่ง token ตาม redirect ไปยัง host หรือ endpoint อื่น
        if ( response.status >= 300 && response.status < 400 ) {
            await response.body?.cancel()
            return errorResponse("Legacy Onsite API returned an unexpected redirect", 502)
        }
        const responseHeaders = new Headers({ "Cache-Control": "no-store, private" })
        const responseType = response.headers.get("content-type")
        if ( responseType ) responseHeaders.set("Content-Type", responseType)
        const hasNoBody = request.method === "HEAD" || [ 204, 205 ].includes(response.status)
        return new Response(hasNoBody ? null : response.body, { status: response.status, headers: responseHeaders })
    } catch ( error ) {
        const isTimeout = error instanceof Error && [ "TimeoutError", "AbortError" ].includes(error.name)
        return errorResponse(isTimeout ? "Legacy Onsite API timed out" : "Cannot connect to legacy Onsite API", isTimeout ? 504 : 502)
    }
}
