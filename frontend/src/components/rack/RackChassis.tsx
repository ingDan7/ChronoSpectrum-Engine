import type { ReactNode } from "react"
import { ContactPopover } from "./ContactPopover"
import avatarImage from "@/assets/ChatGPT Image 14 sept 2026, 06_54_08 p.m.png"

// Contenedor visual del "chasis" de rack; flex column para repartirse en la altura fija de TvFrame.
export function RackChassis({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-hud-border bg-hud-bg p-3 shadow-2xl">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded bg-hud-card px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.6)]">
        <span className="font-mono text-[10px] tracking-widest text-rack-text-dim uppercase">
          ChronoSpectrum Engine · Lab Instruments
        </span>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-rack-accent-muted shadow-[0_0_8px_var(--color-rack-accent-muted)]" />
          <span className="font-mono text-[10px] tracking-widest text-rack-accent-muted uppercase">
            {title}
          </span>
          <ContactPopover
            name="Daniel Colmenares Bolivar"
            title="Multimedia Engineering | Software Development"
            linkedinUrl="https://www.linkedin.com/in/ing-mul-daniel"
            email="ing.daniel.bolivar757@gmail.com"
            avatarUrl={avatarImage}
          />
        </div>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
