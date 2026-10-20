"use client"

import { useMemo, useState } from "react"

import { endOfMonth, endOfYear, isSameDay, startOfMonth, startOfYear, subDays, subMonths, subYears } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

import { formatDate, formatDateDMY, parseDateValue } from "@/functions/functions"
import { cn } from "@/lib/utils"

import type { ChangeEvent, ChangeEventHandler } from "react"
import type { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import type { DateRange, DropdownNavProps, DropdownProps } from "react-day-picker"

type Props = {
    /** ช่วงวันที่แบบ controlled — รูปแบบ ISO ["YYYY-MM-DD", "YYYY-MM-DD"] (ตรงกับที่ API ใช้) */
    value?: string[];
    /** คืนค่าเป็น ISO ["YYYY-MM-DD", "YYYY-MM-DD"] ส่วนที่แสดงบนปุ่มเป็น dd/MM/yyyy */
    setValue?: ( dates: string[] ) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
    classPopover?: string;
    /** ปิด auto-fill ค่าเดือนปัจจุบันตอน mount — เริ่มต้นว่าง (default: false) */
    noDefault?: boolean;
}

// ช่วงปีที่เลือกได้ใน dropdown
// ถ้าไม่กำหนด react-day-picker จะ default endMonth = สิ้นปีปัจจุบัน ทำให้เลือกปีอนาคตไม่ได้
const DROPDOWN_START_MONTH = new Date( new Date().getFullYear() - 20, 0 )
const DROPDOWN_END_MONTH   = new Date( new Date().getFullYear() + 10, 11 )

const getDefaultDates = (): [ Date, Date ] => {
    const now = new Date()
    return [ new Date( now.getFullYear(), now.getMonth(), 1 ), now ]
}

// ช่วงเวลาที่ใช้บ่อย — คำนวณตอนคลิก เพื่อให้อ้างอิงวันปัจจุบันเสมอ (ไม่ค้างค่าตอน import)
const PRESETS: { label: string; getRange: () => DateRange }[] = [
    { label: "วันนี้",         getRange: () => ({ from: new Date(), to: new Date() }) },
    { label: "เมื่อวาน",        getRange: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
    { label: "7 วันล่าสุด",     getRange: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
    { label: "30 วันล่าสุด",    getRange: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
    { label: "เดือนนี้",        getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
    { label: "เดือนที่แล้ว",     getRange: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
    { label: "ปีนี้",           getRange: () => ({ from: startOfYear(new Date()), to: new Date() }) },
    { label: "ปีที่แล้ว",        getRange: () => ({ from: startOfYear(subYears(new Date(), 1)), to: endOfYear(subYears(new Date(), 1)) }) },
]

export default function DatePickerRange({
    value,
    setValue,
    disabled,
    placeholder = "กรุณาเลือกช่วงวันที่",
    className,
    classPopover,
    noDefault = false,
}: Props) {
    const [ open, setOpen ] = useState<boolean>(false)

    // controlled = มี value ส่งมา → derive ช่วงจาก prop ตรงๆ ไม่ mirror ลง state
    // (mirror ด้วย useEffect + setState จะโดน react-hooks/set-state-in-effect และทำให้เกิด cascading render)
    const isControlled = Array.isArray(value)

    const fallbackRange = useMemo<DateRange>(() => {
        if ( noDefault ) return { from: undefined, to: undefined }
        const [ from, to ] = getDefaultDates()
        return { from, to }
    }, [ noDefault ])

    const controlledRange = useMemo<DateRange>(() => {
        if ( !Array.isArray(value) || value.length !== 2 ) return fallbackRange
        const from = parseDateValue( value[0] )
        const to   = parseDateValue( value[1] )
        return from && to ? { from, to } : fallbackRange
    }, [ value, fallbackRange ])

    // state ภายใน ใช้ตอน uncontrolled และใช้เก็บสถานะ "เลือกไปครึ่งทาง" ตอน controlled
    const [ innerRange, setInnerRange ] = useState<DateRange>(fallbackRange)
    const [ pendingFrom, setPendingFrom ] = useState<Date | undefined>(undefined)

    const range: DateRange = pendingFrom
        ? { from: pendingFrom, to: undefined }
        : isControlled ? controlledRange : innerRange

    // เดือนที่ปฏิทินกำลังแสดง (controlled) — ให้ preset เลื่อนมุมมองปฏิทินได้
    const [ month, setMonth ] = useState<Date>(() => new Date())

    // แสดง 2 เดือน → เลื่อนให้เดือนของวันสิ้นสุดไปอยู่แผงขวา จะเห็นช่วงที่เลือกครบกว่า
    const focusMonth = ( date?: Date ) => setMonth( subMonths( date ?? new Date(), 1 ) )

    const commit = ( next: DateRange ) => {
        setPendingFrom(undefined)
        if ( !isControlled ) setInnerRange( next )
        if ( next.from && next.to ) {
            setValue?.([ formatDate(next.from), formatDate(next.to) ])
            setOpen(false)
        }
    }

    // ห่อ native <select> ของ react-day-picker (เลือกเดือน/ปี) เป็น onChange event ปลอม เพื่อให้ใช้กับ shadcn Select ได้
    const handleCalendarChange = ( next: string | number, onChange: ChangeEventHandler<HTMLSelectElement> ) => {
        onChange({ target: { value: String(next) } } as ChangeEvent<HTMLSelectElement>)
    }

    // preset ไหนตรงกับช่วงที่เลือกอยู่ (เทียบระดับวัน ไม่สนเวลา) → ใช้ทำ active state
    const isPresetActive = ( getRange: () => DateRange ): boolean => {
        if ( !range.from || !range.to ) return false
        const preset = getRange()
        if ( !preset.from || !preset.to ) return false
        return isSameDay( range.from, preset.from ) && isSameDay( range.to, preset.to )
    }

    const applyPreset = ( getRange: () => DateRange ) => {
        const next = getRange()
        focusMonth( next.to )
        commit( next )
    }

    const renderLabel = () => {
        if ( range.from && range.to ) return `${formatDateDMY(range.from)} - ${formatDateDMY(range.to)}`
        if ( range.from ) return `${formatDateDMY(range.from)} - เลือกวันสิ้นสุด`
        return placeholder
    }

    const handleSelect = ( selected: DateRange | undefined ) => {
        if ( !selected ) return

        // คลิกแรกของรอบใหม่ (ยังไม่มีช่วง หรือมีช่วงครบแล้ว) → เริ่มนับใหม่จากวันที่เพิ่งคลิก
        if ( !pendingFrom ) {
            const clicked =
                range.from && selected.from && selected.from.getTime() !== range.from.getTime() ? selected.from :
                range.to && selected.to && selected.to.getTime() !== range.to.getTime() ? selected.to :
                selected.from ?? selected.to

            if ( clicked ) setPendingFrom( clicked )
            return
        }

        // คลิกที่สอง → ปิดช่วงให้ครบ แล้วเรียงลำดับให้ from <= to เสมอ
        const second = selected.to && selected.to.getTime() !== pendingFrom.getTime() ? selected.to : selected.from
        if ( !second ) return

        const [ from, to ] = second < pendingFrom ? [ second, pendingFrom ] : [ pendingFrom, second ]
        commit({ from, to })
    }

    const handleOpenChange = ( next: boolean, details: PopoverPrimitive.Root.ChangeEventDetails ) => {
        // dropdown เดือน/ปีของ Select portal ไปที่ document.body คนละ subtree กับ Popover
        // base-ui จะมองว่าคลิก item ใน Select = คลิกนอกกรอบแล้วปิด Popover ทิ้งก่อนได้เลือกค่า จึงต้อง cancel
        // (base-ui ไม่มี onInteractOutside แบบ radix — ใช้ reason + cancel() แทน)
        if ( !next && details.reason === "outside-press" ) {
            const target = details.event.target as HTMLElement | null
            if ( target?.closest('[data-slot="select-content"]') || target?.closest('[data-slot="select-trigger"]') ) {
                details.cancel()
                return
            }
        }

        setOpen( next )
        // sync มุมมองปฏิทินตอนเปิด (ทำใน handler ไม่ใช่ effect เพื่อเลี่ยง cascading render)
        if ( next ) focusMonth( range.to ?? range.from )
        // ปิดโดยที่เลือกไม่ครบ → ทิ้งค่าครึ่งทาง ไม่ให้ค้างไว้รอบหน้า
        if ( !next ) setPendingFrom(undefined)
    }

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger
                disabled={disabled}
                render={(
                    <Button
                        variant="outline"
                        className={cn("w-full justify-between border border-input bg-card font-normal hover:bg-card", className)}
                    />
                )}
            >
                <span className="truncate text-sm"> { renderLabel() } </span>
                <CalendarIcon className="size-4 shrink-0" />
            </PopoverTrigger>

            <PopoverContent className={cn("w-auto p-0", classPopover)} align="end">
                <div className="flex max-sm:flex-col">
                    {/* ช่วงเวลาที่ใช้บ่อย */}
                    <div className="relative py-3 max-sm:order-1 max-sm:border-t sm:w-36">
                        <div className="h-full sm:border-e">
                            <div className="flex flex-col gap-0.5 px-2">
                                { PRESETS.map(( preset ) => {
                                    const isActive = isPresetActive( preset.getRange )
                                    return (
                                        <Button
                                            key={preset.label}
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "w-full justify-start font-normal",
                                                isActive && "bg-primary/10 font-medium text-primary hover:bg-primary/15 hover:text-primary",
                                            )}
                                            onClick={() => applyPreset( preset.getRange )}
                                        >
                                            { preset.label }
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <Calendar
                        mode="range"
                        selected={range}
                        onSelect={handleSelect}
                        month={month}
                        onMonthChange={setMonth}
                        numberOfMonths={2}
                        captionLayout="dropdown"
                        // hideNavigation จำเป็น — ปุ่ม prev/next ของ shadcn calendar เป็น `absolute inset-x-0 top-0 w-full`
                        // ซึ่งเป็น layer ทับแถบ caption ทั้งแถบ ทำให้คลิก dropdown เดือน/ปีไม่ติด (ใช้ dropdown navigate แทน)
                        hideNavigation
                        startMonth={DROPDOWN_START_MONTH}
                        endMonth={DROPDOWN_END_MONTH}
                        components={{
                            Dropdown: ( props: DropdownProps ) => (
                                <Select
                                    value={String(props.value)}
                                    onValueChange={( next ) => {
                                        if ( props.onChange && next !== null ) handleCalendarChange( next, props.onChange )
                                    }}
                                >
                                    <SelectTrigger className="first:grow">
                                        <SelectValue>
                                            { props.options?.find(( option ) => option.value === props.value )?.label }
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent align="start">
                                        <SelectGroup>
                                        { props.options?.map(( option ) => (
                                            <SelectItem
                                                key={option.value}
                                                value={String(option.value)}
                                                disabled={option.disabled}
                                            >
                                                { option.label }
                                            </SelectItem>
                                        ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            ),
                            DropdownNav: ( props: DropdownNavProps ) => (
                                <div className="flex w-full items-center gap-2"> { props.children } </div>
                            ),
                        }}
                    />
                </div>
            </PopoverContent>
        </Popover>
    )
}
