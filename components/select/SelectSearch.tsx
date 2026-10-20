"use client"

import { useState } from "react"

import { ChevronDown, X, Check } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { Input } from "../ui/input"

import { cn } from "@/lib/utils"

export type SelectOption = { value: string; label: string; title?: string }

export type SelectSize = "sm" | "default" | "lg"

// ความสูง/padding ต้องตรงกับสเกลของ Button (components/ui/button.tsx) และ Input (components/ui/input.tsx)
// sm → h-7 (เท่า Button size="sm"), default → h-8 (เท่า Button/Input ดีฟอลต์), lg → h-9 (เท่า Button size="lg")
// ไม่งั้นเวลาวางแถวเดียวกับ Input/Button/DatePickerRange จะสูงไม่เท่ากัน
const SIZE_CLASSES: Record<SelectSize, { trigger: string; text: string; chip: string; icon: string }> = {
    sm: {
        trigger: "min-h-7 px-2.5 py-1",
        text: "text-xs",
        chip: "text-[11px] px-1 py-0.5",
        icon: "size-3.5",
    },
    default: {
        trigger: "min-h-8 px-2.5 py-1",
        text: "text-sm",
        chip: "text-xs px-1.5 py-0.5",
        icon: "size-4",
    },
    lg: {
        trigger: "min-h-9 px-2.5 py-1.5",
        text: "text-base",
        chip: "text-sm px-2 py-1",
        icon: "size-5",
    },
}

type Props = {
    placeholder?: string
    options: SelectOption[]
    value: string | undefined
    onChange: ( value: string | undefined ) => void
    className?: string
    disabled?: boolean
    /** ขนาดของ trigger (ปรับความสูง/padding/ขนาดตัวอักษร) */
    size?: SelectSize
    /** ใช้ `false` เมื่ออยู่ภายใน Sheet/Dialog เพื่อไม่ให้ Popover ชน focus trap */
    modal?: boolean
}

export default function SelectSearch({ placeholder = "กรุณาเลือก", options, value, onChange, className, disabled, size = "default", modal = true }: Props) {
    const sz = SIZE_CLASSES[size]
    const [ open, setOpen ] = useState<boolean>(false)
    const [ search, setSearch ] = useState<string>("")

    const filtered = search.trim()
        ? options.filter(( o ) => 
            o.label.toLowerCase().includes( search.toLowerCase() ) ||
            ( o.title ?? "" ).toLowerCase().includes( search.toLowerCase() )
          )
        : options

    const selectedOption = options.find(( o ) => String(o.value) === String(value ?? ""))

    const select = ( val: string ) => {
        onChange( val )
        setOpen(false)
        setSearch("")
    }

    const clear = ( e: React.MouseEvent | React.PointerEvent ) => {
        e.stopPropagation()
        e.preventDefault()
        onChange( undefined )
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={( o ) => { setOpen(o); if ( !o ) setSearch("") }} modal={modal}>
            <PopoverTrigger
                disabled={disabled}
                render={(
                    <Button
                        variant="outline"
                        className={cn("w-full h-auto justify-between font-normal border border-input bg-card hover:bg-card", sz.trigger, className)}
                    />
                )}
            >
                    { !selectedOption ? (
                        <span className={cn("text-muted-foreground truncate", sz.text)}> {placeholder} </span>
                    ) : (
                        <div className="flex flex-1 min-w-0 items-center gap-1">
                            <span className={cn("inline-flex min-w-0 items-center gap-0.5 rounded bg-secondary text-secondary-foreground", sz.chip)}>
                                <span className="truncate" title={selectedOption.label}>{selectedOption.label}</span>
                                <span
                                    role="button"
                                    tabIndex={-1}
                                    aria-label="ล้างค่า"
                                    className="inline-flex shrink-0 cursor-pointer items-center rounded-sm hover:text-destructive"
                                    onMouseDown={( e ) => { e.preventDefault(); e.stopPropagation() }}
                                    onClick={clear}
                                >
                                    <X className="size-3" />
                                </span>
                            </span>
                        </div>
                    )}
                    <ChevronDown className={cn("shrink-0 text-muted-foreground ml-1", sz.icon)} />
            </PopoverTrigger>
            <PopoverContent
                className="w-(--anchor-width) p-0 pb-2"
                align="start"
                sideOffset={4}
            >
                {/* Search */}
                <div className="px-2 py-1.5 border-b">
                    <Input
                        placeholder="ค้นหา..."
                        value={search}
                        onChange={( e ) => setSearch( e.target.value )}
                        className="h-7 text-sm border-0 shadow-none focus-visible:ring-0 p-0"
                        autoFocus
                    />
                </div>

                {/* Options */}
                <div className="max-h-[min(50vh,280px)] overflow-y-auto p-1">
                    { filtered.length === 0 ? (
                        <div className="py-3 text-center text-sm text-muted-foreground"> ไม่พบข้อมูล </div>
                    ) : filtered.map(( option ) => {
                        const isActive = String(option.value) === String(value ?? "")
                        return (
                            <div
                                key={option.value}
                                className="flex items-center justify-between px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent text-sm"
                                onClick={() => select( String(option.value) )}
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="line-clamp-1 text-sm"> {option.label} </span>
                                    { option.title && (
                                        <span className="text-[11px] text-muted-foreground line-clamp-1"> {option.title} </span>
                                    )}
                                </div>
                                { isActive && <Check className="size-4 text-primary shrink-0" /> }
                            </div>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    )
}
