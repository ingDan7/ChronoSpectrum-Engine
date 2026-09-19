import { useRef, type PointerEvent as ReactPointerEvent } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { cn } from "cn"

// Perilla de posiciones fijas (discreta), mismo sistema visual que RotaryKnob pero sin arrastre continuo.

interface SteppedKnobOption<T extends string> {
  value: T
  label: string
  /** Ángulo del indicador: 0 = 12h (arriba), -90 = 9h, 90 = 3h. */
  angle: number
  /** Color propio del indicador/label activo; sin esto usa el verde default. */
  color?: { vivid: string; muted: string }
}

interface SteppedKnobProps<T extends string> {
  label: string
  options: SteppedKnobOption<T>[]
  value: T
  onValueChange: (value: T) => void
  disabled?: boolean
  /** Sobrescribe el diámetro default (82px) con un valor exacto en px. */
  diameter?: number
}

const DEFAULT_DIAMETER = 82

export function SteppedKnob<T extends string>({
  label,
  options,
  value,
  onValueChange,
  disabled = false,
  diameter: diameterOverride,
}: SteppedKnobProps<T>) {
  const DIAMETER = diameterOverride ?? DEFAULT_DIAMETER
  const dialRef = useRef<HTMLDivElement>(null)
  const dialWrapRef = useRef<HTMLDivElement>(null)
  const activeOption = options.find((o) => o.value === value) ?? options[0]

  useGSAP(
    () => {
      if (!dialRef.current) return
      gsap.to(dialRef.current, {
        rotate: activeOption.angle,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      })
    },
    { dependencies: [activeOption.angle], scope: dialRef }
  )

  const updateFromClientPoint = (clientX: number, clientY: number) => {
    const el = dialWrapRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = clientX - cx
    const dy = clientY - cy
    // 0° = arriba (12h), positivo = sentido horario (misma convención que option.angle).
    const angle = (Math.atan2(dx, -dy) * 180) / Math.PI

    let closest = options[0]
    let closestDist = Infinity
    for (const opt of options) {
      const dist = Math.abs(((angle - opt.angle + 540) % 360) - 180)
      if (dist < closestDist) {
        closestDist = dist
        closest = opt
      }
    }
    if (closest.value !== value) onValueChange(closest.value)
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromClientPoint(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.buttons !== 1) return
    updateFromClientPoint(e.clientX, e.clientY)
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", disabled && "opacity-40")}>
      <span className="flex h-8 max-w-[120px] items-center justify-center text-center font-mono text-[10px] leading-tight tracking-widest text-rack-text-dim uppercase">
        {label}
      </span>

      <div
        ref={dialWrapRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="relative"
        style={{
          width: DIAMETER,
          height: DIAMETER,
          touchAction: "none",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <svg
          aria-hidden
          className="pointer-events-none absolute text-rack-text-dim/50"
          style={{ width: DIAMETER, height: DIAMETER }}
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeDasharray="2 5" strokeWidth="1" />
        </svg>

        <div
          ref={dialRef}
          className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-neutral-500 via-neutral-700 to-neutral-900 shadow-[0_4px_10px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.15)]"
          style={{ width: DIAMETER * 0.82, height: DIAMETER * 0.82 }}
        >
          <div
            className="absolute top-1.5 h-1/3 w-[3px] rounded-full"
            style={{
              backgroundColor: activeOption.color?.vivid ?? "var(--color-rack-accent-muted)",
              boxShadow: `0 0 8px ${activeOption.color?.vivid ?? "var(--color-rack-accent-muted)"}`,
            }}
          />
        </div>
      </div>

      <div role="radiogroup" aria-label={label} className="flex items-center gap-3">
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onValueChange(opt.value)}
              className={cn(
                "font-mono text-[9px] uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-rack-accent",
                active ? "font-bold" : "text-rack-text-dim-2 hover:text-rack-text-dim"
              )}
              style={
                active
                  ? {
                      color: opt.color?.muted ?? "var(--color-rack-accent-muted)",
                      filter: `drop-shadow(0 0 4px ${opt.color?.vivid ?? "var(--color-rack-accent-muted)"})`,
                    }
                  : undefined
              }
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
