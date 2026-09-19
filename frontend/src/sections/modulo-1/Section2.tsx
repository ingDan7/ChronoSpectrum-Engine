import { useEffect, useRef } from "react"
import "./Section2.css"

// Section2 — "Mouse Spotlight HUD"; 5 Steps de documentación técnica, portados desde el mockup de Daniel.
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
        const isError = card.classList.contains("error-card")
        if (isHovered) {
          card.style.borderColor = isError ? "rgba(245, 158, 11, 0.8)" : "rgba(52, 211, 153, 0.85)"
          card.style.boxShadow = isError ? "0 0 25px rgba(245, 158, 11, 0.25)" : "0 0 25px rgba(52, 211, 153, 0.25)"
          card.style.filter = "grayscale(0) brightness(1)"
        } else {
          // En reposo la tarjeta queda desaturada; se enciende solo al pasar el mouse.
          card.style.borderColor = isError ? "rgba(245, 158, 11, 0.4)" : "#2b322d"
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
              <span className="px-2.5 py-1 bg-hud-neon-muted text-black font-black text-xs sm:text-sm uppercase rounded-sm shadow-[0_0_10px_rgba(52, 211, 153,0.4)]">
                STEP 01
              </span>
              <span className="text-sm sm:text-base font-bold text-hud-neon-muted tracking-wider uppercase">
                CONTEXTO &amp; PIPELINE
              </span>
            </div>
            <span className="text-xs sm:text-sm font-extrabold text-hud-neon-muted uppercase tracking-widest bg-hud-inner border border-hud-border px-2.5 py-1 rounded-sm">
              AMPLIFICACIÓN DE MOVIMIENTO
            </span>
          </div>

          <div className="pl-3 my-auto flex flex-col gap-3 relative z-10">
            <h1 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none">
              Eulerian Motion &amp; Pulse Magnifier
            </h1>
            <p className="text-base sm:text-xl text-hud-dim leading-snug font-semibold max-w-full">
              Detección y amplificación de variaciones imperceptibles al ojo humano en secuencias de video
              (frecuencia cardíaca, micro-vibraciones estructurales).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 pl-3 relative z-10 sm:grid-cols-3">
            <div className="p-3 bg-hud-inner border border-hud-border rounded-sm flex flex-col items-center text-center justify-center gap-1">
              <span className="text-xs text-hud-neon-muted font-bold uppercase tracking-widest">// FASE 01</span>
              <span className="text-sm sm:text-base font-black text-white">DESCOMPOSICIÓN MULTIESCALA</span>
            </div>
            <div className="p-3 bg-hud-inner border-2 border-hud-neon-muted/70 rounded-sm flex flex-col items-center text-center justify-center gap-1 shadow-[0_0_15px_rgba(52, 211, 153,0.15)]">
              <span className="text-xs text-hud-neon-muted font-bold uppercase tracking-widest">// FASE 02</span>
              <span className="text-sm sm:text-base font-black text-hud-neon-muted">FILTRADO TEMPORAL IIR</span>
            </div>
            <div className="p-3 bg-hud-inner border border-hud-border rounded-sm flex flex-col items-center text-center justify-center gap-1">
              <span className="text-xs text-hud-neon-muted font-bold uppercase tracking-widest">// FASE 03</span>
              <span className="text-sm sm:text-base font-black text-white">RECONSTRUCCIÓN &amp; COLAPSO</span>
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

          <div className="grid grid-cols-1 gap-4 items-stretch pl-3 relative z-10 lg:my-auto lg:h-full lg:max-h-[80%] lg:grid-cols-12">
            <div className="lg:col-span-5 bg-hud-inner p-3 border-2 border-hud-border rounded-sm flex flex-col items-center justify-between">
              <div className="w-full flex justify-between items-center text-xs font-bold text-hud-neon-muted border-b border-hud-border pb-1.5">
                <span>[ INPUT STREAM ]</span>
                <span>GAUSSIAN / LAPLACIAN PYRAMID</span>
              </div>
              <svg className="w-full h-32 sm:h-40 my-auto" viewBox="0 0 500 180" fill="none">
                <path
                  d="M70 90 L170 45 M70 90 L170 135"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
                <path
                  d="M170 45 L270 65 M170 135 L270 115"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.8"
                />
                <path d="M270 65 L370 90 M270 115 L370 90" stroke="#f59e0b" strokeWidth="2.5" />
                <rect x="20" y="55" width="90" height="70" rx="4" fill="#121413" stroke="#f59e0b" strokeWidth="2.5" />
                <text x="65" y="96" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="12" fontWeight="bold" textAnchor="middle">
                  NIVEL 0
                </text>
                <rect x="150" y="20" width="80" height="45" rx="4" fill="#181b19" stroke="#f59e0b" strokeWidth="2" />
                <text x="190" y="47" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="11" fontWeight="bold" textAnchor="middle">
                  G_1 (1/2)
                </text>
                <rect x="150" y="115" width="80" height="45" rx="4" fill="#181b19" stroke="#f59e0b" strokeWidth="2" />
                <text x="190" y="142" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="11" fontWeight="bold" textAnchor="middle">
                  L_1 (Band)
                </text>
                <rect x="250" y="45" width="80" height="90" rx="4" fill="#222a24" stroke="#f59e0b" strokeWidth="2.5" />
                <text x="290" y="85" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="12" fontWeight="bold" textAnchor="middle">
                  FILTRO
                </text>
                <text x="290" y="108" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="12" fontWeight="bold" textAnchor="middle">
                  IIR
                </text>
                <rect x="360" y="55" width="100" height="70" rx="4" fill="#121413" stroke="#f59e0b" strokeWidth="2.5" />
                <text x="410" y="96" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="12" fontWeight="bold" textAnchor="middle">
                  OUTPUT
                </text>
              </svg>
              <span className="text-xs font-extrabold text-hud-neon-muted text-center tracking-wide">
                FIG 01: DESCOMPOSICIÓN PIRAMIDAL
              </span>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between gap-2.5">
              <div className="bg-hud-inner border-2 border-hud-border p-3.5 rounded-sm flex-1 flex flex-col justify-center">
                <span className="text-xs text-hud-neon-muted font-extrabold uppercase tracking-wider block mb-1">
                  // PIRÁMIDES ESPACIALES
                </span>
                <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                  Kernel binomial de 5 taps{" "}
                  <code className="text-hud-neon-muted bg-hud-bg border border-hud-border px-2 py-0.5 rounded text-sm sm:text-base font-bold">
                    [1,4,6,4,1]/16
                  </code>
                  . Submuestreo <strong className="text-hud-neon-muted">x2</strong> por nivel.
                </p>
              </div>
              <div className="bg-hud-inner border-2 border-hud-border p-3.5 rounded-sm flex-1 flex flex-col justify-center">
                <span className="text-xs text-hud-neon-muted font-extrabold uppercase tracking-wider block mb-1">
                  // FILTRO TEMPORAL IIR
                </span>
                <code className="text-sm sm:text-lg font-mono text-hud-neon-muted bg-hud-bg border border-hud-border px-3 py-1.5 rounded block font-bold">
                  lo = lo + a · (x - lo) <span className="text-hud-dim font-normal text-xs sm:text-sm">// Pasa-banda dual</span>
                </code>
              </div>
              <div className="bg-hud-inner border-2 border-hud-border p-3.5 rounded-sm flex-1 flex flex-col justify-center">
                <span className="text-xs text-hud-neon-muted font-extrabold uppercase tracking-wider block mb-1">
                  // COMPLEJIDAD DE ESTADO
                </span>
                <p className="text-sm sm:text-base font-extrabold text-hud-neon-muted leading-snug">
                  Procesamiento O(1) por píxel en streaming continuo sin buffer acumulativo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 03 */}
        <section
          ref={(el) => {
            cardRefs.current[2] = el
          }}
          className="step step-card error-card min-h-[calc(50dvh-0.75rem)] h-auto w-full flex-none overflow-visible rounded-lg lg:h-[calc(50dvh-0.75rem)] lg:overflow-hidden border-2 border-hud-error/60 bg-hud-card p-4 sm:p-5 flex flex-col justify-between relative"
        >
          <div className="hud-bar absolute top-0 left-0 w-2.5 h-full bg-hud-error opacity-70 rounded-l-lg" />

          <div className="flex items-center justify-between border-b-2 border-hud-error/40 pb-2.5 pl-3 relative z-10">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-hud-error text-black font-black text-xs sm:text-sm uppercase rounded-sm shadow-[0_0_10px_rgba(245, 158, 11,0.4)]">
                STEP 03
              </span>
              <span className="text-sm sm:text-base font-black text-hud-error tracking-wider uppercase">
                ! BUG CRÍTICO DE FASE !
              </span>
            </div>
            <span className="text-xs sm:text-sm font-black text-hud-error uppercase tracking-widest bg-hud-inner border border-hud-error/60 px-2.5 py-1 rounded-sm">
              DISRUPCIÓN DETECTADA
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 items-stretch pl-3 relative z-10 lg:my-auto lg:h-full lg:max-h-[80%] lg:grid-cols-12">
            <div className="lg:col-span-5 bg-hud-inner p-3 border-2 border-hud-error/40 rounded-sm flex flex-col items-center justify-between">
              <div className="w-full flex justify-between items-center text-xs font-bold text-hud-error border-b border-hud-error/40 pb-1.5">
                <span>[ FREQUENCY RESPONSE ]</span>
                <span>COLLAPSE AT -180°</span>
              </div>
              <svg className="w-full h-32 sm:h-40 my-auto" viewBox="0 0 500 180" fill="none">
                <line x1="40" y1="150" x2="460" y2="150" stroke="#f59e0b" strokeWidth="2" opacity="0.6" />
                <line x1="40" y1="20" x2="40" y2="150" stroke="#f59e0b" strokeWidth="2" opacity="0.6" />
                <line x1="40" y1="106.7" x2="460" y2="106.7" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />

                {/* Fase real de H(f) sin normalizar, calculada con la fórmula de temporal_filter.py (f_low=0.8, f_high=1.2, fs=30). */}
                <path
                  d="M 40.6,22.4 L 46.2,46.0 L 52.5,69.2 L 58.8,87.9 L 64.4,100.8 L 70.7,111.9 L 77.0,120.4 L 82.6,126.3 L 88.9,131.4 L 95.2,135.4 L 100.8,138.2 L 107.1,140.7 L 113.4,142.6 L 119.0,143.9 L 125.3,145.1 L 131.6,145.9 L 137.2,146.5 L 143.5,146.9 L 149.8,147.1 L 155.4,147.2 L 161.7,147.2 L 168.0,147.1 L 173.6,146.9 L 179.9,146.6 L 186.2,146.2 L 192.5,145.7 L 198.1,145.3 L 204.4,144.7 L 210.7,144.1 L 216.3,143.6 L 222.6,142.9 L 228.9,142.2 L 234.5,141.5 L 240.8,140.8 L 247.1,140.0 L 252.7,139.3 L 259.0,138.4 L 265.3,137.6 L 270.9,136.8 L 277.2,135.9 L 283.5,135.0 L 289.1,134.2 L 295.4,133.3 L 301.7,132.3 L 307.3,131.5 L 313.7,130.5 L 320.0,129.6 L 326.3,128.6 L 331.9,127.7 L 338.2,126.7 L 344.5,125.7 L 350.1,124.8 L 356.4,123.8 L 362.7,122.8 L 368.3,121.9 L 374.6,120.8 L 380.9,119.8 L 386.5,118.9 L 392.8,117.9 L 399.1,116.8 L 404.7,115.9 L 411.0,114.8 L 417.3,113.8 L 422.9,112.9 L 429.2,111.8 L 435.5,110.8 L 441.1,109.8 L 447.4,108.8 L 453.7,107.7 L 460.0,106.7"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  fill="none"
                />
                <circle cx="67.4" cy="106.4" r="7" fill="#f59e0b" className="animate-ping" />
                <circle cx="67.4" cy="106.4" r="4" fill="#ffffff" />
                <text x="80" y="100" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="12" fontWeight="bold">
                  f≈0.98 Hz → fase≈-180°
                </text>

                {[0, 5, 10, 15].map((hz) => {
                  const x = 40 + (hz / 15) * 420
                  return (
                    <g key={hz}>
                      <line x1={x} y1="150" x2={x} y2="155" stroke="#f59e0b" strokeWidth="1.5" opacity="0.7" />
                      <text x={x} y="168" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" opacity="0.85">
                        {hz}
                      </text>
                    </g>
                  )
                })}
                <text x="460" y="178" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end" opacity="0.7">
                  f (Hz)
                </text>

                {[
                  { deg: -90, y: 20 },
                  { deg: -180, y: 106.7 },
                  { deg: -225, y: 150 },
                ].map(({ deg, y }) => (
                  <g key={deg}>
                    <line x1="35" y1={y} x2="40" y2={y} stroke="#f59e0b" strokeWidth="1.5" opacity="0.7" />
                    <text x="30" y={y + 3} fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end" opacity="0.85">
                      {deg}°
                    </text>
                  </g>
                ))}
              </svg>
              <span className="text-xs font-extrabold text-hud-error text-center tracking-wide">
                FIG 02: FASE REAL DE H(f) — DATOS CALCULADOS DEL FILTRO IIR
              </span>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between gap-3">
              <div className="bg-hud-inner border-2 border-hud-error/60 p-4 rounded-sm flex-1 flex flex-col justify-center">
                <span className="text-xs font-black text-hud-error uppercase tracking-wider block mb-1">
                  // FÓRMULA DE FASE CRÍTICA
                </span>
                <div className="text-2xl sm:text-4xl font-black text-hud-neon-muted font-mono my-1 tracking-tight">
                  H(f_center) ≈ −0.18 − 0.0003j
                </div>
                <p className="text-sm sm:text-base text-hud-dim leading-relaxed font-semibold">
                  Señal en antifase (-180°). La amplitud colapsaba a{" "}
                  <strong className="text-hud-error font-extrabold text-base sm:text-lg">~1.7% de la original</strong>.
                </p>
              </div>

              <div className="bg-hud-inner border-2 border-hud-neon-muted p-4 rounded-sm flex-none shadow-[0_0_15px_rgba(52, 211, 153,0.1)]">
                <strong className="text-hud-neon-muted uppercase block text-xs tracking-wider font-extrabold mb-1">
                  SOLUCIÓN APLICADA:
                </strong>
                <p className="text-sm sm:text-lg text-white font-bold leading-snug">
                  Normalización por la parte <strong className="text-hud-neon-muted font-black underline">REAL con signo de H(f_center)</strong>.
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
              <span className="px-2.5 py-1 bg-hud-neon-muted text-black font-black text-xs sm:text-sm uppercase rounded-sm shadow-[0_0_10px_rgba(52, 211, 153,0.4)]">
                STEP 04
              </span>
              <span className="text-sm sm:text-base font-bold text-hud-neon-muted tracking-wider uppercase">
                RESULTADOS DE GANANCIA
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pl-3 items-stretch relative z-10 sm:grid-cols-2 lg:my-auto lg:h-full lg:max-h-[80%]">
            <div className="bg-linear-to-br from-[#34d399] to-[#059669] text-black p-5 rounded-sm flex flex-col justify-between border-2 border-hud-neon-muted shadow-[0_0_20px_rgba(52, 211, 153,0.2)]">
              <div className="flex items-center justify-between font-black text-xs sm:text-sm tracking-widest">
                <span>// BANDA OBJETIVO [1 Hz]</span>
                <span className="px-3 py-1 bg-hud-bg text-hud-neon-muted font-black rounded-sm text-xs uppercase">
                  VERIFICADO
                </span>
              </div>
              <div className="text-5xl sm:text-7xl lg:text-9xl font-display font-black tracking-tighter leading-none my-auto text-black">
                11.0X
              </div>
              <div className="border-t-2 border-black/40 pt-2 text-xs sm:text-sm font-black flex justify-between uppercase tracking-wider">
                <span>AMPLIFICACIÓN DENTRO DE BANDA</span>
                <span>UMBRAL &gt; 8.0X</span>
              </div>
            </div>

            <div className="bg-hud-inner border-2 border-hud-border p-5 rounded-sm flex flex-col justify-between">
              <div className="flex items-center justify-between font-black text-xs sm:text-sm tracking-widest text-hud-dim">
                <span>// FUERA DE BANDA [4 Hz]</span>
                <span className="px-3 py-1 bg-hud-bg text-hud-neon-muted border border-hud-border rounded-sm text-xs uppercase">
                  ATENUADO
                </span>
              </div>
              <div className="text-5xl sm:text-7xl lg:text-9xl font-display font-black tracking-tighter text-white leading-none my-auto">
                5.22X
              </div>
              <div className="border-t-2 border-hud-border pt-2 text-xs sm:text-sm font-extrabold text-hud-dim flex justify-between uppercase tracking-wider">
                <span>RECHAZO DE RUIDO</span>
                <span className="text-hud-neon-muted font-black">UMBRAL &lt; 7.0X</span>
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
                RENDIMIENTO Y LÍMITES
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pl-3 items-stretch relative z-10 sm:grid-cols-2 lg:my-auto lg:h-full lg:max-h-[80%] lg:grid-cols-4">
            <div className="bg-hud-inner border-2 border-hud-border p-4 rounded-sm flex flex-col justify-between">
              <span className="font-extrabold text-hud-neon-muted text-sm sm:text-base font-display uppercase tracking-wider">
                // DECISIÓN DE ARQUITECTURA: CLOUD GRATUITO
              </span>
              <p className="leading-relaxed text-hud-dim text-sm sm:text-base font-semibold my-auto">
                Diseñado para operar dentro de Render free tier (<strong className="text-white font-black text-base sm:text-lg">512 MB RAM</strong>,
                sin GPU, cold start ~1 min). Los assets se recortan a{" "}
                <strong className="text-hud-neon-muted font-bold">128×128/7s</strong> por decisión explícita, no por límite del
                algoritmo.
              </p>
            </div>
            <div className="bg-hud-inner border-2 border-hud-border p-4 rounded-sm flex flex-col justify-between">
              <span className="font-extrabold text-hud-neon-muted text-sm sm:text-base font-display uppercase tracking-wider">
                // DECISIÓN: PROCESAMIENTO STREAMING
              </span>
              <p className="leading-relaxed text-hud-dim text-sm sm:text-base font-semibold my-auto">
                Se eligió mantener solo estado por píxel entre frames, sin buffer completo de video — la única arquitectura
                que corre EVM real bajo <strong className="text-white font-black text-base sm:text-lg">512 MB de RAM</strong>{" "}
                sin GPU.
              </p>
            </div>
            <div className="bg-hud-inner border-2 border-hud-border p-4 rounded-sm flex flex-col justify-between">
              <span className="font-extrabold text-hud-neon-muted text-sm sm:text-base font-display uppercase tracking-wider">
                // DECISIÓN DE DISEÑO: IIR SOBRE FFT/DCT
              </span>
              <p className="leading-relaxed text-hud-dim text-sm sm:text-base font-semibold my-auto">
                Se optó por un filtro IIR de <strong className="text-hud-neon-muted font-bold">rolloff suave</strong> en vez del
                filtro ideal vía FFT/DCT del paper original — más selectivo, pero incompatible con streaming en tiempo real.
              </p>
            </div>
            <div className="bg-hud-inner border-2 border-hud-border p-4 rounded-sm flex flex-col justify-between">
              <span className="font-extrabold text-hud-neon-muted text-sm sm:text-base font-display uppercase tracking-wider">
                // LÍMITE DE DISEÑO (Ec. 14, Wu et al. 2012)
              </span>
              <p className="leading-relaxed text-hud-dim text-sm sm:text-base font-semibold my-auto">
                <code className="text-hud-neon-muted bg-hud-bg px-1.5 py-1 rounded border border-hud-border font-bold block mb-1">
                  (1+α)·δ(t) &lt; λ/8
                </code>
                La ecuación que define hasta dónde puede llevarse α antes de artefactos visibles; la misma que expuso el bug
                de fase del Paso 03.
              </p>
            </div>
          </div>
        </section>
    </div>
  )
}
