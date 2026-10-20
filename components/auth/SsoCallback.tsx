"use client"

import { useEffect, useRef, useState } from "react"

import { useRouter, useSearchParams } from "next/navigation"

import { LoaderCircle, RotateCcw, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { clearSsoAuthorization, readSsoCallback } from "@/lib/sso"
import { exchangeSsoAuthorizationCode, getSsoUserInfo } from "@/services/apiSSOService"
import { useAppStore } from "@/store/useAppStore"
import { AUTH_MESSAGES } from "@/utils/messages"

type CallbackStatus = "loading" | "error"

export default function SsoCallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const setSsoSession = useAppStore(( state ) => state.setSsoSession)
    const hasStarted = useRef<boolean>(false)
    const [ status, setStatus ] = useState<CallbackStatus>("loading")
    const [ errorMessage, setErrorMessage ] = useState<string>("")

    useEffect(() => {
        if ( hasStarted.current ) return
        hasStarted.current = true

        const handleCallback = async () => {
            try {
                const { authorization, code } = readSsoCallback(searchParams)
                window.history.replaceState(window.history.state, "", window.location.pathname)
                const token = await exchangeSsoAuthorizationCode(
                    code,
                    authorization.codeVerifier,
                    authorization.redirectUri,
                )
                const userInfo = await getSsoUserInfo(token.access_token)

                setSsoSession(token.access_token, userInfo, token.refresh_token, token.expires_in)
                clearSsoAuthorization()

                router.replace(authorization.returnTo)
            } catch ( error ) {
                clearSsoAuthorization()
                setErrorMessage(error instanceof Error ? error.message : AUTH_MESSAGES.SSO_LOGIN_FAILED)
                setStatus("error")
            }
        }

        void handleCallback()
    }, [ router, searchParams, setSsoSession ])

    const handleRetry = () => {
        clearSsoAuthorization()
        router.replace("/login")
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        { status === "loading"
                            ? <LoaderCircle className="animate-spin" aria-hidden="true" />
                            : <ShieldCheck aria-hidden="true" /> }
                    </div>
                    <CardTitle>
                        { status === "loading" ? AUTH_MESSAGES.CALLBACK_CHECKING_TITLE : AUTH_MESSAGES.LOGIN_FAILED_TITLE }
                    </CardTitle>
                    <CardDescription aria-live="polite">
                        { status === "loading"
                            ? AUTH_MESSAGES.CALLBACK_CHECKING_HINT
                            : errorMessage }
                    </CardDescription>
                </CardHeader>
                { status === "error" ? (
                    <CardContent>
                        <Button className="w-full" type="button" onClick={handleRetry}>
                            <RotateCcw data-icon="inline-start" />
                            กลับไปหน้าเข้าสู่ระบบ
                        </Button>
                    </CardContent>
                ) : null }
            </Card>
        </main>
    )
}

