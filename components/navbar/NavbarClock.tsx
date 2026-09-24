"use client"

import { useEffect, useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { formatThaiDateLong, formatTime } from "@/functions/functions"

export default function NavbarClock() {
    const [ dateLabel, setDateLabel ] = useState<string>("")
    const [ timeLabel, setTimeLabel ] = useState<string>("--:--")
    const [ dateTooltip, setDateTooltip ] = useState<string>("")

    // เดินนาฬิกาทุกวินาที แต่เก็บเป็น string ระดับนาที React จะข้าม re-render ถ้าค่าเดิม
    useEffect(() => {
        const tick = () => {
            const now = new Date()
            setDateLabel(formatThaiDateLong(now))
            setTimeLabel(formatTime(now))
            setDateTooltip(`${formatThaiDateLong(now, true)} ${formatTime(now)}`)
        }

        const timer = window.setInterval(tick, 1000)

        return () => window.clearInterval(timer)
    }, [])

    return (
        <Tooltip>
            <TooltipTrigger className="cursor-default">
                <div className="hidden h-9 items-center border-l border-border pl-3 @md:flex">
                    <div className="flex shrink-0 flex-col text-xs leading-tight">
                        <span className="font-medium text-foreground"> { dateLabel } </span>
                        <span className="font-normal text-muted-foreground tabular-nums text-start"> { timeLabel } </span>
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="start"> { dateTooltip } </TooltipContent>
        </Tooltip>
    )
}

