"use client"

import { useEffect, useMemo, useState } from "react"
import { Timer } from "lucide-react"
import { jwtDecode } from "jwt-decode"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/useAppStore"
import { AUTH_MESSAGES } from "@/utils/messages"

type TokenPayload = {
    exp?: number;
    iat?: number;
}

type TokenTiming = {
    expirationTime: number | null;
    issuedAtTime: number | null;
}

const getTokenTiming = ( token: string ): TokenTiming => {
    if ( !token ) return { expirationTime: null, issuedAtTime: null }

    try {
        const { exp, iat } = jwtDecode<TokenPayload>( token )
        return {
            expirationTime: typeof exp === "number" ? exp * 1000 : null,
            issuedAtTime: typeof iat === "number" ? iat * 1000 : null,
        }
    } catch {
        return { expirationTime: null, issuedAtTime: null }
    }
}

const getRemainingSeconds = ( expirationTime: number | null, now: number ): number | null => {
    if ( expirationTime === null ) return null
    return Math.max( 0, Math.ceil(( expirationTime - now ) / 1000) )
}

const getSessionProgress = ( issuedAtTime: number | null, expirationTime: number | null, now: number ): number => {
    if ( issuedAtTime === null || expirationTime === null ) return 0

    const sessionDuration = expirationTime - issuedAtTime
    if ( sessionDuration <= 0 ) return 0

    const remainingDuration = expirationTime - now
    return Math.min( 100, Math.max( 0, ( remainingDuration / sessionDuration ) * 100) )
}

const formatDuration = ( seconds: number | null ): string => {
    if ( seconds === null ) return "--:--"

    const hours = Math.floor( seconds / 3600 )
    const minutes = Math.floor(( seconds % 3600 ) / 60)
    const remainingSeconds = seconds % 60
    const paddedMinutes = String( minutes ).padStart( 2, "0" )
    const paddedSeconds = String( remainingSeconds ).padStart( 2, "0" )

    return hours > 0 ? `${hours}:${paddedMinutes}:${paddedSeconds}` : `${paddedMinutes}:${paddedSeconds}`
}

const formatExpirationTime = ( expirationTime: number | null ): string => {
    if ( expirationTime === null ) return AUTH_MESSAGES.TOKEN_EXPIRATION_MISSING

    return new Date( expirationTime ).toLocaleString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })
}

export default function NavbarSessionTimer() {
    const accessToken = useAppStore(( state ) => state.accessToken)
    const sessionExpiresAt = useAppStore(( state ) => state.expiresAt)
    const tokenTiming = useMemo(() => getTokenTiming(accessToken), [ accessToken ])
    const expirationTime = sessionExpiresAt ?? tokenTiming.expirationTime
    const issuedAtTime = tokenTiming.issuedAtTime
    const [ now, setNow ] = useState<number>(() => Date.now())

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 1000)

        return () => window.clearInterval( timer )
    }, [])

    const remainingSeconds = getRemainingSeconds( expirationTime, now )
    const sessionProgress = getSessionProgress( issuedAtTime, expirationTime, now )
    const hasExpiration = expirationTime !== null
    const isExpired = remainingSeconds === 0
    const isExpiringSoon = remainingSeconds !== null && remainingSeconds > 0 && remainingSeconds <= 300
    const tooltipLabel = !hasExpiration
        ? AUTH_MESSAGES.TOKEN_EXPIRATION_MISSING
        : isExpired
            ? AUTH_MESSAGES.SESSION_EXPIRED_SHORT
            : `Session เหลือ ${formatDuration( remainingSeconds )} · หมดอายุ ${formatExpirationTime( expirationTime )}`

    return (
        <Tooltip>
            <TooltipTrigger>
                <div
                    className={cn(
                        "relative flex size-8 shrink-0 cursor-default items-center justify-center overflow-hidden rounded-full bg-muted/70 text-muted-foreground",
                        ( isExpiringSoon || isExpired ) && "text-destructive ring-1 ring-destructive/30",
                    )}
                    role="timer"
                    aria-label={tooltipLabel}
                >
                    <div
                        className={cn(
                            "pointer-events-none absolute inset-x-0 bottom-0 transition-[height] duration-1000 ease-linear",
                            isExpiringSoon || isExpired ? "bg-destructive/15" : "bg-primary/15",
                        )}
                        style={{ height: `${sessionProgress}%` }}
                        aria-hidden="true"
                    >
                        <div
                            className={cn(
                                "absolute inset-x-0 top-0 h-1 border-t bg-linear-to-b to-transparent",
                                isExpiringSoon || isExpired
                                    ? "border-destructive/30 from-destructive/20"
                                    : "border-primary/30 from-primary/20",
                            )}
                        />
                    </div>

                    <Timer className="relative size-4" aria-hidden="true" />
                </div>
            </TooltipTrigger>
            <TooltipContent
                side="bottom"
                align="end"
                sideOffset={12}
                className={hasExpiration && !isExpired ? "w-72 max-w-[calc(100vw-2rem)] whitespace-normal" : undefined}
            >
                { hasExpiration && !isExpired ? (
                    <span className="flex flex-col gap-0.5 py-0.5">
                        <span className="font-semibold">เหลือเวลาใช้งาน { formatDuration( remainingSeconds ) }</span>
                        <span className="text-background/75">หมดอายุ { formatExpirationTime( expirationTime ) }</span>
                    </span>
                ) : tooltipLabel }
            </TooltipContent>
        </Tooltip>
    )
}

