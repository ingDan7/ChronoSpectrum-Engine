import { useEffect, useMemo, useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import type { TemporalPsd } from "@/lib/api/types"

// Onda seno real derivada de freqHz/alpha (no decorativa); sin simulación activa el monitor queda vacío.
function buildLiveWavePath(freqHz: number, alpha: number, timeOffsetMs: number): string {
  const width = 800
  const centerY = 50
  const sweepMs = 400 // 8 divisiones × 50 ms/DIV, igual que la rejilla de ejes de abajo
  const points = 160
  // alpha en [1,50] -> amplitud visual en [8,42], dentro del viewBox 0-100.
  const amplitude = 8 + (Math.min(Math.max(alpha, 1), 50) - 1) * (34 / 49)

  const segments: string[] = []
  for (let i = 0; i <= points; i++) {
    const tMs = (i / points) * sweepMs + timeOffsetMs
    const x = (i / points) * width
    const y = centerY - amplitude * Math.sin(2 * Math.PI * freqHz * (tMs / 1000))
    segments.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return segments.join(" ")
}

// Barras del PSD real en escala dB (relativo al pico, piso -60dB) para que los bins pequeños sigan visibles.
function buildPsdBars(psd: TemporalPsd): { x: number; width: number; height: number }[] {
  const width = 800
  const maxHeight = 90
  const floorDb = -60
  const n = psd.magnitude.length
  if (n === 0) return []
  const maxMagnitude = Math.max(...psd.magnitude, 1e-9)
  const barWidth = width / n
  return psd.magnitude.map((m, i) => {
    const db = 20 * Math.log10(Math.max(m, 1e-12) / maxMagnitude)
    const clampedDb = Math.max(db, floorDb)
    const heightFraction = (clampedDb - floorDb) / -floorDb
    return {
      x: i * barWidth,
      width: Math.max(barWidth - 0.5, 0.5),
      height: heightFraction * maxHeight,
    }
  })
}

interface OscilloscopeProps {
  label?: string
  /** Simulación en vivo activa; si es falso el monitor no dibuja ningún trazo. */
  active?: boolean
  /** Frecuencia central real de la banda, en Hz; solo se usa si `active`. */
  freqHz?: number
  /** Factor de amplificación real; solo se usa si `active`, para escalar la amplitud mostrada. */
  alpha?: number
  /** PSD real del trazo temporal amplificado; sin resultado todavía el panel queda vacío. */
  psd?: TemporalPsd
  /** Layout dividido (Signal Monitor + PSD Monitor); prop fijo para no destruir el <path> a mitad de sesión. */
  showPsd?: boolean
}

export function Oscilloscope({
  label = "SIGNAL MONITOR",
  active = false,
  freqHz,
  alpha,
  psd,
  showPsd = false,
}: OscilloscopeProps) {
  const traceRef = useRef<SVGPathElement>(null)

  // Path inicial (fase 0); la animación continua la maneja el gsap.ticker del useEffect de abajo.
  const wavePath = useMemo(() => {
    if (active && freqHz !== undefined && alpha !== undefined) {
      return buildLiveWavePath(freqHz, alpha, 0)
    }
    return ""
  }, [active, freqHz, alpha])

  const psdBars = useMemo(() => {
    if (!psd) return []
    return buildPsdBars(psd)
  }, [psd])
  const psdMaxFreq = psd && psd.freqs.length > 0 ? psd.freqs[psd.freqs.length - 1] : 0

  useGSAP(
    () => {
      const el = traceRef.current
      if (!el || !wavePath) return
      const length = el.getTotalLength()
      gsap.fromTo(
        el,
        { strokeDasharray: length, strokeDashoffset: length },
        { strokeDashoffset: 0, duration: active ? 0.3 : 1.4, ease: "power2.out" }
      )
    },
    { scope: traceRef, dependencies: [wavePath] }
  )

  // Mientras la simulación está activa, recalcula la onda en cada frame (fase = tiempo real transcurrido)
  // y la escribe directo en el atributo `d` por ref, sin re-renderizar React 60 veces por segundo.
  useEffect(() => {
    if (!active || freqHz === undefined || alpha === undefined) return
    const el = traceRef.current
    if (!el) return

    const startTime = performance.now()
    const tick = () => {
      const elapsedMs = performance.now() - startTime
      el.setAttribute("d", buildLiveWavePath(freqHz, alpha, elapsedMs))
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
    }
  }, [active, freqHz, alpha])

  // Factorizado para compartir el mismo SVG entre el modo normal y el modo dividido (showPsd).
  const waveSvg = (
    <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="h-full w-full text-rack-accent-muted">
      {Array.from({ length: 9 }, (_, i) => i * 100).map((x) => (
        <line
          key={`v${x}`}
          x1={x}
          y1="0"
          x2={x}
          y2="100"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity={x % 200 === 0 ? 0.3 : 0.15}
        />
      ))}
      {[0, 25, 50, 75, 100].map((y) => (
        <line
          key={`h${y}`}
          x1="0"
          y1={y}
          x2="800"
          y2={y}
          stroke="currentColor"
          strokeWidth="0.5"
          opacity={y === 50 ? 0.3 : 0.15}
        />
      ))}

      <path ref={traceRef} d={wavePath} fill="none" stroke="currentColor" strokeWidth="1.5" />

      <text x="4" y="10" fill="currentColor" fontFamily="JetBrains Mono" fontSize="8" opacity="0.7">+1.0</text>
      <text x="4" y="53" fill="currentColor" fontFamily="JetBrains Mono" fontSize="8" opacity="0.7">0</text>
      <text x="4" y="97" fill="currentColor" fontFamily="JetBrains Mono" fontSize="8" opacity="0.7">-1.0</text>
      <text x="770" y="10" fill="currentColor" fontFamily="JetBrains Mono" fontSize="7" opacity="0.5">u.a.</text>

      <text x="4" y="99" fill="currentColor" fontFamily="JetBrains Mono" fontSize="8" opacity="0.7">0</text>
      {!showPsd && (
        <text x="398" y="99" fill="currentColor" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" opacity="0.7">
          200ms
        </text>
      )}
      <text x="796" y="99" fill="currentColor" fontFamily="JetBrains Mono" fontSize="8" textAnchor="end" opacity="0.7">
        400ms
      </text>
    </svg>
  )

  const psdSvg = (
    <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="h-full w-full text-rack-accent-muted">
      {[0, 25, 50, 75, 100].map((y) => (
        <line
          key={`psd-h${y}`}
          x1="0"
          y1={y}
          x2="800"
          y2={y}
          stroke="currentColor"
          strokeWidth="0.5"
          opacity={y === 100 ? 0.3 : 0.15}
        />
      ))}

      {psdBars.map((bar, i) => (
        <rect key={i} x={bar.x} y={100 - bar.height} width={bar.width} height={bar.height} fill="currentColor" opacity={0.85} />
      ))}

      <text x="4" y="10" fill="currentColor" fontFamily="JetBrains Mono" fontSize="7" opacity="0.5">u.a.</text>
      <text x="4" y="99" fill="currentColor" fontFamily="JetBrains Mono" fontSize="8" opacity="0.7">0 Hz</text>
      <text x="796" y="99" fill="currentColor" fontFamily="JetBrains Mono" fontSize="8" textAnchor="end" opacity="0.7">
        {psdMaxFreq.toFixed(1)} Hz
      </text>
    </svg>
  )

  if (showPsd) {
    return (
      <div className="relative mt-1 flex gap-2 rounded-b-lg bg-rack-bg-deep p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
        <div className="min-w-0 flex-1">
          <div className="mb-1 px-1">
            <span className="font-mono text-[10px] tracking-widest text-rack-accent-muted uppercase drop-shadow-[0_0_4px_var(--color-rack-accent)]">
              {label}
            </span>
          </div>
          <div className="relative h-20 w-full overflow-hidden rounded bg-rack-bg-deep shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]">
            {waveSvg}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 px-1">
            <span className="font-mono text-[10px] tracking-widest text-rack-accent-muted uppercase drop-shadow-[0_0_4px_var(--color-rack-accent)]">
              PSD Monitor
            </span>
          </div>
          <div className="relative h-20 w-full overflow-hidden rounded bg-rack-bg-deep shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]">
            {psdSvg}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mt-1 rounded-b-lg bg-rack-bg-deep p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="font-mono text-[10px] tracking-widest text-rack-accent-muted uppercase drop-shadow-[0_0_4px_var(--color-rack-accent)]">
          {label}
        </span>
        <span className="font-mono text-[10px] tracking-wider text-rack-accent-2">
          SWEEP: 50 ms/DIV
        </span>
      </div>
      <div className="relative h-20 w-full overflow-hidden rounded bg-rack-bg-deep shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]">
        {waveSvg}
      </div>
    </div>
  )
}
