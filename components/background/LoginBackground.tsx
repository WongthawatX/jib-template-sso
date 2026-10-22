import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

type Props = {
    className?: string;
    accent?: string;
}

// สี accent เริ่มต้น — ผูกกับ primary ของธีม (รองรับ dark mode ผ่าน CSS variable)
const DEFAULT_ACCENT = "var(--primary)"

// อนุภาคลอยขึ้น — กำหนดค่าคงที่ไว้ให้ตำแหน่ง/จังหวะไม่กระโดดตอน re-render
const PARTICLES = [
    { left: 6,  size: 6,  duration: 17, delay: 0,   opacity: 0.55 },
    { left: 13, size: 3,  duration: 13, delay: 4,   opacity: 0.40 },
    { left: 21, size: 9,  duration: 22, delay: 2,   opacity: 0.30 },
    { left: 28, size: 4,  duration: 15, delay: 7,   opacity: 0.50 },
    { left: 35, size: 7,  duration: 19, delay: 1,   opacity: 0.35 },
    { left: 43, size: 3,  duration: 12, delay: 9,   opacity: 0.45 },
    { left: 50, size: 10, duration: 24, delay: 5,   opacity: 0.25 },
    { left: 57, size: 5,  duration: 16, delay: 3,   opacity: 0.45 },
    { left: 64, size: 8,  duration: 21, delay: 8,   opacity: 0.30 },
    { left: 71, size: 4,  duration: 14, delay: 11,  opacity: 0.50 },
    { left: 79, size: 6,  duration: 18, delay: 6,   opacity: 0.40 },
    { left: 86, size: 3,  duration: 13, delay: 10,  opacity: 0.45 },
    { left: 93, size: 8,  duration: 23, delay: 2.5, opacity: 0.28 },
]

export default function LoginBackground({ className, accent = DEFAULT_ACCENT }: Props) {
    // สีร่วมชุดจากธีม (ผสมให้ได้โทนสดใสหลายเฉด)
    const c1 = accent
    const c2 = `color-mix(in srgb, ${accent} 55%, #22d3ee)`
    const c3 = `color-mix(in srgb, ${accent} 45%, #f472b6)`
    const c4 = `color-mix(in srgb, ${accent} 60%, #a855f7)`

    return (
        <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
            {/* 1) Aurora mesh — ไล่เฉดหลายจุดเลื่อนไปมา */}
            <div
                className="absolute inset-[-20%] motion-safe:animate-aurora opacity-70 blur-3xl"
                style={{
                    backgroundImage: `
                        radial-gradient(38rem 30rem at 20% 25%, ${c1}, transparent 65%),
                        radial-gradient(34rem 28rem at 80% 70%, ${c2}, transparent 65%),
                        radial-gradient(30rem 26rem at 55% 15%, ${c3}, transparent 65%)
                    `,
                    backgroundSize: "160% 160%, 160% 160%, 160% 160%",
                    backgroundRepeat: "no-repeat",
                } as CSSProperties}
            />

            {/* 2) ลำแสงเฉียง */}
            <div
                className="absolute -top-1/4 left-1/4 h-[150%] w-72 motion-safe:animate-beam blur-2xl"
                style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${c4}, transparent)` }}
            />

            {/* 3) กริดวิ่งขึ้น */}
            <div
                className="absolute inset-0 motion-safe:animate-grid-pan mask-[radial-gradient(ellipse_at_center,black_35%,transparent_75%)] opacity-[0.18]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, ${accent} 1px, transparent 1px),
                        linear-gradient(to bottom, ${accent} 1px, transparent 1px)
                    `,
                    backgroundSize: "40px 40px",
                }}
            />

            {/* 4) อนุภาคลอยขึ้น */}
            { PARTICLES.map(( p, i ) => (
                <span
                    key={i}
                    className="absolute bottom-[-10%] motion-safe:animate-float-up rounded-full blur-[1px]"
                    style={{
                        left: `${p.left}%`,
                        width: p.size,
                        height: p.size,
                        opacity: p.opacity,
                        backgroundColor: i % 3 === 0 ? c2 : i % 3 === 1 ? c3 : c1,
                        animationDuration: `${p.duration}s`,
                        animationDelay: `${p.delay}s`,
                        boxShadow: `0 0 ${p.size * 2}px ${accent}`,
                    }}
                />
            )) }

            {/* 5) ขอบมืดแบบ vignette ช่วยดันแสงด้านหลังให้อยู่รอบขอบจอ */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,var(--sidebar)_100%)] opacity-35" />
        </div>
    )
}
