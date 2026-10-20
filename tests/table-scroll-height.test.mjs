import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { runInNewContext } from "node:vm"
import ts from "typescript"

const source = ts.transpileModule(readFileSync(new URL("../hooks/useTableScrollHeight.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function mountTable() {
    const refs = []
    const effects = []
    let cleanup
    let scrollY
    let frame
    let notifyResize
    let notifyMutation
    let contentHeight = 600
    let overhead = 70
    const viewport = {
        clientWidth: 1000, clientHeight: 600, scrollTop: 0,
        getBoundingClientRect: () => ({ top: 0, bottom: viewport.clientHeight }),
    }
    const body = { getBoundingClientRect: () => ({ height: Math.min(contentHeight, scrollY ?? contentHeight) }) }
    const wrapper = {
        parentElement: viewport,
        closest: () => viewport,
        querySelector: ( selector ) => selector === ".ant-table" ? {} : selector === ".ant-table-body" ? body : null,
        getBoundingClientRect: () => {
            const height = body.getBoundingClientRect().height + overhead
            const top = 100 - viewport.scrollTop
            return { top, bottom: top + height, height }
        },
    }
    const compiledModule = { exports: {} }
    runInNewContext(source, {
        module: compiledModule, exports: compiledModule.exports,
        require: ( name ) => {
            assert.equal(name, "react")
            return {
                useRef: ( value ) => { const ref = { current: value }; refs.push(ref); return ref },
                useState: () => [ undefined, ( value ) => { scrollY = typeof value === "function" ? value(scrollY) : value } ],
                useEffect: ( effect ) => effects.push(effect),
            }
        },
        window: { getComputedStyle: () => ({ paddingBottom: "0", marginBottom: "0" }), addEventListener() {}, removeEventListener() {} },
        requestAnimationFrame: ( callback ) => { frame = callback; return 1 },
        cancelAnimationFrame: () => { frame = undefined },
        ResizeObserver: class { constructor(callback) { notifyResize = callback } observe() {} disconnect() {} },
        MutationObserver: class { constructor(callback) { notifyMutation = callback } observe() {} disconnect() {} },
    })
    compiledModule.exports.useTableScrollHeight()
    refs[0].current = wrapper
    cleanup = effects[0]()

    const flush = () => {
        const callback = frame
        frame = undefined
        callback?.()
    }
    flush()

    return {
        get height() { return scrollY },
        viewport,
        changeContent: ( height ) => { contentHeight = height; notifyMutation(); flush() },
        resize: ( height, extra = 70 ) => { viewport.clientHeight = height; overhead = extra; notifyResize(); flush() },
        cleanup,
    }
}

test("last-page and expanded-row transitions never accumulate unused max-height", () => {
    const table = mountTable()
    assert.equal(table.height, 428)
    for ( let round = 0; round < 5; round += 1 ) {
        table.changeContent(30) // หน้าสุดท้ายเหลือหนึ่งแถว
        assert.equal(table.height, 428)
        table.changeContent(90) // ขยายแถวกำลังโหลดข้อมูลช่าง
        assert.equal(table.height, 428)
        table.changeContent(180) // ข้อมูลช่างโหลดเสร็จ
        assert.equal(table.height, 428)
        table.changeContent(600) // กลับหน้ารองสุดท้ายที่มี 20 แถว
        assert.equal(table.height, 428)
    }
    table.cleanup()
})

test("outer page scroll does not inflate the table height", () => {
    const table = mountTable()
    table.viewport.scrollTop = 180
    table.changeContent(30)
    assert.equal(table.height, 428)
    table.changeContent(600)
    assert.equal(table.height, 428)
    table.cleanup()
})

test("viewport and footer geometry changes recompute available height", () => {
    const table = mountTable()
    table.resize(500)
    assert.equal(table.height, 328)
    table.resize(500, 90)
    assert.equal(table.height, 308)
    table.resize(600)
    assert.equal(table.height, 428)
    table.cleanup()
})
