"use client"

import { PanelLeftIcon } from "lucide-react"
import { SidebarHeader as UiSidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "../ui/sidebar"

export function SidebarHeader() {
    const { toggleSidebar } = useSidebar()

    return (
        <UiSidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem className="border-b-2 pb-3">
                    <SidebarMenuButton
                        onClick={toggleSidebar}
                        aria-label="ย่อ / ขยายเมนู"
                        className="cursor-pointer text-sidebar-foreground/80"
                    >
                        <PanelLeftIcon />
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </UiSidebarHeader>
    )
}

