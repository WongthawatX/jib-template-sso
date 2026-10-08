import { UserProfile } from "@/components/auth"
import LegacyOnsiteConnection from "@/components/auth/LegacyOnsiteConnection"
import { USE_LEGACY_ONSITE_API } from "@/config/env"

import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "ข้อมูลผู้ใช้",
}

export default function ProfilePage() {
    return (
        <div className="flex flex-col gap-6">
            <UserProfile />
            { USE_LEGACY_ONSITE_API && <LegacyOnsiteConnection /> }
        </div>
    )
}
