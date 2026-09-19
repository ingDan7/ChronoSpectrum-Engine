import { cn } from "cn"

// Grupo de interruptores de palanca, radiogroup accesible manual (sin RadioGroup de shadcn/Base UI instalado).

interface ToggleOption {
  value: string
  label: string
}

interface ToggleSwitchGroupProps {
  label: string
  options: ToggleOption[]
  value: string
  onValueChange: (value: string) => void
  /** Layout compacto: mismas palancas verticales, a menor escala, para caber varias en una fila. */
  compact?: boolean
  /** Variante grande del layout default; se ignora si `compact` es true. */
  large?: boolean
  /** Bloquea la selección mientras hay una simulación en vivo activa. */
  disabled?: boolean
  /** Fondo `bg-hud-card` en vez del `bg-rack-bg-deep/60` default, con la sombra "elevada" de VfdMetricCard. */
  light?: boolean
}

export function ToggleSwitchGroup({
  label,
  options,
  value,
  onValueChange,
  compact = false,
  large = false,
  disabled = false,
  light = false,
}: ToggleSwitchGroupProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex h-full flex-col items-center justify-center gap-1.5 rounded px-2.5 py-2.5",
          light
            ? "bg-black shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]"
            : "bg-[#121312] shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]"
        )}
      >
        <span className="font-mono text-[9px] tracking-widest text-rack-text-dim uppercase">
          {label}
        </span>
        <div role="radiogroup" aria-label={label} className="flex items-end gap-2.5">
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => onValueChange(opt.value)}
                className="flex flex-col items-center gap-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-rack-accent disabled:pointer-events-none disabled:opacity-40"
              >
                <span
                  className={cn(
                    "font-mono text-[9px] leading-none",
                    active
                      ? "font-bold text-rack-accent-muted drop-shadow-[0_0_4px_var(--color-rack-accent-muted)]"
                      : "text-rack-text-dim-2"
                  )}
                >
                  {opt.label}
                </span>
                <span
                  className={cn(
                    "flex h-7 w-3.5 flex-col rounded-full bg-rack-bg-deep p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]",
                    active ? "justify-start" : "justify-end"
                  )}
                >
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      active
                        ? "bg-rack-accent-muted shadow-[0_0_8px_var(--color-rack-accent-muted)]"
                        : "bg-neutral-600"
                    )}
                  />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded",
        light
          ? "bg-black shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]"
          : "bg-[#121312] shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]",
        large ? "px-4 py-3" : "px-3 py-2"
      )}
    >
      <span
        className={cn(
          "font-mono tracking-widest text-rack-text-dim uppercase",
          large ? "text-xs" : "text-[10px]"
        )}
      >
        {label}
      </span>
      <div role="radiogroup" aria-label={label} className={cn("flex items-center", large ? "gap-6" : "gap-4")}>
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onValueChange(opt.value)}
              className="flex flex-col items-center gap-1.5 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-rack-accent disabled:pointer-events-none disabled:opacity-40"
            >
              <span
                className={cn(
                  "font-mono",
                  large ? "text-xs" : "text-[10px]",
                  active
                    ? "font-bold text-rack-accent-muted drop-shadow-[0_0_4px_var(--color-rack-accent-muted)]"
                    : "text-rack-text-dim-2"
                )}
              >
                {opt.label}
              </span>
              <span
                className={cn(
                  "flex flex-col rounded-full bg-rack-bg-deep p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]",
                  large ? "h-10 w-5" : "h-8 w-4",
                  active ? "justify-start" : "justify-end"
                )}
              >
                <span
                  className={cn(
                    "rounded-full",
                    large ? "size-4" : "size-3",
                    active
                      ? "bg-rack-accent-muted shadow-[0_0_8px_var(--color-rack-accent-muted)]"
                      : "bg-neutral-600"
                  )}
                />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
