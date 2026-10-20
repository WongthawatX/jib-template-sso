import { TableDemo } from "@/components/table"

export default function TableDemoPage() {
    return (
        <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold"> ทดลอง Table </h1>
                <p className="text-sm text-muted-foreground">
                    ข้อมูลสมมติ 120 รายการ · ลองเรียงข้อมูล กรองสถานะ เลือกแถว และขยายรายละเอียด
                </p>
                <p className="text-sm text-muted-foreground">
                    ลากหัวคอลัมน์เพื่อสลับตำแหน่ง หรือกด “ปรับแต่งคอลัมน์” ด้านล่างเพื่อซ่อน ตรึง และปรับรูปแบบตาราง
                </p>
            </div>
            <TableDemo />
        </div>
    )
}
