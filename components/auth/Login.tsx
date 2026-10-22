"use client"

import { useCallback, useState } from "react"

import { useRouter, useSearchParams } from "next/navigation"

import { LoaderCircle, RotateCcw, ShieldCheck } from "lucide-react"

import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { beginSsoAuthorization, getSafeReturnTo } from "@/lib/sso"
import { useAppStore } from "@/store/useAppStore"
import { AUTH_MESSAGES } from "@/utils/messages"
import { LoginBackground } from "@/components/background"

export default function Login() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [ errorMessage, setErrorMessage ] = useState<string>("")
    const [ isLoading, setIsLoading ] = useState<boolean>(false)
    const isLoggedOut = searchParams.get("loggedOut") === "1" || searchParams.get("logged_out") === "1"
    const isPasswordChanged = searchParams.get("passwordChanged") === "1"
    const returnTo = getSafeReturnTo(searchParams.get("returnTo") ?? "/dashboard")

    const handleStartSso = useCallback(async () => {
        setIsLoading(true)
        setErrorMessage("")
        try {
            if ( !isLoggedOut && !isPasswordChanged ) {
                await useAppStore.getState().initializeSession()
                if ( useAppStore.getState().accessToken ) {
                    router.replace(returnTo)
                    return
                }
            }
            // ออกจากระบบ/เปลี่ยนรหัสผ่านแล้วต้องเห็นหน้า login ของ SSO จริง ไม่ใช่ถูก session เดิมพาเข้าระบบเงียบ ๆ
            await beginSsoAuthorization(returnTo, isLoggedOut || isPasswordChanged)
        } catch ( error ) {
            setErrorMessage(error instanceof Error ? error.message : AUTH_MESSAGES.SSO_CONNECT_FAILED)
            setIsLoading(false)
        }
    }, [ isLoggedOut, isPasswordChanged, returnTo, router ])

    const handleRetry = () => {
        void handleStartSso()
    }


    return (
        <main className="fixed inset-0 flex items-center justify-center overflow-hidden bg-background p-4 sm:p-6">
            <LoginBackground />

            <div className="relative z-10 mx-auto flex w-full max-w-5xl justify-center">
                <Card className="w-full max-w-96 justify-self-center border-border/80 py-8 shadow-xl shadow-primary/10 motion-safe:animate-login-enter motion-reduce:animate-none min-h-128 justify-center">
                    <CardHeader className="mx-auto w-full max-w-70 text-center">
                        <CardTitle className="text-2xl font-bold"> { isLoggedOut ? "ออกจากระบบแล้ว" : "ยินดีต้อนรับ" } </CardTitle>
                        <CardDescription> { isLoggedOut ? "กดปุ่มด้านล่างเพื่อเข้าสู่ระบบอีกครั้ง" : "เข้าสู่ระบบเพื่อใช้งาน JIB PROCON" } </CardDescription>
                    </CardHeader>
                    <CardContent className="mx-auto flex w-full flex-col gap-5 mt-12">
                        <Button
                            className="group relative w-full overflow-hidden font-semibold shadow-lg shadow-primary/30 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 focus-visible:ring-4 focus-visible:ring-primary/20 motion-reduce:transition-none"
                            size={"default"}
                            disabled={isLoading}
                            onClick={handleRetry}
                        >
                            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[-70%] w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-[340%] motion-reduce:transition-none" />
                            <span className="relative flex items-center justify-center gap-2">
                                { isLoading ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : errorMessage ? <RotateCcw className="size-5" aria-hidden="true" /> : <ShieldCheck className="size-5" aria-hidden="true" /> }
                                { isLoading ? "กำลังเชื่อมต่อ JIB SSO..." : errorMessage ? "ลองเชื่อมต่ออีกครั้ง" : "เข้าสู่ระบบด้วย JIB SSO" }
                            </span>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
