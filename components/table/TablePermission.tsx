"use client"

import { Check, X } from "lucide-react"

import TableTemplate from "./TableTemplate"

import { navSections } from "@/utils/links"
import { buildPermissionRows, PERMISSION_ACTIONS } from "@/utils/permissions"

import type { TableColumnsType } from "antd"
import type { Permission, PermissionRow } from "@/utils/permissions"

type Props = { items: Permission[] }

const NAV_LABELS = Object.fromEntries(
    navSections.flatMap(( section ) => section.groups.flatMap(( group ) => group.links.flatMap(( link ) => {
        const resource = link.resource?.toLowerCase()
        const routeSegment = link.url.split("/").filter(Boolean).at(-1)?.toLowerCase()
        return [
            ...(resource ? [[ resource, link.title ]] : []),
            ...(routeSegment ? [[ routeSegment, link.title ]] : []),
        ]
    }))),
)

export default function TablePermission({ items }: Props) {
    const columns: TableColumnsType<PermissionRow> = [
        { key: "label", title: "เมนู", dataIndex: "label", width: 220 },
        ...PERMISSION_ACTIONS.map(( action ): TableColumnsType<PermissionRow>[number] => ({
            key: action.key,
            title: action.label,
            dataIndex: action.key,
            align: "center",
            width: 80,
            render: ( granted: boolean ) => granted
                ? <Check aria-label="มีสิทธิ์" className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                : <X aria-label="ไม่มีสิทธิ์" className="mx-auto size-4 text-muted-foreground/40" />,
        })),
    ]

    return (
        <TableTemplate
            storageKey="permissions"
            rowKey="resource"
            columns={columns}
            dataSource={buildPermissionRows(items, NAV_LABELS)}
            scroll={{ x: "max-content" }}
            size="small"
            bordered
        />
    )
}
