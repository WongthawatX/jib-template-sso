"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

import { cn } from "@/lib/utils"

/**
 * cell สำหรับข้อความยาวในตาราง — ตัดด้วย line-clamp แล้วโชว์ค่าเต็มใน tooltip ตอน hover/focus
 * ใช้แทนการใส่ ScrollArea ในแต่ละ cell เพราะไม่มีแถบ scrollbar โผล่ทุกแถวให้รกสายตา
 *
 * delay ของ tooltip คุมรวมที่ <TooltipProvider> ใน components/layout/Providers.tsx
 * (ไม่ต้องตั้ง provider เพิ่มที่นี่ และ Tooltip.Root ของ base-ui ก็ทำงานได้เองแม้ไม่มี provider)
 *
 * หมายเหตุ: tooltip ขึ้นทุกครั้งแม้ข้อความสั้นพอที่จะไม่ถูกตัด — ถ้าจะกันต้องวัด
 * scrollHeight/clientHeight ฝั่ง client เพิ่ม ซึ่งยังไม่คุ้มกับความซับซ้อนตอนนี้
 */

type ClampLines = 1 | 2 | 3

// ต้องเขียนคลาสเต็มเป็น literal ห้ามต่อสตริง ไม่งั้น Tailwind scan ไม่เจอแล้วไม่ compile utility ออกมา
const LINE_CLAMP: Record<ClampLines, string> = {
    1: "line-clamp-1",
    2: "line-clamp-2",
    3: "line-clamp-3",
}

type Props = {
    text: string;
    /** จำนวนบรรทัดก่อนตัด (ดีฟอลต์ 1) */
    lines?: ClampLines;
    /** ข้อความแทนเมื่อค่าว่าง (ดีฟอลต์ "-") */
    placeholder?: string;
    side?: React.ComponentProps<typeof TooltipContent>["side"];
    sideOffset?: React.ComponentProps<typeof TooltipContent>["sideOffset"];
    className?: string;
}

export default function ClampedCell({
    text,
    lines = 1,
    placeholder = "-",
    side = "top",
    sideOffset = 7,
    className,
}: Props) {
    if ( !text ) return <div className="text-start text-muted-foreground"> { placeholder } </div>

    return (
        <Tooltip>
            {/* tabIndex ให้ keyboard เข้าถึงได้ ไม่ใช่เปิดได้แค่ hover (base-ui เปิด tooltip ตอน focus ให้เอง) */}
            <TooltipTrigger
                tabIndex={0}
                render={(
                    <div
                        className={cn(
                            LINE_CLAMP[ lines ],
                            "cursor-default rounded-sm text-start leading-snug outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                            className,
                        )}
                    />
                )}
            >
                { text }
            </TooltipTrigger>
            <TooltipContent sideOffset={sideOffset} side={side} className="max-w-xs text-start leading-relaxed">
                { text }
            </TooltipContent>
        </Tooltip>
    )
}
