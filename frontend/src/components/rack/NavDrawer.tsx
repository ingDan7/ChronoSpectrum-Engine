import { useEffect, useRef, useState } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ChevronLeft, ChevronRight, Globe, Home } from "lucide-react"
import { cn } from "cn"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

// Navegación única del sitio (drawer lateral); posición inicial fijada por GSAP, no por un style estático del JSX.

interface NavDrawerModule {
  value: string
  label: string
}

interface NavDrawerProps {
  modules: NavDrawerModule[]
  active: string
  onSelect: (value: string) => void
  /** Va a la landing ("/"), separado de `onSelect` para no sobrecargarlo con un value vacío. */
  onHome: () => void
}

const PANEL_WIDTH = 280
const SLEEP_DELAY_MS = 1800

export function NavDrawer({ modules, active, onSelect, onHome }: NavDrawerProps) {
  const { language, toggleLanguage, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [awake, setAwake] = useState(true)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { contextSafe } = useGSAP(
    () => {
      if (!panelRef.current) return
      gsap.set(panelRef.current, { xPercent: 100 })
    },
    { scope: panelRef }
  )

  useEffect(() => {
    const wake = () => {
      setAwake(true)
      if (sleepTimer.current) clearTimeout(sleepTimer.current)
      sleepTimer.current = setTimeout(() => setAwake(false), SLEEP_DELAY_MS)
    }
    window.addEventListener("mousemove", wake, { passive: true })
    // Fase de captura: el scroll real ocurre en <main>, no burbujea hasta window.
    window.addEventListener("scroll", wake, true)
    wake()
    return () => {
      window.removeEventListener("mousemove", wake)
      window.removeEventListener("scroll", wake, true)
      if (sleepTimer.current) clearTimeout(sleepTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      toggle()
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const toggle = contextSafe(() => {
    setOpen((prev) => {
      const next = !prev
      if (panelRef.current) {
        gsap.to(panelRef.current, {
          xPercent: next ? 0 : 100,
          duration: 0.4,
          ease: "power3.out",
        })
      }
      return next
    })
  })

  const isVisible = awake || open

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? t("navCloseDrawer") : t("navOpenDrawer")}
        className={cn(
          "fixed top-1/2 right-0 z-[10000] flex -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 bg-hud-card text-rack-text-dim shadow-[0_2px_8px_rgba(0,0,0,0.6)] transition-all duration-300 ease-out hover:text-rack-accent",
          isVisible
            ? "h-16 w-6 border-neutral-700 opacity-100"
            : "h-10 w-1.5 border-transparent bg-rack-text-dim/40 opacity-40 hover:h-16 hover:w-6 hover:border-neutral-700 hover:bg-hud-card hover:opacity-100 focus-visible:h-16 focus-visible:w-6 focus-visible:border-neutral-700 focus-visible:bg-hud-card focus-visible:opacity-100"
        )}
      >
        {open ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>

      <div
        ref={panelRef}
        style={{ width: PANEL_WIDTH }}
        className="fixed top-0 right-0 z-[9999] flex h-full flex-col justify-center gap-3 border-l border-rack-accent/30 bg-hud-bg/40 p-4 shadow-[-4px_0_16px_rgba(0,0,0,0.6)] backdrop-blur-sm"
      >
        <button
          type="button"
          onClick={onHome}
          aria-current={active === "" ? "true" : undefined}
          className={cn(
            "flex items-center gap-2 rounded-md border px-3 py-2 text-left font-mono text-xs tracking-widest uppercase transition-colors",
            active === ""
              ? "border-rack-accent/40 bg-rack-bg-deep text-rack-accent shadow-[0_0_10px_var(--color-rack-accent)]"
              : "border-neutral-700 bg-rack-bg-deep text-rack-text-dim hover:text-rack-accent"
          )}
        >
          <Home className="size-3.5" />
          {t("navHome")}
        </button>

        {modules.map((m) => {
          const isActive = m.value === active
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onSelect(m.value)}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                "rounded-md border px-3 py-2 text-left font-mono text-xs tracking-widest uppercase transition-colors",
                isActive
                  ? "border-rack-accent/40 bg-rack-bg-deep text-rack-accent shadow-[0_0_10px_var(--color-rack-accent)]"
                  : "border-neutral-700 bg-rack-bg-deep text-rack-text-dim hover:text-rack-accent"
              )}
            >
              {m.label}
            </button>
          )
        })}

        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={t("navLanguageToggle")}
          className="mt-1 flex items-center justify-center gap-2 rounded-md border border-neutral-700 bg-rack-bg-deep px-3 py-2 font-mono text-xs tracking-widest text-rack-text-dim uppercase transition-colors hover:text-rack-accent"
        >
          <Globe className="size-3.5" />
          {language === "es" ? "EN" : "ES"}
        </button>
      </div>
    </>
  )
}
