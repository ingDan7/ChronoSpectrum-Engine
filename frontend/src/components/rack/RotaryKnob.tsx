import { useRef, type PointerEvent as ReactPointerEvent } from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { cn } from "cn"

// Perilla rotativa sobre el slider vertical de Base UI (arrastre vertical simula rotación), con teclado/ARIA reales.

const SWEEP_DEG = 270 // recorrido visual del potenciómetro: -135° a +135°

interface RotaryKnobProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  size?: "lg" | "md"
  onValueChange: (value: number) => void
  /** Color del indicador (vívido) y del valor numérico (muted), por instancia. */
  accentColor?: { vivid: string; muted: string }
  /** Label en una sola línea, fuente más chica (para labels largos en espacios reducidos). */
  compactLabel?: boolean
  /** Sobrescribe el diámetro calculado por `size` con un valor exacto en px. */
  diameter?: number
  /** Agranda la tipografía de la lectura digital (text-lg -> text-xl). */
  largeReadout?: boolean
}

export function RotaryKnob({
  label,
  value,
  min,
  max,
  step = 0.1,
  unit,
  size = "md",
  onValueChange,
  accentColor,
  compactLabel = false,
  diameter: diameterOverride,
  largeReadout = false,
}: RotaryKnobProps) {
  const dialRef = useRef<HTMLDivElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)
  const diameter = diameterOverride ?? (size === "lg" ? 120 : 70)

  const percent = Math.min(1, Math.max(0, (value - min) / (max - min)))
  const angle = -SWEEP_DEG / 2 + percent * SWEEP_DEG

  useGSAP(
    () => {
      if (!dialRef.current) return
      gsap.to(dialRef.current, {
        rotate: angle,
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      })
    },
    { dependencies: [angle], scope: dialRef }
  )

  const decimals = step < 1 ? 2 : 0

  // Arrastre manual (no el nativo de Slider.Control): permite ajustar la sensibilidad sin agrandar el contenedor.
  const DRAG_PIXELS_FOR_FULL_RANGE = 900

  const dragStateRef = useRef<{ startY: number; startValue: number } | null>(null)

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStateRef.current = { startY: e.clientY, startValue: value }
    thumbInputRef.current?.focus()
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current) return
    const { startY, startValue } = dragStateRef.current
    const deltaY = startY - e.clientY
    const rawValue = startValue + (deltaY / DRAG_PIXELS_FOR_FULL_RANGE) * (max - min)
    const stepped = Math.round(rawValue / step) * step
    onValueChange(Math.min(max, Math.max(min, stepped)))
  }

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStateRef.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={cn(
          "flex h-8 max-w-[120px] items-center justify-center overflow-hidden text-center font-mono leading-tight text-rack-text-dim uppercase",
          compactLabel ? "text-[9px] tracking-normal whitespace-nowrap" : "text-[10px] tracking-widest"
        )}
      >
        {label}
      </span>

      <div className="relative" style={{ width: diameter, height: diameter }}>
        <SliderPrimitive.Root
          value={[value]}
          min={min}
          max={max}
          step={step}
          orientation="vertical"
          onValueChange={(v) => onValueChange(Array.isArray(v) ? v[0] : v)}
        >
          <SliderPrimitive.Control
            className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center select-none"
            style={{ width: diameter, height: diameter }}
          >
            {/* Escala grabada (decorativa, no interactiva) */}
            <svg
              aria-hidden
              className="pointer-events-none absolute text-rack-text-dim/50"
              style={{ width: diameter, height: diameter }}
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="currentColor"
                strokeDasharray="2 5"
                strokeWidth="1"
              />
            </svg>

            {/* Cuerpo de aluminio, rota según el valor */}
            <div
              ref={dialRef}
              className="relative flex items-center justify-center rounded-full bg-gradient-to-br from-neutral-500 via-neutral-700 to-neutral-900 shadow-[0_4px_10px_rgba(0,0,0,0.6),inset_0_1px_2px_rgba(255,255,255,0.15)]"
              style={{ width: diameter * 0.82, height: diameter * 0.82 }}
            >
              <div
                className="absolute top-1.5 h-1/3 w-[3px] rounded-full"
                style={{
                  backgroundColor: accentColor?.vivid ?? "var(--color-rack-accent-muted)",
                  boxShadow: `0 0 8px ${accentColor?.vivid ?? "var(--color-rack-accent-muted)"}`,
                }}
              />
            </div>

            {/* Thumb real de Base UI: capa invisible, solo foco/teclado/ARIA (el arrastre lo maneja la capa de abajo). */}
            <SliderPrimitive.Thumb
              inputRef={thumbInputRef}
              className="absolute rounded-full opacity-0 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rack-accent"
              style={{ width: diameter, height: diameter }}
            />
          </SliderPrimitive.Control>
        </SliderPrimitive.Root>

        {/* Capa de arrastre real (mouse/touch), mismo tamaño exacto que la perilla; recibe el pointerdown antes que Control. */}
        <div
          className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      <div className="rounded bg-rack-bg-deep px-3 py-1 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.6)]">
        <span
          className={cn("font-mono tracking-wider tabular-nums", largeReadout ? "text-xl" : "text-lg")}
          style={{
            color: accentColor?.muted ?? "var(--color-rack-accent-muted)",
            filter: `drop-shadow(0 0 6px ${accentColor?.vivid ?? "var(--color-rack-accent-muted)"})`,
          }}
        >
          {value.toFixed(decimals)}
        </span>
        {unit ? (
          <span className="ml-1 font-mono text-xs text-rack-text-dim">{unit}</span>
        ) : null}
      </div>
    </div>
  )
}
