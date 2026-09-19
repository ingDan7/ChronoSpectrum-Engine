import { useEffect, useState } from "react"

// Efecto de texto tipo terminal (revelado carácter por carácter vía timer, sin plugin de GSAP).
interface TerminalTextProps {
  text: string
  active?: boolean
  speedMs?: number
  className?: string
}

export function TerminalText({
  text,
  active = true,
  speedMs = 18,
  className,
}: TerminalTextProps) {
  const [shown, setShown] = useState(active ? "" : text)

  useEffect(() => {
    if (!active) return
    setShown("")

    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) window.clearInterval(id)
    }, speedMs)

    return () => window.clearInterval(id)
  }, [active, text, speedMs])

  return (
    <span className={className}>
      {shown}
      <span className="animate-pulse text-rack-accent">▊</span>
    </span>
  )
}
