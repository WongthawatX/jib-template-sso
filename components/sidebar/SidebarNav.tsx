"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { ScrollArea } from "../ui/scroll-area"
import { Sidebar, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from "../ui/sidebar"
import { isLinkActive } from "@/functions/functions"

import type { NavSection } from "@/utils/links"

type Props = {
    section?: NavSection;
}

export function SidebarNav({ section }: Props) {
    const pathname = usePathname()

    return (
        <Sidebar
            collapsible="none"
            className="hidden flex-1 bg-linear-to-r from-sidebar via-sidebar-bottom to-chart-4 py-2 pr-2 text-card-foreground md:flex"
        >
            <div className="flex h-full flex-col overflow-hidden rounded-md bg-card">
                <SidebarHeader className="px-4 pb-0">
                    <div className="text-lg font-semibold text-foreground">
                        { section?.title }
                    </div>
                </SidebarHeader>

                <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
                    { section?.groups.map(( group ) => (
                        <Collapsible key={group.label} defaultOpen className="group/collapsible">
                            <SidebarGroup className="py-1">
                                <SidebarGroupLabel
                                    render={<CollapsibleTrigger />}
                                    className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                    { group.label }
                                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />

                                </SidebarGroupLabel>
                                <CollapsibleContent className="overflow-hidden">
                                    <SidebarGroupContent>
                                        <SidebarMenuSub className="border-border mr-0">
                                            { group.links.map(( link ) => {
                                                const Icon = link.icon

                                                return (
                                                    <SidebarMenuItem key={link.url}>
                                                        <SidebarMenuButton
                                                            render={<Link href={link.url} />}
                                                            isActive={isLinkActive(pathname, link.url)}
                                                            aria-current={isLinkActive(pathname, link.url) ? "page" : undefined}
                                                            className="relative text-[0.95rem] text-foreground/70 hover:bg-accent hover:text-accent-foreground! active:bg-accent active:text-accent-foreground! data-active:bg-nav-accent data-active:font-medium data-active:text-nav-accent-foreground! data-active:before:absolute data-active:before:inset-y-1 data-active:before:left-0 data-active:before:w-1 data-active:before:rounded-full data-active:before:bg-nav-indicator"
                                                        >

                                                            <Icon />
                                                            <span className="text-[11px]"> { link.title } </span>

                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                )
                                            }) }
                                        </SidebarMenuSub>
                                    </SidebarGroupContent>
                                </CollapsibleContent>
                            </SidebarGroup>
                        </Collapsible>
                    )) }
                </ScrollArea>
            </div>
        </Sidebar>
    )
}

