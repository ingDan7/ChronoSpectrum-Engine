import { useTranslation } from "@/lib/i18n/LanguageProvider"

interface CrtMonitorProps {
  src?: string
  alt?: string
  channelLabel: string
  statusLabel: string
  /** Petición al backend en curso — se prioriza sobre `src`/errorMessage. */
  loading?: boolean
  /** Mensaje real del backend (validación, rate-limit, red). */
  errorMessage?: string
  /** Miniatura opcional en la esquina inferior derecha (ej. el original mientras se procesa). */
  thumbnailSrc?: string
  /** Etiqueta corta de la miniatura; se ignora si no hay `thumbnailSrc`. */
  thumbnailLabel?: string
}

// Bisel + pantalla CRT con scanlines; TvFrame ya resuelve el escalado, aquí solo llena `h-full`.
export function CrtMonitor({
  src,
  alt,
  channelLabel,
  statusLabel,
  loading,
  errorMessage,
  thumbnailSrc,
  thumbnailLabel,
}: CrtMonitorProps) {
  const { t } = useTranslation()
  return (
    <div className="relative flex h-full w-full flex-col rounded-xl bg-hud-card p-3 shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_4px_6px_rgba(0,0,0,0.6)]">
      <div className="relative flex-1 overflow-hidden rounded-lg bg-rack-bg-deep shadow-[inset_0_0_30px_rgba(0,0,0,0.9)]">
        {loading ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <span className="size-2 animate-ping rounded-full bg-rack-accent-muted" />
            <span className="font-mono text-xs tracking-[0.3em] text-rack-accent-muted uppercase">
              {t("procesando")}
            </span>
          </div>
        ) : errorMessage ? (
          <div className="flex h-full w-full items-center justify-center p-4">
            <span className="max-w-full text-center font-mono text-xs text-hud-error">{errorMessage}</span>
          </div>
        ) : src ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-contain contrast-125 brightness-95"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-mono text-xs tracking-[0.3em] text-rack-text-dim uppercase">
              No Signal
            </span>
          </div>
        )}

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
          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.95)]"
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-2">
          <span className="flex items-center gap-1.5 rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] tracking-wider text-rack-accent-muted">
            <span className="size-1.5 animate-pulse rounded-full bg-rack-accent-muted" />
            {channelLabel}
          </span>
          <span className="rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] tracking-wider text-rack-accent-2">
            {statusLabel}
          </span>
        </div>

        {thumbnailSrc ? (
          <div className="absolute right-2 bottom-2 w-1/4 min-w-16 overflow-hidden rounded border border-rack-accent-muted/50 bg-black shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <img src={thumbnailSrc} alt={thumbnailLabel ?? "Original"} className="aspect-video w-full object-contain" />
            {thumbnailLabel ? (
              <span className="absolute bottom-0.5 left-1 rounded bg-black/70 px-1 font-mono text-[8px] tracking-wider text-rack-accent-muted">
                {thumbnailLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
