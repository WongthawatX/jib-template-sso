import Link from "next/link"
import { notFound } from "next/navigation"

import { ArrowLeftIcon, WrenchIcon } from "lucide-react"

import { navSections } from "@/utils/links"

export default async function TemplatePage({ params }: PageProps<"/[...slug]">) {
    const { slug } = await params
    const pathname = `/${slug.join("/")}`
    const link = navSections.flatMap(( section ) => section.groups.flatMap(( group ) => group.links))
        .find(( item ) => item.url === pathname)
    if ( !link ) notFound()

    const Icon = link.icon

    return (
        <section className="flex min-h-[60svh] flex-col items-center justify-center gap-6 py-10 text-center">
            <div className="relative flex size-20 items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-primary/5" />
                <div className="absolute inset-0 animate-pulse rounded-2xl ring-1 ring-inset ring-primary/15" />
                <div className="relative flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm ring-1 ring-inset ring-primary/15">
                    <Icon className="size-7" />
                </div>
            </div>

            <div className="flex max-w-md flex-col items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <WrenchIcon className="size-3.5" />
                    อยู่ระหว่างเตรียมใช้งาน
                </span>
                <h1 className="text-2xl font-semibold text-foreground"> { link.title } </h1>
                <p className="text-sm text-muted-foreground">
                    หน้านี้กำลังพัฒนาและจะเปิดให้ใช้งานเร็วๆ นี้
                </p>
            </div>

            <Link
                href="/dashboard"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
                <ArrowLeftIcon className="size-4" />
                กลับหน้า Dashboard
            </Link>
        </section>
    )
}
