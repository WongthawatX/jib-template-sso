"use client"

import { ThemeProvider } from "next-themes"

import { TooltipProvider } from "../ui/tooltip"
import { STORAGE_NS } from "@/lib/storage"

import type { ReactNode } from "react"

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey={`${STORAGE_NS}:theme`}>
            <TooltipProvider delay={300}>{ children }</TooltipProvider>
        </ThemeProvider>
    )
}
