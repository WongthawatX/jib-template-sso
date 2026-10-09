"use client"

import { Check, X } from "lucide-react"

import TableTemplate from "./TableTemplate"

import { buildPermissionRows, PERMISSION_ACTIONS } from "@/utils/permissions"

import type { TableColumnsType } from "antd"
import type { Permission, PermissionRow } from "@/utils/permissions"

type Props = { items: Permission[] }

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
            dataSource={buildPermissionRows(items)}
            scroll={{ x: "max-content" }}
            size="small"
            bordered
        />
    )
}
