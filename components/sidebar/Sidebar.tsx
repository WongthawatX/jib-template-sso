"use client"

import { useState } from "react"
import { Sidebar as UiSidebar, useSidebar } from "../ui/sidebar"
import { SidebarHeader } from "./SidebarHeader"
import { SidebarMain } from "./SidebarMain"
import { SidebarNav } from "./SidebarNav"
import { SidebarMobileNav } from "./SidebarMobileNav"
import { usePathname } from "next/navigation"
import { useVisibleNavSections } from "@/hooks/useVisibleNavSections"
import { isLinkActive } from "@/functions/functions"
import type { NavSection } from "@/utils/links"

import type { ComponentProps } from "react"

export function AppSidebar({ ...props }: ComponentProps<typeof UiSidebar>) {
    const pathname = usePathname()
    const navSections = useVisibleNavSections()
    const [ selection, setSelection ] = useState<{ title: string; pathname: string } | null>(null)
    const { setOpen, isMobile } = useSidebar()

    const sectionFromPath = navSections.find(( section ) =>
        section.groups.some(( group ) => group.links.some(( link ) => isLinkActive(pathname, link.url) ))
    )

    const activeSection = navSections.find(( section ) => section.title === selection?.title && selection.pathname === pathname ) ?? sectionFromPath ?? navSections[0]

    const handleSelectSection = ( section: NavSection ) => {
        setSelection({ title: section.title, pathname })
        setOpen(true)
    }

    return (
        <UiSidebar
            variant="sidebar"
            collapsible="icon"
            className="bg-muted border-r-0! p-2 *:data-[sidebar=sidebar]:h-[calc(100svh-1rem)] *:data-[sidebar=sidebar]:flex-row *:data-[sidebar=sidebar]:overflow-hidden *:data-[sidebar=sidebar]:rounded-xl *:data-[sidebar=sidebar]:bg-transparent! *:data-[sidebar=sidebar]:shadow-lg *:data-[sidebar=sidebar]:ring-1 *:data-[sidebar=sidebar]:ring-border"
            {...props}
        >
            { isMobile ? (
                <SidebarMobileNav />
            ) : (
                <>
                    <UiSidebar
                        collapsible="none"
                        className="w-12! shrink-0 border-0 bg-sidebar"
                    >
                        <SidebarHeader />
                        <SidebarMain activeSection={activeSection} onSelect={handleSelectSection} />
                    </UiSidebar>

                    <SidebarNav section={activeSection} />
                </>
            ) }
        </UiSidebar>
    )
}

