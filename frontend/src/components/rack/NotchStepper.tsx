import { cn } from "cn"

// Contador digital 1-10 para elegir slots de notch (límite real de SpectrumCleanerRequest.notches).

interface NotchStepperProps {
  value: number
  min: number
  max: number
  onValueChange: (value: number) => void
  /** Versión compacta para compartir fila con "Source" y "Notch Enabled". */
  compact?: boolean
}

export function NotchStepper({ value, min, max, onValueChange, compact = false }: NotchStepperProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col justify-center rounded-lg bg-[#121312] shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]",
        compact ? "p-2" : "p-2.5"
      )}
    >
      <div
        className={cn(
          "text-center font-mono tracking-widest text-rack-text-dim uppercase",
          compact ? "mb-1 text-[9px]" : "mb-1 text-[10px]"
        )}
      >
        Active Notches
      </div>
      <div className={cn("flex items-center justify-center", compact ? "gap-2.5" : "gap-4")}>
        <button
          type="button"
          onClick={() => onValueChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Reducir número de notches"
          className={cn(
            "flex items-center justify-center rounded-full border border-neutral-700 bg-rack-panel font-mono font-bold text-rack-text-dim transition-colors hover:text-rack-accent-muted disabled:cursor-not-allowed disabled:opacity-30",
            compact ? "size-6 text-sm" : "size-7 text-base"
          )}
        >
          −
        </button>
        <span
          className={cn(
            "text-center font-mono font-bold text-rack-accent drop-shadow-[0_0_8px_var(--color-rack-accent)]",
            compact ? "w-7 text-xl" : "w-11 text-2xl"
          )}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onValueChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="Aumentar número de notches"
          className={cn(
            "flex items-center justify-center rounded-full border border-neutral-700 bg-rack-panel font-mono font-bold text-rack-text-dim transition-colors hover:text-rack-accent-muted disabled:cursor-not-allowed disabled:opacity-30",
            compact ? "size-6 text-sm" : "size-7 text-base"
          )}
        >
          +
        </button>
      </div>
    </div>
  )
}
