import { useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { RackChassis } from "@/components/rack/RackChassis"
import { CrtMonitor } from "@/components/rack/CrtMonitor"
import { RotaryKnob } from "@/components/rack/RotaryKnob"
import { SteppedKnob } from "@/components/rack/SteppedKnob"
import { RadarPad } from "@/components/rack/RadarPad"
import { NotchStepper } from "@/components/rack/NotchStepper"
import { ToggleSwitchGroup } from "@/components/rack/ToggleSwitchGroup"
import { VfdMetricCard } from "@/components/rack/VfdMetricCard"
import { connectSpectrumCleanerLive } from "@/lib/api/live"
import { runSpectrumCleaner } from "@/lib/api/client"
import { validateSpectrumCleanerRequest } from "@/lib/api/validation"
import type { LiveConnection } from "@/lib/api/live"
import type {
  NotchParams,
  SpectrumAssetId,
  SpectrumCleanerLiveResult,
  SpectrumCleanerRequest,
} from "@/lib/api/types"
import syntheticPreview from "@/assets/previews/spectrum-synthetic.png"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

// Debounce antes de reenviar cambios de notch por WebSocket.
const KNOB_DEBOUNCE_MS = 150

const SOURCES: { value: SpectrumAssetId; label: string }[] = [
  { value: "synthetic_grid_noise", label: "SYN" },
  { value: "real_mesh_texture", label: "MESH" },
  { value: "real_halftone_print", label: "HALF" },
]

// Un color por rol funcional; Butterworth y Order (n) coinciden porque `n` solo aplica en modo butterworth.
const D0_COLOR = { vivid: "#38bdf8", muted: "#7dd3fc" }
const IDEAL_COLOR = { vivid: "#00ff66", muted: "#34d399" }
const GAUSSIAN_COLOR = { vivid: "#10b981", muted: "#6ee7b7" }
const BUTTERWORTH_COLOR = { vivid: "#f59e0b", muted: "#fbbf24" }

const MODE_OPTIONS = [
  { value: "ideal" as const, label: "Ideal", angle: -90, color: IDEAL_COLOR },
  { value: "gaussian" as const, label: "Gaussian", angle: 0, color: GAUSSIAN_COLOR },
  { value: "butterworth" as const, label: "Butter.", angle: 90, color: BUTTERWORTH_COLOR },
]

const KNOB_DIAMETER = 82

interface NotchState {
  enabled: boolean
  radius: number
  angleDeg: number
  d0: number
  mode: "ideal" | "gaussian" | "butterworth"
  n: number
}

// Radio de Nyquist para assets de 256×256 px.
const MAX_RADIUS = 128

function makeDefaultNotch(): NotchState {
  return { enabled: true, radius: 30, angleDeg: 0, d0: 20, mode: "gaussian", n: 2 }
}

function toJpegSrc(base64: string | undefined): string | undefined {
  return base64 ? `data:image/jpeg;base64,${base64}` : undefined
}

// Convierte (radio, ángulo) del RadarPad al par (u0,v0) real que espera el backend.
function buildNotchParams(enabledNotches: NotchState[]): NotchParams[] {
  return enabledNotches.map((n) => {
    const rad = (n.angleDeg * Math.PI) / 180
    return {
      u0: Math.round(n.radius * Math.cos(rad) * 100) / 100,
      v0: Math.round(n.radius * Math.sin(rad) * 100) / 100,
      d0: n.d0,
      mode: n.mode,
      n: n.n,
    }
  })
}

// Módulo 2 — 2D-FFT Interactive Spectrum Cleaner.
export function Modulo2() {
  const { t } = useTranslation()
  const [source, setSource] = useState<SpectrumAssetId>("synthetic_grid_noise")
  const [notches, setNotches] = useState<NotchState[]>([makeDefaultNotch()])
  const [activeIndex, setActiveIndex] = useState(0)

  // `isSimulating` y `errorMessage` son independientes: un error de negocio no cierra la simulación ni el socket.
  const [isSimulating, setIsSimulating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [liveResult, setLiveResult] = useState<SpectrumCleanerLiveResult | null>(null)
  // Persiste entre actualizaciones y tras un Stop.
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(syntheticPreview)
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(false)
  const [originalErrorMessage, setOriginalErrorMessage] = useState<string | null>(null)

  const isConnecting = isSimulating && liveResult === null && errorMessage === null

  const connectionRef = useRef<LiveConnection<SpectrumCleanerRequest> | null>(null)
  const expectedCloseRef = useRef(false)
  const debounceRef = useRef<number | null>(null)
  // Descarta la respuesta de una petición de "original" vieja si el usuario cambió de Source otra vez.
  const originalFetchIdRef = useRef(0)

  const executeBoxRef = useRef<HTMLDivElement>(null)
  const { contextSafe } = useGSAP(() => {}, { scope: executeBoxRef })

  const flashExecuteBox = contextSafe(() => {
    if (!executeBoxRef.current) return
    gsap.fromTo(
      executeBoxRef.current,
      { filter: "brightness(1.6)" },
      { filter: "brightness(1)", duration: 0.4, ease: "power2.out" }
    )
  })

  const notchCount = notches.length
  const activeNotch = notches[activeIndex] ?? notches[0]

  // (u0,v0) del notch activo, misma fórmula que `buildNotchParams`, solo para mostrarlo junto al RadarPad.
  const activeNotchRad = (activeNotch.angleDeg * Math.PI) / 180
  const activeU0 = Math.round(activeNotch.radius * Math.cos(activeNotchRad) * 100) / 100
  const activeV0 = Math.round(activeNotch.radius * Math.sin(activeNotchRad) * 100) / 100

  const setNotchCount = (count: number) => {
    setNotches((prev) => {
      if (count === prev.length) return prev
      if (count < prev.length) return prev.slice(0, count)
      return [...prev, ...Array.from({ length: count - prev.length }, makeDefaultNotch)]
    })
    setActiveIndex((prev) => Math.min(prev, count - 1))
  }

  const updateActiveNotch = (patch: Partial<NotchState>) => {
    setNotches((prev) => prev.map((n, i) => (i === activeIndex ? { ...n, ...patch } : n)))
  }

  // Cierra la conexión en vivo al desmontar.
  useEffect(() => {
    return () => {
      expectedCloseRef.current = true
      connectionRef.current?.close()
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    }
  }, [])

  // Al cambiar Source, trae el original real (SYN es local, el resto vía HTTP liviano) sin abrir el WebSocket.
  useEffect(() => {
    const fetchId = ++originalFetchIdRef.current

    if (source === "synthetic_grid_noise") {
      setOriginalImageSrc(syntheticPreview)
      setIsLoadingOriginal(false)
      setOriginalErrorMessage(null)
      return
    }

    const enabledNotches = notches.filter((n) => n.enabled)
    if (enabledNotches.length === 0) {
      setOriginalImageSrc(null)
      setIsLoadingOriginal(false)
      setOriginalErrorMessage(t("modulo2ErrorLoadOriginal"))
      return
    }

    setIsLoadingOriginal(true)
    setOriginalErrorMessage(null)

    runSpectrumCleaner({ asset_id: source, notches: buildNotchParams(enabledNotches) }).then((result) => {
      if (fetchId !== originalFetchIdRef.current) return // Ya se cambió de Source otra vez.
      setIsLoadingOriginal(false)
      if (result.kind === "ok") {
        setOriginalImageSrc(`data:image/png;base64,${result.data.original_image_png_base64}`)
      } else {
        setOriginalErrorMessage(result.message)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  // Reenvía los notches por el socket en cada cambio, mientras la simulación está activa.
  useEffect(() => {
    if (!isSimulating || !connectionRef.current) return
    const enabledNotches = notches.filter((n) => n.enabled)
    if (enabledNotches.length === 0) return
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      connectionRef.current?.send({ asset_id: source, notches: buildNotchParams(enabledNotches) })
    }, KNOB_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notches, isSimulating])

  const handleResult = (result: SpectrumCleanerLiveResult) => {
    setLiveResult(result)
    setOriginalImageSrc(`data:image/jpeg;base64,${result.original_image_jpeg_base64}`)
    setErrorMessage(null)
  }

  const handleExecute = contextSafe(() => {
    if (isSimulating) return
    flashExecuteBox()

    const enabledNotches = notches.filter((n) => n.enabled)
    if (enabledNotches.length === 0) {
      setErrorMessage(t("modulo2ErrorNoNotch"))
      return
    }

    const requestBody: SpectrumCleanerRequest = { asset_id: source, notches: buildNotchParams(enabledNotches) }
    const validationErrors = validateSpectrumCleanerRequest(requestBody)
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.map((e) => e.message).join(" · "))
      return
    }

    setErrorMessage(null)
    expectedCloseRef.current = false

    const connection = connectSpectrumCleanerLive({
      onResult: handleResult,
      onError: (message) => setErrorMessage(message),
      onClose: () => {
        if (!expectedCloseRef.current) {
          setIsSimulating(false)
          setLiveResult(null)
          setErrorMessage(t("conexionPerdida"))
        }
      },
    })
    connectionRef.current = connection
    // El envío inicial lo dispara el useEffect de arriba.
    setIsSimulating(true)
  })

  const handleStop = contextSafe(() => {
    if (!isSimulating) return
    expectedCloseRef.current = true
    connectionRef.current?.close()
    connectionRef.current = null
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    setLiveResult(null)
    setIsSimulating(false)
    setErrorMessage(null)
    // `originalImageSrc` NO se limpia -- el CRT vuelve a mostrarlo.
  })

  const activeNotchCount = notches.filter((n) => n.enabled).length
  const liveSrc = liveResult ? toJpegSrc(liveResult.filtered_image_jpeg_base64) : undefined

  return (
    <RackChassis title="Spectrum Cleaner Console">
      <div className="flex min-h-0 flex-col gap-3 lg:h-full lg:flex-row">
        <div className="flex min-h-0 flex-col gap-3 lg:h-full lg:flex-3">
          <div className="flex flex-col gap-2 lg:min-h-0 lg:flex-1 lg:flex-row">
            <div className="h-56 lg:h-auto lg:min-h-0 lg:flex-1">
              <CrtMonitor
                src={originalImageSrc ?? undefined}
                alt={t("modulo2AltOriginal")}
                loading={isLoadingOriginal}
                errorMessage={originalErrorMessage ?? undefined}
                channelLabel={`CH-02 · ${source.toUpperCase()}`}
                statusLabel="ORIGINAL"
              />
            </div>
            <div className="h-56 lg:h-auto lg:min-h-0 lg:flex-1">
              <CrtMonitor
                src={liveSrc}
                alt={t("modulo2AltLive")}
                loading={isConnecting}
                errorMessage={errorMessage ?? undefined}
                channelLabel={`CH-02 · ${source.toUpperCase()}`}
                statusLabel={isSimulating ? "SIGNAL LOCKED · LIVE" : "LIVE"}
              />
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3">
            <VfdMetricCard label="Peak Count" value={String(activeNotchCount)} sublabel="notches" />
            {/* Reducción espectral, normalizada de forma independiente antes/después. */}
            <VfdMetricCard
              label="Spectral Reduction %"
              value={liveResult ? `${liveResult.reduction_percent.toFixed(1)}%` : "--.-"}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-2 lg:h-full lg:flex-2">
          {/* Signal Monitor: espectro real antes/después. */}
          <div className="shrink-0 rounded-lg bg-rack-bg-deep p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
            <div className="mb-1 flex items-center justify-between px-1">
              <span className="font-mono text-[10px] tracking-widest text-rack-accent-muted uppercase drop-shadow-[0_0_4px_var(--color-rack-accent)]">
                Signal Monitor
              </span>
              <span className="font-mono text-[10px] tracking-wider text-rack-accent-2">FFT DOMAIN</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative flex h-[80px] items-center justify-center overflow-hidden rounded bg-rack-bg-deep shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]">
                {liveResult ? (
                  <img
                    src={toJpegSrc(liveResult.spectrum_before_jpeg_base64)}
                    alt="Espectro antes del filtro"
                    className="h-full w-full object-contain contrast-125 brightness-95"
                  />
                ) : (
                  <span className="font-mono text-[9px] tracking-widest text-rack-text-dim uppercase">
                    {t("sinDatos")}
                  </span>
                )}
                <span className="absolute bottom-1 left-1.5 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] text-rack-text-dim uppercase">
                  {t("antes")}
                </span>
              </div>
              <div className="relative flex h-[80px] items-center justify-center overflow-hidden rounded bg-rack-bg-deep shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]">
                {liveResult ? (
                  <img
                    src={toJpegSrc(liveResult.spectrum_after_jpeg_base64)}
                    alt="Espectro después del filtro"
                    className="h-full w-full object-contain contrast-125 brightness-95"
                  />
                ) : (
                  <span className="font-mono text-[9px] tracking-widest text-rack-text-dim uppercase">
                    {t("sinDatos")}
                  </span>
                )}
                <span className="absolute right-1.5 bottom-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] text-rack-accent-muted uppercase">
                  {t("despues")}
                </span>
              </div>
              {/* Máscara H(u,v) combinada de todos los notches activos. */}
              <div className="relative flex h-[80px] items-center justify-center overflow-hidden rounded bg-rack-bg-deep shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]">
                {liveResult ? (
                  <img
                    src={toJpegSrc(liveResult.mask_jpeg_base64)}
                    alt="Máscara H(u,v) combinada"
                    className="h-full w-full object-contain contrast-125 brightness-95"
                  />
                ) : (
                  <span className="font-mono text-[9px] tracking-widest text-rack-text-dim uppercase">
                    {t("sinDatos")}
                  </span>
                )}
                <span className="absolute bottom-1 left-1.5 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] text-rack-text-dim uppercase">
                  H(u,v)
                </span>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-8 border-hud-card bg-rack-bg-deep shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_4px_16px_rgba(0,0,0,0.6)] lg:h-full">
            <div className="shrink-0 bg-hud-card px-3 py-1.5">
              <span className="font-mono text-[11px] tracking-widest text-neutral-200 uppercase">
                2D-FFT Parameter Processor
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-between gap-1.5 p-2.5">
            <div className="grid shrink-0 grid-cols-1 gap-2.5 sm:grid-cols-3">
              {/* Bloqueado mientras hay una simulación en vivo activa. */}
              <ToggleSwitchGroup
                label="Source"
                options={SOURCES}
                value={source}
                onValueChange={(v) => setSource(v as SpectrumAssetId)}
                compact
                disabled={isSimulating}
              />

              <NotchStepper value={notchCount} min={1} max={10} onValueChange={setNotchCount} compact />

              <button
                type="button"
                aria-pressed={activeNotch.enabled}
                onClick={() => updateActiveNotch({ enabled: !activeNotch.enabled })}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1.5 rounded-lg p-2 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] transition-all",
                  activeNotch.enabled
                    ? "bg-rack-accent-muted/10 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8),0_0_14px_rgba(52,211,153,0.5)]"
                    : "bg-[#121312] opacity-60"
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[9px] tracking-widest uppercase",
                    activeNotch.enabled
                      ? "text-rack-accent-muted drop-shadow-[0_0_4px_var(--color-rack-accent-muted)]"
                      : "text-rack-text-dim-2"
                  )}
                >
                  Notch #{activeIndex + 1}
                </span>
                <span
                  className={cn(
                    "font-mono text-xl font-bold tracking-wider",
                    activeNotch.enabled
                      ? "text-rack-accent drop-shadow-[0_0_10px_var(--color-rack-accent-muted)]"
                      : "text-rack-text-dim-2"
                  )}
                >
                  {activeNotch.enabled ? "ON" : "OFF"}
                </span>
              </button>
            </div>

            <div className="flex shrink-0 flex-col gap-1.5 rounded-lg bg-[#0e0e0e] p-2 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.6)]">
              <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-2">
                <div className="flex flex-col items-center gap-1">
                  <RadarPad
                    radius={activeNotch.radius}
                    angleDeg={activeNotch.angleDeg}
                    maxRadius={MAX_RADIUS}
                    disabled={!activeNotch.enabled}
                    onChange={(radius, angleDeg) => updateActiveNotch({ radius, angleDeg })}
                  />
                  {/* Lectura cartesiana (u0,v0), mismo valor que se envía al backend. */}
                  <span className="font-mono text-[9px] tracking-wider text-rack-text-dim uppercase">
                    u0: {activeU0.toFixed(2)} · v0: {activeV0.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-center">
                  <SteppedKnob
                    label="Filter Mode"
                    options={MODE_OPTIONS}
                    value={activeNotch.mode}
                    onValueChange={(mode) => updateActiveNotch({ mode })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 items-start gap-2 border-t border-neutral-700/50 pt-1 sm:grid-cols-2">
                <RotaryKnob
                  label="Cutoff Radius (d0)"
                  value={activeNotch.d0}
                  min={0.1}
                  max={200}
                  step={0.1}
                  onValueChange={(v) => updateActiveNotch({ d0: v })}
                  compactLabel
                  diameter={KNOB_DIAMETER}
                  accentColor={D0_COLOR}
                />
                <RotaryKnob
                  label="Order (n)"
                  value={activeNotch.n}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(v) => updateActiveNotch({ n: v })}
                  accentColor={
                    activeNotch.mode === "butterworth"
                      ? BUTTERWORTH_COLOR
                      : { vivid: "#525252", muted: "#737373" }
                  }
                  compactLabel
                  diameter={KNOB_DIAMETER}
                />
              </div>
            </div>

            <div ref={executeBoxRef} className="grid shrink-0 grid-cols-2 gap-2 rounded-xl">
              <Button
                onClick={handleExecute}
                disabled={isSimulating}
                className="group relative flex h-11 w-full items-center justify-center rounded border border-neutral-600/40 bg-rack-bg-deep font-mono text-xs font-bold tracking-[0.18em] text-rack-accent-muted uppercase shadow-[0_3px_0_#000,0_5px_10px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-rack-accent-muted/60 hover:bg-rack-panel hover:shadow-[0_3px_0_#000,0_0_16px_rgba(52,211,153,0.25)] active:translate-y-0.5 active:shadow-[0_1px_0_#000,inset_0_2px_4px_rgba(0,0,0,0.8)]"
              >
                <span className="drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]">
                  {isSimulating ? t("simulando") : "Execute Spectrum Clean"}
                </span>
              </Button>
              <Button
                onClick={handleStop}
                disabled={!isSimulating}
                className="group relative flex h-11 w-full items-center justify-center rounded border border-neutral-600/40 bg-rack-bg-deep font-mono text-xs font-bold tracking-[0.18em] text-hud-error uppercase shadow-[0_3px_0_#000,0_5px_10px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-hud-error/60 hover:bg-rack-panel active:translate-y-0.5 active:shadow-[0_1px_0_#000,inset_0_2px_4px_rgba(0,0,0,0.8)]"
              >
                <span className="drop-shadow-[0_0_4px_rgba(220,38,38,0.5)]">Stop</span>
              </Button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </RackChassis>
  )
}
