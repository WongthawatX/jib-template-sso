"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { ScrollArea } from "../ui/scroll-area"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, useSidebar } from "../ui/sidebar"
import { useVisibleNavSections } from "@/hooks/useVisibleNavSections"
import { isLinkActive } from "@/functions/functions"

// ใช้ ! กับสีตัวอักษร hover/active เพื่อทับ base ของ SidebarMenuButton ที่ตั้ง text-sidebar-accent-foreground (สีขาว)
// ไม่งั้นตอน hover จะได้พื้น bg-accent (น้ำเงินอ่อน) + ตัวอักษรขาว → กลืนหายบนพื้นการ์ดสว่าง
const ITEM_CLASS = "relative cursor-pointer text-foreground/70 hover:bg-accent hover:text-accent-foreground! active:bg-accent active:text-accent-foreground! data-active:bg-nav-accent data-active:font-medium data-active:text-nav-accent-foreground!"

export function SidebarMobileNav() {
    const pathname = usePathname()
    const { setOpenMobile } = useSidebar()

    const navSections = useVisibleNavSections()

    const closeSheet = () => setOpenMobile(false)

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-card">
            <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block! pr-1">
                <SidebarMenu className="gap-1 p-2">
                    { navSections.map(( section ) => {
                        const SectionIcon = section.icon
                        const links = section.groups.flatMap(( group ) => group.links )

                        // section ที่มีลิงก์เดียว กดไปหน้านั้นตรงๆ ไม่ต้องกางเมนูย่อย
                        if ( links.length === 1 ) {
                            const link = links[0]

                            return (
                                <SidebarMenuItem key={section.title}>
                                    <SidebarMenuButton
                                        render={<Link href={link.url} onClick={closeSheet} />}
                                        isActive={isLinkActive(pathname, link.url)}
                                        className={ITEM_CLASS}
                                    >

                                            <SectionIcon />
                                            <span> { section.title } </span>

                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        }

                        const isCurrentSection = links.some(( link ) => isLinkActive(pathname, link.url) )

                        return (
                            <SidebarMenuItem key={section.title}>
                            <Collapsible
                                defaultOpen={isCurrentSection}
                                className="group/collapsible"
                            >
                                    <CollapsibleTrigger render={<SidebarMenuButton className={ITEM_CLASS} />}>
                                            <SectionIcon />
                                            <span> { section.title } </span>
                                            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
                                        </CollapsibleTrigger>
                                    <CollapsibleContent className="overflow-hidden">
                                        <SidebarMenuSub className="border-border">
                                            { links.map(( link ) => {
                                                const Icon = link.icon

                                                return (
                                                    <SidebarMenuItem key={link.url}>
                                                        <SidebarMenuButton
                                                            render={<Link href={link.url} onClick={closeSheet} />}
                                                            isActive={isLinkActive(pathname, link.url)}
                                                            className={ITEM_CLASS}
                                                        >

                                                                <Icon />
                                                                <span className="text-[11px]"> { link.title } </span>

                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                )
                                            }) }
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                            </Collapsible>
                            </SidebarMenuItem>
                        )
                    }) }
                </SidebarMenu>
            </ScrollArea>
        </div>
    )
}
