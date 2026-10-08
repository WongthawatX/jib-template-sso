"use client"

import { DraggableColumnsTable } from "./index"

import { useTableScrollHeight } from "@/hooks/useTableScrollHeight"
import { cn } from "@/lib/utils"

import type { TableColumnsType, TablePaginationConfig, TableProps } from "antd"

/**
 * ตารางตั้งต้นของโปรเจกต์ — ใช้ตัวนี้เป็นฐานเวลาสร้างตารางใหม่ ไม่ต้องไปตั้งค่าซ้ำทุกที่
 *
 * รวมของที่ทุกตารางต้องใช้ไว้แล้ว:
 * - ลากสลับตำแหน่งคอลัมน์ได้ + จำลำดับลง localStorage (ส่ง `storageKey` มา)
 * - ความสูงปรับอัตโนมัติให้เต็มพื้นที่ที่เหลือ แถวที่เกิน scroll ในตัวตารางเอง
 *   header/pagination อยู่ติดที่ หน้าไม่เลื่อนทั้งหน้า
 * - ค่าเริ่มต้นของโปรเจกต์: size small, bordered, scroll แนวนอนแบบ max-content,
 *   pagination มุมขวาล่าง + ตัวเลือกจำนวนแถว + ข้อความรวมจำนวนรายการ
 *
 * ทุกค่าที่ตั้งไว้ override ได้ด้วย props ของ antd ตามปกติ (merge ให้ ไม่ทับทิ้ง)
 *
 * ตัวอย่าง:
 * ```tsx
 * <TableTemplate<Customer>
 *     columns={columns}
 *     dataSource={items}
 *     rowKey="id"
 *     loading={isLoading}
 *     storageKey="customers"
 * />
 * ```
 */

const DEFAULT_PAGINATION: TablePaginationConfig = {
    defaultPageSize: 20,
    pageSizeOptions: [ 20, 50, 100 ],
    placement: [ "none", "bottomEnd" ],
    showTotal: ( total ) => `ทั้งหมด ${total} รายการ`,
    // showSizeChanger รับ SelectProps ได้ — ปิด showSearch ไม่ให้มีไอคอนแว่นขยายโผล่ในช่องเลือกจำนวนแถว
    // (มีแค่ 3 ตัวเลือก ไม่ต้องค้นหา)
    showSizeChanger: { showSearch: false },
    // antd ไม่ได้ตั้ง locale ไทยไว้ (โปรเจกต์ไม่มี ConfigProvider) ดีฟอลต์จึงเป็น "/ page"
    locale: { items_per_page: "/ หน้า" },
}

type Props<T> = Omit<TableProps<T>, "columns"> & {
    columns: TableColumnsType<T>;
    /** key สำหรับจำลำดับคอลัมน์ลง localStorage — ไม่ส่งมาก็ลากได้ แต่ไม่จำข้ามรอบ */
    storageKey?: string;
    /** ปิดการปรับความสูงอัตโนมัติ เช่นตารางเล็กที่ไม่ต้องเต็มจอ (default: true) */
    autoHeight?: boolean;
    /** class ของ div ที่ครอบตาราง (ตัวที่ใช้วัดความสูง) */
    className?: string;
}

export default function TableTemplate<T extends object>({ columns, storageKey, autoHeight = true, className, scroll, pagination, size = "small", bordered = true, ...tableProps }: Props<T>) {
    const { wrapperRef, scrollY } = useTableScrollHeight<HTMLDivElement>({ disabled: !autoHeight })

    // ถ้า caller กำหนด scroll.y มาเองถือว่าคุมความสูงเอง ไม่เอาค่าที่วัดได้ไปทับ
    const mergedScroll = { x: "max-content", ...scroll, y: scroll?.y ?? scrollY }

    // pagination === false คือสั่งปิด ต้องปล่อยผ่าน ไม่ใช่เอา default ไปใส่ทับ
    const mergedPagination = pagination === false ? false as const : { ...DEFAULT_PAGINATION, ...pagination }

    return (
        <div ref={wrapperRef} className={cn("min-w-0", className)}>
            <DraggableColumnsTable<T>
                columns={columns}
                storageKey={storageKey}
                size={size}
                bordered={bordered}
                scroll={mergedScroll}
                pagination={mergedPagination}
                {...tableProps}
            />
        </div>
    )
}
