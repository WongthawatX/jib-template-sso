"use client"

import { useCallback, useMemo, useState, useSyncExternalStore } from "react"

import { storage } from "@/lib/storage"

export type PinSide = "left" | "right"
export type Density = "compact" | "normal" | "comfortable"
export type WidthMode = "content" | "screen"
export type BorderIntensity = "none" | "light" | "normal" | "strong"
export type BorderWidth = 0.5 | 1 | 2

export type TablePrefs = {
    /** ลำดับคอลัมน์ที่ผู้ใช้จัดเอง (เฉพาะคอลัมน์ที่ลากได้) */
    order: string[];
    /** key ของคอลัมน์ที่ถูกซ่อน */
    hidden: string[];
    /** คอลัมน์ที่ผู้ใช้สั่งตรึงเอง (คนละส่วนกับ `fixed` ที่ dev กำหนดในนิยามคอลัมน์) */
    pins: Record<string, PinSide>;
    density: Density;
    headerFontSize: number;
    bodyFontSize: number;
    widthMode: WidthMode;
    /** ความเข้มของเส้นตาราง */
    borderIntensity: BorderIntensity;
    /** ความหนาของเส้นตาราง (px) */
    borderWidth: BorderWidth;
    /** แถบสลับสีในแถวคู่ */
    striped: boolean;
    /** เส้นคั่นระหว่างคอลัมน์ */
    columnDivider: boolean;
}

export const DEFAULT_PREFS: TablePrefs = {
    order: [],
    hidden: [],
    pins: {},
    density: "compact",
    headerFontSize: 12,
    bodyFontSize: 11,
    widthMode: "content",
    borderIntensity: "normal",
    borderWidth: 1,
    striped: false,
    columnDivider: true,
}

/**
 * สีเส้นตารางตามระดับความเข้ม — ผูกกับ token `--border` ของธีม จึงพลิกตาม light/dark ให้เอง
 * ไม่ hardcode hex เพราะจะต้องมาเขียนแยกสองธีมแล้วหลุด sync กันภายหลัง
 */
export const BORDER_COLOR: Record<BorderIntensity, string> = {
    none: "transparent",
    light: "color-mix(in oklch, var(--border) 45%, transparent)",
    normal: "var(--border)",
    strong: "color-mix(in oklch, var(--border), var(--foreground) 30%)",
}

export const BORDER_WIDTH_OPTIONS = [ 0.5, 1, 2 ] as const

export const DENSITY_PADDING: Record<Density, string> = {
    compact: "2px",
    normal: "4px",
    comfortable: "8px",
}

export const FONT_SIZE_OPTIONS = [ 11, 12, 13, 14, 15 ] as const

const PREFS_PREFIX = "table_prefs:"
/** คีย์เดิมที่เก็บแค่ลำดับคอลัมน์เป็น array — อ่านต่อได้เพื่อไม่ให้ของที่ผู้ใช้จัดไว้หาย */
const LEGACY_ORDER_PREFIX = "table_col_order:"

// localStorage มีแค่ฝั่ง client → อ่านผ่าน useSyncExternalStore (server snapshot = null) กัน SSR crash
// "storage" event ไม่ยิงใน tab ที่เขียนเอง เลยต้องมี listener ของตัวเองไว้ปลุก subscriber ในแท็บเดียวกัน
const listeners = new Set<() => void>()

const emitChange = (): void => {
    listeners.forEach(( listener ) => listener())
}

const subscribe = ( onStoreChange: () => void ): (() => void) => {
    listeners.add( onStoreChange )
    window.addEventListener("storage", onStoreChange)
    return () => {
        listeners.delete( onStoreChange )
        window.removeEventListener("storage", onStoreChange)
    }
}

const isRecord = ( value: unknown ): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

const stringArray = ( value: unknown ): string[] =>
    Array.isArray(value) ? value.filter(( item ): item is string => typeof item === "string" ) : []

const pinRecord = ( value: unknown ): Record<string, PinSide> => {
    if ( !isRecord(value) ) return {}
    const result: Record<string, PinSide> = {}
    for ( const [ key, side ] of Object.entries(value) ) {
        if ( side === "left" || side === "right" ) result[key] = side
    }
    return result
}

const oneOf = <T extends string>( value: unknown, allowed: readonly T[], fallback: T ): T =>
    allowed.includes( value as T ) ? value as T : fallback

const fontSize = ( value: unknown, fallback: number ): number =>
    typeof value === "number" && FONT_SIZE_OPTIONS.includes( value as typeof FONT_SIZE_OPTIONS[number] )
        ? value
        : fallback

const borderWidth = ( value: unknown ): BorderWidth =>
    BORDER_WIDTH_OPTIONS.includes( value as BorderWidth ) ? value as BorderWidth : DEFAULT_PREFS.borderWidth

const boolean = ( value: unknown, fallback: boolean ): boolean =>
    typeof value === "boolean" ? value : fallback

const parsePrefs = ( raw: string | null, legacyRaw: string | null ): TablePrefs => {
    // ยังไม่มีค่าใหม่ แต่มีลำดับคอลัมน์จากคีย์เดิม → ยกมาใช้เป็น order
    if ( !raw ) {
        if ( !legacyRaw ) return DEFAULT_PREFS
        try {
            return { ...DEFAULT_PREFS, order: stringArray( JSON.parse(legacyRaw) ) }
        } catch {
            return DEFAULT_PREFS
        }
    }

    try {
        const parsed: unknown = JSON.parse(raw)
        if ( !isRecord(parsed) ) return DEFAULT_PREFS

        return {
            order: stringArray( parsed.order ),
            hidden: stringArray( parsed.hidden ),
            pins: pinRecord( parsed.pins ),
            density: oneOf( parsed.density, [ "compact", "normal", "comfortable" ] as const, DEFAULT_PREFS.density ),
            headerFontSize: fontSize( parsed.headerFontSize, DEFAULT_PREFS.headerFontSize ),
            bodyFontSize: fontSize( parsed.bodyFontSize, DEFAULT_PREFS.bodyFontSize ),
            widthMode: oneOf( parsed.widthMode, [ "content", "screen" ] as const, DEFAULT_PREFS.widthMode ),
            borderIntensity: oneOf(
                parsed.borderIntensity,
                [ "none", "light", "normal", "strong" ] as const,
                DEFAULT_PREFS.borderIntensity,
            ),
            borderWidth: borderWidth( parsed.borderWidth ),
            striped: boolean( parsed.striped, DEFAULT_PREFS.striped ),
            columnDivider: boolean( parsed.columnDivider, DEFAULT_PREFS.columnDivider ),
        }
    } catch {
        return DEFAULT_PREFS
    }
}

/**
 * อ่าน/เขียนการตั้งค่าตารางของผู้ใช้
 * - มี `storageKey` → เก็บลง localStorage (จำข้ามรอบ) และ sync ทุก instance ที่ใช้คีย์เดียวกัน
 * - ไม่มี → เก็บใน state ของ component (หายเมื่อ unmount) ไม่ต้องบังคับให้ทุกตารางมีคีย์
 *
 * เรียก hook ทั้งสองทางเสมอ (ห้ามเรียกแบบมีเงื่อนไข) แล้วเลือกค่าที่จะใช้ตอนท้าย
 */
export function useTablePrefs( storageKey?: string ) {
    const [ sessionPrefs, setSessionPrefs ] = useState<TablePrefs>(DEFAULT_PREFS)

    const getStoredSnapshot = useCallback(
        () => ( storageKey ? storage.getItem( PREFS_PREFIX + storageKey ) : null ),
        [ storageKey ],
    )
    const getLegacySnapshot = useCallback(
        () => ( storageKey ? storage.getItem( LEGACY_ORDER_PREFIX + storageKey ) : null ),
        [ storageKey ],
    )
    const getServerSnapshot = useCallback(() => null, [])

    const rawPrefs = useSyncExternalStore( subscribe, getStoredSnapshot, getServerSnapshot )
    const rawLegacy = useSyncExternalStore( subscribe, getLegacySnapshot, getServerSnapshot )

    const storedPrefs = useMemo(() => parsePrefs( rawPrefs, rawLegacy ), [ rawPrefs, rawLegacy ])
    const prefs = storageKey ? storedPrefs : sessionPrefs

    const update = useCallback(( patch: Partial<TablePrefs> ) => {
        if ( !storageKey ) {
            setSessionPrefs(( previous ) => ({ ...previous, ...patch }))
            return
        }
        const current = parsePrefs(
            storage.getItem( PREFS_PREFIX + storageKey ),
            storage.getItem( LEGACY_ORDER_PREFIX + storageKey ),
        )
        storage.setItem( PREFS_PREFIX + storageKey, JSON.stringify({ ...current, ...patch }) )
        emitChange()
    }, [ storageKey ])

    const reset = useCallback(( keys?: ( keyof TablePrefs )[] ) => {
        // ไม่ระบุ keys = คืนค่าทั้งหมด
        if ( !keys ) {
            if ( !storageKey ) {
                setSessionPrefs(DEFAULT_PREFS)
                return
            }
            storage.removeItem( PREFS_PREFIX + storageKey )
            storage.removeItem( LEGACY_ORDER_PREFIX + storageKey )
            emitChange()
            return
        }

        const patch: Partial<TablePrefs> = {}
        for ( const key of keys ) patch[key] = DEFAULT_PREFS[key] as never
        update( patch )

        // order ถูกเก็บในคีย์เดิมด้วย ถ้าไม่ลบทิ้ง การคืนค่าจะไม่มีผล
        if ( storageKey && keys.includes("order") ) {
            storage.removeItem( LEGACY_ORDER_PREFIX + storageKey )
            emitChange()
        }
    }, [ storageKey, update ])

    const isCustomized = useMemo(() => (
        prefs.order.length > 0
        || prefs.hidden.length > 0
        || Object.keys(prefs.pins).length > 0
        || prefs.density !== DEFAULT_PREFS.density
        || prefs.headerFontSize !== DEFAULT_PREFS.headerFontSize
        || prefs.bodyFontSize !== DEFAULT_PREFS.bodyFontSize
        || prefs.widthMode !== DEFAULT_PREFS.widthMode
        || prefs.borderIntensity !== DEFAULT_PREFS.borderIntensity
        || prefs.borderWidth !== DEFAULT_PREFS.borderWidth
        || prefs.striped !== DEFAULT_PREFS.striped
        || prefs.columnDivider !== DEFAULT_PREFS.columnDivider
    ), [ prefs ])

    return { prefs, update, reset, isCustomized }
}
