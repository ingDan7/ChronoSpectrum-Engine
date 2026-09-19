import { Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DiagnosticConsoleProps {
  lines: string[]
  onOpenLogs?: () => void
}

export function DiagnosticConsole({ lines, onOpenLogs }: DiagnosticConsoleProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded bg-rack-panel px-3 py-1 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] md:flex-row md:justify-between">
      <div className="w-full rounded bg-rack-bg-deep p-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
        {lines.map((line, i) => (
          <div key={i} className="font-mono text-[11px] tracking-widest text-rack-accent/90">
            {line}
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        onClick={onOpenLogs}
        className="rounded border-neutral-700 bg-rack-bg-deep font-mono text-[10px] tracking-widest whitespace-nowrap text-rack-text-dim uppercase hover:text-rack-accent"
      >
        <Terminal className="size-3.5" />[ Diagnostic Logs ]
      </Button>
    </div>
  )
}
