import { useEffect, useRef, useState } from "react"
import { User } from "lucide-react"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

interface ContactPopoverProps {
  name: string
  title: string
  linkedinUrl: string
  email: string
  /** Opcional; sin ella se muestra un placeholder con el ícono `User`. */
  avatarUrl?: string
}

// Botón "user" + popup de contacto; se cierra al hacer click/tap afuera (mismo patrón que NavDrawer).
export function ContactPopover({ name, title, linkedinUrl, email, avatarUrl }: ContactPopoverProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (wrapperRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [open])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={t("contactAriaLabel")}
        className="flex size-6 items-center justify-center rounded-full border border-neutral-700 bg-rack-bg-deep text-rack-text-dim transition-colors hover:text-rack-accent"
      >
        <User className="size-3.5" />
      </button>
      {open ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-[307px] rounded-md border border-rack-accent/30 bg-hud-card p-[19px] shadow-[0_4px_12px_rgba(0,0,0,0.7)]">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-rack-accent-muted/40 bg-rack-bg-deep">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="size-full object-cover" />
              ) : (
                <User className="size-5 text-rack-text-dim" />
              )}
            </div>
            <div>
              <p className="font-mono text-[14px] text-rack-text-dim">{name}</p>
              <p className="mt-1 font-mono text-[12px] text-rack-accent-muted">{title}</p>
            </div>
          </div>
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block font-mono text-[14px] text-rack-accent-muted hover:text-rack-accent"
          >
            LinkedIn →
          </a>
          <a
            href={`mailto:${email}`}
            className="mt-1 block font-mono text-[14px] text-rack-accent-muted hover:text-rack-accent"
          >
            {t("contactEmailLink")}
          </a>
        </div>
      ) : null}
    </div>
  )
}
