"use client"

import { AtSignIcon, BadgeCheckIcon, Building2Icon, IdCardIcon, MailIcon, PhoneIcon, ShieldCheckIcon, StoreIcon, UserIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/useAppStore"

import type { LucideIcon } from "lucide-react"

type ProfileFieldProps = {
    label: string;
    value?: string;
    icon: LucideIcon;
}

const FIELD_ROW_CLASS = "flex min-w-0 flex-col gap-1 border-t border-border/60 py-3 first:border-t-0 sm:[&:nth-child(2)]:border-t-0 uppercase"

const getInitials = ( name: string ): string => name.trim().split(/\s+/).slice(0, 2).map(( part ) => part.charAt(0)).join("").toUpperCase()

function ProfileField({ label, value, icon: Icon }: ProfileFieldProps) {
    return (
        <div className={FIELD_ROW_CLASS}>
            <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 truncate"> { label } </span>
            </dt>
            <dd className={cn("min-w-0 text-sm wrap-break-word", !value && "text-muted-foreground")}> { value || "-" } </dd>
        </div>
    )
}

function ProfileSkeleton() {
    return (
        <div className="flex flex-col gap-4" role="status" aria-busy="true" aria-label="กำลังโหลดข้อมูลผู้ใช้">
            <Card className="gap-0 py-0">
                <div className="flex flex-col items-center gap-4 bg-muted/40 p-5 sm:flex-row">
                    <Skeleton className="size-20 rounded-full sm:size-24" />
                    <div className="flex w-full max-w-xs flex-col items-center gap-2 sm:items-start">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-48 rounded-full" />
                    </div>
                </div>
            </Card>
            { [ "contact", "organisation" ].map(( section ) => (
                <Card key={section}>
                    <CardHeader>
                        <Skeleton className="h-5 w-32" />
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                        { [ 0, 1, 2, 3 ].map(( row ) => (
                            <div key={row} className="flex flex-col gap-2 py-3">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-4 w-full max-w-48" />
                            </div>
                        )) }
                    </CardContent>
                </Card>
            )) }
        </div>
    )
}

export default function UserProfile() {
    const userDetail = useAppStore(( state ) => state.userDetail)

    if ( !userDetail ) return <ProfileSkeleton />

    const displayName = userDetail.name || "ผู้ใช้งาน"
    const employeeId = userDetail.employee_id ?? userDetail.preferred_username ?? userDetail.sub
    const displayRole = userDetail.system_role ?? userDetail.roles?.[0]
    const initials = getInitials(displayName)
    const username = userDetail.preferred_username ?? userDetail.employee_id ?? userDetail.sub
    const avatarUrl = process.env.NEXT_PUBLIC_API_URL && username ? `${process.env.NEXT_PUBLIC_API_URL}/intranet-api/storage/view?bucket=images&object=${encodeURIComponent(`JIBHR/img_hr/${username}.jpg`)}` : undefined

    return (
        <section className="flex flex-col gap-4" aria-labelledby="profile-heading">
            <h1 id="profile-heading" className="text-lg font-medium"> ข้อมูลผู้ใช้ </h1>

            <Card className="gap-0 py-0">
                <div className="flex flex-col items-center gap-4 bg-muted/40 p-5 text-center sm:flex-row sm:text-left">
                    <Avatar className="size-20 shadow-sm ring-2 ring-card sm:size-24">
                        <AvatarImage src={avatarUrl} alt={`รูปประจำตัวของ ${displayName}`} className="object-fill" />
                        <AvatarFallback className="bg-primary/15 text-lg font-medium text-primary">
                            { initials || <UserIcon className="size-7" aria-hidden="true" /> }
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex min-w-0 flex-col items-center gap-1 sm:items-start">
                        <h2 className="text-xl font-semibold wrap-break-word"> { displayName } </h2>
                        <p className="text-sm text-muted-foreground wrap-break-word"> รหัสพนักงาน · { employeeId } </p>
                        <div className="flex flex-wrap justify-center gap-1.5 pt-1 sm:justify-start">
                            { displayRole ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20 uppercase">
                                    <BadgeCheckIcon className="size-3 shrink-0" aria-hidden="true" />
                                    { displayRole }
                                </span>
                            ) : null }
                            { userDetail.department ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
                                    <Building2Icon className="size-3 shrink-0" aria-hidden="true" />
                                    { userDetail.department }
                                </span>
                            ) : null }
                            { userDetail.branch ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
                                    <StoreIcon className="size-3 shrink-0" aria-hidden="true" />
                                    { userDetail.branch }
                                </span>
                            ) : null }
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle> ข้อมูลติดต่อ </CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                        <ProfileField label="อีเมล" value={userDetail.email} icon={MailIcon} />
                        <ProfileField label="เบอร์โทรศัพท์" value={userDetail.phone} icon={PhoneIcon} />
                    </dl>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle> ข้อมูลองค์กร </CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                        <ProfileField label="รหัสพนักงาน" value={userDetail.employee_id} icon={IdCardIcon} />
                        <ProfileField label="ชื่อผู้ใช้" value={userDetail.preferred_username} icon={AtSignIcon} />
                        <ProfileField label="แผนก" value={userDetail.department} icon={Building2Icon} />
                        <ProfileField label="สาขา" value={userDetail.branch} icon={StoreIcon} />
                        <ProfileField label="บทบาท" value={displayRole} icon={ShieldCheckIcon} />
                    </dl>
                </CardContent>
            </Card>
        </section>
    )
}
