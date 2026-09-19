import { useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { RackChassis } from "@/components/rack/RackChassis"
import { CrtMonitor } from "@/components/rack/CrtMonitor"
import { CorrelationSurface3D } from "@/components/rack/CorrelationSurface3D"
import { ToggleSwitchGroup } from "@/components/rack/ToggleSwitchGroup"
import { VfdMetricCard } from "@/components/rack/VfdMetricCard"
import { connectPhaseCorrelatorLive } from "@/lib/api/live"
import { runPhaseCorrelator } from "@/lib/api/client"
import { validatePhaseCorrelatorRequest } from "@/lib/api/validation"
import type { LiveConnection } from "@/lib/api/live"
import type { PhaseAssetId, PhaseCorrelatorLiveResult, PhaseCorrelatorRequest } from "@/lib/api/types"
import syntheticPreview from "@/assets/previews/phase-synthetic.png"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

const SOURCES: { value: PhaseAssetId; label: string }[] = [
  { value: "synthetic_shifted_pair", label: "SYN" },
  { value: "real_shifted_pair", label: "REAL" },
  { value: "real_painting_pair", label: "ART" },
]

function toJpegSrc(base64: string | undefined): string | undefined {
  return base64 ? `data:image/jpeg;base64,${base64}` : undefined
}

// Módulo 3 — Sub-Pixel Phase Correlator; `asset_id` es el único parámetro, sin perillas continuas que reenviar en vivo.
export function Modulo3() {
  const { t } = useTranslation()
  const [source, setSource] = useState<PhaseAssetId>("synthetic_shifted_pair")

  // `isSimulating` y `errorMessage` independientes.
  const [isSimulating, setIsSimulating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [liveResult, setLiveResult] = useState<PhaseCorrelatorLiveResult | null>(null)
  // Persiste entre actualizaciones y tras un Stop (`image1`).
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(syntheticPreview)
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(false)
  const [originalErrorMessage, setOriginalErrorMessage] = useState<string | null>(null)
  // Alterna el Signal Monitor entre zoom 2D y malla 3D (`CorrelationSurface3D`), misma caja.
  const [show3D, setShow3D] = useState(false)

  const isConnecting = isSimulating && liveResult === null && errorMessage === null

  const connectionRef = useRef<LiveConnection<PhaseCorrelatorRequest> | null>(null)
  const expectedCloseRef = useRef(false)
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

  // Cierra la conexión en vivo al desmontar.
  useEffect(() => {
    return () => {
      expectedCloseRef.current = true
      connectionRef.current?.close()
    }
  }, [])

  // Al cambiar Source, trae `image1` real (SYN es local, el resto vía HTTP liviano) sin abrir el WebSocket.
  useEffect(() => {
    const fetchId = ++originalFetchIdRef.current

    if (source === "synthetic_shifted_pair") {
      setOriginalImageSrc(syntheticPreview)
      setIsLoadingOriginal(false)
      setOriginalErrorMessage(null)
      return
    }

    setIsLoadingOriginal(true)
    setOriginalErrorMessage(null)

    runPhaseCorrelator({ asset_id: source }).then((result) => {
      if (fetchId !== originalFetchIdRef.current) return // Ya se cambió de Source otra vez.
      setIsLoadingOriginal(false)
      if (result.kind === "ok") {
        setOriginalImageSrc(`data:image/png;base64,${result.data.image1_png_base64}`)
      } else {
        setOriginalErrorMessage(result.message)
      }
    })
  }, [source])

  const handleResult = (result: PhaseCorrelatorLiveResult) => {
    setLiveResult(result)
    setOriginalImageSrc(`data:image/jpeg;base64,${result.image1_jpeg_base64}`)
    setErrorMessage(null)
  }

  const handleExecute = contextSafe(() => {
    if (isSimulating) return
    flashExecuteBox()

    const requestBody: PhaseCorrelatorRequest = { asset_id: source }
    const validationErrors = validatePhaseCorrelatorRequest(requestBody)
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.map((e) => e.message).join(" · "))
      return
    }

    setIsSimulating(true)
    setErrorMessage(null)
    expectedCloseRef.current = false

    const connection = connectPhaseCorrelatorLive({
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
    // Sin perillas que reenviar: un único envío inicial basta.
    connection.send(requestBody)
  })

  const handleStop = contextSafe(() => {
    if (!isSimulating) return
    expectedCloseRef.current = true
    connectionRef.current?.close()
    connectionRef.current = null
    setLiveResult(null)
    setIsSimulating(false)
    setErrorMessage(null)
    // `originalImageSrc` NO se limpia -- el CRT vuelve a mostrarlo.
  })

  const livePeakSrc = liveResult ? toJpegSrc(liveResult.correlation_peak_jpeg_base64) : undefined
  // Confianza real del pico (`peak_confidence`) y PSR real (`psr`), ambos devueltos por el backend.
  const peakConfidenceLabel =
    liveResult && typeof liveResult.peak_confidence === "number"
      ? `CONFIDENCE ${liveResult.peak_confidence.toFixed(3)} · PSR ${liveResult.psr.toFixed(1)}`
      : "PEAK ZOOM ×3"
  // El CRT derecho muestra el mapa de error RESIDUAL entre `image1` y `image2_aligned`, no una miniatura del pico.
  const liveDiffSrc = liveResult ? toJpegSrc(liveResult.alignment_diff_jpeg_base64) : undefined
  const residualErrorLabel =
    liveResult && typeof liveResult.residual_error_pct === "number"
      ? `${liveResult.residual_error_pct.toFixed(2)}%`
      : "--.--%"

  return (
    <RackChassis title="Phase Correlation Core">
      <div className="flex min-h-0 flex-col gap-3 lg:h-full lg:flex-row">
        <div className="flex min-h-0 flex-col gap-3 lg:h-full lg:flex-3">
          <div className="flex flex-col gap-2 lg:min-h-0 lg:flex-1 lg:flex-row">
            <div className="h-56 lg:h-auto lg:min-h-0 lg:flex-1">
              <CrtMonitor
                src={originalImageSrc ?? undefined}
                alt={t("modulo3AltOriginal")}
                loading={isLoadingOriginal}
                errorMessage={originalErrorMessage ?? undefined}
                channelLabel={`CH-03 · ${source.toUpperCase()}`}
                statusLabel="ORIGINAL"
              />
            </div>
            <div className="h-56 lg:h-auto lg:min-h-0 lg:flex-1">
              <CrtMonitor
                src={liveDiffSrc}
                alt={t("modulo3AltLive")}
                loading={isConnecting}
                errorMessage={errorMessage ?? undefined}
                channelLabel={`CH-03 · ${source.toUpperCase()}`}
                statusLabel={isSimulating ? "SIGNAL LOCKED · LIVE" : "LIVE"}
              />
            </div>
          </div>

          {/* dx/dy/residual: datos reales devueltos por el backend. */}
          <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3">
            <VfdMetricCard
              label="Δx (px)"
              value={liveResult ? liveResult.dx.toFixed(4) : "--.----"}
              sublabel="sub-pixel"
            />
            <VfdMetricCard
              label="Δy (px)"
              value={liveResult ? liveResult.dy.toFixed(4) : "--.----"}
              sublabel="sub-pixel"
            />
            <VfdMetricCard label="Residual Error" value={residualErrorLabel} sublabel="align diff" />
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3 lg:h-full lg:flex-2">
          {/* Signal Monitor: acercamiento del mismo pico de correlación real. */}
          <div className="shrink-0 rounded-lg bg-rack-bg-deep p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
            <div className="mb-1 flex items-center justify-between px-1">
              <span className="font-mono text-[10px] tracking-widest text-rack-accent-muted uppercase drop-shadow-[0_0_4px_var(--color-rack-accent)]">
                Signal Monitor
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-wider text-rack-accent-2">{peakConfidenceLabel}</span>
                {/* Toggle 2D/3D; deshabilitado sin `livePeakSrc`. */}
                <div className="flex overflow-hidden rounded border border-neutral-600/40 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]">
                  <button
                    type="button"
                    onClick={() => setShow3D(false)}
                    disabled={!livePeakSrc}
                    aria-pressed={!show3D}
                    className={cn(
                      "px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase transition-all disabled:pointer-events-none disabled:opacity-40",
                      !show3D
                        ? "bg-rack-accent-muted/15 text-rack-accent-muted shadow-[inset_0_0_10px_rgba(52,211,153,0.35)] drop-shadow-[0_0_4px_var(--color-rack-accent-muted)]"
                        : "bg-rack-bg-deep text-rack-text-dim-2 hover:text-rack-text-dim"
                    )}
                  >
                    2D
                  </button>
                  <button
                    type="button"
                    onClick={() => setShow3D(true)}
                    disabled={!livePeakSrc}
                    aria-pressed={show3D}
                    className={cn(
                      "border-l border-neutral-600/40 px-2.5 py-1 font-mono text-[10px] font-bold tracking-widest uppercase transition-all disabled:pointer-events-none disabled:opacity-40",
                      show3D
                        ? "bg-rack-accent-muted/15 text-rack-accent-muted shadow-[inset_0_0_10px_rgba(52,211,153,0.35)] drop-shadow-[0_0_4px_var(--color-rack-accent-muted)]"
                        : "bg-rack-bg-deep text-rack-text-dim-2 hover:text-rack-text-dim"
                    )}
                  >
                    3D
                  </button>
                </div>
              </div>
            </div>
            {/* Misma caja para los dos modos (2D zoom CSS / 3D malla Three.js). */}
            <div className="relative h-[168px] w-full overflow-hidden rounded bg-rack-bg-deep shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]">
              {livePeakSrc ? (
                show3D ? (
                  <CorrelationSurface3D src={livePeakSrc} />
                ) : (
                  <img
                    src={livePeakSrc}
                    alt={t("modulo3AltZoom")}
                    className="h-full w-full object-cover contrast-125 brightness-95"
                    style={{ transform: "scale(3)" }}
                  />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="font-mono text-[9px] tracking-widest text-rack-text-dim uppercase">
                    {t("sinDatos")}
                  </span>
                </div>
              )}
              {livePeakSrc && !show3D && (
                <div className="pointer-events-none absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-rack-accent shadow-[0_0_8px_var(--color-rack-accent)]" />
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-8 border-hud-card bg-rack-bg-deep shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_4px_16px_rgba(0,0,0,0.6)] lg:h-full">
            <div className="shrink-0 bg-hud-card px-3 py-1.5">
              <span className="font-mono text-[11px] tracking-widest text-neutral-200 uppercase">
                Phase Correlator Processor
              </span>
            </div>

            {/* Etiqueta estática del método sub-píxel real (`subpixel_refine_1d`). */}
            <div className="shrink-0 px-3 pt-1">
              <span className="font-mono text-[9px] tracking-wider text-rack-text-dim uppercase">
                Subpixel Method: Foroosh-Zerubia-Berthod
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-between gap-3 p-3">
            <div className="flex flex-1 items-center justify-center">
              <ToggleSwitchGroup
                label="Source"
                options={SOURCES}
                value={source}
                onValueChange={(v) => setSource(v as PhaseAssetId)}
                disabled={isSimulating}
                large
              />
            </div>

            <div ref={executeBoxRef} className="grid shrink-0 grid-cols-2 gap-2 rounded-xl">
              <Button
                onClick={handleExecute}
                disabled={isSimulating}
                className="group relative flex h-11 w-full items-center justify-center rounded border border-neutral-600/40 bg-rack-bg-deep font-mono text-xs font-bold tracking-[0.18em] text-rack-accent-muted uppercase shadow-[0_3px_0_#000,0_5px_10px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-rack-accent-muted/60 hover:bg-rack-panel hover:shadow-[0_3px_0_#000,0_0_16px_rgba(52,211,153,0.25)] active:translate-y-0.5 active:shadow-[0_1px_0_#000,inset_0_2px_4px_rgba(0,0,0,0.8)] disabled:pointer-events-none disabled:opacity-40"
              >
                <span className="drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]">
                  {isSimulating ? t("simulando") : "Execute Phase Correlation"}
                </span>
              </Button>
              <Button
                onClick={handleStop}
                disabled={!isSimulating}
                className="group relative flex h-11 w-full items-center justify-center rounded border border-hud-error/40 bg-rack-bg-deep font-mono text-xs font-bold tracking-[0.18em] text-hud-error uppercase shadow-[0_3px_0_#000,0_5px_10px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-hud-error/60 hover:bg-rack-panel hover:shadow-[0_3px_0_#000,0_0_16px_rgba(239,68,68,0.25)] active:translate-y-0.5 active:shadow-[0_1px_0_#000,inset_0_2px_4px_rgba(0,0,0,0.8)] disabled:pointer-events-none disabled:opacity-40"
              >
                <span className="drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]">Stop</span>
              </Button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </RackChassis>
  )
}
