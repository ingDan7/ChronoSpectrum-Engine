import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react"

// Control circular tipo "radar" para elegir un pico del espectro por radio/ángulo, convertido a u0/v0.

interface RadarPadProps {
  radius: number
  angleDeg: number
  maxRadius?: number
  onChange: (radius: number, angleDeg: number) => void
  disabled?: boolean
}

// maxRadius=128 por defecto: Nyquist de los assets 256×256 de este módulo (api/assets.py).
const PAD_SIZE = 110

export function RadarPad({ radius, angleDeg, maxRadius = 128, onChange, disabled = false }: RadarPadProps) {
  const padRef = useRef<HTMLDivElement>(null)

  const updateFromClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = padRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = clientX - cx
      const dy = clientY - cy
      const pxRadius = Math.min(Math.sqrt(dx * dx + dy * dy), rect.width / 2)
      const normalizedRadius = (pxRadius / (rect.width / 2)) * maxRadius
      // Ángulo matemático estándar (0° = derecha, antihorario); se invierte Y (pantalla crece hacia abajo).
      const angle = (Math.atan2(-dy, dx) * 180) / Math.PI
      onChange(
        Math.round(normalizedRadius * 10) / 10,
        Math.round(((angle + 360) % 360) * 10) / 10
      )
    },
    [maxRadius, onChange]
  )

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromClientPoint(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled || e.buttons !== 1) return
    updateFromClientPoint(e.clientX, e.clientY)
  }

  const pxRadius = maxRadius > 0 ? (radius / maxRadius) * (PAD_SIZE / 2) : 0
  const angleRad = (angleDeg * Math.PI) / 180
  const pointX = PAD_SIZE / 2 + pxRadius * Math.cos(angleRad)
  const pointY = PAD_SIZE / 2 - pxRadius * Math.sin(angleRad)

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={padRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="relative rounded-full border border-rack-text-dim-2 bg-rack-bg-deep shadow-[inset_0_0_10px_rgba(0,0,0,0.9)]"
        style={{
          width: PAD_SIZE,
          height: PAD_SIZE,
          touchAction: "none",
          cursor: disabled ? "not-allowed" : "crosshair",
        }}
      >
        <svg className="pointer-events-none absolute inset-0" width={PAD_SIZE} height={PAD_SIZE} aria-hidden>
          <line x1={PAD_SIZE / 2} y1={4} x2={PAD_SIZE / 2} y2={PAD_SIZE - 4} stroke="white" strokeOpacity={0.15} />
          <line x1={4} y1={PAD_SIZE / 2} x2={PAD_SIZE - 4} y2={PAD_SIZE / 2} stroke="white" strokeOpacity={0.15} />
          <circle cx={PAD_SIZE / 2} cy={PAD_SIZE / 2} r={PAD_SIZE / 2 - 4} fill="none" stroke="white" strokeOpacity={0.1} />
          <line
            x1={PAD_SIZE / 2}
            y1={PAD_SIZE / 2}
            x2={pointX}
            y2={pointY}
            stroke="var(--color-rack-accent)"
            strokeWidth={1.5}
            strokeOpacity={0.8}
          />
          <circle
            cx={pointX}
            cy={pointY}
            r={4}
            fill="var(--color-rack-accent)"
            style={{ filter: "drop-shadow(0 0 4px var(--color-rack-accent))" }}
          />
        </svg>
      </div>
      <div className="flex items-center gap-3 font-mono text-[10px] text-rack-accent-muted">
        <span>RADIUS: {radius.toFixed(1)}</span>
        <span>ANGLE: {angleDeg.toFixed(0)}°</span>
      </div>
    </div>
  )
}
