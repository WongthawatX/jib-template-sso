"use client"

import { MoonStarIcon, SunIcon } from "lucide-react"
import { Button } from "../ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { useTheme } from "next-themes"

export default function NavbarThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme()

    return (
        <Tooltip>
            <TooltipTrigger render={
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="สลับโหมดมืด / โหมดสว่าง"
                    onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                    className="rounded-full bg-chart-4/10 text-chart-4 shadow-sm ring-1 ring-inset ring-chart-4/20 transition-all hover:bg-chart-4/20 hover:text-chart-4 hover:shadow-md active:translate-y-0"
                >
                    <MoonStarIcon className="dark:hidden" />
                    <SunIcon className="hidden dark:block" />
                </Button>
            } />
            <TooltipContent side="bottom" align="end" sideOffset={12}> สลับโหมดมืด / โหมดสว่าง </TooltipContent>
        </Tooltip>
    )
}

