import { HomeIcon, WrenchIcon, LayersIcon, SettingsIcon, LayoutDashboardIcon, ClipboardListIcon, UsersIcon, ListTreeIcon, FileTextIcon, ShieldCheckIcon, FileDownIcon } from "lucide-react"

import type { ComponentType } from "react"

export type SidebarIcon = ComponentType<{ className?: string }>

export type MenuLink = {
    title: string;
    url: string;
    icon: SidebarIcon;
    /** ผูกกับ menu_id ของระบบสิทธิ์ — ถ้ามี จะซ่อนลิงก์เมื่อไม่มีสิทธิ์ views (ไม่ใส่ = แสดงเสมอ) */
    menuId?: number;
}

export type MenuGroup = {
    label: string;
    links: MenuLink[];
}

export type NavSection = {
    title: string;
    icon: SidebarIcon;
    groups: MenuGroup[];
}

export type SidebarUser = {
    name: string;
    email: string;
    avatar: string;
}

// TODO: เปลี่ยนไปดึงข้อมูลจริงจาก API แทน mock data
export const sidebarUser: SidebarUser = {
    name: "admin zero",
    email: "root",
    avatar: "/avatars/shadcn.jpg",
}

// รวมเมนูจาก jib-onsite-technician และ jib-onsite-admin-v2
export const navSections: NavSection[] = [
    {
        title: "หน้าหลัก",
        icon: HomeIcon,
        groups: [
            {
                label: "ภาพรวม",
                links: [
                    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
                ],
            },
        ],
    },
    {
        title: "งานช่าง",
        icon: WrenchIcon,
        groups: [
            {
                label: "เมนู",
                links: [
                    { title: "รายการทั้งหมด", url: "/job-technician", icon: ClipboardListIcon },
                ],
            },
        ],
    },
    {
        title: "ผู้ดูแลระบบ",
        icon: LayersIcon,
        groups: [
            {
                label: "จัดการงาน",
                links: [
                    { title: "งานทั้งหมด", url: "/job-admin", icon: LayersIcon },
                ],
            },
        ],
    },
    {
        title: "ตั้งค่า",
        icon: SettingsIcon,
        groups: [
            {
                label: "ตั้งค่าระบบ",
                links: [
                    { title: "ผู้ใช้งาน", url: "/users", icon: UsersIcon },
                    { title: "จัดการ", url: "/management", icon: ListTreeIcon },
                    { title: "Logs Process", url: "/logs-process", icon: FileTextIcon },
                    { title: "Logs Login", url: "/logs-login", icon: ShieldCheckIcon },
                ],
            },
        ],
    },
    {
        title: "ส่งออกข้อมูล",
        icon: FileDownIcon,
        groups: [
            {
                label: "งานช่าง",
                links: [
                    { title: "Export File", url: "/export-page", icon: FileDownIcon },
                ],
            },
            {
                label: "ผู้ดูแลระบบ",
                links: [
                    { title: "EXPORT", url: "/export", icon: FileDownIcon },
                ],
            },
        ],
    },
]
