import { useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

import { Button } from "@/components/ui/button"
import { RackChassis } from "@/components/rack/RackChassis"
import { CrtMonitor } from "@/components/rack/CrtMonitor"
import { Oscilloscope } from "@/components/rack/Oscilloscope"
import { RotaryKnob } from "@/components/rack/RotaryKnob"
import { SteppedKnob } from "@/components/rack/SteppedKnob"
import { ToggleSwitchGroup } from "@/components/rack/ToggleSwitchGroup"
import { VfdMetricCard } from "@/components/rack/VfdMetricCard"
import { connectMotionMagnifierLive } from "@/lib/api/live"
import { runMotionMagnifier } from "@/lib/api/client"
import { validateMotionMagnifierRequest } from "@/lib/api/validation"
import type { LiveConnection } from "@/lib/api/live"
import type {
  MotionAssetId,
  MotionFilterMode,
  MotionMagnifierLiveResult,
  MotionMagnifierRequest,
  TemporalPsd,
} from "@/lib/api/types"
import { useSyncedFramePlayer } from "@/lib/useFramePlayer"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

const SOURCES: { value: MotionAssetId; label: string }[] = [
  { value: "synthetic_breathing_1hz", label: "SYN" },
  { value: "real_eye_pulse", label: "EYE" },
  { value: "real_speaker_vibration", label: "VIB" },
]

// Niveles de la pirámide Laplaciana, rango 2-5 fijado en el backend (api/models.py).
const LEVELS_OPTIONS: { value: string; label: string; angle: number }[] = [
  { value: "2", label: "2", angle: -135 },
  { value: "3", label: "3", angle: -45 },
  { value: "4", label: "4", angle: 45 },
  { value: "5", label: "5", angle: 135 },
]

const FILTER_MODE_OPTIONS: { value: MotionFilterMode; label: string }[] = [
  { value: "iir", label: "DEFAULT" },
  { value: "ideal_fft", label: "IDEAL" },
]

// Espera este tiempo tras el último movimiento de perilla antes de reenviar por el WebSocket.
const KNOB_DEBOUNCE_MS = 150

// synthetic_breathing_1hz fija sample_rate=30.0 en código (backend/api/assets.py).
const SYNTHETIC_SAMPLE_RATE = 30.0

// Margen restado a Nyquist para el tope de las perillas Bandpass (el backend rechaza f_high >= sample_rate/2).
const NYQUIST_SAFETY_MARGIN_HZ = 0.1

// Módulo 1 — Eulerian Motion & Pulse Magnifier.
export function Modulo1() {
  const { t } = useTranslation()
  const [alpha, setAlpha] = useState(10)
  const [fLow, setFLow] = useState(0.8)
  const [fHigh, setFHigh] = useState(1.2)
  const [levels, setLevels] = useState(3)
  const [filterMode, setFilterMode] = useState<MotionFilterMode>("iir")
  const [source, setSource] = useState<MotionAssetId>("synthetic_breathing_1hz")

  // isSimulating y errorMessage son independientes: un error de negocio no cierra la simulación ni el socket.
  const [isSimulating, setIsSimulating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [liveFrames, setLiveFrames] = useState<string[] | null>(null)
  const [liveSampleRate, setLiveSampleRate] = useState<number | null>(null)
  const [psd, setPsd] = useState<TemporalPsd | null>(null)
  const [liveOriginalFrames, setLiveOriginalFrames] = useState<string[] | null>(null)
  // Persiste el original entre actualizaciones y tras un Stop (no se limpia al parar la simulación).
  const [originalFrames, setOriginalFrames] = useState<string[] | null>(null)
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(false)
  const [originalErrorMessage, setOriginalErrorMessage] = useState<string | null>(null)
  const [sampleRateForSource, setSampleRateForSource] = useState<number>(SYNTHETIC_SAMPLE_RATE)

  const isConnecting = isSimulating && liveFrames === null && errorMessage === null

  // Original y procesado se reproducen sincronizados con un único índice compartido (useSyncedFramePlayer).
  const framePlayer = useSyncedFramePlayer(
    liveOriginalFrames ?? originalFrames,
    liveFrames,
    liveSampleRate ?? sampleRateForSource,
    "image/jpeg"
  )

  const connectionRef = useRef<LiveConnection<MotionMagnifierRequest> | null>(null)
  const expectedCloseRef = useRef(false)
  const debounceRef = useRef<number | null>(null)
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

  useEffect(() => {
    return () => {
      expectedCloseRef.current = true
      connectionRef.current?.close()
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    }
  }, [])

  // Al cambiar Source, trae el original completo y el sample_rate real vía HTTP (sin abrir el WebSocket).
  useEffect(() => {
    const fetchId = ++originalFetchIdRef.current

    setIsLoadingOriginal(true)
    setOriginalErrorMessage(null)

    runMotionMagnifier({ asset_id: source, levels: 3, filter_mode: "iir", alpha: 1, f_low: 0.1, f_high: 1.0 }).then((result) => {
      if (fetchId !== originalFetchIdRef.current) return
      setIsLoadingOriginal(false)
      if (result.kind === "ok") {
        setOriginalFrames(result.data.original_frames_jpeg_base64)
        setSampleRateForSource(result.data.sample_rate)
        const safeMax = Math.max(0.3, result.data.sample_rate / 2 - NYQUIST_SAFETY_MARGIN_HZ)
        setFHigh((prev) => Math.min(prev, safeMax))
        setFLow((prev) => Math.min(prev, safeMax - 0.1))
      } else {
        setOriginalErrorMessage(result.message)
      }
    })
  }, [source])

  const handleResult = (result: MotionMagnifierLiveResult) => {
    setLiveFrames(result.frames_jpeg_base64)
    setLiveSampleRate(result.sample_rate)
    setPsd(result.psd)
    setLiveOriginalFrames(result.original_frames_jpeg_base64)
    setSampleRateForSource(result.sample_rate)
    setErrorMessage(null)
  }

  const handleLiveError = (message: string) => {
    setErrorMessage(message)
  }

  const handleExecute = contextSafe(() => {
    if (isSimulating) return
    flashExecuteBox()

    const requestBody: MotionMagnifierRequest = {
      asset_id: source,
      levels,
      filter_mode: filterMode,
      alpha,
      f_low: fLow,
      f_high: fHigh,
    }
    const validationErrors = validateMotionMagnifierRequest(requestBody)
    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.map((e) => e.message).join(" · "))
      return
    }

    setIsSimulating(true)
    setErrorMessage(null)
    expectedCloseRef.current = false

    const connection = connectMotionMagnifierLive({
      onResult: handleResult,
      onError: handleLiveError,
      onClose: () => {
        if (!expectedCloseRef.current) {
          setIsSimulating(false)
          setLiveFrames(null)
          setLiveSampleRate(null)
          setLiveOriginalFrames(null)
          setPsd(null)
          setErrorMessage(t("conexionPerdida"))
        }
      },
    })
    connectionRef.current = connection
    connection.send(requestBody)
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
    setLiveFrames(null)
    setLiveSampleRate(null)
    setLiveOriginalFrames(null)
    setPsd(null)
    setIsSimulating(false)
    setErrorMessage(null)
  })

  const sendLiveUpdate = (next: {
    levels: number
    filterMode: MotionFilterMode
    alpha: number
    fLow: number
    fHigh: number
  }) => {
    if (!isSimulating || !connectionRef.current) return
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      connectionRef.current?.send({
        asset_id: source,
        levels: next.levels,
        filter_mode: next.filterMode,
        alpha: next.alpha,
        f_low: next.fLow,
        f_high: next.fHigh,
      })
    }, KNOB_DEBOUNCE_MS)
  }

  const handleAlphaChange = (v: number) => {
    setAlpha(v)
    sendLiveUpdate({ levels, filterMode, alpha: v, fLow, fHigh })
  }
  const handleFLowChange = (v: number) => {
    const next = Math.min(v, fHigh - 0.1)
    setFLow(next)
    sendLiveUpdate({ levels, filterMode, alpha, fLow: next, fHigh })
  }
  const handleFHighChange = (v: number) => {
    const next = Math.max(v, fLow + 0.1)
    setFHigh(next)
    sendLiveUpdate({ levels, filterMode, alpha, fLow, fHigh: next })
  }
  const handleLevelsChange = (v: string) => {
    const next = Number(v)
    setLevels(next)
    sendLiveUpdate({ levels: next, filterMode, alpha, fLow, fHigh })
  }
  const handleFilterModeChange = (v: string) => {
    const next = v as MotionFilterMode
    setFilterMode(next)
    sendLiveUpdate({ levels, filterMode: next, alpha, fLow, fHigh })
  }

  // Un solo CRT: original antes de Execute/tras Stop, procesado durante la simulación (original en miniatura).
  const crtSrc = (isSimulating ? framePlayer.frameSrcB : framePlayer.frameSrcA) ?? undefined
  const crtLoading = isSimulating ? isConnecting : isLoadingOriginal
  const crtErrorMessage = (isSimulating ? errorMessage : originalErrorMessage) ?? undefined
  const thumbnailSrc = isSimulating ? (framePlayer.frameSrcA ?? undefined) : undefined

  const knobMaxHz = Math.max(0.3, sampleRateForSource / 2 - NYQUIST_SAFETY_MARGIN_HZ)

  return (
    <RackChassis title="EVM Optical Core">
      <div className="flex min-h-0 flex-col gap-3 lg:h-full lg:flex-row">
        <div className="flex min-h-0 flex-col gap-3 lg:h-full lg:flex-3">
          <div className="h-64 lg:h-auto lg:min-h-0 lg:flex-1">
            <CrtMonitor
              src={crtSrc}
              alt={isSimulating ? t("modulo1AltLive") : t("modulo1AltOriginal")}
              loading={crtLoading}
              errorMessage={crtErrorMessage}
              channelLabel={`CH-01 · ${source.toUpperCase()}`}
              statusLabel={isSimulating ? "SIGNAL LOCKED · LIVE" : "ORIGINAL"}
              thumbnailSrc={thumbnailSrc}
              thumbnailLabel="ORIGINAL"
            />
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3">
            <VfdMetricCard label="Gain" value={`${alpha.toFixed(1)}×`} sublabel="α" />
            <VfdMetricCard label="Frequency" value={`${fLow.toFixed(1)}–${fHigh.toFixed(1)}`} sublabel="Hz" />
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3 lg:h-full lg:flex-2">
          <div className="shrink-0">
            <Oscilloscope
              active={isSimulating}
              freqHz={(fLow + fHigh) / 2}
              alpha={alpha}
              psd={psd ?? undefined}
              showPsd
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-8 border-hud-card bg-rack-bg-deep shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_4px_16px_rgba(0,0,0,0.6)] lg:h-full">
            <div className="shrink-0 bg-hud-card px-3 py-1.5">
              <span className="font-mono text-[11px] tracking-widest text-neutral-200 uppercase">
                EVM Parameter Processor
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 p-2">

            <div className="grid shrink-0 grid-cols-1 items-center gap-2 border-b border-white/5 pb-3 sm:grid-cols-3">
              <RotaryKnob
                label="Magnification Factor (α)"
                value={alpha}
                min={1}
                max={50}
                step={1}
                onValueChange={handleAlphaChange}
                diameter={100}
                largeReadout
              />
              <RotaryKnob
                label="Bandpass Low (Hz)"
                value={fLow}
                min={0.1}
                max={knobMaxHz}
                step={0.1}
                onValueChange={handleFLowChange}
                accentColor={{ vivid: "#84cc16", muted: "#a3e635" }}
                compactLabel
                diameter={85}
                largeReadout
              />
              <RotaryKnob
                label="Bandpass High (Hz)"
                value={fHigh}
                min={0.1}
                max={knobMaxHz}
                step={0.1}
                onValueChange={handleFHighChange}
                accentColor={{ vivid: "#14b8a6", muted: "#2dd4bf" }}
                compactLabel
                diameter={85}
                largeReadout
              />
            </div>

            <div className="grid shrink-0 grid-cols-1 items-center gap-2 sm:grid-cols-3">
              <ToggleSwitchGroup
                label="Source"
                options={SOURCES}
                value={source}
                onValueChange={(v) => setSource(v as MotionAssetId)}
                disabled={isSimulating}
              />
              <ToggleSwitchGroup
                label="Temporal Filter"
                options={FILTER_MODE_OPTIONS}
                value={filterMode}
                onValueChange={handleFilterModeChange}
              />
              <SteppedKnob
                label="Pyramid Levels"
                options={LEVELS_OPTIONS}
                value={String(levels)}
                onValueChange={handleLevelsChange}
                diameter={100}
              />
            </div>

            <div ref={executeBoxRef} className="grid shrink-0 grid-cols-2 gap-2 rounded-xl">
              <Button
                onClick={handleExecute}
                disabled={isSimulating}
                className="group relative flex h-11 w-full items-center justify-center rounded border border-neutral-600/40 bg-rack-bg-deep font-mono text-xs font-bold tracking-[0.18em] text-rack-accent-muted uppercase shadow-[0_3px_0_#000,0_5px_10px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-rack-accent-muted/60 hover:bg-rack-panel hover:shadow-[0_3px_0_#000,0_0_16px_rgba(52,211,153,0.25)] active:translate-y-0.5 active:shadow-[0_1px_0_#000,inset_0_2px_4px_rgba(0,0,0,0.8)]"
              >
                <span className="drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]">
                  {isSimulating ? t("simulando") : "Execute Magnification"}
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
