"use client"

import { useMemo } from "react"

import { useAppStore } from "@/store/useAppStore"
import { navSections } from "@/utils/links"
import { filterNavSections } from "@/utils/navigationPermissions"

import type { NavSection } from "@/utils/links"

export function useVisibleNavSections(): NavSection[] {
    const permissions = useAppStore(( state ) => state.permissions)

    return useMemo(() => filterNavSections( navSections, permissions ), [ permissions ])
}
