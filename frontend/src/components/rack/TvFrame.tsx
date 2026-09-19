import { useEffect, useRef, useState, type ReactNode } from "react"

// Escala todo el contenido como "una sola unidad rígida" (como el zoom de una imagen de TV), no con flexbox.

const DESIGN_WIDTH = 1440
const DESIGN_HEIGHT = 900

export function TvFrame({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = outerRef.current
    if (!el) return

    const recompute = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width === 0 || height === 0) return
      const next = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT, 1)
      setScale(next)
    }

    recompute()
    const observer = new ResizeObserver(recompute)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={outerRef} className="flex h-full w-full items-center justify-center overflow-hidden">
      <div
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
  )
}
