import { sessionStorageStore, storage } from "@/lib/storage";
import { Eye, Plus, Pencil, Trash2, CheckCircle2, Printer } from "lucide-react"

import type { ComponentType } from "react"

/**
 * สิทธิ์การเข้าถึง (CRUD) ต่อ 1 เมนู
 * ค่ามาจาก backend เป็น 0/1 (การกำหนดสิทธิ์ทำจากโปรแกรมอื่น ฝั่งนี้อ่านอย่างเดียว)
 * backend อาจแนบ menu_name มาด้วย (optional) — ถ้ามีจะใช้เป็น label ก่อน
 */
export type Permission = {
    menu_id: number;
    menu_name?: string;
    views: number;
    creates: number;
    edits: number;
    deletes: number;
    approves: number;
    printed: number;
}

/** ชื่อ action (key ตรงกับ field ใน Permission) */
export type PermissionAction = "views" | "creates" | "edits" | "deletes" | "approves" | "printed"

type PermissionActionConfig = {
    key: PermissionAction;
    label: string;
    icon: ComponentType<{ className?: string }>;
}

/** คอลัมน์ CRUD ที่แสดงในตาราง + ใช้ map key → label (เรียงตามลำดับที่ต้องการโชว์) */
export const PERMISSION_ACTIONS: PermissionActionConfig[] = [
    { key: "views",    label: "ดู",      icon: Eye },
    { key: "creates",  label: "เพิ่ม",    icon: Plus },
    { key: "edits",    label: "แก้ไข",    icon: Pencil },
    { key: "deletes",  label: "ลบ",      icon: Trash2 },
    { key: "approves", label: "อนุมัติ",  icon: CheckCircle2 },
    { key: "printed",  label: "พิมพ์",    icon: Printer },
]

/**
 * menu_id แบบมีชื่อ — ให้ component/หน้า อ้างชื่อแทนเลขดิบ (เช่น MENU.PJOB แทน 1)
 * ⚠️ ค่าเลขต้องตรงกับที่ระบบจัดการสิทธิ์ (อีกโปรแกรม) กำหนด — ยืนยัน mapping ก่อนใช้ gate จริง
 */
export const MENU = {
    PJOB: 1,
    CJOB: 2,
    ATM: 3,
    RETURN_PRODUCT: 4,
} as const

export type MenuId = ( typeof MENU )[keyof typeof MENU]

/**
 * ชื่อเมนูตาม menu_id — การกำหนดสิทธิ์ทำจากโปรแกรมอื่น ฝั่งนี้ map เพื่อแสดงผลเท่านั้น
 * ปรับ/เพิ่มได้ที่นี่ที่เดียว ถ้า backend ส่ง menu_name มาจะใช้ menu_name ก่อน map นี้
 */
export const MENU_LABELS: Record<number, string> = {
    [MENU.PJOB]: "P JOB",
    [MENU.CJOB]: "C JOB",
    [MENU.ATM]: "ATM",
    [MENU.RETURN_PRODUCT]: "คืนสินค้า",
}

/** คืนชื่อเมนูสำหรับแสดงผล: menu_name (จาก backend) → MENU_LABELS → fallback "เมนู #id" */
export const getMenuLabel = ( permission: Permission ): string => {
    if ( permission.menu_name ) return permission.menu_name
    return MENU_LABELS[permission.menu_id] ?? `เมนู #${permission.menu_id}`
}

/**
 * admin เห็นทุกเมนู/ทำได้ทุกอย่าง — ข้ามการเช็คสิทธิ์ทั้งหมด
 * เช็คสิทธิ์ตาม permissions เฉพาะ role อื่น (เช่น user) เท่านั้น
 */
export const isAdminRole = ( role?: string ): boolean =>
    String( role ?? "" ).toLowerCase() === "admin"

/** อ่าน permissions ที่เก็บไว้ตอน login จาก storage (ไม่ throw — คืน [] ถ้า parse ไม่ได้) */
export const getStoredPermissions = (): Permission[] => {
    try {
        const raw = sessionStorageStore.getItem("permissions") ?? storage.getItem("permissions")
        const parsed = raw ? JSON.parse( raw ) : []
        return Array.isArray( parsed ) ? parsed : []
    } catch {
        return []
    }
}

/**
 * เช็คว่าผู้ใช้มีสิทธิ์ทำ action กับเมนูนั้นหรือไม่ (เตรียมไว้ใช้ gate ปุ่ม/หน้าในอนาคต)
 * @example if ( hasPermission(permissions, 1, "creates") ) { ...show create button... }
 */
export const hasPermission = ( permissions: Permission[], menuId: number, action: PermissionAction ): boolean => {
    const menu = permissions.find(( p ) => p.menu_id === menuId )
    return menu ? menu[action] === 1 : false
}
