"use client"

import { useMemo, useState } from "react"

import {
    ArrowLeftToLine,
    ArrowRightToLine,
    Columns3,
    ListOrdered,
    Maximize2,
    Pin,
    PinOff,
    RotateCcw,
    Scan,
    Search,
} from "lucide-react"

import { Button } from "../ui/button"
import { Checkbox } from "../ui/checkbox"
import { Input } from "../ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { ScrollArea } from "../ui/scroll-area"
import { Separator } from "../ui/separator"
import { Switch } from "../ui/switch"

import { cn } from "@/lib/utils"
import { BORDER_WIDTH_OPTIONS, FONT_SIZE_OPTIONS } from "./tablePrefs"

import type { BorderIntensity, Density, PinSide, TablePrefs, WidthMode } from "./tablePrefs"

/** คอลัมน์ที่เอามาแสดงในรายการ — ตัวที่ dev ตรึงไว้เองจะล็อก ผู้ใช้แก้ไม่ได้ */
export type SettingsColumn = {
    key: string;
    label: string;
    /** dev กำหนด `fixed` มาในนิยามคอลัมน์ → ผู้ใช้ซ่อน/ตรึงเองไม่ได้ */
    locked: boolean;
}

type Props = {
    columns: SettingsColumn[];
    prefs: TablePrefs;
    onChange: ( patch: Partial<TablePrefs> ) => void;
    onReset: ( keys?: ( keyof TablePrefs )[] ) => void;
}

const DENSITY_OPTIONS: { value: Density; label: string }[] = [
    { value: "compact", label: "แน่น" },
    { value: "normal", label: "ปกติ" },
    { value: "comfortable", label: "โปร่ง" },
]

const WIDTH_OPTIONS: { value: WidthMode; label: string; icon: typeof Scan }[] = [
    { value: "content", label: "พอดีข้อมูล", icon: Maximize2 },
    { value: "screen", label: "พอดีจอ", icon: Scan },
]

const BORDER_INTENSITY_OPTIONS: { value: BorderIntensity; label: string }[] = [
    { value: "none", label: "ไม่มี" },
    { value: "light", label: "จาง" },
    { value: "normal", label: "ปกติ" },
    { value: "strong", label: "เข้ม" },
]

/** หัวข้อกลุ่มของแผง ใช้สไตล์เดียวกันทุกกลุ่มเพื่อให้อ่านเป็นลำดับชั้น */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"> { title } </h3>
        { children }
    </section>
)

/** แถวหนึ่งการตั้งค่า = ป้ายชื่อบน + ตัวควบคุมล่าง */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
        <span className="text-[11px] text-muted-foreground"> { label } </span>
        { children }
    </div>
)

/** ปุ่มเลือกค่าแบบกลุ่ม ใช้ซ้ำหลายที่ในแผงนี้ */
const OptionGroup = <T extends string | number>({ value, options, onSelect, disabled }: {
    value: T;
    options: { value: T; label: string; icon?: typeof Scan }[];
    onSelect: ( next: T ) => void;
    disabled?: boolean;
}) => (
    <div className={cn("flex gap-1", disabled && "pointer-events-none opacity-40")}>
        { options.map(( option ) => {
            const Icon = option.icon
            const isActive = value === option.value

            return (
                <Button
                    key={String(option.value)}
                    size="xs"
                    variant={isActive ? "secondary" : "outline"}
                    className={cn("min-w-0 flex-1 gap-1 px-1", isActive && "border-primary/40 text-primary")}
                    onClick={() => onSelect( option.value )}
                >
                    { Icon && <Icon className="size-3 shrink-0" /> }
                    <span className="truncate text-[11px]"> { option.label } </span>
                </Button>
            )
        }) }
    </div>
)

/** สวิตช์เปิด/ปิดหนึ่งตัว */
const ToggleRow = ({ label, checked, onChange }: {
    label: string;
    checked: boolean;
    onChange: ( next: boolean ) => void;
}) => (
    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md border px-2 py-1.5">
        <span className="text-[11px]"> { label } </span>
        <Switch checked={checked} onCheckedChange={onChange} />
    </label>
)

export default function TableColumnSettings({ columns, prefs, onChange, onReset }: Props) {
    const [ search, setSearch ] = useState<string>("")

    const toggleable = useMemo(() => columns.filter(( c ) => !c.locked ), [ columns ])
    const visibleCount = toggleable.filter(( c ) => !prefs.hidden.includes( c.key )).length

    const filtered = useMemo(() => {
        const keyword = search.trim().toLowerCase()
        if ( !keyword ) return columns
        return columns.filter(( c ) => c.label.toLowerCase().includes( keyword ))
    }, [ columns, search ])

    const setHidden = ( key: string, hidden: boolean ) => {
        onChange({
            hidden: hidden
                ? [ ...new Set([ ...prefs.hidden, key ]) ]
                : prefs.hidden.filter(( item ) => item !== key ),
        })
    }

    const setPin = ( key: string, side: PinSide | null ) => {
        const next = { ...prefs.pins }
        if ( side ) next[key] = side
        else delete next[key]
        onChange({ pins: next })
    }

    const allVisible = visibleCount === toggleable.length
    const noneVisible = visibleCount === 0
    const pinnedCount = Object.keys(prefs.pins).length

    return (
        <Popover>
            <PopoverTrigger
                render={(
                    <Button size="xs" variant="outline" className="gap-1.5">
                        <Columns3 className="size-3.5" />
                        <span className="text-xs"> ปรับแต่งคอลัมน์ </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            { visibleCount }/{ toggleable.length }
                        </span>
                    </Button>
                )}
            />

            {/* flex-row จำเป็น — base class ของ PopoverContent มี flex-col อยู่ ถ้าไม่ทับจะเรียงลงเป็นแถวเดียว
                align="start" เพราะปุ่มอยู่มุมซ้ายล่าง ถ้า "end" แผงจะกางไปทางซ้ายแล้วตกขอบจอ */}
            <PopoverContent
                align="start"
                side="top"
                className="flex h-88 w-[44rem] max-w-[calc(100vw-2rem)] flex-row gap-0 overflow-hidden p-0"
            >
                {/* ─── คอลัมน์ 1: รายการคอลัมน์ ─── */}
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="border-b p-2.5">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="ค้นหาคอลัมน์"
                                value={search}
                                onChange={( e ) => setSearch( e.target.value )}
                                className="h-7 pl-7 text-xs"
                            />
                        </div>
                    </div>

                    <label className="flex cursor-pointer items-center justify-between gap-2 border-b bg-muted/40 px-2.5 py-1.5">
                        <span className="flex min-w-0 items-center gap-2">
                            <Checkbox
                                checked={allVisible}
                                indeterminate={!allVisible && !noneVisible}
                                onCheckedChange={( checked ) => onChange({
                                    hidden: checked ? [] : toggleable.map(( c ) => c.key ),
                                })}
                            />
                            <span className="text-xs font-medium"> เลือกทั้งหมด </span>
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                            { visibleCount }/{ toggleable.length }
                        </span>
                    </label>

                    <ScrollArea className="min-h-0 flex-1">
                        <div className="flex flex-col p-1.5">
                            { filtered.length === 0 ? (
                                <p className="py-8 text-center text-xs text-muted-foreground"> ไม่พบคอลัมน์ </p>
                            ) : filtered.map(( column ) => {
                                const isHidden = prefs.hidden.includes( column.key )
                                const pin = prefs.pins[column.key] ?? null

                                return (
                                    <div
                                        key={column.key}
                                        className="flex h-8 items-center gap-2 rounded-md px-1.5 hover:bg-muted/60"
                                    >
                                        <Checkbox
                                            checked={!isHidden}
                                            disabled={column.locked}
                                            onCheckedChange={( checked ) => setHidden( column.key, !checked )}
                                        />
                                        <span className={cn("min-w-0 flex-1 truncate text-xs", isHidden && "text-muted-foreground line-through")}>
                                            { column.label }
                                        </span>

                                        { column.locked ? (
                                            <Pin className="size-3 shrink-0 text-muted-foreground" aria-label="dev ตรึงไว้" />
                                        ) : (
                                            <div className="flex shrink-0 gap-0.5">
                                                <Button
                                                    size="icon-xs"
                                                    variant={pin === "left" ? "secondary" : "ghost"}
                                                    title={pin === "left" ? "เลิกตรึง" : "ตรึงซ้าย"}
                                                    aria-label={`ตรึงคอลัมน์ ${column.label} ไว้ซ้าย`}
                                                    className={cn(pin === "left" && "text-primary")}
                                                    onClick={() => setPin( column.key, pin === "left" ? null : "left" )}
                                                >
                                                    <ArrowLeftToLine />
                                                </Button>
                                                <Button
                                                    size="icon-xs"
                                                    variant={pin === "right" ? "secondary" : "ghost"}
                                                    title={pin === "right" ? "เลิกตรึง" : "ตรึงขวา"}
                                                    aria-label={`ตรึงคอลัมน์ ${column.label} ไว้ขวา`}
                                                    className={cn(pin === "right" && "text-primary")}
                                                    onClick={() => setPin( column.key, pin === "right" ? null : "right" )}
                                                >
                                                    <ArrowRightToLine />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )
                            }) }
                        </div>
                    </ScrollArea>
                </div>

                <Separator orientation="vertical" className="h-auto" />

                {/* ─── คอลัมน์ 2: ขนาด + เส้นตาราง ─── */}
                <div className="flex w-52 shrink-0 flex-col gap-4 p-3">
                    <Section title="ขนาด">
                        <Field label="ความกว้างคอลัมน์">
                            <OptionGroup
                                value={prefs.widthMode}
                                options={WIDTH_OPTIONS}
                                onSelect={( widthMode ) => onChange({ widthMode })}
                            />
                        </Field>
                        <Field label="ความสูงแถว">
                            <OptionGroup
                                value={prefs.density}
                                options={DENSITY_OPTIONS}
                                onSelect={( density ) => onChange({ density })}
                            />
                        </Field>
                    </Section>

                    <Section title="เส้นตาราง">
                        <Field label="ความเข้ม">
                            <OptionGroup
                                value={prefs.borderIntensity}
                                options={BORDER_INTENSITY_OPTIONS}
                                onSelect={( borderIntensity ) => onChange({ borderIntensity })}
                            />
                        </Field>
                        <Field label="ความหนา">
                            <OptionGroup
                                value={prefs.borderWidth}
                                options={BORDER_WIDTH_OPTIONS.map(( width ) => ({ value: width, label: `${width}px` }))}
                                onSelect={( borderWidth ) => onChange({ borderWidth })}
                                disabled={prefs.borderIntensity === "none"}
                            />
                        </Field>
                        <ToggleRow
                            label="เส้นคั่นคอลัมน์"
                            checked={prefs.columnDivider}
                            onChange={( columnDivider ) => onChange({ columnDivider })}
                        />
                    </Section>
                </div>

                <Separator orientation="vertical" className="h-auto" />

                {/* ─── คอลัมน์ 3: ตัวหนังสือ + คืนค่า ─── */}
                <div className="flex w-52 shrink-0 flex-col gap-4 p-3">
                    <Section title="ตัวหนังสือ (px)">
                        <Field label="หัวตาราง">
                            <OptionGroup
                                value={prefs.headerFontSize}
                                options={FONT_SIZE_OPTIONS.map(( size ) => ({ value: size, label: String(size) }))}
                                onSelect={( headerFontSize ) => onChange({ headerFontSize })}
                            />
                        </Field>
                        <Field label="ในแถว">
                            <OptionGroup
                                value={prefs.bodyFontSize}
                                options={FONT_SIZE_OPTIONS.map(( size ) => ({ value: size, label: String(size) }))}
                                onSelect={( bodyFontSize ) => onChange({ bodyFontSize })}
                            />
                        </Field>
                        <ToggleRow
                            label="แถบสลับสี"
                            checked={prefs.striped}
                            onChange={( striped ) => onChange({ striped })}
                        />
                    </Section>

                    <Section title="คืนค่า">
                        <Button size="xs" variant="outline" className="justify-start gap-1.5" onClick={() => onReset([ "order" ])}>
                            <ListOrdered className="size-3" />
                            <span className="text-[11px]"> ตำแหน่งคอลัมน์ </span>
                        </Button>
                        <Button size="xs" variant="outline" className="justify-start gap-1.5" onClick={() => onReset([ "hidden", "pins" ])}>
                            <PinOff className="size-3" />
                            <span className="text-[11px]"> การซ่อน/ตรึง { pinnedCount > 0 && `(${pinnedCount})` } </span>
                        </Button>
                        <Button size="xs" variant="destructive" className="justify-start gap-1.5" onClick={() => onReset()}>
                            <RotateCcw className="size-3" />
                            <span className="text-[11px]"> คืนค่าทั้งหมด </span>
                        </Button>
                    </Section>
                </div>
            </PopoverContent>
        </Popover>
    )
}
