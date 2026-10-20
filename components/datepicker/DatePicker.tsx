"use client"

import { useMemo, useState } from "react"

import { CalendarIcon } from "lucide-react"

import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

import { formatDate, formatDateDMY, parseDateValue } from "@/functions/functions"
import { cn } from "@/lib/utils"

type Props = {
    title?: string;
    /** รับได้ทั้ง Date, "YYYY-MM-DD" และ "dd/MM/yyyy" */
    date?: Date | string;
    /** คืนค่าเป็น ISO "YYYY-MM-DD" (ตรงกับที่ API ใช้) ส่วนที่แสดงบนปุ่มเป็น dd/MM/yyyy */
    onChange?: ( date: string ) => void;
    className?: string;
}

export default function DatePicker({ title = "เลือกวันที่", date, onChange, className }: Props) {
    const [ open, setOpen ] = useState<boolean>(false)

    // derive จาก prop ตรงๆ ไม่ mirror ลง state ด้วย useEffect
    // (setState ใน effect โดน react-hooks/set-state-in-effect และทำให้เกิด cascading render)
    const controlledDate = useMemo(() => parseDateValue(date), [ date ])
    const [ innerDate, setInnerDate ] = useState<Date | undefined>(undefined)

    const isControlled = date !== undefined
    const selectedDate = isControlled ? controlledDate : innerDate

    const commit = ( next: Date | undefined ) => {
        if ( !isControlled ) setInnerDate( next )
        if ( next ) {
            onChange?.( formatDate(next) )
            setOpen(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                render={(
                    <Button
                        variant="outline"
                        data-empty={!selectedDate}
                        className={cn("w-full justify-between border border-input bg-card text-left font-normal hover:bg-card", className)}
                    />
                )}
            >
                <span className="truncate text-sm">
                    { selectedDate ? formatDateDMY(selectedDate) : title }
                </span>
                <CalendarIcon className="size-4 shrink-0" />
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={commit}
                    defaultMonth={selectedDate}
                />
                <div className="border-t px-3 py-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => commit(new Date())}
                    >
                        วันนี้
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
