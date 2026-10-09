"use client"

import TableColumnSettings from "./TableColumnSettings"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { Table } from "antd"
import { closestCenter, DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable"
import { GripVertical } from "lucide-react"
import { BORDER_COLOR, DENSITY_PADDING, useTablePrefs } from "./tablePrefs"

import { cn } from "@/lib/utils"

import type { TableColumnsType, TableProps } from "antd"
import type { DragEndEvent, DragOverEvent, UniqueIdentifier } from "@dnd-kit/core"

type DragIndexState = {
    active: UniqueIdentifier;
    over: UniqueIdentifier | undefined;
    direction?: "left" | "right";
}

type CellProps = React.HTMLAttributes<HTMLTableCellElement> & { id?: string }

const DragIndexContext = createContext<DragIndexState>({ active: -1, over: -1 })

const dragActiveStyle = ( dragState: DragIndexState, id: string ): React.CSSProperties => {
    const { active, over } = dragState
    if ( active === id ) return { backgroundColor: "gray", opacity: 0.5 }
    if ( over === id && active !== over ) return { borderInlineStart: "1px dashed gray" }
    return {}
}

const DragBodyCell = ({ id, ...props }: CellProps ) => {
    const dragState = useContext(DragIndexContext)
    if ( !id ) return <td {...props} />
    return <td {...props} style={{ ...props.style, ...dragActiveStyle( dragState, id ) }} />
}

const SortableHeaderCell = ({ id, ...props }: CellProps & { id: string }) => {
    const dragState = useContext(DragIndexContext)
    const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id })

    const style: React.CSSProperties = {
        ...props.style,
        cursor: isDragging ? "grabbing" : "grab",
        transition: "background-color 200ms ease, transform 200ms ease",
        ...( isDragging ? { position: "relative", zIndex: 9999, userSelect: "none", transform: "scale(1.02)" } : {} ),
        ...dragActiveStyle( dragState, id ),
    }

    return <th {...props} ref={setNodeRef} style={style} {...attributes} {...listeners} />
}

const DragHeaderCell = ({ id, ...props }: CellProps ) => {
    if ( !id ) return <th {...props} />
    return <SortableHeaderCell {...props} id={id} />
}

type Column<T> = TableColumnsType<T>[number]
type FixedSide = "left" | "right" | null

/**
 * คอลัมน์นี้ถูกตรึงไว้ข้างไหน — rc-table รับได้ทั้ง 5 ค่า (true/left/start = ซ้าย, right/end = ขวา)
 * ดู FixedType ใน @rc-component/table/es/interface.d.ts
 */
const getFixedSide = <T,>( column: Column<T> ): FixedSide => {
    const { fixed } = column
    if ( fixed === true || fixed === "left" || fixed === "start" ) return "left"
    if ( fixed === "right" || fixed === "end" ) return "right"
    return null
}

type Props<T> = TableProps<T> & {
    /**
     * คอลัมน์ที่ใส่ `fixed: "left"` / `fixed: "right"` จะถูกตรึงไว้หัว/ท้ายตารางและลากไม่ได้
     * เพราะ antd บังคับว่าคอลัมน์ที่ตรึงต้องอยู่สุดฝั่งนั้น ถ้าลากไปกลางตารางจะ render เพี้ยน
     * ส่วนคอลัมน์ที่ไม่ตรึงลากสลับกันได้อิสระ (ต้องมี `scroll.x` ด้วย fixed จึงจะมีผล)
     */
    columns: TableColumnsType<T>;
    storageKey?: string;
}

export default function DraggableColumnsTable<T extends object>({ columns: baseColumns, storageKey, ...tableProps }: Props<T>) {
    const [ dragIndex, setDragIndex ] = useState<DragIndexState>({ active: -1, over: -1 })
    const { prefs, update, reset, isCustomized } = useTablePrefs( storageKey )
    const userOrder = prefs.order

    // ระหว่างลาก — บังคับ cursor ทั้งหน้าเป็น grabbing กัน revert ตอนเมาส์อยู่บน body cells
    useEffect(() => {
        const isDragging = dragIndex.active !== -1
        document.body.style.cursor = isDragging ? "grabbing" : ""

        return () => { document.body.style.cursor = "" }
    }, [ dragIndex.active ])

    // รายการคอลัมน์สำหรับแผงตั้งค่า — ต้องมาจาก baseColumns ทั้งหมด (รวมตัวที่ซ่อน) ไม่งั้นเปิดคืนไม่ได้
    const settingsColumns = useMemo(() => baseColumns
        .filter(( c ) => c.key !== undefined )
        .map(( c ) => ({
            key: String(c.key),
            label: typeof c.title === "string" ? c.title : String(c.key),
            // dev ตรึงไว้เองในนิยามคอลัมน์ → ล็อก ผู้ใช้ซ่อน/ย้ายไม่ได้ (เช่นคอลัมน์ปุ่ม action)
            locked: getFixedSide( c ) !== null,
        })),
    [ baseColumns ])

    // แบ่งคอลัมน์เป็น 3 กลุ่มตามการตรึง — ลากได้เฉพาะกลุ่มกลาง
    // antd บังคับว่า fixed left ต้องอยู่ต้นสุด fixed right ต้องอยู่ท้ายสุด ถ้าลากข้ามกลุ่มได้ตารางจะเพี้ยน
    // การตรึงมาได้ 2 ทาง: dev กำหนด `fixed` ในนิยามคอลัมน์ (ล็อก) หรือผู้ใช้สั่งเองจากแผงตั้งค่า
    const groups = useMemo(() => {
        const left: Column<T>[] = []
        const middle: Column<T>[] = []
        const right: Column<T>[] = []
        const lockedRight: Column<T>[] = []

        for ( const column of baseColumns ) {
            const key = column.key !== undefined ? String(column.key) : undefined
            const lockedSide = getFixedSide( column )

            if ( key && lockedSide === null && prefs.hidden.includes( key ) ) continue

            const side = lockedSide ?? ( key ? prefs.pins[key] ?? null : null )
            if ( side === null ) {
                middle.push( column )
                continue
            }

            // ต้องใส่ `fixed` ให้จริง ไม่ใช่แค่ย้ายตำแหน่ง ไม่งั้น antd ไม่ทำ sticky ให้
            // (คอลัมน์ที่ dev ตรึงมาเองมี fixed อยู่แล้ว ไม่ต้องแตะ)
            const pinned = lockedSide ? column : { ...column, fixed: side }

            if ( side === "left" ) left.push( pinned )
            // คอลัมน์ที่ dev ตรึงขวาควรอยู่ริมสุด ให้ของที่ผู้ใช้ตรึงเองมาก่อน
            else ( lockedSide ? lockedRight : right ).push( pinned )
        }

        return { left, middle, right: [ ...right, ...lockedRight ] }
    }, [ baseColumns, prefs.hidden, prefs.pins ])

    // ลำดับดีฟอลต์ของกลุ่มกลาง (เฉพาะตัวที่มี key เพราะ key คือ id ที่ DnD ใช้)
    const defaultOrder = useMemo(
        () => groups.middle.filter(( c ) => c.key !== undefined ).map(( c ) => String(c.key)),
        [ groups.middle ],
    )

    // ลำดับจริง = คำนวณสดจาก defaultOrder + userOrder (derived state, ไม่ใช้ effect เลยไม่มี cascading render)
    // คงลำดับที่ผู้ใช้จัดไว้เท่าที่ key ยังอยู่ในกลุ่มกลาง แล้วต่อท้ายด้วยคอลัมน์ใหม่
    // (key ที่เคยลากไว้แล้วภายหลังถูกเปลี่ยนเป็น fixed จะถูกกรองออกตรงนี้เอง)
    const columnOrder = useMemo(() => {
        const kept = userOrder.filter(( key ) => defaultOrder.includes( key ))
        const added = defaultOrder.filter(( key ) => !kept.includes( key ))

        return [ ...kept, ...added ]
    }, [ defaultOrder, userOrder ])

    const persistOrder = ( order: string[] ) => update({ order })

    const columns: TableColumnsType<T> = useMemo(() => {
        const byKey = new Map( groups.middle.filter(( c ) => c.key !== undefined ).map(( c ) => [ String(c.key), c ]))
        const orderedMiddle = columnOrder
            .map(( key ) => byKey.get( key ))
            .filter(( c ): c is Column<T> => Boolean(c))
        // คอลัมน์กลุ่มกลางที่ไม่มี key ลากไม่ได้ (ไม่มี id) แต่ต้องคงไว้ ไม่งั้นคอลัมน์หาย
        const middleWithoutKey = groups.middle.filter(( c ) => c.key === undefined )

        // ส่ง id ให้เฉพาะคอลัมน์ที่ลากได้ — DragHeaderCell จะ render <th> ธรรมดาถ้าไม่มี id
        // จึงเป็นตัวกำหนดว่าคอลัมน์ไหนลากได้ โดยไม่ต้องไปยุ่งกับ DnD เพิ่ม
        const decorate = ( column: Column<T>, draggable: boolean ): Column<T> => {
            const id = draggable && column.key !== undefined ? String(column.key) : undefined
            // เก็บ handler เดิมของ caller ไว้ ไม่ทับทิ้ง (ColumnGroupType ไม่มี onCell จึงต้อง cast)
            const original = column as { onHeaderCell?: ( ...args: never[] ) => object; onCell?: ( ...args: never[] ) => object }

            return {
                ...column,
                onHeaderCell: (( ...args: never[] ) => ({
                    ...original.onHeaderCell?.( ...args ),
                    ...( id ? { id } : {} ),
                })) as Column<T>["onHeaderCell"],
                onCell: (( ...args: never[] ) => ({
                    ...original.onCell?.( ...args ),
                    ...( id ? { id } : {} ),
                })) as Column<T>["onCell"],
            }
        }

        return [
            ...groups.left.map(( c ) => decorate( c, false )),
            ...orderedMiddle.map(( c ) => decorate( c, true )),
            ...middleWithoutKey.map(( c ) => decorate( c, false )),
            ...groups.right.map(( c ) => decorate( c, false )),
        ]
    }, [ columnOrder, groups ])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    )

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if ( over && active.id !== over.id ) {
            const activeIndex = columnOrder.findIndex(( k ) => k === active.id )
            const overIndex   = columnOrder.findIndex(( k ) => k === over.id )
            if ( activeIndex >= 0 && overIndex >= 0 ) {
                persistOrder( arrayMove( columnOrder, activeIndex, overIndex ))
            }
        }
        setDragIndex({ active: -1, over: -1 })
    }

    const handleDragOver = ({ active, over }: DragOverEvent) => {
        const activeIndex = columnOrder.findIndex(( k ) => k === active.id )
        const overIndex   = columnOrder.findIndex(( k ) => k === over?.id )
        setDragIndex({
            active:    active.id,
            over:      over?.id,
            direction: overIndex > activeIndex ? "right" : "left",
        })
    }

    const activeColumn = columns.find(( c ) => String(c.key) === String(dragIndex.active))
    const activeTitle  = typeof activeColumn?.title === "function" ? null : activeColumn?.title

    return (
        <div
            className="group/table relative flex min-w-0 flex-col"
            // CSS var ที่ .table-antd-overrides ใน app/antd-overrides.css เอาไปใช้
            data-table-striped={prefs.striped}
            data-table-divider={prefs.columnDivider}
            style={{
                "--table-cell-padding-y": DENSITY_PADDING[prefs.density],
                "--table-header-font-size": `${prefs.headerFontSize}px`,
                "--table-body-font-size": `${prefs.bodyFontSize}px`,
                "--table-border-color": BORDER_COLOR[prefs.borderIntensity],
                "--table-border-width": `${prefs.borderWidth}px`,
            } as React.CSSProperties}
        >

            <DndContext
                sensors={sensors}
                modifiers={[ restrictToHorizontalAxis ]}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                collisionDetection={closestCenter}
            >
                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                    <DragIndexContext.Provider value={dragIndex}>
                        <Table<T>
                            columns={columns}
                            components={{
                                header: { cell: DragHeaderCell },
                                body:   { cell: DragBodyCell },
                            }}
                            {...tableProps}
                            // ความกว้าง/ความสูง/ขนาดตัวหนังสือ มาจากแผงตั้งค่าของผู้ใช้
                            // "พอดีจอ" = ปล่อยให้ antd บีบคอลัมน์ลงในความกว้างที่มี, "พอดีข้อมูล" = max-content แล้ว scroll
                            scroll={{
                                ...tableProps.scroll,
                                x: prefs.widthMode === "screen" ? "100%" : ( tableProps.scroll?.x ?? "max-content" ),
                            }}
                            // merge ไว้ ไม่งั้น className ที่ caller ส่งผ่าน tableProps จะถูกทับหาย
                            className={cn("table-antd-overrides", tableProps.className, "[&_.ant-pagination]:min-h-6 md:[&_.ant-pagination]:pl-60!")}
                        />
                    </DragIndexContext.Provider>
                </SortableContext>

                <DragOverlay>
                    { activeTitle ? (
                        <div
                            className="flex items-center gap-2 bg-background border border-border text-foreground px-3 py-1.5 rounded-md font-medium text-[11px] truncate"
                            style={{ cursor: "grabbing" }}
                        >
                            <GripVertical size={16} />
                            { activeTitle as React.ReactNode }
                        </div>
                    ) : null }
                </DragOverlay>
            </DndContext>
            <div className="mt-2 flex min-h-6 items-center gap-1.5 md:group-has-[.ant-spin-container>.ant-pagination:last-child]/table:absolute md:group-has-[.ant-spin-container>.ant-pagination:last-child]/table:bottom-2 md:group-has-[.ant-spin-container>.ant-pagination:last-child]/table:left-0 md:group-has-[.ant-spin-container>.ant-pagination:last-child]/table:mt-0">
                <TableColumnSettings columns={settingsColumns} prefs={prefs} onChange={update} onReset={reset} />
                { isCustomized && <span className="text-[11px] text-muted-foreground"> ปรับแต่งอยู่ </span> }
            </div>
        </div>
    )
}
