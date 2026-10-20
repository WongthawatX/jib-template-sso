"use client"

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  /**
   * แกนที่จะให้มี scrollbar. Scrollbar ต้องเป็นลูกของ Root (พี่น้องกับ Viewport) เท่านั้น
   * ส่ง <ScrollBar /> เข้ามาเป็น children ไม่ได้ เพราะ children จะถูกวางไว้ใน Viewport
   */
  orientation?: "vertical" | "horizontal" | "both"
}) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {/* Content จำเป็น ไม่ใช่แค่ div ห่อเฉยๆ — base-ui ติด ResizeObserver ไว้ที่ชิ้นนี้เพื่อวัดใหม่
            เวลาเนื้อหาเปลี่ยนขนาด ถ้าไม่มี มันจะวัด overflow แค่ตอน viewport เปลี่ยนขนาดหรือตอน scroll
            ทำให้ scrollbar ค้างโชว์ทั้งที่เนื้อหาหดลงจนไม่ล้นแล้ว

            base-ui ใส่ `min-width: fit-content` มาแบบ inline เพื่อไม่ให้เนื้อหาถูกบีบตอน scroll แนวนอน
            แต่ถ้าเป็นแนวตั้งล้วน ค่านี้จะดันเนื้อหากว้างตามของที่กว้างสุดข้างใน (เช่นตารางที่ scroll เองได้)
            แล้วทำให้ทั้งหน้าเลื่อนแนวนอน จึงปิดทิ้งเฉพาะกรณีนั้น */}
        <ScrollAreaPrimitive.Content
          data-slot="scroll-area-content"
          style={orientation === "vertical" ? { minWidth: 0 } : undefined}
        >
          {children}
        </ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>
      {orientation !== "horizontal" && <ScrollBar orientation="vertical" />}
      {orientation !== "vertical" && <ScrollBar orientation="horizontal" />}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none opacity-0 transition-opacity delay-300 duration-300 select-none data-hovering:opacity-100 data-hovering:delay-0 data-scrolling:opacity-100 data-scrolling:delay-0 data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2 data-vertical:flex-col data-vertical:border-l data-vertical:border-l-transparent",
        className
      )}
      {...props}
    >
      {/* base-ui ใส่ inline style ให้เฉพาะแกนที่เลื่อน (vertical → height, horizontal → width)
          จึงต้องกำหนดขนาดแกนขวางเองทั้งสองด้าน ไม่งั้น horizontal thumb จะสูง 0 แล้วมองไม่เห็น
          (inline style ของ base-ui ชนะ class เสมอ จึงไม่ตีกับ h-full/w-full) */}
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative h-full w-full rounded-full bg-primary/50 transition-colors hover:bg-primary"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
