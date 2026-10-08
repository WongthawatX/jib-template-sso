"use client"

import Image from "next/image"
import { APP_BASE_PATH } from "@/config/env"

import { SidebarTrigger } from "../ui/sidebar"

import { NavbarClock, NavbarSessionTimer, NavbarThemeToggle, NavbarUserMenu } from "../navbar"

export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 flex shrink-0 bg-transparent p-2 pb-0 lg:pl-0">
            <div className="@container flex h-14 w-full items-center gap-2 rounded-xl border border-border bg-card p-2">
                <div className="flex min-w-0 flex-1 items-center gap-2 px-1">
                    <SidebarTrigger className="-ml-1 flex size-7 md:hidden" />

                    <Image
                        src={`${APP_BASE_PATH}/JIB_LOGO_BLUE.jpg`}
                        alt="JIB"
                        width={28}
                        height={28}
                        loading="lazy"
                        className="size-7 shrink-0 rounded-sm object-contain"
                    />

                    <NavbarClock />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <NavbarSessionTimer />
                    <NavbarThemeToggle />
                    {/* <NavbarNotifications /> */}
                    <NavbarUserMenu />
                </div>
            </div>
        </header>
    )
}

