import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { runInNewContext } from "node:vm"
import { webcrypto } from "node:crypto"
import test from "node:test"
import ts from "typescript"

const require = createRequire(import.meta.url)

function memoryStorage() {
    const items = new Map()
    return {
        get length() { return items.size },
        key: ( index ) => [ ...items.keys() ][index] ?? null,
        getItem: ( key ) => items.get(key) ?? null,
        setItem: ( key, value ) => items.set(key, String(value)),
        removeItem: ( key ) => items.delete(key),
    }
}

function runtime({ api = "", environment = {}, fetcher = async () => { throw new Error("Unexpected API call") } } = {}) {
    const cache = new Map()
    const sessionStorage = memoryStorage()
    const localStorage = memoryStorage()
    const redirects = []
    const globals = {
        URL, URLSearchParams, TextEncoder, AbortSignal, btoa,
        crypto: webcrypto,
        process: { env: {
            NEXT_PUBLIC_SSO_API_BASE_URL: api,
            NEXT_PUBLIC_BASE_PATH: "/jib-sso",
            NEXT_PUBLIC_SSO_BASE_URL: "http://localhost:4001/jib-sso",
            ...environment,
        } },
        sessionStorage, localStorage,
        fetch: fetcher,
        window: {
            isSecureContext: true,
            crypto: webcrypto,
            location: { origin: "http://localhost:4000", assign: ( url ) => redirects.push(url) },
        },
    }
    const load = ( name ) => {
        const file = resolve(name.replace(/^@\//, "") + ".ts")
        if ( cache.has(file) ) return cache.get(file).exports
        const compiledModule = { exports: {} }
        cache.set(file, compiledModule)
        const source = ts.transpileModule(readFileSync(file, "utf8"), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText
        runInNewContext(source, {
            ...globals, module: compiledModule, exports: compiledModule.exports,
            require: ( id ) => id.startsWith("@/") ? load(id) : require(id),
        }, { filename: file })
        return compiledModule.exports
    }
    return { load, sessionStorage, localStorage, redirects, globals }
}

const pendingAuthorization = {
    state: "expected-state", nonce: "nonce", codeVerifier: "verifier",
    redirectUri: "http://localhost:4000/jib-sso/auth/callback", returnTo: "/profile",
    createdAt: Date.now(), expiresAt: Date.now() + 600000,
}

function savePending(rt, value = pendingAuthorization) {
    rt.sessionStorage.setItem("jib-sso:ssoAuthorization", JSON.stringify(value))
}

test("PKCE uses S256, unpredictable state and the basePath callback", async () => {
    const rt = runtime()
    await rt.load("lib/sso").beginSsoAuthorization("/profile?tab=account")
    const destination = new URL(rt.redirects[0])
    const stored = JSON.parse(rt.sessionStorage.getItem("jib-sso:ssoAuthorization"))
    assert.equal(destination.pathname, "/jib-sso/authorize")
    assert.equal(destination.searchParams.get("client_id"), "jib-template-app")
    assert.equal(destination.searchParams.get("app_name"), "template")
    assert.equal(destination.searchParams.get("redirect_uri"), "http://localhost:4000/jib-sso/auth/callback")
    assert.equal(destination.searchParams.get("code_challenge_method"), "S256")
    const digest = await webcrypto.subtle.digest("SHA-256", new TextEncoder().encode(stored.codeVerifier))
    assert.equal(destination.searchParams.get("code_challenge"), Buffer.from(digest).toString("base64url"))
    assert.ok(stored.state.length >= 43)
    assert.equal(stored.returnTo, "/profile?tab=account")
    assert.equal(destination.searchParams.has("code_verifier"), false)
})

test("return destinations reject external URLs, backslashes and auth loops", () => {
    const { getSafeReturnTo } = runtime().load("lib/sso")
    for ( const value of [ "https://evil.test", "//evil.test", "/\\evil.test", "javascript:alert(1)", "/login", "/auth/callback", "/x/../login", "/\nevil.test" ] ) {
        assert.equal(getSafeReturnTo(value), "/dashboard")
    }
    assert.equal(getSafeReturnTo("/store/products?q=abc#top"), "/store/products?q=abc#top")
})

test("callback rejects missing/mismatched state, missing code, denial and expired authorization", () => {
    for ( const query of [ "code=ok", "code=ok&state=wrong", "state=expected-state", "error=access_denied&state=expected-state" ] ) {
        const rt = runtime()
        savePending(rt)
        assert.throws(() => rt.load("lib/sso").readSsoCallback(new URLSearchParams(query)))
        assert.equal(rt.sessionStorage.getItem("jib-sso:ssoAuthorization"), null)
    }
    const rt = runtime()
    savePending(rt, { ...pendingAuthorization, expiresAt: Date.now() - 1 })
    assert.throws(() => rt.load("lib/sso").readSsoCallback(new URLSearchParams("code=ok&state=expected-state")))
    savePending(rt)
    assert.equal(rt.load("lib/sso").readSsoCallback(new URLSearchParams("code=ok&state=expected-state")).code, "ok")
})

test("disabled storage prevents leaving the app with an unusable authorization", async () => {
    const rt = runtime()
    rt.sessionStorage.setItem = () => { throw new Error("Storage blocked") }
    await assert.rejects(rt.load("lib/sso").beginSsoAuthorization("/dashboard"))
    assert.equal(rt.redirects.length, 0)
})

test("authorization API supports signin and rejects unexpected redirect origins", async () => {
    const rt = runtime({ api: "https://sso.test/v1", fetcher: async () => ({ ok: true, json: async () => ({ error: "login_required", authorizationRequestId: "request-123", expiresIn: 120 }) }) })
    await rt.load("lib/sso").beginSsoAuthorization("/dashboard")
    assert.equal(new URL(rt.redirects[0]).searchParams.get("authorizationRequestId"), "request-123")
    const destination = new URL(rt.redirects[0])
    assert.equal(destination.searchParams.get("app_name"), "template")
    assert.equal(destination.searchParams.get("expiresIn"), "120")
    assert.equal(Number(destination.searchParams.get("expiresAt")), rt.load("lib/sso").getSsoAuthorization().expiresAt)
    const invalid = runtime({ api: "https://sso.test/v1", fetcher: async () => ({ ok: true, json: async () => ({ redirectUrl: "https://evil.test/callback" }) }) })
    await assert.rejects(invalid.load("lib/sso").beginSsoAuthorization("/dashboard"))
    assert.equal(invalid.redirects.length, 0)
})

test("token exchange sends PKCE as form data and validates API responses", async () => {
    let request
    const rt = runtime({ fetcher: async ( url, options ) => {
        request = { url, options }
        return { ok: true, json: async () => ({ access_token: "token", token_type: "Bearer" }) }
    } })
    await rt.load("services/apiSSOService").exchangeSsoAuthorizationCode("code", "verifier", pendingAuthorization.redirectUri)
    assert.equal(request.options.body.get("code_verifier"), "verifier")
    assert.equal(request.options.body.get("redirect_uri"), pendingAuthorization.redirectUri)
    assert.equal(request.options.method, "POST")
    const invalid = runtime({ fetcher: async () => ({ ok: true, json: async () => ({ access_token: "" }) }) })
    await assert.rejects(invalid.load("services/apiSSOService").exchangeSsoAuthorizationCode("c", "v", "u"))
})

test("change password sends an authenticated PATCH request", async () => {
    let request
    const rt = runtime({ api: "https://sso.test/v1", fetcher: async ( url, options ) => {
        request = { url, options }
        return { ok: true, json: async () => ({ success: true, reauthentication_required: true }) }
    } })

    const result = await rt.load("services/apiSSOService").changeOwnSsoPassword("access-token", {
        currentPassword: "old-password",
        newPassword: "new-password",
    })

    assert.equal(request.url, "https://sso.test/v1/me/password")
    assert.equal(request.options.method, "PATCH")
    assert.equal(request.options.headers.Authorization, "Bearer access-token")
    assert.deepEqual(JSON.parse(request.options.body), {
        current_password: "old-password",
        new_password: "new-password",
    })
    assert.equal(result.reauthenticationRequired, true)
})

test("UAT signin returns to the template callback and exchanges the original PKCE verifier", async () => {
    const api = "https://api-uat-intranet.jibcomputer.group/jib-sso/v1"
    const signin = "https://uat-intranet.jibcomputer.group/nexus-intralogin/signin"
    for ( const frontend of [ signin, `${signin}/`, signin.replace(/\/signin$/, "") ] ) {
        const requests = []
        const rt = runtime({
            environment: {
                NEXT_PUBLIC_API_URL: "https://api-uat-intranet.jibcomputer.group/",
                NEXT_PUBLIC_BASE_PATH: "/template",
                NEXT_PUBLIC_SSO_BASE_URL: frontend,
            },
            fetcher: async ( url, options ) => {
                requests.push({ url: new URL(url), options })
                const data = url.startsWith(`${api}/authorize?`)
                    ? { error: "login_required", authorizationRequestId: "new-uat-request", expiresIn: 300 }
                    : url === `${api}/token`
                        ? { access_token: "uat-token", token_type: "Bearer", expires_in: 3600 }
                        : { sub: "employee-123", name: "SSO User", permissions: [ "*", "DASHBOARD.view" ] }
                return { ok: true, json: async () => data }
            },
        })
        const sso = rt.load("lib/sso")
        await sso.beginSsoAuthorization("/profile")
        const authorize = requests[0].url
        const stored = sso.getSsoAuthorization()
        const destination = new URL(rt.redirects[0])
        assert.equal(`${destination.origin}${destination.pathname}`, signin)
        assert.equal(destination.searchParams.get("authorizationRequestId"), "new-uat-request")
        assert.equal(destination.searchParams.get("app_name"), "template")
        assert.equal(destination.searchParams.get("expiresIn"), "300")
        assert.equal(Number(destination.searchParams.get("expiresAt")), stored.expiresAt)
        assert.equal(destination.searchParams.has("code_verifier"), false)
        assert.equal(authorize.origin + authorize.pathname, `${api}/authorize`)
        assert.equal(authorize.searchParams.get("client_id"), "jib-template-app")
        assert.equal(authorize.searchParams.get("redirect_uri"), "http://localhost:4000/template/auth/callback")
        const digest = await webcrypto.subtle.digest("SHA-256", new TextEncoder().encode(stored.codeVerifier))
        assert.equal(authorize.searchParams.get("code_challenge"), Buffer.from(digest).toString("base64url"))
        const { authorization, code } = sso.readSsoCallback(new URLSearchParams({ code: "uat-code", state: stored.state }))
        const service = rt.load("services/apiSSOService")
        const token = await service.exchangeSsoAuthorizationCode(code, authorization.codeVerifier, authorization.redirectUri)
        const user = await service.getSsoUserInfo(token.access_token)
        const store = rt.load("store/useAppStore").useAppStore
        store.getState().setSsoSession(token.access_token, user, token.refresh_token, token.expires_in)
        sso.clearSsoAuthorization()
        assert.equal(requests[1].url.href, `${api}/token`)
        assert.equal(requests[1].options.body.get("code_verifier"), stored.codeVerifier)
        assert.equal(requests[1].options.body.get("redirect_uri"), stored.redirectUri)
        assert.equal(requests[1].options.body.has("client_secret"), false)
        assert.equal(requests[2].options.headers.Authorization, "Bearer uat-token")
        assert.equal(store.getState().accessToken, "uat-token")
        assert.equal(store.getState().userDetail.name, "SSO User")
        assert.deepEqual(store.getState().permissions, [ "*", "DASHBOARD.view" ])
        assert.deepEqual(JSON.parse(rt.sessionStorage.getItem("template:permissions")), [ "*", "DASHBOARD.view" ])
        assert.equal(sso.getSsoAuthorization(), null)
        assert.equal(authorization.returnTo, "/profile")
    }
})

test("authorize fallback uses the SSO root when configured with a signin URL", async () => {
    const rt = runtime({ environment: {
        NEXT_PUBLIC_SSO_BASE_URL: "https://sso.test/nexus-intralogin/signin?authorizationRequestId=old#fragment",
    } })
    await rt.load("lib/sso").beginSsoAuthorization("/dashboard")
    const destination = new URL(rt.redirects[0])
    assert.equal(destination.pathname, "/nexus-intralogin/authorize")
    assert.equal(destination.searchParams.has("authorizationRequestId"), false)
    assert.equal(destination.hash, "")
})

test("session initializes only after SSO verification and logout preserves sibling app storage", async () => {
    let resolveUser
    let calls = 0
    const rt = runtime({ fetcher: async () => {
        calls++
        return { ok: true, json: () => new Promise(( resolve ) => { resolveUser = resolve }) }
    } })
    rt.sessionStorage.setItem("jib-sso:accessToken", "opaque-token")
    rt.sessionStorage.setItem("other-app:accessToken", "keep-me")
    const store = rt.load("store/useAppStore").useAppStore
    assert.equal(store.getState().accessToken, "")
    assert.equal(store.getState().isInitialized, false)
    const first = store.getState().initializeSession()
    const second = store.getState().initializeSession()
    await new Promise(( resolve ) => setImmediate(resolve))
    assert.equal(calls, 1)
    resolveUser({ sub: "123", name: "Test User", permissions: [] })
    await Promise.all([ first, second ])
    assert.equal(store.getState().userDetail.name, "Test User")
    assert.equal(store.getState().accessToken, "opaque-token")
    store.getState().logout()
    assert.equal(store.getState().accessToken, "")
    assert.equal(rt.sessionStorage.getItem("jib-sso:accessToken"), null)
    assert.equal(rt.sessionStorage.getItem("other-app:accessToken"), "keep-me")
})

test("expired or rejected tokens clear the session", async () => {
    for ( const expired of [ true, false ] ) {
        const rt = runtime({ fetcher: async () => ({ ok: false, status: 401 }) })
        rt.sessionStorage.setItem("jib-sso:accessToken", "invalid-token")
        if ( expired ) rt.sessionStorage.setItem("jib-sso:expiresAt", String(Date.now() - 1000))
        const store = rt.load("store/useAppStore").useAppStore
        await store.getState().initializeSession()
        assert.equal(store.getState().accessToken, "")
        assert.equal(store.getState().isInitialized, true)
        assert.equal(rt.sessionStorage.getItem("jib-sso:accessToken"), null)
    }
})
