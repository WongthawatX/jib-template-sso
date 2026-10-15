import { HomeIcon, StoreIcon, UsersIcon, ChartColumnIcon, SettingsIcon, LayoutDashboardIcon, ListTreeIcon, PackageIcon, Rotate3dIcon, ShoppingBagIcon, LayoutGridIcon, LayersIcon, GitBranchIcon, FileTextIcon, MapIcon, FolderTreeIcon, TagIcon, TagsIcon, TruckIcon, FilterIcon, ShieldCheckIcon, WrenchIcon, ClipboardListIcon, FileStackIcon } from "lucide-react"

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
                    { title: "ทดลอง Table", url: "/table-demo", icon: ClipboardListIcon, resource: "table-demo" },
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
                    { title: "Dashboard", url: "/store/dashboard", icon: LayoutDashboardIcon, resource: "store-dashboard" },
                    { title: "จัดระเบียบสินค้า", url: "/store/organize", icon: ListTreeIcon, resource: "store-organize" },
                    { title: "Products", url: "/store/products", icon: PackageIcon, resource: "store-products" },
                    { title: "Upload 360°", url: "/store/upload-360", icon: Rotate3dIcon, resource: "store-upload-360" },
                    { title: "Marketplace Option", url: "/store/marketplace-option", icon: ShoppingBagIcon, resource: "store-marketplace-option" },
                    { title: "Commercial Products", url: "/store/commercial-products", icon: LayoutGridIcon, resource: "store-commercial-products" },
                    { title: "Com Set", url: "/store/com-set", icon: LayersIcon, resource: "store-com-set" },
                    { title: "Variations", url: "/store/variations", icon: GitBranchIcon, resource: "store-variations" },
                    { title: "Spec Templates", url: "/store/spec-templates", icon: FileTextIcon, resource: "store-spec-templates" },
                    { title: "Mapping", url: "/store/mapping", icon: MapIcon, resource: "store-mapping" },
                    { title: "Category", url: "/store/category", icon: FolderTreeIcon, resource: "store-category" },
                    { title: "Brands", url: "/store/brands", icon: TagIcon, resource: "store-brands" },
                    { title: "Suppliers", url: "/store/suppliers", icon: TruckIcon, resource: "store-suppliers" },
                    { title: "Filters", url: "/store/filters", icon: FilterIcon, resource: "store-filters" },
                    { title: "Tags", url: "/store/tags", icon: TagsIcon, resource: "store-tags" },
                    { title: "Warranties", url: "/store/warranties", icon: ShieldCheckIcon, resource: "store-warranties" },
                    { title: "Services", url: "/store/services", icon: WrenchIcon, resource: "store-services" },
                ],
            },
            {
                label: "จัดการออเดอร์",
                links: [
                    { title: "รายการคำสั่งซื้อ", url: "/store/orders", icon: ClipboardListIcon, resource: "store-orders" },
                    { title: "รายการคำสั่งซื้อ By Order", url: "/store/orders-by-order", icon: FileStackIcon, resource: "store-orders-by-order" },
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
                    { title: "Users", url: "/users", icon: UsersIcon, resource: "users" },
                    { title: "Permissions", url: "/users/permissions", icon: ShieldCheckIcon, resource: "users-permissions" },
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
                    { title: "รายงานยอดขาย", url: "/reports/sales", icon: ChartColumnIcon, resource: "reports-sales" },
                    { title: "รายงานสินค้า", url: "/reports/products", icon: PackageIcon, resource: "reports-products" },
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
                    { title: "ตั้งค่าทั่วไป", url: "/settings/general", icon: SettingsIcon, resource: "settings-general" },
                ],
            },
        ],
    },
]
