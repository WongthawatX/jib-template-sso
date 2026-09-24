import { Suspense } from "react"

import { SsoCallback } from "@/components/auth"

export default function CallbackPage() {
    return <Suspense> <SsoCallback /> </Suspense>
}
