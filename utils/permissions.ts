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

/**
 * resource key = segment ของ route (kebab-case) ให้ตรงกับที่ backend ส่งใน permissions
 * อ้างชื่อแทน string ดิบ (เช่น RESOURCE.STORE_PRODUCTS แทน "pjob")
 */
export const RESOURCE = {
    DASHBOARD: "dashboard",
    TABLE_DEMO: "table-demo",
    STORE_DASHBOARD: "store-dashboard",
    STORE_ORGANIZE: "store-organize",
    STORE_PRODUCTS: "store-products",
    STORE_UPLOAD_360: "store-upload-360",
    STORE_MARKETPLACE_OPTION: "store-marketplace-option",
    STORE_COMMERCIAL_PRODUCTS: "store-commercial-products",
    STORE_COM_SET: "store-com-set",
    STORE_VARIATIONS: "store-variations",
    STORE_SPEC_TEMPLATES: "store-spec-templates",
    STORE_MAPPING: "store-mapping",
    STORE_CATEGORY: "store-category",
    STORE_BRANDS: "store-brands",
    STORE_SUPPLIERS: "store-suppliers",
    STORE_FILTERS: "store-filters",
    STORE_TAGS: "store-tags",
    STORE_WARRANTIES: "store-warranties",
    STORE_SERVICES: "store-services",
    STORE_ORDERS: "store-orders",
    STORE_ORDERS_BY_ORDER: "store-orders-by-order",
    USERS: "users",
    USERS_PERMISSIONS: "users-permissions",
    REPORTS_SALES: "reports-sales",
    REPORTS_PRODUCTS: "reports-products",
    SETTINGS_GENERAL: "settings-general",
} as const

export type ResourceKey = ( typeof RESOURCE )[keyof typeof RESOURCE]

/** ชื่อ resource สำหรับแสดงผล — ปรับ/เพิ่มได้ที่นี่ที่เดียว */
export const RESOURCE_LABELS: Record<string, string> = {
    [RESOURCE.DASHBOARD]: "Dashboard",
    [RESOURCE.TABLE_DEMO]: "ทดลอง Table",
    [RESOURCE.STORE_DASHBOARD]: "Dashboard",
    [RESOURCE.STORE_ORGANIZE]: "จัดระเบียบสินค้า",
    [RESOURCE.STORE_PRODUCTS]: "Products",
    [RESOURCE.STORE_UPLOAD_360]: "Upload 360°",
    [RESOURCE.STORE_MARKETPLACE_OPTION]: "Marketplace Option",
    [RESOURCE.STORE_COMMERCIAL_PRODUCTS]: "Commercial Products",
    [RESOURCE.STORE_COM_SET]: "Com Set",
    [RESOURCE.STORE_VARIATIONS]: "Variations",
    [RESOURCE.STORE_SPEC_TEMPLATES]: "Spec Templates",
    [RESOURCE.STORE_MAPPING]: "Mapping",
    [RESOURCE.STORE_CATEGORY]: "Category",
    [RESOURCE.STORE_BRANDS]: "Brands",
    [RESOURCE.STORE_SUPPLIERS]: "Suppliers",
    [RESOURCE.STORE_FILTERS]: "Filters",
    [RESOURCE.STORE_TAGS]: "Tags",
    [RESOURCE.STORE_WARRANTIES]: "Warranties",
    [RESOURCE.STORE_SERVICES]: "Services",
    [RESOURCE.STORE_ORDERS]: "รายการคำสั่งซื้อ",
    [RESOURCE.STORE_ORDERS_BY_ORDER]: "รายการคำสั่งซื้อ By Order",
    [RESOURCE.USERS]: "Users",
    [RESOURCE.USERS_PERMISSIONS]: "Permissions",
    [RESOURCE.REPORTS_SALES]: "รายงานยอดขาย",
    [RESOURCE.REPORTS_PRODUCTS]: "รายงานสินค้า",
    [RESOURCE.SETTINGS_GENERAL]: "ตั้งค่าทั่วไป",
}

/** คืนชื่อ resource สำหรับแสดงผล: RESOURCE_LABELS → fallback เป็น key ดิบ */
export const getResourceLabel = ( resource: string ): string =>
    RESOURCE_LABELS[resource] ?? resource

/** รับเฉพาะสิทธิ์แบบ string ตามสัญญา SSO ของ Procon */
export const normalizePermissions = ( value: unknown ): Permission[] =>
    Array.isArray(value) ? value.filter(( permission ): permission is string => typeof permission === "string") : []

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
 * @example if ( hasPermission(permissions, RESOURCE.PJOB, "create") ) { ...show create button... }
 */
export const hasPermission = ( permissions: Permission[], resource: string, action: PermissionAction ): boolean =>
    permissions.includes( WILDCARD ) ||
    permissions.includes( `${resource}.${WILDCARD}` ) ||
    permissions.includes( `${resource}.${action}` )

/** 1 แถวของตารางสิทธิ์: resource + ธง boolean ต่อ action */
export type PermissionRow = { resource: string; label: string } & Record<PermissionAction, boolean>

/**
 * แปลง permissions (string[]) เป็นตาราง resource × action สำหรับแสดงผล
 * รวม resource ที่แอปรู้จัก (RESOURCE_LABELS) กับที่มาใน permissions จริง เพื่อให้ครบ
 */
export const buildPermissionRows = ( permissions: Permission[] ): PermissionRow[] => {
    const fromPerms = permissions
        .filter(( p ) => p !== WILDCARD && p.includes( "." ) )
        .map(( p ) => p.slice( 0, p.lastIndexOf( "." ) ) )
    const resources = Array.from( new Set([ ...Object.keys( RESOURCE_LABELS ), ...fromPerms ]) )

    return resources.map(( resource ) => {
        const row = { resource, label: getResourceLabel( resource ) } as PermissionRow
        PERMISSION_ACTIONS.forEach(( action ) => {
            row[action.key] = hasPermission( permissions, resource, action.key )
        })
        return row
    })
}
