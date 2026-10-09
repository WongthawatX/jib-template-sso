"use client"

import { useMemo } from "react"
import { useAppStore } from "@/store/useAppStore"
import { hasPermission } from "@/utils/permissions"

/**
 * สิทธิ์ของ resource หนึ่งในรูปแบบ boolean พร้อมใช้ใน component
 * (การกำหนดสิทธิ์ทำจากระบบจัดการผู้ใช้ ฝั่งนี้อ่านเพื่อ gate ปุ่ม/หน้า)
 * ผู้ใช้ที่มีสิทธิ์ "*" ได้ทุก action เสมอ (จัดการใน hasPermission)
 *
 * @example
 * const { canCreate, canEdit } = usePermission(RESOURCE.PJOB)
 * <Button disabled={!canCreate}>เพิ่ม</Button>
 */
export function usePermission( resource: string ) {
    const permissions = useAppStore(( state ) => state.permissions )

    return useMemo(() => ({
        canView:    hasPermission( permissions, resource, "view" ),
        canCreate:  hasPermission( permissions, resource, "create" ),
        canEdit:    hasPermission( permissions, resource, "edit" ),
        canApprove: hasPermission( permissions, resource, "approve" ),
        canPrint:   hasPermission( permissions, resource, "print" ),
        canCancel:  hasPermission( permissions, resource, "cancel" ),
    }), [ permissions, resource ])
}
