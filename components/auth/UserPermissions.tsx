"use client"

import { ShieldCheck } from "lucide-react"

import { TablePermission } from "../table"

import { useAppStore } from "@/store/useAppStore"

export default function UserPermissions() {
    const permissions = useAppStore(( state ) => state.permissions)
    const displayName = useAppStore(( state ) => state.userDetail?.name ?? "-")

    return (
        <section className="space-y-3">
            <h1 className="flex items-center gap-2 text-lg font-medium">
                <ShieldCheck className="size-4 text-primary" /> สิทธิ์การใช้งาน
            </h1>
            <p className="text-xs text-muted-foreground">
                สิทธิ์การเข้าถึงของ <span className="font-medium text-foreground"> { displayName } </span>
                { " " }ในแต่ละเมนู กำหนดจากระบบจัดการผู้ใช้และ SSO หน้านี้แสดงผลอย่างเดียว
            </p>
            <TablePermission items={permissions} />
        </section>
    )
}
