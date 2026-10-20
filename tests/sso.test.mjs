import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
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

function runtime({ api = "", environment = {}, modules = {}, fetcher = async () => { throw new Error("Unexpected API call") } } = {}) {
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
            NEXT_PUBLIC_SSO_APP_NAME: "test-template",
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
        const base = resolve(name.replace(/^@\//, ""))
        const file = existsSync(`${base}.ts`) ? `${base}.ts` : `${base}.tsx`
        if ( cache.has(file) ) return cache.get(file).exports
        const compiledModule = { exports: {} }
        cache.set(file, compiledModule)
        const source = ts.transpileModule(readFileSync(file, "utf8"), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
        }).outputText
        runInNewContext(source, {
            ...globals, module: compiledModule, exports: compiledModule.exports,
            require: ( id ) => modules[id] ?? (id.startsWith("@/") ? load(id) : id.startsWith(".") ? load(resolve(dirname(file), id)) : require(id)),
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
    assert.equal(destination.searchParams.get("app_name"), "test-template")
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

test("configured API still authorizes through the central browser session", async () => {
    const rt = runtime({ api: "https://sso.test/v1" })
    await rt.load("lib/sso").beginSsoAuthorization("/dashboard")
    assert.equal(new URL(rt.redirects[0]).pathname, "/jib-sso/authorize")
    assert.equal(new URL(rt.redirects[0]).searchParams.has("authorizationRequestId"), false)
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

test("UAT central authorization returns to the template callback and exchanges the original PKCE verifier", async () => {
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
        const authorize = new URL(rt.redirects[0])
        const stored = sso.getSsoAuthorization()
        assert.equal(authorize.origin + authorize.pathname, signin.replace(/\/signin$/, "/authorize"))
        assert.equal(authorize.searchParams.get("app_name"), "test-template")
        assert.equal(authorize.searchParams.has("code_verifier"), false)
        assert.equal(requests.length, 0)
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
        assert.equal(requests[0].url.href, `${api}/token`)
        assert.equal(requests[0].options.body.get("code_verifier"), stored.codeVerifier)
        assert.equal(requests[0].options.body.get("redirect_uri"), stored.redirectUri)
        assert.equal(requests[0].options.body.has("client_secret"), false)
        assert.equal(requests[1].options.headers.Authorization, "Bearer uat-token")
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


test("logout clears the frontend cookie and revokes the API refresh family with expired access", async () => {
    const jwt = exp => `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.signature`
    for ( const token of [ "", "invalid", jwt(1), jwt(Math.floor(Date.now() / 1000) + 3600) ] ) {
        const sent = []
        const rt = runtime({ api: "https://sso.test/v1", fetcher: async (url, options) => {
            sent.push({ url, options })
            return { ok: true, json: async () => null }
        } })
        rt.sessionStorage.setItem("jib-sso:refreshToken", "refresh-token")
        await rt.load("services/apiSSOService").logoutSso(token)
        assert.equal(sent.length, 2)
        assert.equal(sent[0].url, "http://localhost:4001/jib-sso/api/auth/logout")
        assert.equal(sent[0].options.body, "{}")
        assert.equal(sent[1].url, "https://sso.test/v1/logout")
        assert.equal(sent[1].options.body, JSON.stringify({ refresh_token: "refresh-token" }))
        for ( const request of sent ) {
            assert.equal(request.options.credentials, "include")
            assert.equal(request.options.method, "POST")
            assert.equal(request.options.headers.Authorization, token === "" || token === "invalid" || token === jwt(1) ? undefined : `Bearer ${token}`)
        }
    }
})

test("logout without refresh uses empty bodies and waits for both endpoints before reporting failure", async () => {
    let finishApi
    const sent = []
    const rt = runtime({ api: "https://sso.test/v1", environment: { NEXT_PUBLIC_SSO_LOGOUT_URL: "https://sso.test/custom/logout" }, fetcher: async (url, options) => {
        sent.push({ url, options })
        if ( url === "https://sso.test/v1/logout" ) await new Promise(resolve => { finishApi = resolve })
        return { ok: url !== "https://sso.test/custom/logout", status: 503, json: async () => null }
    } })
    const service = rt.load("services/apiSSOService")
    let hasFinished = false
    const pending = assert.rejects(service.logoutSso()).then(() => { hasFinished = true })
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(hasFinished, false)
    assert.equal(service.getSsoLogoutState().isLoggingOut, true)
    assert.equal(sent[0].url, "https://sso.test/custom/logout")
    assert.ok(sent.every(request => request.options.body === "{}"))
    finishApi()
    await pending
    assert.equal(service.getSsoLogoutState().isLoggingOut, false)
})

test("refresh completing after logout does not restore tokens or revoke a subsequent session", async () => {
    let finishRefresh
    let requestInterceptor
    const requests = []
    const axios = { default: {
        create: () => ({ interceptors: {
            request: { use: handler => { requestInterceptor = handler } },
            response: { use: () => undefined },
        } }),
    } }
    const rt = runtime({ api: "https://sso.test/v1", modules: { axios }, fetcher: async (url, options) => {
        requests.push({ url, options })
        if ( url.endsWith("/token/refresh") ) {
            return { ok: true, json: () => new Promise(resolve => { finishRefresh = resolve }) }
        }
        return { ok: true, json: async () => null }
    } })
    rt.sessionStorage.setItem("jib-sso:accessToken", "expired-token")
    rt.sessionStorage.setItem("jib-sso:refreshToken", "refresh-token")
    const api = rt.load("services/apiServices")
    const pending = assert.rejects(requestInterceptor({ headers: {} }))
    await new Promise(resolve => setImmediate(resolve))
    await api.logout()
    assert.equal(rt.sessionStorage.getItem("jib-sso:accessToken"), null)
    const store = rt.load("store/useAppStore").useAppStore
    assert.equal(store.getState().hasLoggedOut, true)
    store.getState().setSsoSession("subsequent-token", { sub: "new-user", permissions: [] }, "subsequent-refresh", 3600)
    finishRefresh({ access_token: "late-token", refresh_token: "late-refresh", token_type: "Bearer" })
    await pending
    assert.equal(rt.sessionStorage.getItem("jib-sso:accessToken"), "subsequent-token")
    assert.equal(rt.sessionStorage.getItem("jib-sso:refreshToken"), "subsequent-refresh")
    assert.equal(requests.length, 3)
})

test("logout blocks requests and refresh while central logout is pending", async () => {
    let finishLogout
    let requestInterceptor
    const axios = { default: { create: () => ({ interceptors: {
        request: { use: handler => { requestInterceptor = handler } },
        response: { use: () => undefined },
    } }) } }
    let calls = 0
    const rt = runtime({ api: "https://sso.test/v1", modules: { axios }, fetcher: async url => {
        calls++
        if ( url.endsWith("/api/auth/logout") ) await new Promise(resolve => { finishLogout = resolve })
        return { ok: true, json: async () => null }
    } })
    rt.sessionStorage.setItem("jib-sso:accessToken", "expired-token")
    rt.sessionStorage.setItem("jib-sso:refreshToken", "refresh-token")
    const api = rt.load("services/apiServices")
    const pending = api.logout()
    await assert.rejects(requestInterceptor({ headers: {} }), /Logout in progress/)
    assert.equal(calls, 2)
    finishLogout()
    await pending
    assert.equal(rt.sessionStorage.getItem("jib-sso:refreshToken"), null)
})

test("session verification completing after logout cannot restore the old user", async () => {
    let finishUser
    const rt = runtime({ fetcher: async () => ({ ok: true, json: () => new Promise(resolve => { finishUser = resolve }) }) })
    rt.sessionStorage.setItem("jib-sso:accessToken", "old-token")
    const store = rt.load("store/useAppStore").useAppStore
    const pending = store.getState().initializeSession()
    await new Promise(resolve => setImmediate(resolve))
    store.getState().logout()
    finishUser({ sub: "old-user", permissions: [] })
    await pending
    assert.equal(store.getState().accessToken, "")
    assert.equal(store.getState().userDetail, null)
    assert.equal(store.getState().hasLoggedOut, true)
})


test("permissions use exact actions and resource/global wildcards like Procon", () => {
    const { hasPermission, PERMISSION_ACTIONS } = runtime().load("utils/permissions")
    assert.equal(hasPermission([ "jobs.view" ], "jobs", "view"), true)
    assert.equal(hasPermission([ "jobs.view" ], "jobs", "edit"), false)
    assert.equal(hasPermission([ "jobs.*" ], "jobs", "approve"), true)
    assert.equal(hasPermission([ "jobs.*" ], "other", "view"), false)
    assert.equal(hasPermission([ "*" ], "other", "cancel"), true)
    assert.equal(hasPermission([], "jobs", "view"), false)
    assert.deepEqual(Array.from(PERMISSION_ACTIONS, ( action ) => action.key), [ "view", "create", "edit", "approve", "print", "cancel" ])
})

test("Sidebar removes unauthorized links and empty groups/sections; admin role grants nothing", () => {
    const rt = runtime()
    const { navSections } = rt.load("utils/links")
    const { filterNavSections } = rt.load("utils/navigationPermissions")
    const store = rt.load("store/useAppStore").useAppStore
    store.getState().setSsoSession("opaque", { sub: "admin", system_role: "admin", permissions: [] }, undefined, 3600)
    const visible = filterNavSections(navSections, store.getState().permissions)
    const links = visible.flatMap(( section ) => section.groups.flatMap(( group ) => group.links))
    assert.deepEqual(Array.from(links, ( link ) => link.url), [ "/dashboard" ])

    const protectedLinks = navSections.flatMap(( section ) => section.groups.flatMap(( group ) => group.links))
        .filter(( link ) => link.resource)
    for ( const permitted of protectedLinks ) {
        const filtered = filterNavSections(navSections, [ permitted.resource + ".view" ])
        assert.ok(filtered.every(( section ) => section.groups.length && section.groups.every(( group ) => group.links.length)))
        const urls = filtered.flatMap(( section ) => section.groups.flatMap(( group ) => group.links)).map(( link ) => link.url)
        assert.ok(urls.includes(permitted.url))
        assert.equal(urls.length, 2)
        assert.equal(filterNavSections(navSections, [ permitted.resource + ".create" ]).length, 1)
    }
    assert.equal(filterNavSections(navSections, [ "*" ]).length, navSections.length)
})

test("route permissions match Sidebar and protect create/edit URLs without prefix collisions", () => {
    const rt = runtime()
    const { navSections } = rt.load("utils/links")
    const { getRoutePermission } = rt.load("utils/navigationPermissions")
    const links = navSections.flatMap(( section ) => section.groups.flatMap(( group ) => group.links))
    for ( const link of links.filter(( item ) => item.resource) ) {
        assert.equal(getRoutePermission(link.url).resource, link.resource)
        assert.equal(getRoutePermission(link.url).action, "view")
        assert.equal(getRoutePermission(link.url + "/create").action, "create")
        assert.equal(getRoutePermission(link.url + "/123/edit").action, "edit")
    }
    assert.equal(getRoutePermission("/dashboard"), undefined)
    assert.equal(getRoutePermission("/profile"), undefined)
    assert.equal(getRoutePermission("/permissions"), undefined)
    assert.equal(getRoutePermission("/users-other"), undefined)
    const nested = links.find(( item ) => item.url === "/users/permissions")
    if ( nested ) assert.equal(getRoutePermission(nested.url).resource, nested.resource)
})

test("SSO drops legacy menu objects and malformed permissions instead of granting access", async () => {
    const rt = runtime({ api: "https://sso.example/api", fetcher: async () => ({
        ok: true,
        json: async () => ({ sub: "123", system_role: "admin", permissions: [ "users.view", { menu_id: 1, views: 1 }, null, 1 ] }),
    }) })
    const user = await rt.load("services/apiSSOService").getSsoUserInfo("opaque")
    assert.deepEqual(user.permissions, [ "users.view" ])
    const store = rt.load("store/useAppStore").useAppStore
    store.getState().setSsoSession("opaque", user, undefined, 3600)
    assert.deepEqual(store.getState().permissions, [ "users.view" ])
    store.getState().logout()
    assert.equal(store.getState().permissions.length, 0)
})

test("stored permissions are validated and the permission table includes unknown resources", () => {
    const rt = runtime()
    const { sessionStorageStore, storage } = rt.load("lib/storage")
    const { getStoredPermissions, buildPermissionRows } = rt.load("utils/permissions")
    storage.setItem("permissions", JSON.stringify([ "*" ]))
    sessionStorageStore.setItem("permissions", JSON.stringify([ "custom.view", null, { menu_id: 1 } ]))
    assert.deepEqual(Array.from(getStoredPermissions()), [ "custom.view" ])
    const rows = buildPermissionRows(getStoredPermissions())
    const custom = rows.find(( row ) => row.resource === "custom")
    assert.equal(custom.view, true)
    assert.equal(custom.edit, false)
    sessionStorageStore.setItem("permissions", "invalid-json")
    assert.equal(getStoredPermissions().length, 0)
})

test("login automatically starts SSO after successful logout and waits on logout errors or password changes", async () => {
    for ( const query of [ "loggedOut=1", "logged_out=1", "loggedOut=1&logoutError=1", "logged_out=1&logoutError=1", "passwordChanged=1", "" ] ) {
        let starts = 0
        let initializations = 0
        const shouldWait = query.includes("logoutError=1") || query.includes("passwordChanged=1")
        const rt = runtime({ modules: {
            react: {
                useCallback: handler => handler,
                useEffect: effect => effect(),
                useRef: value => ({ current: value }),
                useState: value => [ value, () => undefined ],
            },
            "next/navigation": {
                useRouter: () => ({ replace: () => undefined }),
                useSearchParams: () => new URLSearchParams(query),
            },
            "@/lib/sso": { getSafeReturnTo: value => value, beginSsoAuthorization: async () => { starts++ } },
            "@/store/useAppStore": { useAppStore: { getState: () => ({ initializeSession: async () => { initializations++ }, accessToken: query.includes("logged") ? "stale-token" : "" }) } },
            "../ui/button": { Button: "button" },
            "../ui/card": { Card: "div", CardHeader: "header", CardTitle: "h1", CardDescription: "p", CardContent: "section" },
        } })
        const tree = rt.load("components/auth/Login").default()
        await new Promise(resolve => setImmediate(resolve))
        assert.equal(starts, shouldWait ? 0 : 1)
        if ( query.includes("logged") ) assert.equal(initializations, 0)
        if ( shouldWait ) {
            const findButton = element => {
                if ( !element || typeof element !== "object" ) return null
                if ( element.type === "button" ) return element
                const children = element.props?.children
                for ( const child of Array.isArray(children) ? children : [ children ] ) {
                    const found = findButton(child)
                    if ( found ) return found
                }
                return null
            }
            const button = findButton(tree)
            assert.ok(button)
            button.props.onClick()
            await new Promise(resolve => setImmediate(resolve))
            assert.equal(starts, 1)
        }
    }
})

test("local SSO authorization and logout use the same host with cookie credentials", async () => {
    const requests = []
    const rt = runtime({
        api: "https://sso.test/v1",
        environment: {
            NEXT_PUBLIC_SSO_BASE_URL: "http://localhost:4001/nexus-intralogin",
            NEXT_PUBLIC_SSO_LOGOUT_URL: "http://localhost:4001/nexus-intralogin/api/auth/logout",
        },
        fetcher: async (url, options) => {
            requests.push({ url, options })
            return { ok: true, json: async () => null }
        },
    })
    await rt.load("lib/sso").beginSsoAuthorization("/dashboard")
    const authorizeUrl = new URL(rt.redirects[0])
    assert.equal(authorizeUrl.origin + authorizeUrl.pathname, "http://localhost:4001/nexus-intralogin/authorize")
    await rt.load("services/apiSSOService").logoutSso()
    assert.equal(requests[0].url, "http://localhost:4001/nexus-intralogin/api/auth/logout")
    assert.equal(requests[0].options.credentials, "include")
    assert.equal(requests[1].url, "https://sso.test/v1/logout")
})
