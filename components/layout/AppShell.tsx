"use client"

import { Card } from "../ui/card"
import { ScrollArea, ScrollBar } from "../ui/scroll-area"
import { SidebarInset, SidebarProvider } from "../ui/sidebar"
import { Navbar } from "../navbar"
import { AppSidebar } from "../sidebar"

import type { ReactNode } from "react"

export default function AppShell({ children }: { children: ReactNode }) {
    return (
        <SidebarProvider style={{ "--sidebar-width": "20rem", "--sidebar-width-icon": "4rem" } as React.CSSProperties}>
            <AppSidebar />
            <SidebarInset className="flex min-w-0 flex-col h-screen overflow-hidden bg-muted">
                <Navbar />
                <main className="flex min-h-0 flex-1 overflow-hidden p-2 lg:pl-0">
                    <Card className="flex h-full min-h-0 w-full flex-col gap-0 overflow-hidden border-0 py-0 ring-0">
                        <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">
                            <div className="space-y-2 p-5"> { children } </div>
                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    </Card>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
