import type { ComponentProps } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { cn } from "cn"

// Restyling de los Tabs de shadcn/ui como "placas metálicas" del rack, sin duplicar el primitivo base.

export const RackTabs = Tabs

export function RackTabsList({ className, ...props }: ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      className={cn("h-auto flex-wrap gap-3 rounded-none bg-transparent p-0", className)}
      {...props}
    />
  )
}

export function RackTabsTrigger({ className, ...props }: ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        "h-10 rounded-md border border-slate-700 bg-rack-panel px-4 font-mono text-xs tracking-widest text-rack-text-dim uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.6)]",
        "data-active:border-rack-accent/40 data-active:bg-rack-panel data-active:text-rack-accent data-active:shadow-[0_0_10px_var(--color-rack-accent)]",
        className
      )}
      {...props}
    />
  )
}

export const RackTabsContent = TabsContent
