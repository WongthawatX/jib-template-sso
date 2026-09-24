"use client"

import { useMemo } from "react"
import { useAppStore } from "@/store/useAppStore"
import { navSections } from "@/utils/links"
import { hasPermission, isAdminRole } from "@/utils/permissions"

import type { NavSection } from "@/utils/links"

/**
 * กรอง navSections ตามสิทธิ์ views ของผู้ใช้
 * - admin → เห็นทุกเมนู (ไม่กรอง)
 * - ลิงก์ที่มี menuId → แสดงเมื่อมีสิทธิ์ views เท่านั้น
 * - ลิงก์ที่ไม่มี menuId (Dashboard, รายงาน, ตั้งค่า ฯลฯ) → แสดงเสมอ
 * - group/section ที่ไม่เหลือลิงก์เลย จะถูกซ่อน
 */
export function useVisibleNavSections(): NavSection[] {
    const permissions = useAppStore(( state ) => state.permissions )
    const role = useAppStore(( state ) => state.userDetail?.role )
    const admin = isAdminRole( role )

    return useMemo(() => {
        if ( admin ) return navSections

        return navSections
            .map(( section ) => ({
                ...section,
                groups: section.groups
                    .map(( group ) => ({
                        ...group,
                        links: group.links.filter(( link ) =>
                            link.menuId === undefined || hasPermission( permissions, link.menuId, "views" )
                        ),
                    }))
                    .filter(( group ) => group.links.length > 0 ),
            }))
            .filter(( section ) => section.groups.length > 0 )
    }, [ permissions, admin ])
}

