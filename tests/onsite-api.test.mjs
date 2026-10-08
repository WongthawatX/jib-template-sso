import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { runInNewContext } from "node:vm"
import test from "node:test"
import axios from "axios"
import ts from "typescript"

const require = createRequire(import.meta.url)
const baseURL = "https://onsite.test/api-onsite/api/v1"
const tokenExpiry = Math.floor(Date.now() / 1000) + 3600
const jwt = ( subject, exp = tokenExpiry ) =>
    `eyJhbGciOiJub25lIn0.${Buffer.from(JSON.stringify({ sub: subject, exp })).toString("base64url")}.signature`

function memoryStorage() {
    const entries = new Map()
    return {
        get length() { return entries.size },
        key: index => [ ...entries.keys() ][index] ?? null,
        getItem: key => entries.get(key) ?? null,
        setItem: ( key, value ) => entries.set(key, String(value)),
        removeItem: key => entries.delete(key),
    }
}

function runtime(environment = {}) {
    const cache = new Map()
    const sessionStorage = memoryStorage()
    const localStorage = memoryStorage()
    let fetches = 0
    let redirects = 0
    const load = name => {
        const file = resolve(`${name.replace(/^@\//, "")}.ts`)
        if ( cache.has(file) ) return cache.get(file).exports
        const compiledModule = { exports: {} }
        cache.set(file, compiledModule)
        const source = ts.transpileModule(readFileSync(file, "utf8"), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        }).outputText
        runInNewContext(source, {
            module: compiledModule, exports: compiledModule.exports,
            process: { env: {
                NODE_ENV: "development",
                NEXT_PUBLIC_BASE_PATH: "/onsite-service",
                NEXT_PUBLIC_ONSITE_API_AUTH_MODE: "legacy",
                NEXT_PUBLIC_ONSITE_API_BASE_URL: baseURL,
                ...environment,
            } },
            sessionStorage, localStorage, URL, URLSearchParams, AbortSignal,
            fetch: async () => { fetches += 1; throw new Error("Unexpected SSO request") },
            window: { location: { origin: "http://localhost:4000", replace: () => { redirects += 1 } } },
            require: id => id.startsWith("@/") ? load(id)
                : id.startsWith(".") ? load(resolve(dirname(file), id)) : require(id),
        }, { filename: file })
        return compiledModule.exports
    }
    const sso = load("store/useAppStore").useAppStore
    sso.getState().setSsoSession(jwt("sso-user"), { sub: "sso-user" }, "sso-refresh", 3600)
    const legacy = load("store/useLegacyOnsiteStore").useLegacyOnsiteStore
    return { load, sessionStorage, localStorage, sso, legacy, fetches: () => fetches, redirects: () => redirects }
}

const success = config => Promise.resolve({ data: { success: true }, status: 200, statusText: "OK", config, headers: {} })
const rejection = ( config, status = 401 ) => new axios.AxiosError("Rejected", "ERR_BAD_REQUEST", config, undefined, {
    data: {}, status, statusText: "Rejected", headers: {}, config,
})

test("Onsite requests require the legacy token and never fall back to the SSO token", async () => {
    const rt = runtime()
    const client = rt.load("services/onsiteApiClient").onsiteAPI
    let calls = 0
    client.defaults.adapter = config => { calls += 1; return success(config) }
    await assert.rejects(client.get("techService"), /token/)
    assert.equal(calls, 0)
    const ssoToken = rt.sso.getState().accessToken
    assert.throws(() => rt.legacy.getState().connect(ssoToken), /SSO/)
    rt.legacy.getState().connect(`Bearer ${jwt("legacy-user")}`)
    client.defaults.adapter = config => {
        assert.equal(config.headers.Authorization, `Bearer ${jwt("legacy-user")}`)
        assert.equal(config.baseURL, "/onsite-service/api/legacy-onsite/")
        return success(config)
    }
    await client.get("techService")
    assert.equal(rt.sso.getState().accessToken, ssoToken)
    assert.equal(rt.sessionStorage.getItem("onsite-service:accessToken"), ssoToken)
    assert.equal(rt.localStorage.length, 0)
})

test("legacy 401 clears only legacy auth without SSO refresh, logout, or retry; 403 retains it", async () => {
    for ( const status of [ 401, 403 ] ) {
        const rt = runtime()
        rt.legacy.getState().connect(jwt("legacy-user"))
        const before = rt.sso.getState().accessToken
        const client = rt.load("services/onsiteApiClient").onsiteAPI
        let calls = 0
        client.defaults.adapter = config => { calls += 1; return Promise.reject(rejection(config, status)) }
        await assert.rejects(client.get("techService"))
        assert.equal(calls, 1)
        assert.equal(rt.fetches(), 0)
        assert.equal(rt.redirects(), 0)
        assert.equal(rt.sso.getState().accessToken, before)
        assert.equal(rt.sessionStorage.getItem("onsite-service:refreshToken"), "sso-refresh")
        assert.equal(Boolean(rt.load("store/useLegacyOnsiteStore").getLegacyOnsiteToken()), status !== 401)
    }
})

test("a late 401 from an old token cannot delete a replacement token", async () => {
    const rt = runtime()
    rt.legacy.getState().connect(jwt("old"))
    const client = rt.load("services/onsiteApiClient").onsiteAPI
    client.defaults.adapter = config => {
        rt.legacy.getState().connect(jwt("replacement"))
        return Promise.reject(rejection(config))
    }
    await assert.rejects(client.get("users"))
    assert.equal(rt.load("store/useLegacyOnsiteStore").getLegacyOnsiteToken(), jwt("replacement"))
})

test("expired tokens, account changes, and SSO logout cannot reuse the temporary session", () => {
    const rt = runtime()
    assert.throws(() => rt.legacy.getState().connect(jwt("expired", 1)))
    rt.legacy.getState().connect(jwt("legacy-user"))
    rt.sso.getState().setSsoSession(jwt("other-sso-user"), { sub: "other-sso-user" })
    assert.equal(rt.load("store/useLegacyOnsiteStore").getLegacyOnsiteToken(), "")
    rt.legacy.getState().connect(jwt("legacy-user"))
    rt.sso.getState().logout()
    assert.equal(rt.load("store/useLegacyOnsiteStore").getLegacyOnsiteToken(), "")
    assert.equal(rt.sessionStorage.getItem("onsite-service:legacyOnsiteSession"), null)
})

test("SSO mode uses the SSO token; production ignores the legacy flag and saved tokens", async () => {
    for ( const environment of [ { NEXT_PUBLIC_ONSITE_API_AUTH_MODE: "sso" }, { NODE_ENV: "production" } ] ) {
        const rt = runtime(environment)
        rt.sessionStorage.setItem("onsite-service:legacyOnsiteSession", JSON.stringify({ token: jwt("old"), ownerSub: "sso-user" }))
        assert.equal(rt.load("config/env").USE_LEGACY_ONSITE_API, false)
        assert.throws(() => rt.legacy.getState().connect(jwt("old")))
        const client = rt.load("services/onsiteApiClient").onsiteAPI
        client.defaults.adapter = config => {
            assert.equal(config.headers.Authorization, `Bearer ${rt.sso.getState().accessToken}`)
            assert.equal(config.baseURL, `${baseURL}/`)
            return success(config)
        }
        await client.get("techService")
    }
})

test("neither auth mode sends its token outside the configured Onsite API", async () => {
    for ( const mode of [ "legacy", "sso" ] ) {
        const rt = runtime({ NEXT_PUBLIC_ONSITE_API_AUTH_MODE: mode })
        if ( mode === "legacy" ) rt.legacy.getState().connect(jwt("legacy-user"))
        const client = rt.load("services/onsiteApiClient").onsiteAPI
        let calls = 0
        client.defaults.adapter = config => { calls += 1; return success(config) }
        for ( const url of [ "https://other.test/steal", "https://onsite.test/outside", "../../outside" ] ) {
            await assert.rejects(client.get(url))
        }
        assert.equal(calls, 0)
    }
})
