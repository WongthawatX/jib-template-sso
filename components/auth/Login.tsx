"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { useRouter, useSearchParams } from "next/navigation"

import { LoaderCircle, ShieldCheck } from "lucide-react"

import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { beginSsoAuthorization, getSafeReturnTo } from "@/lib/sso"
import { useAppStore } from "@/store/useAppStore"
import { AUTH_MESSAGES } from "@/utils/messages"

export default function Login() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const hasStarted = useRef<boolean>(false)
    const [ errorMessage, setErrorMessage ] = useState<string>("")
    const [ isLoading, setIsLoading ] = useState<boolean>(false)
    const hasLogoutError = searchParams.get("logoutError") === "1"
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
            await beginSsoAuthorization(returnTo)
        } catch ( error ) {
            setErrorMessage(error instanceof Error ? error.message : AUTH_MESSAGES.SSO_CONNECT_FAILED)
            setIsLoading(false)
        }
    }, [ isLoggedOut, isPasswordChanged, returnTo, router ])

    useEffect(() => {
        if ( hasStarted.current || hasLogoutError || isPasswordChanged ) return
        hasStarted.current = true
        void handleStartSso()
    }, [ handleStartSso, hasLogoutError, isPasswordChanged ])

    return (
        <main className="flex min-h-svh items-center justify-center bg-linear-to-br from-background via-accent/50 to-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="items-center text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        { isLoading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" /> }
                    </div>
                    <CardTitle>
                        { errorMessage
                            ? AUTH_MESSAGES.LOGIN_FAILED_TITLE
                            : isPasswordChanged
                                ? AUTH_MESSAGES.PASSWORD_CHANGED_TITLE
                                : hasLogoutError ? AUTH_MESSAGES.LOGOUT_DONE_TITLE : AUTH_MESSAGES.LOGIN_REDIRECT_TITLE }
                    </CardTitle>
                    <CardDescription aria-live="polite">
                        { errorMessage || ( hasLogoutError
                            ? AUTH_MESSAGES.LOGOUT_SSO_FAILED
                            : isPasswordChanged ? AUTH_MESSAGES.PASSWORD_CHANGED_HINT : AUTH_MESSAGES.LOGIN_HINT ) }
                    </CardDescription>
                </CardHeader>
                { (errorMessage || hasLogoutError || isPasswordChanged) && (
                    <CardContent>
                        <Button className="w-full" disabled={isLoading} onClick={() => void handleStartSso()}>
                            เข้าสู่ระบบด้วย JIB SSO
                        </Button>
                    </CardContent>
                ) }
            </Card>
        </main>
    )
}
