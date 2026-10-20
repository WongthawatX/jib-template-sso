import { navSections } from "@/utils/links"
import { hasPermission } from "@/utils/permissions"

import type { NavSection } from "@/utils/links"
import type { Permission, PermissionAction } from "@/utils/permissions"

/** ใช้กติกาเดียวกันใน Sidebar ทั้ง desktop และ mobile */
export const filterNavSections = ( sections: NavSection[], permissions: Permission[] ): NavSection[] =>
    sections.map(( section ) => ({
        ...section,
        groups: section.groups.map(( group ) => ({
            ...group,
            links: group.links.filter(( link ) =>
                link.resource === undefined || hasPermission( permissions, link.resource, "view" ),
            ),
        })).filter(( group ) => group.links.length > 0),
    })).filter(( section ) => section.groups.length > 0)

/** เลือกเมนูที่ตรงที่สุด เพื่อไม่ให้ /users กลบสิทธิ์ของ /users/permissions */
export const getRoutePermission = ( pathname: string ): { resource: string; action: PermissionAction } | undefined => {
    const link = navSections.flatMap(( section ) => section.groups.flatMap(( group ) => group.links))
        .filter(( item ) => pathname === item.url || pathname.startsWith(item.url + "/"))
        .sort(( a, b ) => b.url.length - a.url.length)[0]
    if ( !link?.resource ) return undefined

    const segments = pathname.slice(link.url.length).split("/").filter(Boolean)
    const action = segments.includes("create") ? "create" : segments.includes("edit") ? "edit" : "view"
    return { resource: link.resource, action }
}
