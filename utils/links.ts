import { HomeIcon, StoreIcon, UsersIcon, ChartColumnIcon, SettingsIcon, LayoutDashboardIcon, ListTreeIcon, PackageIcon, Rotate3dIcon, ShoppingBagIcon, LayoutGridIcon, LayersIcon, GitBranchIcon, FileTextIcon, MapIcon, FolderTreeIcon, TagIcon, TagsIcon, TruckIcon, FilterIcon, ShieldCheckIcon, WrenchIcon, ClipboardListIcon, FileStackIcon } from "lucide-react"

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

// TODO: ปรับ url ให้ตรงกับ route จริงเมื่อสร้างหน้าครบ
export const navSections: NavSection[] = [
    {
        title: "หน้าหลัก",
        icon: HomeIcon,
        groups: [
            {
                label: "ภาพรวม",
                links: [
                    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboardIcon },
                    { title: "ทดลอง Table", url: "/table-demo", icon: ClipboardListIcon },
                ],
            },
        ],
    },
    {
        title: "ร้านค้า",
        icon: StoreIcon,
        groups: [
            {
                label: "จัดการสินค้า",
                links: [
                    { title: "Dashboard", url: "/store/dashboard", icon: LayoutDashboardIcon },
                    { title: "จัดระเบียบสินค้า", url: "/store/organize", icon: ListTreeIcon },
                    { title: "Products", url: "/store/products", icon: PackageIcon },
                    { title: "Upload 360°", url: "/store/upload-360", icon: Rotate3dIcon },
                    { title: "Marketplace Option", url: "/store/marketplace-option", icon: ShoppingBagIcon },
                    { title: "Commercial Products", url: "/store/commercial-products", icon: LayoutGridIcon },
                    { title: "Com Set", url: "/store/com-set", icon: LayersIcon },
                    { title: "Variations", url: "/store/variations", icon: GitBranchIcon },
                    { title: "Spec Templates", url: "/store/spec-templates", icon: FileTextIcon },
                    { title: "Mapping", url: "/store/mapping", icon: MapIcon },
                    { title: "Category", url: "/store/category", icon: FolderTreeIcon },
                    { title: "Brands", url: "/store/brands", icon: TagIcon },
                    { title: "Suppliers", url: "/store/suppliers", icon: TruckIcon },
                    { title: "Filters", url: "/store/filters", icon: FilterIcon },
                    { title: "Tags", url: "/store/tags", icon: TagsIcon },
                    { title: "Warranties", url: "/store/warranties", icon: ShieldCheckIcon },
                    { title: "Services", url: "/store/services", icon: WrenchIcon },
                ],
            },
            {
                label: "จัดการออเดอร์",
                links: [
                    { title: "รายการคำสั่งซื้อ", url: "/store/orders", icon: ClipboardListIcon },
                    { title: "รายการคำสั่งซื้อ By Order", url: "/store/orders-by-order", icon: FileStackIcon },
                ],
            },
        ],
    },
    {
        title: "ผู้ใช้งาน",
        icon: UsersIcon,
        groups: [
            {
                label: "จัดการผู้ใช้งาน",
                links: [
                    { title: "Users", url: "/users", icon: UsersIcon },
                    { title: "Permissions", url: "/users/permissions", icon: ShieldCheckIcon },
                ],
            },
        ],
    },
    {
        title: "รายงาน",
        icon: ChartColumnIcon,
        groups: [
            {
                label: "รายงาน",
                links: [
                    { title: "รายงานยอดขาย", url: "/reports/sales", icon: ChartColumnIcon },
                    { title: "รายงานสินค้า", url: "/reports/products", icon: PackageIcon },
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
                    { title: "ตั้งค่าทั่วไป", url: "/settings/general", icon: SettingsIcon },
                ],
            },
        ],
    },
]
