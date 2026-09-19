import { useRef, type ReactNode } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { cn } from "cn"

// Tarjeta metálica reutilizable de Sección 2; al pasar el mouse, un LED destella (contextSafe de useGSAP).
interface DocCardProps {
  title: string
  children: ReactNode
  className?: string
}

export function DocCard({ title, children, className }: DocCardProps) {
  const ledRef = useRef<HTMLSpanElement>(null)
  const { contextSafe } = useGSAP(() => {}, { scope: ledRef })

  const handleFlash = contextSafe(() => {
    if (!ledRef.current) return
    gsap.fromTo(
      ledRef.current,
      { autoAlpha: 1, scale: 1.6 },
      { scale: 1, duration: 0.35, ease: "power2.out" }
    )
  })

  return (
    <div
      onMouseEnter={handleFlash}
      className={cn(
        "flex h-full flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-rack-panel p-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_4px_16px_rgba(0,0,0,0.6)]",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span
          ref={ledRef}
          className="size-2 rounded-full bg-rack-accent shadow-[0_0_8px_var(--color-rack-accent)]"
        />
        <h3 className="font-display text-sm font-semibold tracking-wide text-slate-100 uppercase">
          {title}
        </h3>
      </div>
      <div className="font-mono text-xs leading-relaxed text-rack-text-dim">{children}</div>
    </div>
  )
}
