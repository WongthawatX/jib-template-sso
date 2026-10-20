"use client"

import { Badge } from "../ui/badge"
import ClampedCell from "./ClampedCell"
import TableTemplate from "./TableTemplate"

import type { TableColumnsType } from "antd"

type DemoJob = {
    id: string;
    customer: string;
    branch: string;
    product: string;
    description: string;
    address: string;
    date: string;
    technician: string;
    status: "รอดำเนินการ" | "กำลังดำเนินการ" | "เสร็จแล้ว";
    amount: number;
}

const STATUSES: DemoJob["status"][] = [ "รอดำเนินการ", "กำลังดำเนินการ", "เสร็จแล้ว" ]
const PRODUCTS = [ "Notebook", "Desktop PC", "Monitor", "Printer", "Network Router" ]

const MOCK_JOBS: DemoJob[] = Array.from({ length: 120 }, ( _, index ) => ({
    id: `DEMO-${String(index + 1).padStart(4, "0")}`,
    customer: `ลูกค้าสมมติ ${index + 1}`,
    branch: [ "สาขาตัวอย่าง กรุงเทพฯ", "สาขาตัวอย่าง นนทบุรี", "สาขาตัวอย่าง ปทุมธานี" ][index % 3],
    product: PRODUCTS[index % PRODUCTS.length],
    description: index % 2 === 0
        ? "ตรวจสอบอุปกรณ์และติดตั้งระบบ พร้อมทดสอบการเชื่อมต่อเครือข่ายและสรุปผลให้ลูกค้า ข้อความยาวสำหรับทดลอง Tooltip"
        : "ตรวจเช็กและบำรุงรักษาอุปกรณ์",
    address: `ที่อยู่สมมติ ${index + 1} ถนนตัวอย่าง แขวงทดสอบ เขตสาธิต กรุงเทพฯ 00000`,
    date: `2026-10-${String(index % 28 + 1).padStart(2, "0")}`,
    technician: `ช่างทดสอบ ${index % 5 + 1}`,
    status: STATUSES[index % STATUSES.length],
    amount: 500 + index % 10 * 250,
}))

const COLUMNS: TableColumnsType<DemoJob> = [
    { key: "id", dataIndex: "id", title: "เลขที่งาน", width: 130, fixed: "left" },
    {
        key: "customer", dataIndex: "customer", title: "ลูกค้า", width: 180,
        sorter: ( a, b ) => a.customer.localeCompare(b.customer, "th", { numeric: true }),
    },
    { key: "branch", dataIndex: "branch", title: "สาขา", width: 190 },
    { key: "product", dataIndex: "product", title: "สินค้า", width: 150 },
    {
        key: "description", dataIndex: "description", title: "รายละเอียดงาน", width: 250,
        render: ( text: string ) => <ClampedCell text={text} lines={2} />,
    },
    {
        key: "address", dataIndex: "address", title: "ที่อยู่", width: 230,
        render: ( text: string ) => <ClampedCell text={text} />,
    },
    { key: "date", dataIndex: "date", title: "วันที่นัด", width: 120, sorter: ( a, b ) => a.date.localeCompare(b.date) },
    { key: "technician", dataIndex: "technician", title: "ผู้ปฏิบัติงาน", width: 140 },
    {
        key: "status", dataIndex: "status", title: "สถานะ", width: 170,
        filters: STATUSES.map(( status ) => ({ text: status, value: status })),
        onFilter: ( value, row ) => row.status === value,
        render: ( status: DemoJob["status"] ) => (
            <Badge variant={status === "เสร็จแล้ว" ? "default" : status === "กำลังดำเนินการ" ? "secondary" : "outline"}>
                { status }
            </Badge>
        ),
    },
    {
        key: "amount", dataIndex: "amount", title: "ค่าใช้จ่าย (บาท)", width: 150, align: "right",
        sorter: ( a, b ) => a.amount - b.amount,
        render: ( amount: number ) => amount.toLocaleString("th-TH", { minimumFractionDigits: 2 }),
    },
]

export default function TableDemo() {
    return (
        <TableTemplate<DemoJob>
            columns={COLUMNS}
            dataSource={MOCK_JOBS}
            rowKey="id"
            storageKey="table_demo"
            rowSelection={{ fixed: true }}
            expandable={{
                expandedRowRender: ( row ) => (
                    <div className="flex flex-col gap-1 py-2 text-sm">
                        <p> { row.description } </p>
                        <p className="text-muted-foreground"> { row.address } </p>
                    </div>
                ),
            }}
        />
    )
}
