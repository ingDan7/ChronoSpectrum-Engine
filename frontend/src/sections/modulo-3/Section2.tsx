import { useEffect, useRef } from "react"
import "./Section2.css"

// Section2 — documentación técnica del Sub-Pixel Phase Correlator, mismo HUD "Mouse Spotlight" que los otros módulos.
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
            <span className="px-2.5 py-1 bg-hud-neon-muted text-black font-black text-xs sm:text-sm uppercase rounded-sm shadow-[0_0_10px_rgba(52,211,153,0.4)]">
              STEP 01
            </span>
            <span className="text-sm sm:text-base font-bold text-hud-neon-muted tracking-wider uppercase">
              CONTEXTO &amp; PIPELINE
            </span>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-hud-neon-muted uppercase tracking-widest bg-hud-inner border border-hud-border px-2.5 py-1 rounded-sm">
            SUB-PIXEL PHASE CORRELATION
          </span>
        </div>

        <div className="pl-3 my-auto flex flex-col gap-3 relative z-10">
          <h1 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-none">
            Sub-Pixel Phase Correlator
          </h1>
          <p className="text-base sm:text-xl text-hud-dim leading-snug font-semibold max-w-full">
            Mide el desplazamiento entre dos imágenes con precisión de fracciones de píxel, sin descriptores
            pesados ni features/keypoints — útil para deformaciones mecánicas o desplazamientos microscópicos.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 pl-3 relative z-10 sm:grid-cols-3">
          <div className="p-3 bg-hud-inner border border-hud-border rounded-sm flex flex-col items-center text-center justify-center gap-1">
            <span className="text-xs text-hud-neon-muted font-bold uppercase tracking-widest">// FASE 01</span>
            <span className="text-sm sm:text-base font-black text-white">ESPECTRO CRUZADO</span>
          </div>
          <div className="p-3 bg-hud-inner border-2 border-hud-neon-muted/70 rounded-sm flex flex-col items-center text-center justify-center gap-1 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
            <span className="text-xs text-hud-neon-muted font-bold uppercase tracking-widest">// FASE 02</span>
            <span className="text-sm sm:text-base font-black text-hud-neon-muted">LOCALIZACIÓN DEL PICO</span>
          </div>
          <div className="p-3 bg-hud-inner border border-hud-border rounded-sm flex flex-col items-center text-center justify-center gap-1">
            <span className="text-xs text-hud-neon-muted font-bold uppercase tracking-widest">// FASE 03</span>
            <span className="text-sm sm:text-base font-black text-white">REFINAMIENTO SUBPÍXEL</span>
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
              <span>[ CORRELACIÓN ]</span>
              <span>VECINDAD DEL PICO</span>
            </div>
            <svg className="w-full flex-1 min-h-0" viewBox="0 0 500 180" fill="none" preserveAspectRatio="xMidYMid meet">
              <rect x="20" y="20" width="460" height="140" rx="4" fill="#121413" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="250" cy="90" r="12" fill="#f59e0b" />
              <text x="250" y="72" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="11" fontWeight="bold" textAnchor="middle">
                PICO ENTERO (py,px)
              </text>
              <circle cx="350" cy="90" r="7" fill="#ffffff" opacity="0.85" />
              <text x="350" y="112" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" opacity="0.85">
                +x
              </text>
              <circle cx="150" cy="90" r="7" fill="#ffffff" opacity="0.85" />
              <text x="150" y="112" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" opacity="0.85">
                −x
              </text>
              <circle cx="250" cy="40" r="7" fill="#ffffff" opacity="0.85" />
              <text x="278" y="43" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="10" opacity="0.85">
                +y
              </text>
              <circle cx="250" cy="140" r="7" fill="#ffffff" opacity="0.85" />
              <text x="278" y="143" fill="#ffffff" fontFamily="JetBrains Mono" fontSize="10" opacity="0.85">
                −y
              </text>
              <line x1="262" y1="90" x2="343" y2="90" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />
              <line x1="238" y1="90" x2="157" y2="90" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />
              <line x1="250" y1="78" x2="250" y2="47" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />
              <line x1="250" y1="102" x2="250" y2="133" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />
              <text x="250" y="175" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" opacity="0.8">
                se compara magnitud del vecino por eje → elige signo
              </text>
            </svg>
            <span className="text-xs font-extrabold text-hud-neon-muted text-center tracking-wide">
              FIG 01: VECINOS USADOS EN EL REFINAMIENTO
            </span>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between gap-2.5 min-h-0">
            <div className="bg-hud-inner border-2 border-hud-border p-3.5 rounded-sm flex-1 flex flex-col justify-center min-h-0">
              <span className="text-xs text-hud-neon-muted font-extrabold uppercase tracking-wider block mb-1">
                // ESPECTRO CRUZADO NORMALIZADO
              </span>
              <code className="text-sm sm:text-base font-mono text-hud-neon-muted bg-hud-bg border border-hud-border px-3 py-1.5 rounded block font-bold">
                R(u,v) = (F1·F2*) / |F1·F2*|
              </code>
            </div>
            <div className="bg-hud-inner border-2 border-hud-border p-3.5 rounded-sm flex-1 flex flex-col justify-center min-h-0">
              <span className="text-xs text-hud-neon-muted font-extrabold uppercase tracking-wider block mb-1">
                // LOCALIZACIÓN DEL PICO
              </span>
              <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                IFFT2D de R localiza el impulso delta de Dirac — la traslación entera exacta, todavía sin ajuste
                subpíxel.
              </p>
            </div>
            <div className="bg-hud-inner border-2 border-hud-border p-3.5 rounded-sm flex-1 flex flex-col justify-center min-h-0">
              <span className="text-xs text-hud-neon-muted font-extrabold uppercase tracking-wider block mb-1">
                // REFINAMIENTO SUBPÍXEL (FOROOSH ET AL.)
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-hud-neon-muted leading-snug">
                δx = arcsin(√[Φ(0,0)/Φ(1,0)]) / π, resuelto por eje comparando el vecino de mayor magnitud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 03 — bug crítico: dos bugs reales encontrados y corregidos durante la validación. */}
      <section
        ref={(el) => {
          cardRefs.current[2] = el
        }}
        className="step step-card error-card min-h-[calc(50dvh-0.75rem)] h-auto w-full flex-none overflow-visible rounded-lg lg:h-[calc(50dvh-0.75rem)] lg:overflow-hidden border-2 border-hud-error/60 bg-hud-card p-4 sm:p-5 flex flex-col justify-between relative"
      >
        <div className="hud-bar absolute top-0 left-0 w-2.5 h-full bg-hud-error opacity-70 rounded-l-lg" />

        <div className="flex items-center justify-between border-b-2 border-hud-error/40 pb-2.5 pl-3 relative z-10">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-hud-error text-black font-black text-xs sm:text-sm uppercase rounded-sm shadow-[0_0_10px_rgba(245,158,11,0.4)]">
              STEP 03
            </span>
            <span className="text-sm sm:text-base font-black text-hud-error tracking-wider uppercase">
              ! 2 BUGS CRÍTICOS CORREGIDOS !
            </span>
          </div>
          <span className="text-xs sm:text-sm font-black text-hud-error uppercase tracking-widest bg-hud-inner border border-hud-error/60 px-2.5 py-1 rounded-sm">
            DETECTADOS EN VALIDACIÓN
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 items-stretch pl-3 relative z-10 lg:flex-1 lg:min-h-0 lg:grid-cols-12">
          <div className="lg:col-span-5 bg-hud-inner p-3 border-2 border-hud-error/40 rounded-sm flex flex-col items-center justify-between min-h-0">
            <div className="w-full flex justify-between items-center text-xs font-bold text-hud-error border-b border-hud-error/40 pb-1.5">
              <span>[ CASO DE PRUEBA ]</span>
              <span>DESPLAZAMIENTO ENTERO</span>
            </div>
            <svg className="w-full flex-1 min-h-0" viewBox="0 0 500 180" fill="none" preserveAspectRatio="xMidYMid meet">
              <rect x="20" y="20" width="460" height="140" rx="4" fill="#121413" stroke="#f59e0b" strokeWidth="2" />
              <line x1="250" y1="20" x2="250" y2="160" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
              <line x1="20" y1="90" x2="480" y2="90" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
              <line x1="250" y1="90" x2="360" y2="50" stroke="#f59e0b" strokeWidth="2.5" markerEnd="url(#arrowBad)" opacity="0.9" />
              <text x="365" y="48" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="12" fontWeight="bold">
                (-5,5) ✗
              </text>
              <text x="250" y="65" fill="#f59e0b" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" opacity="0.8">
                SIN NEGAR
              </text>
              <line x1="250" y1="90" x2="140" y2="130" stroke="#34d399" strokeWidth="2.5" markerEnd="url(#arrowOk)" opacity="0.95" />
              <text x="90" y="148" fill="#34d399" fontFamily="JetBrains Mono" fontSize="12" fontWeight="bold">
                (5,-5) ✓
              </text>
              <text x="250" y="118" fill="#34d399" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" opacity="0.9">
                NEGADO (real)
              </text>
              <defs>
                <marker id="arrowBad" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#f59e0b" />
                </marker>
                <marker id="arrowOk" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="#34d399" />
                </marker>
              </defs>
            </svg>
            <span className="text-xs font-extrabold text-hud-error text-center tracking-wide">
              FIG 02: PRUEBA (5,−5) QUE EXPUSO EL SIGNO INVERTIDO
            </span>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between gap-2.5 min-h-0">
            <div className="bg-hud-inner border-2 border-hud-error/60 p-3 rounded-sm flex-1 flex flex-col justify-center min-h-0">
              <span className="text-xs font-black text-hud-error uppercase tracking-wider block mb-1">
                // BUG 1 — CONVENCIÓN DE SIGNO INVERTIDA
              </span>
              <p className="text-xs sm:text-sm text-hud-dim leading-snug font-semibold">
                Un desplazamiento entero de prueba <strong className="text-white font-black">(5,-5)</strong> devolvía{" "}
                <strong className="text-hud-error font-extrabold">(-5,5)</strong> — corregido negando el resultado
                final.
              </p>
            </div>
            <div className="bg-hud-inner border-2 border-hud-error/60 p-3 rounded-sm flex-1 flex flex-col justify-center min-h-0">
              <span className="text-xs font-black text-hud-error uppercase tracking-wider block mb-1">
                // BUG 2 — EXPLOSIÓN NUMÉRICA CERCA DE ENTEROS
              </span>
              <p className="text-xs sm:text-sm text-hud-dim leading-snug font-semibold">
                División por una magnitud casi nula cerca de desplazamientos enteros exactos producía un error
                falso de <strong className="text-hud-error font-extrabold">0.5px</strong>.
              </p>
            </div>
            <div className="bg-hud-inner border-2 border-hud-neon-muted p-3 rounded-sm flex-none shadow-[0_0_15px_rgba(52,211,153,0.1)]">
              <strong className="text-hud-neon-muted uppercase block text-xs tracking-wider font-extrabold mb-1">
                SOLUCIÓN APLICADA:
              </strong>
              <p className="text-xs sm:text-base text-white font-bold leading-snug">
                Signo negado tras verificación empírica, más un umbral explícito de{" "}
                <strong className="text-hud-neon-muted font-black underline">"vecino despreciable"</strong> que
                devuelve refinamiento 0.0.
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

        <div className="grid grid-cols-1 gap-4 pl-3 items-stretch relative z-10 sm:grid-cols-2 lg:flex-1 lg:min-h-0">
          <div className="bg-linear-to-br from-[#34d399] to-[#059669] text-black p-5 rounded-sm flex flex-col justify-between border-2 border-hud-neon-muted shadow-[0_0_20px_rgba(52,211,153,0.2)]">
            <div className="flex items-center justify-between font-black text-xs sm:text-sm tracking-widest">
              <span>// PEOR CASO MEDIDO</span>
              <span className="px-3 py-1 bg-hud-bg text-hud-neon-muted font-black rounded-sm text-xs uppercase">
                MEDIDO
              </span>
            </div>
            <div className="text-4xl sm:text-6xl lg:text-8xl font-display font-black tracking-tighter leading-none my-auto text-black">
              0.40px
            </div>
            <div className="border-t-2 border-black/40 pt-2 text-xs sm:text-sm font-black flex justify-between uppercase tracking-wider">
              <span>CASO (−3.90,4.20)</span>
              <span>UMBRAL &lt; 0.5px</span>
            </div>
          </div>

          <div className="bg-hud-inner border-2 border-hud-border p-5 rounded-sm flex flex-col justify-between">
            <div className="flex items-center justify-between font-black text-xs sm:text-sm tracking-widest text-hud-dim">
              <span>// DESPLAZAMIENTO ENTERO EXACTO</span>
              <span className="px-3 py-1 bg-hud-bg text-hud-neon-muted border border-hud-border rounded-sm text-xs uppercase">
                SIN ERROR
              </span>
            </div>
            <div className="text-3xl sm:text-5xl lg:text-7xl font-display font-black tracking-tighter text-white leading-none my-auto">
              0.000px
            </div>
            <div className="border-t-2 border-hud-border pt-2 text-xs sm:text-sm font-extrabold text-hud-dim flex justify-between uppercase tracking-wider">
              <span>FRACCIONARIOS: 0.10–0.40px</span>
              <span className="text-hud-neon-muted font-black">TODOS &lt; 0.5px</span>
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

        <div className="grid grid-cols-1 gap-4 pl-3 items-stretch relative z-10 sm:grid-cols-2 lg:flex-1 lg:min-h-0 lg:grid-cols-4">
          <div className="bg-hud-inner border-2 border-hud-border p-4 rounded-sm flex flex-col justify-between min-h-0">
            <span className="font-extrabold text-hud-neon-muted text-sm sm:text-base font-display uppercase tracking-wider">
              // POR QUÉ NO HAY PARÁMETROS AJUSTABLES
            </span>
            <p className="leading-relaxed text-hud-dim text-xs sm:text-sm font-semibold my-auto">
              A diferencia de los otros dos módulos, la petición solo acepta el par de imágenes de entrada — se
              decidió no inventar controles ficticios sobre un algoritmo sin hiperparámetros reales.
            </p>
          </div>
          <div className="bg-hud-inner border-2 border-hud-border p-4 rounded-sm flex flex-col justify-between min-h-0">
            <span className="font-extrabold text-hud-neon-muted text-sm sm:text-base font-display uppercase tracking-wider">
              // POR QUÉ EL UMBRAL ES 0.5px
            </span>
            <p className="leading-relaxed text-hud-dim text-xs sm:text-sm font-semibold my-auto">
              Se decidió documentar el error real medido (0.1–0.4px) en vez de mantener un umbral optimista de{" "}
              <strong className="text-white font-black text-sm sm:text-base">0.1px</strong> asumido al inicio, sin
              verificar.
            </p>
          </div>
          <div className="bg-hud-inner border-2 border-hud-border p-4 rounded-sm flex flex-col justify-between min-h-0">
            <span className="font-extrabold text-hud-neon-muted text-sm sm:text-base font-display uppercase tracking-wider">
              // POR QUÉ RUIDO DE BANDA ANCHA
            </span>
            <p className="leading-relaxed text-hud-dim text-xs sm:text-sm font-semibold my-auto">
              Se decidió probar con ruido gaussiano filtrado paso-bajo, más representativo de una imagen real, en
              vez de sinusoides puras que amplifican el ruido numérico al normalizar por magnitud.
            </p>
          </div>
          <div className="bg-hud-inner border-2 border-hud-border p-4 rounded-sm flex flex-col justify-between min-h-0">
            <span className="font-extrabold text-hud-neon-muted text-sm sm:text-base font-display uppercase tracking-wider">
              // POR QUÉ NO HAY COMPARADOR DE IMÁGENES
            </span>
            <p className="leading-relaxed text-hud-dim text-xs sm:text-sm font-semibold my-auto">
              La respuesta real nunca incluye las dos imágenes de entrada, solo{" "}
              <code className="text-hud-neon-muted bg-hud-bg px-1 py-0.5 rounded border border-hud-border font-bold">
                dx, dy
              </code>{" "}
              y el pico de correlación — se decidió no fabricar ese comparador con datos que la API no entrega.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
