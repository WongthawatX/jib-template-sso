"use client"

import type { NavSection } from "@/utils/links"
import { useVisibleNavSections } from "@/hooks/useVisibleNavSections"
import { SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar"

type Props = {
    activeSection?: NavSection;
    onSelect: ( section: NavSection ) => void;
}

export function SidebarMain({ activeSection, onSelect }: Props) {
    const navSections = useVisibleNavSections()

    return (
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupContent className="px-1.5 lg:px-0">
                    <SidebarMenu className="gap-1">
                        { navSections.map(( section ) => {
                            const Icon = section.icon

                            return (
                                <SidebarMenuItem key={section.title}>
                                    <SidebarMenuButton
                                        onClick={() => onSelect(section)}
                                        isActive={activeSection?.title === section.title}
                                        className="relative cursor-pointer justify-center rounded-md px-0 text-sidebar-foreground/65 transition-[background-color,color,box-shadow] duration-200 hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:after:absolute data-active:after:top-1/2 data-active:after:right-0 data-active:after:h-5.5 data-active:after:w-1 data-active:after:-translate-y-1/2 data-active:after:rounded-full data-active:after:bg-sidebar-primary data-active:ring-1"
                                    >
                                        <Icon />
                                        <span className="sr-only"> { section.title } </span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        }) }
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        </SidebarContent>
    )
}

