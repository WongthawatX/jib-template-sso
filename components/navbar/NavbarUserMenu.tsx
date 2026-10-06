"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRoundIcon, LogOutIcon, User, UserIcon } from "lucide-react"
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { logoutSso } from "@/services/apiSSOService"
import { useAppStore } from "@/store/useAppStore"
import { ChangePasswordDialog } from "../dialog"

export default function NavbarUserMenu() {
    const router = useRouter()
    const userDetail = useAppStore(( state ) => state.userDetail)
    const logout = useAppStore(( state ) => state.logout)
    const [ isLoggingOut, setIsLoggingOut ] = useState<boolean>(false)
    const [ isChangePasswordOpen, setIsChangePasswordOpen ] = useState<boolean>(false)

    const displayName = userDetail?.name || "ผู้ใช้งาน"
    const displayRole = userDetail?.system_role ?? userDetail?.roles?.[0] ?? "-"
    const username = userDetail?.preferred_username ?? userDetail?.employee_id ?? userDetail?.sub
    const avatarUrl = process.env.NEXT_PUBLIC_API_URL && username
        ? `${process.env.NEXT_PUBLIC_API_URL}/intranet-api/storage/view?bucket=images&object=${encodeURIComponent(`JIBHR/img_hr/${username}.jpg`)}`
        : undefined

    const handleLogout = async () => {
        if ( isLoggingOut ) return
        setIsLoggingOut(true)
        let hasLogoutError = false
        try {
            await logoutSso(useAppStore.getState().accessToken)
        } catch {
            hasLogoutError = true
        } finally {
            logout()
            router.replace(`/login?loggedOut=1${hasLogoutError ? "&logoutError=1" : ""}`)
        }
    }

    return (
        <div className="flex items-center justify-end gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger render={
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="เมนูผู้ใช้"
                        className="relative rounded-full bg-primary/10 p-0 shadow-sm ring-1 ring-inset ring-primary/20 transition-all duration-200 hover:bg-primary/15 hover:shadow-md active:translate-y-0"
                    >
                        <Avatar className="size-8 ring-2 ring-card">
                            <AvatarImage src={avatarUrl} alt={displayName} className="object-fill" />
                            <AvatarFallback className="bg-primary/15 text-primary">
                                <User className="size-4" />
                            </AvatarFallback>
                            <AvatarBadge className="bg-primary" />
                        </Avatar>
                    </Button>
                } />
                <DropdownMenuContent align="end" sideOffset={12} className="w-60 border-primary/15 shadow-lg">
                    <DropdownMenuGroup>
                    <DropdownMenuLabel className="bg-primary/5 font-normal">
                        <div className="flex items-center gap-3">
                            <Avatar size="lg" className="ring-2 ring-primary/15">
                                <AvatarImage src={avatarUrl} alt={displayName} className="object-fill" />
                                <AvatarFallback className="bg-primary/15 text-primary">
                                    <User />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5 cursor-default">
                                <span className="truncate text-sm font-medium"> { displayName } </span>
                                <span className="truncate text-xs font-medium uppercase text-primary"> { displayRole } </span>
                            </div>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                        <UserIcon /> ข้อมูลผู้ใช้
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsChangePasswordOpen(true)}>
                        <KeyRoundIcon /> เปลี่ยนรหัสผ่าน
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" disabled={isLoggingOut} onClick={handleLogout}>
                        <LogOutIcon /> ออกจากระบบ
                    </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            <ChangePasswordDialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
        </div>
    )
}
