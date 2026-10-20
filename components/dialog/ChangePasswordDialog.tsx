"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EyeIcon, EyeOffIcon, KeyRoundIcon, LoaderCircleIcon } from "lucide-react"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"

import { changeOwnSsoPassword, logoutSso } from "@/services/apiSSOService"
import { useAppStore } from "@/store/useAppStore"
import { AUTH_MESSAGES } from "@/utils/messages"

import type { FormEvent } from "react"

type Props = {
    open: boolean;
    onOpenChange: ( open: boolean ) => void;
}

export default function ChangePasswordDialog({ open, onOpenChange }: Props) {
    const router = useRouter()
    const accessToken = useAppStore(( state ) => state.accessToken)
    const logout = useAppStore(( state ) => state.logout)
    const [ currentPassword, setCurrentPassword ] = useState<string>("")
    const [ newPassword, setNewPassword ] = useState<string>("")
    const [ confirmPassword, setConfirmPassword ] = useState<string>("")
    const [ showPassword, setShowPassword ] = useState<boolean>(false)
    const [ errorMessage, setErrorMessage ] = useState<string>("")
    const [ isConfirmationInvalid, setIsConfirmationInvalid ] = useState<boolean>(false)
    const [ isLoading, setIsLoading ] = useState<boolean>(false)

    const resetForm = () => {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setShowPassword(false)
        setErrorMessage("")
        setIsConfirmationInvalid(false)
    }

    const handleOpenChange = ( isOpen: boolean ) => {
        if ( !isOpen ) resetForm()
        onOpenChange(isOpen)
    }

    const handleSubmit = async ( event: FormEvent<HTMLFormElement> ) => {
        event.preventDefault()
        setErrorMessage("")
        setIsConfirmationInvalid(false)

        if ( !accessToken ) {
            setErrorMessage(AUTH_MESSAGES.SESSION_EXPIRED)
            return
        }
        if ( newPassword !== confirmPassword ) {
            setIsConfirmationInvalid(true)
            setErrorMessage("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน")
            return
        }
        if ( currentPassword === newPassword ) {
            setErrorMessage("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน")
            return
        }

        try {
            setIsLoading(true)
            await changeOwnSsoPassword(accessToken, { currentPassword, newPassword })
            let hasLogoutError = false
            try {
                await logoutSso(accessToken)
            } catch {
                hasLogoutError = true
            }
            handleOpenChange(false)
            logout()
            router.replace(`/login?passwordChanged=1${hasLogoutError ? "&logoutError=1" : ""}`)
        } catch ( error ) {
            setErrorMessage(error instanceof Error ? error.message : AUTH_MESSAGES.PASSWORD_CHANGE_FAILED)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <KeyRoundIcon aria-hidden="true" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
                                <DialogDescription>เปลี่ยนแล้วต้องเข้าสู่ระบบใหม่อีกครั้ง</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="current-password">รหัสผ่านปัจจุบัน</FieldLabel>
                            <Input
                                id="current-password"
                                type={showPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={( event ) => setCurrentPassword(event.target.value)}
                                autoComplete="current-password"
                                placeholder="ระบุรหัสผ่านปัจจุบัน"
                                disabled={isLoading}
                                required
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="new-password">รหัสผ่านใหม่</FieldLabel>
                            <Input
                                id="new-password"
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={( event ) => setNewPassword(event.target.value)}
                                autoComplete="new-password"
                                placeholder="ระบุรหัสผ่านใหม่"
                                disabled={isLoading}
                                required
                            />
                        </Field>
                        <Field data-invalid={isConfirmationInvalid}>
                            <FieldLabel htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</FieldLabel>
                            <Input
                                id="confirm-password"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={( event ) => setConfirmPassword(event.target.value)}
                                autoComplete="new-password"
                                placeholder="ระบุรหัสผ่านใหม่อีกครั้ง"
                                aria-invalid={isConfirmationInvalid}
                                disabled={isLoading}
                                required
                            />
                        </Field>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="self-start"
                            aria-pressed={showPassword}
                            onClick={() => setShowPassword(( isVisible ) => !isVisible)}
                            disabled={isLoading}
                        >
                            { showPassword
                                ? <EyeOffIcon data-icon="inline-start" aria-hidden="true" />
                                : <EyeIcon data-icon="inline-start" aria-hidden="true" /> }
                            { showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน" }
                        </Button>
                        { errorMessage ? (
                            <Field data-invalid>
                                <FieldError>{ errorMessage }</FieldError>
                            </Field>
                        ) : null }
                    </FieldGroup>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                            ปิด
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            { isLoading ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" aria-hidden="true" /> : null }
                            บันทึก
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
