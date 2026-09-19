import { Lock } from "lucide-react"
import { cn } from "cn"
import { useTranslation } from "@/lib/i18n/LanguageProvider"

// Display tipo VFD para la tira de métricas; `locked` marca métricas que el backend aún no calcula.

interface VfdMetricCardProps {
  label: string
  value: string
  sublabel?: string
  locked?: boolean
}

export function VfdMetricCard({
  label,
  value,
  sublabel,
  locked = false,
}: VfdMetricCardProps) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-1 rounded bg-hud-card px-2 py-1.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.6)]",
        locked && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between text-rack-text-dim">
        <span className="font-mono text-[10px] tracking-wider uppercase">{label}</span>
        {locked && (
          <span className="flex items-center gap-1">
            <Lock className="size-3" aria-hidden />
            <span className="font-mono text-[9px] uppercase">{t("proximamente")}</span>
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between rounded bg-rack-bg-deep p-1.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]">
        <span
          className={cn(
            "font-mono text-lg tracking-wider tabular-nums",
            locked
              ? "text-rack-text-dim"
              : "text-rack-accent-muted drop-shadow-[0_0_6px_var(--color-rack-accent)]"
          )}
        >
          {value}
        </span>
        {sublabel && (
          <span className="font-mono text-[9px] text-rack-text-dim">{sublabel}</span>
        )}
      </div>
    </div>
  )
}
