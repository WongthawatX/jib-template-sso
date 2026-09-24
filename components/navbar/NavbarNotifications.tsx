"use client"

import { BellIcon } from "lucide-react"
import { Button } from "../ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"

export default function NavbarNotifications() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="การแจ้งเตือน"
                    className="relative rounded-full bg-chart-5/10 text-chart-5 shadow-sm ring-1 ring-inset ring-chart-5/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-chart-5/20 hover:text-chart-5 hover:shadow-md active:translate-y-0"
                >
                    <BellIcon />
                </Button>
            } />
            <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuGroup><DropdownMenuLabel> การแจ้งเตือน </DropdownMenuLabel></DropdownMenuGroup>
                <DropdownMenuSeparator />
                {/* TODO: ต่อ API รายการแจ้งเตือนจริง */}
                <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                    ยังไม่มีการแจ้งเตือน
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

