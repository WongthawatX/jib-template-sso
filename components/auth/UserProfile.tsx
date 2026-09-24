"use client"

import { useAppStore } from "@/store/useAppStore"

export default function UserProfile() {
    const user = useAppStore(( state ) => state.userDetail)
    const fields = [
        [ "ชื่อ", user?.name ],
        [ "รหัสพนักงาน", user?.employee_id ?? user?.preferred_username ?? user?.sub ],
        [ "อีเมล", user?.email ],
        [ "แผนก", user?.department ],
        [ "สาขา", user?.branch ],
        [ "บทบาท", user?.system_role ?? user?.roles?.[0] ],
    ]

    return (
        <section className="flex flex-col gap-6 py-4">
            <h1 className="text-lg font-medium"> ข้อมูลผู้ใช้ </h1>
            <dl className="grid gap-4 sm:grid-cols-2">
                { fields.map(([ label, value ]) => (
                    <div key={label} className="flex flex-col gap-1">
                        <dt className="text-sm text-muted-foreground">{ label }</dt>
                        <dd>{ value || "-" }</dd>
                    </div>
                )) }
            </dl>
        </section>
    )
}
