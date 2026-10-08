const THAI_WEEKDAYS_SHORT = [ "อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์" ]
const THAI_WEEKDAYS_FULL = [ "อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์" ]
const THAI_MONTHS_FULL = [ "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม" ]

const pad = ( value: number ): string => String(value).padStart(2, "0")

/** คืนค่า YYYY-MM-DD ตามเวลาเครื่อง (ไม่ใช้ toISOString เพราะจะเป็น UTC) */
export const formatDate = ( date: Date = new Date() ): string =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** คืนค่า dd/MM/yyyy (ค.ศ.) สำหรับแสดงผล */
export const formatDateDMY = ( date: Date = new Date() ): string =>
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`

/**
 * แปลงค่าวันที่จาก prop เป็น Date — รับได้ทั้ง Date, "YYYY-MM-DD" และ "dd/MM/yyyy"
 * คืน undefined ถ้าแปลงไม่ได้ (อย่าคืน Invalid Date ออกไป เพราะจะไปพังที่ปลายทาง)
 */
export const parseDateValue = ( value?: Date | string | null ): Date | undefined => {
    if ( !value ) return undefined
    if ( value instanceof Date ) return Number.isNaN(value.getTime()) ? undefined : value

    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
    if ( iso ) return new Date( Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]) )

    const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value)
    if ( dmy ) return new Date( Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]) )

    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

/** คืนค่า HH:mm ตามเวลาเครื่อง */
export const formatTime = ( date: Date = new Date() ): string =>
    `${pad(date.getHours())}:${pad(date.getMinutes())}`

/** เช่น "พฤหัส 2026-09-10" (full = true จะได้ "พฤหัสบดี") */
export const formatThaiDate = ( date: Date = new Date(), full: boolean = false ): string => {
    const weekdays = full ? THAI_WEEKDAYS_FULL : THAI_WEEKDAYS_SHORT

    return `${weekdays[date.getDay()]} ${formatDate(date)}`
}

/** เช่น "ศุกร์ 11 กันยายน 2569" — ชื่อวัน + วัน + ชื่อเดือนไทยเต็ม + ปี พ.ศ. (full = true จะได้ชื่อวันเต็ม) */
export const formatThaiDateLong = ( date: Date = new Date(), full: boolean = false ): string => {
    const weekdays = full ? THAI_WEEKDAYS_FULL : THAI_WEEKDAYS_SHORT

    return `${weekdays[date.getDay()]} ${date.getDate()} ${THAI_MONTHS_FULL[date.getMonth()]} ${date.getFullYear() + 543}`
}

export const isLinkActive = ( pathname: string, url: string ): boolean => pathname === url || pathname.startsWith(`${url}/`)