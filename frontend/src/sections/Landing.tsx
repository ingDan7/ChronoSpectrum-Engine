import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { checkHealth } from "@/lib/api/client"
import { useTranslation } from "@/lib/i18n/LanguageProvider"
import type { TranslationKey } from "@/lib/i18n/translations"
import avatarImage from "@/assets/ChatGPT Image 14 sept 2026, 06_54_08 p.m.png"

// Pantalla de inicio: carrusel de módulos tipo "coverflow" (ángulos acotados a 30° para no mostrar el reverso).

interface ModuleSummary {
  mod: string
  label: string
  descriptionKey: TranslationKey
}

const MODULE_SUMMARIES: ModuleSummary[] = [
  { mod: "MOD 01", label: "EVM Optical Core", descriptionKey: "landingModule1Description" },
  { mod: "MOD 02", label: "Spectrum Cleaner Console", descriptionKey: "landingModule2Description" },
  { mod: "MOD 03", label: "Phase Correlation Core", descriptionKey: "landingModule3Description" },
]

const SLASH_COUNT = 12
const SLASH_TICK_MS = 5_000
const CAROUSEL_INTERVAL_MS = 7_000
const CAROUSEL_TRANSITION_S = 1.8

// 3 posiciones fijas del carrusel: 0 = centro/frente, 1 y 2 = atrás a cada lado (más chicas, rotadas, hundidas).
const CAROUSEL_SLOTS = [
  { x: 0, z: 0, rotationY: 0, scale: 1, opacity: 1, zIndex: 3 },
  { x: 190, z: -170, rotationY: -30, scale: 0.72, opacity: 0.5, zIndex: 1 },
  { x: -190, z: -170, rotationY: 30, scale: 0.72, opacity: 0.5, zIndex: 1 },
]

function ModuleCarousel() {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState(0)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % MODULE_SUMMARIES.length)
    }, CAROUSEL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])

  useGSAP(() => {
    MODULE_SUMMARIES.forEach((_, i) => {
      const el = cardRefs.current[i]
      if (!el) return
      const slot = (i - activeIndex + MODULE_SUMMARIES.length) % MODULE_SUMMARIES.length
      const target = CAROUSEL_SLOTS[slot]
      gsap.to(el, {
        x: target.x,
        z: target.z,
        rotationY: target.rotationY,
        scale: target.scale,
        opacity: target.opacity,
        zIndex: target.zIndex,
        duration: CAROUSEL_TRANSITION_S,
        ease: "power2.inOut",
      })
    })
  }, [activeIndex])

  return (
    <div className="relative h-40 w-full max-w-xl sm:h-48" style={{ perspective: 1400 }}>
      {MODULE_SUMMARIES.map((m, i) => (
        <div
          key={m.label}
          ref={(el) => {
            cardRefs.current[i] = el
          }}
          className="absolute inset-0 mx-auto flex w-full max-w-sm flex-col justify-center gap-1.5 rounded-lg border border-hud-border bg-black/55 p-4 text-left"
          style={{ transformStyle: "preserve-3d" }}
        >
          <span className="w-fit rounded-sm border border-hud-border bg-hud-inner px-2.5 py-1 font-mono text-xs font-extrabold tracking-widest text-hud-neon-muted uppercase sm:text-sm">
            {m.mod}
          </span>
          <span className="font-mono text-sm font-bold tracking-wider text-hud-neon-muted uppercase sm:text-base">
            {m.label}
          </span>
          <span className="font-mono text-xs text-rack-text-dim sm:text-sm">{t(m.descriptionKey)}</span>
        </div>
      ))}
    </div>
  )
}

const executeButtonClass =
  "group relative flex h-11 w-full max-w-xs items-center justify-center rounded border border-neutral-600/40 bg-rack-bg-deep font-mono text-xs font-bold tracking-[0.18em] text-rack-accent-muted uppercase shadow-[0_3px_0_#000,0_5px_10px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-rack-accent-muted/60 hover:bg-rack-panel hover:shadow-[0_3px_0_#000,0_0_16px_rgba(52,211,153,0.25)] active:translate-y-0.5 active:shadow-[0_1px_0_#000,inset_0_2px_4px_rgba(0,0,0,0.8)]"

const retryButtonClass =
  "group relative flex h-11 w-full max-w-xs items-center justify-center rounded border border-neutral-600/40 bg-rack-bg-deep font-mono text-xs font-bold tracking-[0.18em] text-hud-error uppercase shadow-[0_3px_0_#000,0_5px_10px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-hud-error/60 hover:bg-rack-panel active:translate-y-0.5 active:shadow-[0_1px_0_#000,inset_0_2px_4px_rgba(0,0,0,0.8)]"

type WakeState = "idle" | "waking" | "error"

export function Landing() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [wakeState, setWakeState] = useState<WakeState>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [litSlashes, setLitSlashes] = useState(0)
  const tickRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current)
    }
  }, [])

  const handleComenzar = async () => {
    if (wakeState === "waking") return
    setWakeState("waking")
    setErrorMessage(null)
    setLitSlashes(0)

    tickRef.current = window.setInterval(() => {
      setLitSlashes((prev) => Math.min(prev + 1, SLASH_COUNT))
    }, SLASH_TICK_MS)

    const result = await checkHealth()

    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current)
      tickRef.current = null
    }

    if (result.kind === "ok") {
      setLitSlashes(SLASH_COUNT)
      navigate("/modulo-1")
      return
    }

    setErrorMessage(result.message)
    setWakeState("error")
  }

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 overflow-hidden bg-rack-bg px-6 py-6 text-neutral-200 sm:px-10">
      <div className="flex min-h-0 w-full max-w-[72.8rem] flex-1 flex-col items-center justify-center gap-4">
        {/* Bisel exterior tipo plástico oscuro, envolviendo el bisel interior de CrtMonitor.tsx. */}
        <div className="relative w-full max-h-[70dvh] overflow-hidden rounded-[28px] bg-gradient-to-b from-neutral-700 to-black p-4 shadow-[0_16px_50px_rgba(0,0,0,0.85),inset_0_2px_2px_rgba(255,255,255,0.06)] sm:p-5">
          <div className="relative rounded-xl bg-hud-card p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_4px_6px_rgba(0,0,0,0.6)]">
            <div className="relative overflow-hidden rounded-lg bg-rack-bg-deep p-6 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] sm:p-10">
              <div className="flex flex-col items-center gap-4 text-center">
                <div>
                  <h1 className="font-display text-4xl leading-none font-black tracking-tight text-white uppercase sm:text-6xl">
                    ChronoSpectrum Engine
                  </h1>
                  <p className="mt-2 font-mono text-base font-bold tracking-wider text-hud-neon-muted uppercase sm:text-lg">
                    {t("landingSubtitle")}
                  </p>
                </div>

                <ModuleCarousel />
              </div>

              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-70 mix-blend-overlay"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 1px, transparent 1px, transparent 2px)",
                }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ boxShadow: "inset 0 0 140px 50px rgba(0,0,0,0.9)" }}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleComenzar}
          disabled={wakeState === "waking"}
          className={wakeState === "error" ? retryButtonClass : executeButtonClass}
        >
          <span className="drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]">
            {wakeState === "idle"
              ? t("landingComenzar")
              : wakeState === "waking"
                ? t("landingDespertando")
                : t("landingReintentar")}
          </span>
        </Button>

        {wakeState === "waking" ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className={cn(
                "flex gap-1 font-mono text-xl text-rack-accent",
                litSlashes >= SLASH_COUNT && "animate-pulse"
              )}
            >
              {Array.from({ length: SLASH_COUNT }).map((_, i) => (
                <span key={i} className={i < litSlashes ? "text-rack-accent" : "text-rack-text-dim/30"}>
                  /
                </span>
              ))}
            </div>
            <p className="max-w-xs font-mono text-[10px] text-rack-text-dim">{t("landingWaitNotice")}</p>
          </div>
        ) : null}

        {wakeState === "error" ? (
          <p className="max-w-xs text-center font-mono text-[10px] text-rack-text-dim">{errorMessage}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3 rounded-lg border border-hud-border bg-hud-card px-4 py-3">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-rack-accent-muted/40 bg-rack-bg-deep">
          <img src={avatarImage} alt="Daniel Colmenares Bolivar" className="size-full object-cover" />
        </div>
        <div className="text-left">
          <p className="font-mono text-xs text-rack-text-dim">Daniel Colmenares Bolivar</p>
          <p className="font-mono text-[10px] text-rack-accent-muted">
            Multimedia Engineering | Software Development
          </p>
        </div>
        <div className="ml-2 flex flex-col gap-0.5 border-l border-hud-border pl-3">
          <a
            href="https://www.linkedin.com/in/ing-mul-daniel"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-rack-accent-muted hover:text-rack-accent"
          >
            LinkedIn →
          </a>
          <a
            href="mailto:ing.daniel.bolivar757@gmail.com"
            className="font-mono text-[10px] text-rack-accent-muted hover:text-rack-accent"
          >
            {t("contactEmailLink")}
          </a>
        </div>
      </div>
    </div>
  )
}
