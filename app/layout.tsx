import { Kanit } from "next/font/google"
import { Providers } from "@/components/layout"
import { cn } from "@/lib/utils"

import type { Metadata } from "next"

import "./globals.css"

const kanit = Kanit({
    variable: "--font-kanit",
    subsets: [ "latin", "thai" ],
    weight: [ "400", "500", "600", "700" ],
    display: "swap",
})

export const metadata: Metadata = {
    title: "JIB ONSITE SERVICE",
    description: "JIB Onsite Service · ระบบงาน Onsite Service",
    referrer: "no-referrer",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="th" suppressHydrationWarning className={cn(kanit.variable, "h-full antialiased")}>
            <body className="flex min-h-full flex-col">
                <Providers>{ children }</Providers>
            </body>
        </html>
    )
}
