import { Eye, Plus, Pencil, CheckCircle2, Printer, Ban } from "lucide-react"
import { sessionStorageStore, storage } from "@/lib/storage"

import type { ComponentType } from "react"

/**
 * สิทธิ์เป็น string รูปแบบ "<resource>.<action>" เช่น "pjob.view"
 * ค่ามาจาก backend (JWT / SSO /userinfo) — ฝั่งนี้อ่านอย่างเดียว
 * "*" = ได้ทุกสิทธิ์ (super user)
 */
export type Permission = string

/** ชื่อ action (segment หลังของ permission string) */
export type PermissionAction = "view" | "create" | "edit" | "approve" | "print" | "cancel"

type PermissionActionConfig = {
    key: PermissionAction;
    label: string;
    icon: ComponentType<{ className?: string }>;
}

/** คอลัมน์สิทธิ์ที่แสดงในตาราง + ใช้ map key → label (เรียงตามลำดับที่ต้องการโชว์) */
export const PERMISSION_ACTIONS: PermissionActionConfig[] = [
    { key: "view",    label: "ดู",      icon: Eye },
    { key: "create",  label: "เพิ่ม",    icon: Plus },
    { key: "edit",    label: "แก้ไข",    icon: Pencil },
    { key: "approve", label: "อนุมัติ",  icon: CheckCircle2 },
    { key: "print",   label: "พิมพ์",    icon: Printer },
    { key: "cancel",  label: "ยกเลิก",   icon: Ban },
]

/** สร้าง label สำรองจาก resource key เมื่อไม่มีชื่อเมนู */
const formatResourceLabel = ( resource: string ): string =>
    resource.split("-").map(( part ) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")

const canonicalResource = ( resource: string ): string => resource.toLowerCase()

/** รับสิทธิ์แบบ string ตามสัญญา SSO และ normalize resource ให้อยู่ในรูปตัวพิมพ์เล็ก */
export const normalizePermissions = ( value: unknown ): Permission[] =>
    Array.isArray(value)
        ? Array.from(new Set(value.filter(( permission ): permission is string => typeof permission === "string").map(( permission ) => {
            if ( permission === WILDCARD ) return permission
            const separator = permission.lastIndexOf(".")
            if ( separator < 1 ) return permission
            const resource = permission.slice(0, separator)
            return `${canonicalResource(resource)}${permission.slice(separator)}`
        })))
        : []

const WILDCARD = "*"

/** อ่าน permissions ที่เก็บไว้ตอน login จาก storage (ไม่ throw — คืน [] ถ้า parse ไม่ได้) */
export const getStoredPermissions = (): Permission[] => {
    try {
        const raw = sessionStorageStore.getItem("permissions") ?? storage.getItem("permissions")
        const parsed = raw ? JSON.parse( raw ) : []
        return normalizePermissions(parsed)
    } catch {
        return []
    }
}

/** true ถ้ามี "*" (ได้ทุกสิทธิ์) */
export const hasAllPermissions = ( permissions: Permission[] ): boolean =>
    permissions.includes( WILDCARD )

/**
 * เช็คว่าผู้ใช้มีสิทธิ์ทำ action กับ resource นั้นหรือไม่
 * รองรับ: "*" (ทุกสิทธิ์), "<resource>.*" (ทุก action ของ resource), "<resource>.<action>" (ตรงตัว)
 * @example if ( hasPermission(permissions, "store-products", "create") ) { ...show create button... }
 */
export const hasPermission = ( permissions: Permission[], resource: string, action: PermissionAction ): boolean =>
    permissions.includes( WILDCARD ) ||
    permissions.includes( `${resource}.${WILDCARD}` ) ||
    permissions.includes( `${resource}.${action}` )

/** 1 แถวของตารางสิทธิ์: resource + ธง boolean ต่อ action */
export type PermissionRow = { resource: string; label: string } & Record<PermissionAction, boolean>

/**
 * แปลง permissions (string[]) เป็นตาราง resource × action สำหรับแสดงผล
 * สร้างแถวจาก resource ที่มีสิทธิ์อยู่จริง โดยไม่ต้องลงทะเบียน resource ไว้ล่วงหน้า
 */
export const buildPermissionRows = (
    permissions: Permission[],
    labels: Record<string, string> = {},
): PermissionRow[] => {
    const normalizedPermissions = normalizePermissions(permissions)
    const fromPerms = normalizedPermissions
        .filter(( p ) => p !== WILDCARD && p.includes( "." ) )
        .map(( p ) => p.slice( 0, p.lastIndexOf( "." ) ) )
    const resources = Array.from( new Set(fromPerms) )

    return resources.map(( resource ) => {
        const row = { resource, label: labels[resource] ?? formatResourceLabel( resource ) } as PermissionRow
        PERMISSION_ACTIONS.forEach(( action ) => {
            row[action.key] = hasPermission( normalizedPermissions, resource, action.key )
        })
        return row
    })
}
