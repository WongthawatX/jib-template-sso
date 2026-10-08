"use client"

import { useEffect, useState } from "react"

import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"

import { useAppStore } from "@/store/useAppStore"
import { useLegacyOnsiteStore } from "@/store/useLegacyOnsiteStore"

import type { FormEvent } from "react"

export default function LegacyOnsiteConnection() {
    const [ token, setToken ] = useState<string>("")
    const [ errorMessage, setErrorMessage ] = useState<string>("")
    const isConnected = useLegacyOnsiteStore(( state ) => state.isConnected)
    const initializeSession = useLegacyOnsiteStore(( state ) => state.initializeSession)
    const ownerSub = useAppStore(( state ) => state.userDetail?.sub)

    useEffect(() => { initializeSession() }, [ initializeSession, ownerSub ])

    const handleSubmit = ( event: FormEvent<HTMLFormElement> ) => {
        event.preventDefault()
        setErrorMessage("")
        try {
            useLegacyOnsiteStore.getState().connect(token)
            setToken("")
        } catch ( error ) {
            setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถเก็บ token ได้")
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle> API เดิมสำหรับพัฒนา UI </CardTitle>
                <CardDescription>
                    Login ระบบ Onsite เดิม แล้วคัดลอก accessToken มาใส่ที่นี่ ใช้ชั่วคราวเฉพาะโหมดพัฒนา
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form id="legacy-onsite-connection" onSubmit={handleSubmit}>
                    <FieldGroup>
                        <Field data-invalid={Boolean(errorMessage)}>
                            <FieldLabel htmlFor="legacy-onsite-token"> Token ระบบเดิม </FieldLabel>
                            <Input
                                id="legacy-onsite-token"
                                type="password"
                                autoComplete="off"
                                spellCheck={false}
                                value={token}
                                onChange={( event ) => setToken(event.target.value)}
                                placeholder="accessToken หรือ Bearer token"
                                aria-invalid={Boolean(errorMessage)}
                                aria-describedby={errorMessage ? "legacy-onsite-error" : undefined}
                                required
                            />
                            { errorMessage && <FieldError id="legacy-onsite-error"> { errorMessage } </FieldError> }
                        </Field>
                    </FieldGroup>
                </form>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-3">
                <Button type="submit" form="legacy-onsite-connection"> ใช้ token นี้ </Button>
                { isConnected && (
                    <Button variant="outline" onClick={() => useLegacyOnsiteStore.getState().disconnect()}> ล้าง token เดิม </Button>
                ) }
                <p className="text-sm text-muted-foreground" role="status">
                    { isConnected ? "เก็บ token แล้ว พร้อมแนบในการเรียก API เดิม" : "ยังไม่มี token ระบบเดิม" }
                </p>
            </CardFooter>
        </Card>
    )
}
