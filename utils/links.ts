import { HomeIcon, StoreIcon, UsersIcon, ChartColumnIcon, SettingsIcon, LayoutDashboardIcon, ListTreeIcon, PackageIcon, Rotate3dIcon, ShoppingBagIcon, LayoutGridIcon, LayersIcon, GitBranchIcon, FileTextIcon, MapIcon, FolderTreeIcon, TagIcon, TagsIcon, TruckIcon, FilterIcon, ShieldCheckIcon, WrenchIcon, ClipboardListIcon, FileStackIcon } from "lucide-react"

import { RESOURCE } from "@/utils/permissions"

import type { ComponentType } from "react"

export type SidebarIcon = ComponentType<{ className?: string }>

export type MenuLink = {
    title: string;
    url: string;
    icon: SidebarIcon;
    /** แสดงเมนูเมื่อมีสิทธิ์ resource.view (ไม่ใส่ resource = แสดงเสมอ) */
    resource?: string;
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
                    { title: "ทดลอง Table", url: "/table-demo", icon: ClipboardListIcon, resource: RESOURCE.TABLE_DEMO },
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
                    { title: "Dashboard", url: "/store/dashboard", icon: LayoutDashboardIcon, resource: RESOURCE.STORE_DASHBOARD },
                    { title: "จัดระเบียบสินค้า", url: "/store/organize", icon: ListTreeIcon, resource: RESOURCE.STORE_ORGANIZE },
                    { title: "Products", url: "/store/products", icon: PackageIcon, resource: RESOURCE.STORE_PRODUCTS },
                    { title: "Upload 360°", url: "/store/upload-360", icon: Rotate3dIcon, resource: RESOURCE.STORE_UPLOAD_360 },
                    { title: "Marketplace Option", url: "/store/marketplace-option", icon: ShoppingBagIcon, resource: RESOURCE.STORE_MARKETPLACE_OPTION },
                    { title: "Commercial Products", url: "/store/commercial-products", icon: LayoutGridIcon, resource: RESOURCE.STORE_COMMERCIAL_PRODUCTS },
                    { title: "Com Set", url: "/store/com-set", icon: LayersIcon, resource: RESOURCE.STORE_COM_SET },
                    { title: "Variations", url: "/store/variations", icon: GitBranchIcon, resource: RESOURCE.STORE_VARIATIONS },
                    { title: "Spec Templates", url: "/store/spec-templates", icon: FileTextIcon, resource: RESOURCE.STORE_SPEC_TEMPLATES },
                    { title: "Mapping", url: "/store/mapping", icon: MapIcon, resource: RESOURCE.STORE_MAPPING },
                    { title: "Category", url: "/store/category", icon: FolderTreeIcon, resource: RESOURCE.STORE_CATEGORY },
                    { title: "Brands", url: "/store/brands", icon: TagIcon, resource: RESOURCE.STORE_BRANDS },
                    { title: "Suppliers", url: "/store/suppliers", icon: TruckIcon, resource: RESOURCE.STORE_SUPPLIERS },
                    { title: "Filters", url: "/store/filters", icon: FilterIcon, resource: RESOURCE.STORE_FILTERS },
                    { title: "Tags", url: "/store/tags", icon: TagsIcon, resource: RESOURCE.STORE_TAGS },
                    { title: "Warranties", url: "/store/warranties", icon: ShieldCheckIcon, resource: RESOURCE.STORE_WARRANTIES },
                    { title: "Services", url: "/store/services", icon: WrenchIcon, resource: RESOURCE.STORE_SERVICES },
                ],
            },
            {
                label: "จัดการออเดอร์",
                links: [
                    { title: "รายการคำสั่งซื้อ", url: "/store/orders", icon: ClipboardListIcon, resource: RESOURCE.STORE_ORDERS },
                    { title: "รายการคำสั่งซื้อ By Order", url: "/store/orders-by-order", icon: FileStackIcon, resource: RESOURCE.STORE_ORDERS_BY_ORDER },
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
                    { title: "Users", url: "/users", icon: UsersIcon, resource: RESOURCE.USERS },
                    { title: "Permissions", url: "/users/permissions", icon: ShieldCheckIcon, resource: RESOURCE.USERS_PERMISSIONS },
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
                    { title: "รายงานยอดขาย", url: "/reports/sales", icon: ChartColumnIcon, resource: RESOURCE.REPORTS_SALES },
                    { title: "รายงานสินค้า", url: "/reports/products", icon: PackageIcon, resource: RESOURCE.REPORTS_PRODUCTS },
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
                    { title: "ตั้งค่าทั่วไป", url: "/settings/general", icon: SettingsIcon, resource: RESOURCE.SETTINGS_GENERAL },
                ],
            },
        ],
    },
]
