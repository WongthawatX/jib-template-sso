"use client"

import { useEffect, useRef, useState } from "react"

type Options = {
    /** ความสูงขั้นต่ำของพื้นที่แถว (px) กันกรณีพื้นที่เหลือน้อยมาก (default: 160) */
    min?: number;
    /** ปิดการคำนวณ (default: false) */
    disabled?: boolean;
}

const SCROLL_VIEWPORT = '[data-slot="scroll-area-viewport"]'
const ROW = ".ant-table-tbody .ant-table-row:not(.ant-table-measure-row)"

/** คลาดเคลื่อนได้เท่านี้ถือว่าพอดีแล้ว กันไม่ให้ไล่ปรับเพราะเศษ subpixel */
const TOLERANCE = 1
/** เผื่อให้ลงฝั่ง "ไม่ล้น" เสมอ ถ้าเล็งศูนย์พอดีเศษ subpixel จะทำให้หน้าเลื่อนได้ 1px */
const GUARD = 2
/** ยอมให้ค่าไม่ลู่เข้าได้กี่รอบก่อนหยุด — กันลูปค้างถ้าเจอ layout ที่ลงตัวไม่ได้ */
const MAX_STALLS = 3

/**
 * รวม padding/margin ด้านล่างของ ancestor ทุกชั้นระหว่าง element กับ scroll container
 * เป็น "ช่องว่างที่ควรเหลือ" ด้านล่างตาราง (AppShell ใช้ p-5 → 20px)
 */
const getBottomInset = ( from: HTMLElement, until: HTMLElement ): number => {
    let inset = 0
    let node: HTMLElement | null = from

    while ( node && node !== until ) {
        const style = window.getComputedStyle(node)
        inset += ( parseFloat(style.paddingBottom) || 0 ) + ( parseFloat(style.marginBottom) || 0 )
        node = node.parentElement
    }

    return inset
}

/**
 * คืนความสูงสำหรับส่งเข้า `scroll.y` ของตาราง antd ให้ตารางสูงเต็มพื้นที่ที่เหลือพอดี
 * แถวที่เกินจะ scroll อยู่ภายในตัวตารางเอง โดย header กับ pagination ยังอยู่ติดที่
 *
 * ทำไมคืนความสูง ไม่ใช่ pageSize:
 * pageSize เป็นค่าไม่ต่อเนื่อง (14 หรือ 15 ไม่มีระหว่างกลาง) คลาดเคลื่อน 1px ก็ทำให้แถวหาย/เพิ่มทั้งแถว
 * แล้วความสูงตารางที่เปลี่ยนก็ย้อนกลับมาเป็น input ของการวัดอีก → แกว่งไม่จบ
 * ส่วนความสูงเป็นค่าต่อเนื่อง และเมื่อกำหนด `scroll.y` ความสูงตารางจะคงที่ไม่ขึ้นกับจำนวนแถวในหน้า
 *
 * วิธีหาค่า — ไม่ไล่วัดชิ้นส่วนภายในของ antd เลย (เปราะ เคยพลาดเพราะ scrollbar แนวนอนอยู่ในกล่อง
 * body แล้วจึงหักซ้ำ และ margin ของ pagination ที่ล้นออกมา) ใช้หลักเดียวคือ:
 *   "ตอนนี้ body สูง H และขอบล่างตารางเลยเป้าไป δ → ตั้งความสูงใหม่เป็น H + δ"
 * ความสัมพันธ์เป็นเส้นตรง slope −1 จึงลงตัวในรอบเดียวถึงสองรอบ ไม่ใช่การแกว่ง
 *
 * สิ่งที่ต้องระวัง (เคยพลาด): ตอนยังโหลดข้อมูลจะไม่มี header/pagination/แถวให้วัด ค่าที่ได้เป็นขยะ
 * จึงต้องข้ามไปก่อน และต้องรีเซ็ตโควตาการชดเชยทุกครั้งที่ geometry เปลี่ยน (ไม่ใช่แค่ตอนย่อ/ขยายจอ)
 * ไม่งั้นโควตาจะหมดไปตอน layout ยังไม่นิ่ง แล้วค้างอยู่ที่ค่าที่ผิด
 */
export function useTableScrollHeight<T extends HTMLElement>( options: Options = {} ) {
    const { min = 160, disabled = false } = options

    const wrapperRef = useRef<T>(null)
    const stallsRef = useRef<number>(0)
    const lastErrorRef = useRef<number>(Number.POSITIVE_INFINITY)
    const lastGeometryRef = useRef<string>("")
    const [ scrollY, setScrollY ] = useState<number | undefined>(undefined)

    useEffect(() => {
        if ( disabled ) return
        const wrapper = wrapperRef.current
        if ( !wrapper ) return

        const scrollParent = wrapper.closest<HTMLElement>(SCROLL_VIEWPORT)
        if ( !scrollParent ) return

        const measure = () => {
            // ยังโหลดอยู่ / ไม่มีข้อมูล → ไม่มีอะไรให้วัดที่เชื่อถือได้ รอ observer เรียกอีกรอบ
            const isReady = wrapper.querySelector(".ant-table-pagination") ?? wrapper.querySelector(ROW)
            if ( !isReady ) return

            const viewportRect = scrollParent.getBoundingClientRect()
            const bottomInset = getBottomInset( wrapper, scrollParent )
            const offsetTop = Math.round(
                wrapper.getBoundingClientRect().top - viewportRect.top + scrollParent.scrollTop,
            )

            // geometry = ขนาด viewport + ตำแหน่งที่ตารางเริ่ม ถ้าเปลี่ยนถือเป็นรอบใหม่ ให้โควตาใหม่
            // (ความสูงของ filter bar / ชิปสถานะ เปลี่ยนได้ตอนข้อมูลมาถึง ซึ่งไม่ใช่การย่อ/ขยายจอ)
            const geometry = `${scrollParent.clientWidth}x${scrollParent.clientHeight}@${offsetTop}@${bottomInset}`
            if ( geometry !== lastGeometryRef.current ) {
                lastGeometryRef.current = geometry
                stallsRef.current = 0
                lastErrorRef.current = Number.POSITIVE_INFINITY
            }

            // ระยะที่ขอบล่างตารางห่างจากเป้า บวก = ยังเหลือที่ว่าง, ลบ = ล้นออกไป
            const slack = viewportRect.bottom - bottomInset - GUARD - wrapper.getBoundingClientRect().bottom
            const error = Math.abs(slack)

            if ( error <= TOLERANCE ) {
                lastErrorRef.current = error
                return
            }

            // ค่าไม่ลดลง = ไม่ลู่เข้า นับไว้ แล้วหยุดถ้าเกินโควตา
            if ( error >= lastErrorRef.current ) {
                stallsRef.current += 1
                if ( stallsRef.current >= MAX_STALLS ) return
            } else {
                stallsRef.current = 0
            }
            lastErrorRef.current = error

            setScrollY(( previous ) => {
                // รอบแรกยังไม่มีค่าเดิม → ใช้ความสูงปัจจุบันของกล่องที่จะถูกจำกัดเป็นฐาน
                const body = wrapper.querySelector<HTMLElement>(".ant-table-body")
                    ?? wrapper.querySelector<HTMLElement>(".ant-table-content")
                const base = previous ?? ( body?.getBoundingClientRect().height ?? 0 )

                return Math.max( min, Math.round( base + slack ) )
            })
        }

        measure()

        const resizeObserver = new ResizeObserver(measure)
        resizeObserver.observe( scrollParent )
        resizeObserver.observe( wrapper )

        window.addEventListener("resize", measure)

        return () => {
            resizeObserver.disconnect()
            window.removeEventListener("resize", measure)
        }
    }, [ disabled, min ])

    return { wrapperRef, scrollY }
}
