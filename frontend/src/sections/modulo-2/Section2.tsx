import { useEffect, useRef } from "react"
import "./Section2.css"

// Section2 — documentación técnica del 2D-FFT Interactive Spectrum Cleaner, mismo HUD "Mouse Spotlight" que modulo-1/Section2.tsx.
export function Section2() {
  const cardRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cardRefs.current.forEach((card) => {
        if (!card) return
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const isNear = x >= -100 && x <= rect.width + 100 && y >= -100 && y <= rect.height + 100

        card.style.setProperty("--mouse-x", `${x}px`)
        card.style.setProperty("--mouse-y", `${y}px`)
        card.style.setProperty("--glow-opacity", isNear ? "1" : "0")

        const isHovered = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height
        if (isHovered) {
          card.style.borderColor = "rgba(52, 211, 153, 0.85)"
          card.style.boxShadow = "0 0 25px rgba(52, 211, 153, 0.25)"
          card.style.filter = "grayscale(0) brightness(1)"
        } else {
          card.style.borderColor = "#2b322d"
          card.style.boxShadow = "none"
          card.style.filter = "grayscale(1) brightness(0.7)"
        }
      })
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="section2-hud w-full flex flex-col gap-2 bg-hud-bg p-2 font-mono text-hud-dim antialiased selection:bg-hud-neon-muted selection:text-black">
      {/* STEP 01 */}
      <section
        ref={(el) => {
          cardRefs.current[0] = el
        }}
        className="step step-card min-h-[calc(50dvh-0.75rem)] h-auto w-full flex-none overflow-visible rounded-lg lg:h-[calc(50dvh-0.75rem)] lg:overflow-hidden border-2 border-hud-border bg-hud-card p-4 sm:p-5 flex flex-col justify-between relative"
      >
        <div className="hud-bar absolute top-0 left-0 w-2.5 h-full bg-hud-neon-muted opacity-40 rounded-l-lg" />

        <div className="flex items-center justify-between border-b-2 border-hud-border pb-2.5 pl-3 relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-hud-neon-muted text-black font-black text-xs sm:text-sm uppercase rounded-sm shadow-[0_0_10px_rgba(52,211,153,0.4)]">
              STEP 01
            </span>
            <span className="text-sm sm:text-base font-bold text-hud-neon-muted tracking-wider uppercase">
              CONTEXTO &amp; PIPELINE
            </span>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-hud-neon-muted uppercase tracking-widest bg-hud-inner border border-hud-border px-2.5 py-1 rounded-sm">
            LIMPIEZA ESPECTRAL 2D-FFT
          </span>
        </div>

        <div className="pl-3 my-auto flex flex-col gap-3 relative z-10">
          <h1 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none">
            2D-FFT Interactive Spectrum Cleaner
          </h1>
          <p className="text-base sm:text-xl text-hud-dim leading-snug font-semibold max-w-full">
            Elimina patrones de ruido periódico, interferencia electromagnética o tramado Moiré en cualquier imagen
            de entrada — sin necesitar un tipo de sensor o contenido específico.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 pl-3 relative z-10 sm:grid-cols-3">
          <div className="p-3 bg-hud-inner border border-hud-border rounded-sm flex flex-col items-center text-center justify-center gap-1">
            <span className="text-xs text-hud-neon-muted font-bold uppercase tracking-widest">// FASE 01</span>
            <span className="text-sm sm:text-base font-black text-white">TRANSFORMADA FFT2D</span>
          </div>
          <div className="p-3 bg-hud-inner border-2 border-hud-neon-muted/70 rounded-sm flex flex-col items-center text-center justify-center gap-1 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
            <span className="text-xs text-hud-neon-muted font-bold uppercase tracking-widest">// FASE 02</span>
            <span className="text-sm sm:text-base font-black text-hud-neon-muted">FILTRO NOTCH (MÁSCARA)</span>
          </div>
          <div className="p-3 bg-hud-inner border border-hud-border rounded-sm flex flex-col items-center text-center justify-center gap-1">
            <span className="text-xs text-hud-neon-muted font-bold uppercase tracking-widest">// FASE 03</span>
            <span className="text-sm sm:text-base font-black text-white">RECONSTRUCCIÓN IFFT2D</span>
          </div>
        </div>
      </section>

      {/* STEP 02 */}
      <section
        ref={(el) => {
          cardRefs.current[1] = el
        }}
        className="step step-card min-h-[calc(50dvh-0.75rem)] h-auto w-full flex-none overflow-visible rounded-lg lg:h-[calc(50dvh-0.75rem)] lg:overflow-hidden border-2 border-hud-border bg-hud-card p-4 sm:p-5 flex flex-col justify-between relative"
      >
        <div className="hud-bar absolute top-0 left-0 w-2.5 h-full bg-hud-neon-muted opacity-40 rounded-l-lg" />

        <div className="flex items-center justify-between border-b-2 border-hud-border pb-2.5 pl-3 relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-hud-inner text-hud-neon-muted border border-hud-neon-muted/60 font-black text-xs sm:text-sm rounded-sm">
              STEP 02
            </span>
            <span className="text-sm sm:text-base font-bold text-hud-neon-muted tracking-wider uppercase">
              ARQUITECTURA &amp; MATEMÁTICA
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 items-stretch pl-3 relative z-10 lg:flex-1 lg:min-h-0 lg:grid-cols-12">
          <div className="lg:col-span-5 bg-hud-inner p-3 border-2 border-hud-border rounded-sm flex flex-col items-center justify-between min-h-0">
            <div className="w-full flex justify-between items-center text-xs font-bold text-hud-neon-muted border-b border-hud-border pb-1.5">
              <span>[ FRECUENCIA ]</span>
              <span>PAR SIMÉTRICO (u0,v0)</span>
            </div>
            <svg className="w-full flex-1 min-h-0" viewBox="0 0 500 180" fill="none" preserveAspectRatio="xMidYMid meet">
              <rect x="20" y="20" width="460" height="140" rx="4" fill="#121413" stroke="#f59e0b" strokeWidth="2" />
              <line x1="250" y1="20" x2="250" y2="160" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              <line x1="20" y1="90" x2="480" y2="90" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              <circle cx="330" cy="55" r="9" fill="#f59e0b" />
              <text x="330" y="40" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="12" fontWeight="bold" textAnchor="middle">
                (u0,v0)
              </text>
              <circle cx="170" cy="125" r="9" fill="#f59e0b" />
              <text x="170" y="150" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="12" fontWeight="bold" textAnchor="middle">
                (-u0,-v0)
              </text>
              <circle cx="380" cy="115" r="6" fill="#ffffff" opacity="0.9" />
              <text x="395" y="112" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="11" fontWeight="bold" opacity="0.9">
                (u,v)
              </text>
              <line x1="380" y1="115" x2="330" y2="55" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />
              <text x="365" y="78" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="10" opacity="0.8">
                D1
              </text>
              <line x1="380" y1="115" x2="170" y2="125" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />
              <text x="272" y="140" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="10" opacity="0.8">
                D2
              </text>
              <text x="250" y="15" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" opacity="0.7">
                ORIGEN (DC)
              </text>
            </svg>
            <span className="text-xs font-extrabold text-hud-neon-muted text-center tracking-wide">
              FIG 01: DISTANCIA D(u,v) A CADA PICO
            </span>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between gap-2.5 min-h-0">
            <div className="bg-hud-inner border-2 border-hud-border p-3.5 rounded-sm flex-1 flex flex-col justify-center min-h-0">
              <span className="text-xs text-hud-neon-muted font-extrabold uppercase tracking-wider block mb-1">
                // DISTANCIA AL PICO
              </span>
              <code className="text-sm sm:text-base font-mono text-hud-neon-muted bg-hud-bg border border-hud-border px-3 py-1.5 rounded block font-bold">
                D1=√[(u−u0)²+(v−v0)²] &nbsp; D2=√[(u+u0)²+(v+v0)²]
              </code>
            </div>
            <div className="bg-hud-inner border-2 border-hud-border p-3.5 rounded-sm flex-1 flex flex-col justify-center min-h-0">
              <span className="text-xs text-hud-neon-muted font-extrabold uppercase tracking-wider block mb-1">
                // NOTCH GAUSSIANO / BUTTERWORTH
              </span>
              <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                Producto de dos filtros pasa-altos, uno por cada pico del par simétrico —{" "}
                <code className="text-hud-neon-muted bg-hud-bg border border-hud-border px-2 py-0.5 rounded text-sm font-bold">
                  H=Hp(D1)·Hp(D2)
                </code>
                , controlado por el radio de corte <strong className="text-hud-neon-muted">D0</strong> y el orden{" "}
                <strong className="text-hud-neon-muted">n</strong>.
              </p>
            </div>
            <div className="bg-hud-inner border-2 border-hud-border p-3.5 rounded-sm flex-1 flex flex-col justify-center min-h-0">
              <span className="text-xs text-hud-neon-muted font-extrabold uppercase tracking-wider block mb-1">
                // RECONSTRUCCIÓN
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-hud-neon-muted leading-snug">
                Máscara aplicada por multiplicación espectral, imagen limpia recuperada vía IFFT2D — sin ningún paso
                que dependa del contenido de la imagen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 03 — hallazgo técnico general, no un bug. */}
      <section
        ref={(el) => {
          cardRefs.current[2] = el
        }}
        className="step step-card min-h-[calc(50dvh-0.75rem)] h-auto w-full flex-none overflow-visible rounded-lg lg:h-[calc(50dvh-0.75rem)] lg:overflow-hidden border-2 border-hud-border bg-hud-card p-4 sm:p-5 flex flex-col justify-between relative"
      >
        <div className="hud-bar absolute top-0 left-0 w-2.5 h-full bg-hud-neon-muted opacity-40 rounded-l-lg" />

        <div className="flex items-center justify-between border-b-2 border-hud-border pb-2.5 pl-3 relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-hud-neon-muted text-black font-black text-xs sm:text-sm uppercase rounded-sm shadow-[0_0_10px_rgba(52,211,153,0.4)]">
              STEP 03
            </span>
            <span className="text-sm sm:text-base font-bold text-hud-neon-muted tracking-wider uppercase">
              HALLAZGO TÉCNICO
            </span>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-hud-neon-muted uppercase tracking-widest bg-hud-inner border border-hud-border px-2.5 py-1 rounded-sm">
            RUIDO MULTI-FRECUENCIA
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 items-stretch pl-3 relative z-10 lg:flex-1 lg:min-h-0 lg:grid-cols-12">
          <div className="lg:col-span-5 bg-hud-inner p-3 border-2 border-hud-border rounded-sm flex flex-col items-center justify-between min-h-0">
            <div className="w-full flex justify-between items-center text-xs font-bold text-hud-neon-muted border-b border-hud-border pb-1.5">
              <span>[ ESPECTRO ]</span>
              <span>N PARES DE PICOS</span>
            </div>
            <svg className="w-full flex-1 min-h-0" viewBox="0 0 500 180" fill="none" preserveAspectRatio="xMidYMid meet">
              <rect x="20" y="20" width="460" height="140" rx="4" fill="#121413" stroke="#34d399" strokeWidth="2" />
              <line x1="250" y1="20" x2="250" y2="160" stroke="#34d399" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
              <line x1="20" y1="90" x2="480" y2="90" stroke="#34d399" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
              <circle cx="360" cy="45" r="8" fill="#34d399" />
              <circle cx="140" cy="135" r="8" fill="#34d399" />
              <circle cx="330" cy="130" r="8" fill="#34d399" opacity="0.8" />
              <circle cx="170" cy="50" r="8" fill="#34d399" opacity="0.8" />
              <text x="250" y="15" fill="#34d399" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" opacity="0.7">
                ORIGEN (DC)
              </text>
              <text x="250" y="175" fill="#34d399" fontFamily="JetBrains Mono" fontSize="11" textAnchor="middle" fontWeight="bold">
                CADA PAR = 1 NOTCH INDEPENDIENTE
              </text>
            </svg>
            <span className="text-xs font-extrabold text-hud-neon-muted text-center tracking-wide">
              FIG 02: MÚLTIPLES PARES SUPERPUESTOS
            </span>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between gap-3 min-h-0">
            <div className="bg-hud-inner border-2 border-hud-border p-4 rounded-sm flex-1 flex flex-col justify-center min-h-0">
              <span className="text-xs font-black text-hud-neon-muted uppercase tracking-wider block mb-1">
                // EL RUIDO REAL RARA VEZ ES UNA SOLA FRECUENCIA
              </span>
              <p className="text-sm sm:text-base text-hud-dim leading-relaxed font-semibold">
                Un patrón de ruido periódico puede combinar varias rejillas o tramados superpuestos, cada uno con su
                propio pico en el espectro — no una sola frecuencia pura como en el caso más simple.
              </p>
            </div>

            <div className="bg-hud-inner border-2 border-hud-neon-muted p-4 rounded-sm flex-none shadow-[0_0_15px_rgba(52,211,153,0.1)]">
              <strong className="text-hud-neon-muted uppercase block text-xs tracking-wider font-extrabold mb-1">
                DISEÑO RESULTANTE:
              </strong>
              <p className="text-xs sm:text-base text-white font-bold leading-snug">
                El filtro no está limitado a un solo notch: soporta una{" "}
                <strong className="text-hud-neon-muted font-black underline">lista de hasta 10 notches</strong>, cada uno con
                su propio centro, radio de corte, modo y orden — para poder limpiar cualquier combinación de ruido
                periódico, sin importar cuántas frecuencias distintas tenga la imagen de entrada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 04 */}
      <section
        ref={(el) => {
          cardRefs.current[3] = el
        }}
        className="step step-card min-h-[calc(50dvh-0.75rem)] h-auto w-full flex-none overflow-visible rounded-lg lg:h-[calc(50dvh-0.75rem)] lg:overflow-hidden border-2 border-hud-border bg-hud-card p-4 sm:p-5 flex flex-col justify-between relative"
      >
        <div className="hud-bar absolute top-0 left-0 w-2.5 h-full bg-hud-neon-muted opacity-40 rounded-l-lg" />

        <div className="flex items-center justify-between border-b-2 border-hud-border pb-2.5 pl-3 relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-hud-inner text-hud-neon-muted border border-hud-neon-muted/60 font-black text-xs sm:text-sm rounded-sm">
              STEP 04
            </span>
            <span className="text-sm sm:text-base font-bold text-hud-neon-muted tracking-wider uppercase">
              RESULTADOS MEDIDOS
            </span>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-hud-neon-muted uppercase tracking-widest bg-hud-inner border border-hud-border px-2.5 py-1 rounded-sm">
            VALIDACIÓN DE ALGORITMO
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 pl-3 items-stretch relative z-10 sm:grid-cols-2 lg:my-auto lg:h-full lg:max-h-[80%]">
          <div className="bg-linear-to-br from-[#34d399] to-[#059669] text-black p-5 rounded-sm flex flex-col justify-between border-2 border-hud-neon-muted shadow-[0_0_20px_rgba(52,211,153,0.2)]">
            <div className="flex items-center justify-between font-black text-xs sm:text-sm tracking-widest">
              <span>// REDUCCIÓN DE RUIDO (MSE)</span>
              <span className="px-3 py-1 bg-hud-bg text-hud-neon-muted font-black rounded-sm text-xs uppercase">
                MEDIDO
              </span>
            </div>
            <div className="text-4xl sm:text-6xl lg:text-8xl font-display font-black tracking-tighter leading-none my-auto text-black">
              99.3%
            </div>
            <div className="border-t-2 border-black/40 pt-2 text-xs sm:text-sm font-black flex justify-between uppercase tracking-wider">
              <span>MSE: 1250.00 → 8.31</span>
              <span>MODO BUTTERWORTH</span>
            </div>
          </div>

          <div className="bg-hud-inner border-2 border-hud-border p-5 rounded-sm flex flex-col justify-between">
            <div className="flex items-center justify-between font-black text-xs sm:text-sm tracking-widest text-hud-dim">
              <span>// PRECISIÓN DE RECONSTRUCCIÓN</span>
              <span className="px-3 py-1 bg-hud-bg text-hud-neon-muted border border-hud-border rounded-sm text-xs uppercase">
                ROUNDTRIP
              </span>
            </div>
            <div className="text-2xl sm:text-4xl lg:text-6xl font-display font-black tracking-tighter text-white leading-none my-auto">
              5.55e-16
            </div>
            <div className="border-t-2 border-hud-border pt-2 text-xs sm:text-sm font-extrabold text-hud-dim flex justify-between uppercase tracking-wider">
              <span>ERROR MÁXIMO FFT→IFFT SIN FILTRO</span>
              <span className="text-hud-neon-muted font-black">IDEAL / GAUSS / BUTTER: 99.1 / 99.3 / 99.3%</span>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 05 */}
      <section
        ref={(el) => {
          cardRefs.current[4] = el
        }}
        className="step step-card min-h-[calc(50dvh-0.75rem)] h-auto w-full flex-none overflow-visible rounded-lg lg:h-[calc(50dvh-0.75rem)] lg:overflow-hidden border-2 border-hud-border bg-hud-card p-4 sm:p-5 flex flex-col justify-between relative"
      >
        <div className="hud-bar absolute top-0 left-0 w-2.5 h-full bg-hud-neon-muted opacity-40 rounded-l-lg" />

        <div className="flex items-center justify-between border-b-2 border-hud-border pb-2.5 pl-3 relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-hud-bg text-hud-dim border border-hud-border font-black text-xs sm:text-sm rounded-sm">
              STEP 05
            </span>
            <span className="text-sm sm:text-base font-bold text-hud-dim tracking-wider uppercase">
              DECISIONES DE DISEÑO Y LÍMITES
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pl-3 items-stretch relative z-10 sm:grid-cols-2 lg:my-auto lg:h-full lg:max-h-[80%] lg:grid-cols-4">
          <div className="bg-hud-inner border-2 border-hud-border p-4 rounded-sm flex flex-col justify-between">
            <span className="font-extrabold text-hud-neon-muted text-sm sm:text-base font-display uppercase tracking-wider">
              // POR QUÉ SE CONSTRUYÓ EL FILTRO ASÍ
            </span>
            <p className="leading-relaxed text-hud-dim text-sm sm:text-base font-semibold my-auto">
              Se decidió armar el notch desde fórmulas de filtro pasa-altos{" "}
              <strong className="text-white font-black text-base sm:text-lg">estándar y verificadas</strong>{" "}
              (Gaussiano/Butterworth), en vez de depender de la notación compacta de un solo libro.
            </p>
          </div>
          <div className="bg-hud-inner border-2 border-hud-border p-4 rounded-sm flex flex-col justify-between">
            <span className="font-extrabold text-hud-neon-muted text-sm sm:text-base font-display uppercase tracking-wider">
              // POR QUÉ 256×256
            </span>
            <p className="leading-relaxed text-hud-dim text-sm sm:text-base font-semibold my-auto">
              Se decidió estandarizar el tamaño para que el radio de Nyquist ({" "}
              <strong className="text-white font-black text-base sm:text-lg">128</strong>) fuera consistente en toda
              la interfaz — el mismo que usa el selector de frecuencia.
            </p>
          </div>
          <div className="bg-hud-inner border-2 border-hud-border p-4 rounded-sm flex flex-col justify-between">
            <span className="font-extrabold text-hud-neon-muted text-sm sm:text-base font-display uppercase tracking-wider">
              // POR QUÉ ESTOS LÍMITES
            </span>
            <p className="leading-relaxed text-hud-dim text-sm sm:text-base font-semibold my-auto">
              Rangos amplios a propósito —{" "}
              <code className="text-hud-neon-muted bg-hud-bg px-1.5 py-0.5 rounded border border-hud-border font-bold">
                d0 ≤ 200, n ≤ 10
              </code>{" "}
              — para dar control total sobre el filtro, sin un techo artificial bajo.
            </p>
          </div>
          <div className="bg-hud-inner border-2 border-hud-border p-4 rounded-sm flex flex-col justify-between">
            <span className="font-extrabold text-hud-neon-muted text-sm sm:text-base font-display uppercase tracking-wider">
              // POR QUÉ LA LISTA DE NOTCHES
            </span>
            <p className="leading-relaxed text-hud-dim text-sm sm:text-base font-semibold my-auto">
              Se decidió extender la petición de un notch único a una{" "}
              <strong className="text-white font-black text-base sm:text-lg">lista de hasta 10 notches</strong>, para atacar
              de una vez cualquier combinación real de picos dominantes.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
