import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { runInNewContext } from "node:vm"
import test from "node:test"
import ts from "typescript"

const upstreamBase = "https://service.jib.co.th/3010/api-onsite/api/v1"
const proxyBase = "http://localhost:4000/onsite-service/api/legacy-onsite"

function runtime(environment = {}, fetcher = async () => { throw new Error("Unexpected upstream request") }) {
    const cache = new Map()
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
                NEXT_PUBLIC_ONSITE_API_AUTH_MODE: "legacy",
                NEXT_PUBLIC_ONSITE_API_BASE_URL: upstreamBase,
                ...environment,
            } },
            URL, Headers, Response, Request, AbortSignal, Error,
            fetch: fetcher,
            require: load,
        }, { filename: file })
        return compiledModule.exports
    }
    return load("services/legacyOnsiteProxy").forwardLegacyOnsiteRequest
}

const request = ( resource = "onsiteServiceJob", options = {} ) => new Request(`${proxyBase}/${resource}`, {
    headers: { Authorization: "Bearer old-token", Origin: "http://localhost:4000", ...options.headers },
    ...options,
})

test("same-origin proxy forwards jobs query and the legacy token, and preserves upstream responses", async () => {
    for ( const status of [ 200, 401, 403 ] ) {
        let sent
        const forward = runtime({}, async ( url, options ) => {
            sent = { url: String(url), options }
            return Response.json({ success: status === 200, data: [] }, { status, headers: { "Set-Cookie": "upstream=private" } })
        })
        const response = await forward(request("onsiteServiceJob?limit=1000000"), [ "onsiteServiceJob" ])
        assert.equal(sent.url, `${upstreamBase}/onsiteServiceJob?limit=1000000`)
        assert.equal(sent.options.headers.get("Authorization"), "Bearer old-token")
        assert.equal(sent.options.headers.get("Origin"), null)
        assert.equal(sent.options.headers.get("Cookie"), null)
        assert.equal(sent.options.cache, "no-store")
        assert.equal(sent.options.redirect, "manual")
        assert.equal(response.status, status)
        assert.equal(response.headers.get("Set-Cookie"), null)
        assert.match(response.headers.get("Cache-Control"), /no-store/)
        assert.equal((await response.json()).success, status === 200)
    }
})

test("JSON writes retain the method and request body without forwarding browser cookies", async () => {
    let sent
    const forward = runtime({}, async ( url, options ) => {
        sent = options
        return new Response(null, { status: 204 })
    })
    const response = await forward(request("techService", {
        method: "PATCH", body: JSON.stringify({ status: 2 }),
        headers: { Authorization: "Bearer old-token", Origin: "http://localhost:4000", "Content-Type": "application/json", Cookie: "sso=private" },
    }), [ "techService" ])
    assert.equal(sent.method, "PATCH")
    assert.equal(new TextDecoder().decode(sent.body), '{"status":2}')
    assert.equal(sent.headers.get("Content-Type"), "application/json")
    assert.equal(sent.headers.get("Cookie"), null)
    assert.equal(response.status, 204)
    assert.equal(await response.text(), "")
})

test("production and SSO mode disable the proxy even when an Authorization header is supplied", async () => {
    for ( const environment of [ { NODE_ENV: "production" }, { NEXT_PUBLIC_ONSITE_API_AUTH_MODE: "sso" } ] ) {
        const forward = runtime(environment)
        assert.equal((await forward(request(), [ "onsiteServiceJob" ])).status, 404)
    }
})

test("missing tokens, cross-origin calls, unapproved endpoints, traversal, and other hosts are rejected before fetch", async () => {
    const forward = runtime()
    assert.equal((await forward(new Request(`${proxyBase}/users`), [ "users" ])).status, 401)
    assert.equal((await forward(request("users", { headers: { Authorization: "Bearer old-token", Origin: "https://other.test" } }), [ "users" ])).status, 403)
    assert.equal((await forward(request("users", { headers: { Authorization: "Bearer old-token", "Sec-Fetch-Site": "cross-site" } }), [ "users" ])).status, 403)
    for ( const segments of [ [ "auth", "login" ], [ "other" ], [ "users", ".." ], [ "users", "%2fadmin" ], [ "users", "a/b" ], [ "users", "a\\b" ] ] ) {
        assert.equal((await forward(request(), segments)).status, 400)
    }
    const anotherHost = runtime({ NEXT_PUBLIC_ONSITE_API_BASE_URL: "https://other.test/api" })
    assert.equal((await anotherHost(request(), [ "onsiteServiceJob" ])).status, 503)
})

test("redirects never forward the bearer token to another destination; network errors and timeouts have explicit statuses", async () => {
    const redirect = runtime({}, async () => new Response(null, { status: 302, headers: { Location: "https://other.test" } }))
    assert.equal((await redirect(request(), [ "onsiteServiceJob" ])).status, 502)
    const failed = runtime({}, async () => { throw new Error("Network failure") })
    assert.equal((await failed(request(), [ "onsiteServiceJob" ])).status, 502)
    const timeout = runtime({}, async () => { const error = new Error("Timeout"); error.name = "TimeoutError"; throw error })
    assert.equal((await timeout(request(), [ "onsiteServiceJob" ])).status, 504)
})
