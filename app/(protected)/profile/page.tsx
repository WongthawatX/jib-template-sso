import { UserProfile } from "@/components/auth"

import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "ข้อมูลผู้ใช้",
}

export default function ProfilePage() {
    return (
        <div className="flex flex-col gap-6">
            <UserProfile />
        </div>
    )
}
