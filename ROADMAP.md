# ROADMAP — ChronoSpectrum Engine

Fuente de la verdad de **implementación**, complementaria al `README.md` (que documenta objetivos, fundamento matemático y decisiones de arquitectura). Este archivo desglosa el trabajo en fases secuenciales, con tareas concretas y criterios de salida verificables por fase. Se actualiza marcando checkboxes a medida que se completa cada tarea — no se reescribe la narrativa histórica del README, este es el plan de ejecución.

## Cómo usar este documento

- Cada fase tiene un **objetivo**, una lista de **tareas** y un **criterio de salida** (qué debe ser cierto para considerarla terminada).
- No se avanza de fase salteando el criterio de salida de la anterior, salvo decisión explícita en el chat.
- Las decisiones de diseño que surjan durante la implementación de una fase y que no estaban resueltas se documentan en la sección **Decisiones abiertas** al final, no se asumen en silencio.

---

## Resumen del proyecto (panorama rápido)

**Qué es:** plataforma web de portafolio técnico con 3 módulos reales de procesamiento de señales/imágenes (implementación propia en NumPy/OpenCV, no wrappers prehechos para el núcleo algorítmico), servida por un backend FastAPI sin base de datos y un frontend React con una estética de rack de laboratorio retro-futurista.

**Los 3 módulos:**
1. **Eulerian Motion & Pulse Magnifier** — amplifica variaciones invisibles al ojo (pulso, micro-vibración) en video.
2. **2D-FFT Interactive Spectrum Cleaner** — elimina ruido periódico/Moiré de una imagen filtrando su espectro de frecuencia.
3. **Sub-Pixel Phase Correlator** — mide desplazamientos sub-píxel entre dos imágenes por correlación de fase.

**Stack:** frontend Vite + React + TypeScript + Tailwind v4 + GSAP; backend FastAPI + NumPy/OpenCV gestionado con `uv`, sin DB. Detalle completo en `README.md`.

**Estado real (esta fecha, ver detalle fase por fase más abajo):**
- ✅ Núcleo matemático de los 3 módulos (Fase 1), API HTTP (Fase 2), set de assets demo (Fase 3), y la extensión de simulación en vivo por WebSocket (Fase 8, 8.1–8.9) — completos y verificados.
- ✅ **Verificación visual real confirmada por Daniel (corrió `npm run dev` + backend en su máquina):** Módulo 1, Módulo 2, Landing y Navbar funcionan correctamente tal como se documentó en las Fases 8.21-8.30 (carrusel, avatar, contacto, botón Home, selector de idioma, layout general). Esto cierra la mayoría de las notas de "verificación honesta pendiente" de esas fases -- ver la sección nueva "Verificación real confirmada" más abajo para el detalle exacto de qué quedó cerrado y qué sigue sin confirmar.
- 🟡 Fase 4 (UI): módulos 1-3 maquetados, cableados a la API real, y ahora confirmados visualmente en navegador real. Quedan pendientes específicamente: el `TooltipProvider` global, verificación de build de producción (`tsc -b`/`npm run build`, distinto de `npm run dev`) y prueba de responsive en celular (~400px) -- ninguno de estos tres fue parte de la confirmación de Daniel, siguen abiertos -- ver 4.3.
- ⬜ Sin empezar todavía: Fase 5 (prueba de carga bajo restricciones reales de hosting gratuito), Fase 6 (despliegue a Render/Vercel), Fase 7 (pulido final pre-reclutadores), y 8.10 (verificación end-to-end de la Fase 8).
- 📌 Pendientes puntuales fuera de fases: confirmar el comando de arranque de producción de FastAPI (Fase 6), y borrar manualmente `ModuleTabs.tsx`/`TvFrame.tsx` (código muerto desde la 4.2c) — ver "Decisiones abiertas".
- 📋 Backlog de mejoras propuestas (Módulo 1/2/3, auditadas contra el código real pero NO implementadas todavía) -- ver las secciones "Backlog de mejoras propuestas" al final del documento.

**Regla de oro que rige todo el proyecto:** ningún valor mostrado en la UI que no venga de un cómputo real del backend se presenta como dato — se marca `locked` o se elimina (ver Fase 4.0 y Fase 8).

---

## Fase 0 — Fundaciones (COMPLETADA)

- [x] Monorepo (`frontend/`, `backend/`) sin herramienta de monorepo adicional (Turborepo, etc. — innecesario para este tamaño de proyecto)
- [x] Frontend: Vite + React + TypeScript + ESLint
- [x] Tailwind CSS v4 configurado (`@tailwindcss/vite`, alias `@/*`)
- [x] shadcn/ui inicializado (Base UI + preset Nova), componentes base: `button`, `slider`, `tabs`, `card`, `badge`, `tooltip`
- [x] Backend: FastAPI + `uv`, `main.py` mínimo con CORS y `slowapi` (`Limiter`) inicializados, `/health` respondiendo
- [x] Investigación matemática de los 3 módulos contra fuentes primarias, documentada en README

**Criterio de salida:** ✅ cumplido — ambos proyectos arrancan localmente (`npm run dev` / `uv run fastapi dev`).

---

## Fase 1 — Núcleo matemático (backend, sin API todavía)

**Objetivo:** implementar los 3 algoritmos como funciones puras de NumPy/PyTorch, testeadas contra casos sintéticos con resultado conocido, **antes** de exponerlos por API. Así se separa "¿la matemática está bien?" de "¿el servidor funciona?".

### 1.1 — Módulo 2D-FFT Interactive Spectrum Cleaner (primero: es el más simple, sin dimensión temporal) ✅ COMPLETADA
- [x] `backend/core/fft_filters.py`: función `compute_spectrum(image) -> magnitude, phase` (FFT2D + shift de cuadrantes)
- [x] Función `notch_filter(shape, u0, v0, d0, mode="gaussian"|"butterworth"|"ideal", n=2) -> mask` usando las fórmulas ya documentadas en el README (par simétrico `D1`/`D2`)
- [x] Función `apply_filter(image, mask) -> imagen_reconstruida` (multiplicación espectral + IFFT2D)
- [x] Script de generación de imagen sintética con ruido periódico conocido (rejilla senoidal superpuesta a una imagen base) para poder verificar visual y numéricamente que el notch elimina exactamente esa frecuencia
- [x] Prueba de round-trip: FFT2D → IFFT2D sin filtro debe reconstruir la imagen original (validación de que la implementación de la transformada está correcta antes de meter el filtro)

**Criterio de salida:** ✅ cumplido con resultados reales (`uv run python -m core.test_fft_filters`, 12-sep-2026): error de roundtrip `5.55e-16` (precisión de punto flotante, no error real); MSE contra la imagen base antes del filtro `1250.00`, después `8.92` — reducción del 99.3%, muy por debajo del umbral `<20%` fijado.

### 1.2 — Módulo Sub-Pixel Phase Correlator ✅ COMPLETADA
- [x] `backend/core/phase_correlation.py`: `cross_power_spectrum(img1, img2) -> R` (fórmula del README)
- [x] `integer_peak(r) -> (py, px, correlation_real)` sobre la IFFT2D de `R`
- [x] Refinamiento subpíxel siguiendo la fórmula de Foroosh et al. ya documentada (`Φ(0,0)`, `Φ(1,0)`, `arcsin`), aplicado por eje eligiendo la dirección según el vecino de mayor magnitud
- [x] Script de prueba: imagen base con ruido de banda ancha (Gaussiano filtrado — se descartó una imagen puramente senoidal por inestabilidad numérica al normalizar bins del espectro cercanos a cero) desplazada un valor subpíxel conocido vía el teorema de desplazamiento de Fourier (`fourier_shift`), verificando que el algoritmo recupera ese valor dentro de tolerancia

**Bugs reales encontrados y corregidos durante la validación (autoverificación antes de mostrar el código):**
- Convención de signo invertida en el desplazamiento recuperado — verificado con un desplazamiento entero exacto de prueba `(5,-5)`, que devolvía `(-5,5)`; corregido negando el resultado final.
- Explosión numérica cerca de desplazamientos enteros exactos (división por una magnitud casi nula en el refinamiento subpíxel) que producía un falso error de `0.5 px`; corregido con un umbral explícito de "vecino despreciable" que devuelve refinamiento `0.0`.

**Criterio de salida:** ✅ cumplido con resultados reales (12-sep-2026), umbral revisado de `< 0.1 px` (optimista, placeholder inicial) a `< 0.5 px` (realista, fijado después de medir): desplazamientos enteros exactos → error `0.000 px`; desplazamientos fraccionarios `(1.60, -2.37)` → error `(0.10, 0.13) px`; `(0.30, 0.30)` → `(0.20, 0.20) px`; `(-3.90, 4.20)` → `(0.40, 0.30) px`; `(10.25, 10.25)` → `(0.25, 0.25) px`. Todos por debajo del umbral de `0.5 px`.

### 1.3 — Módulo Eulerian Motion & Pulse Magnifier ✅ COMPLETADA
- [x] `backend/core/pyramids.py`: construcción de pirámide Laplaciana con filtro binomial de tamaño 5 (según el paper), separable, bordes reflejados
- [x] `backend/core/temporal_filter.py`: filtro pasa-banda temporal IIR de primer orden (cascada de dos pasa-bajos, `pasa-bajo(f_low) - pasa-bajo(f_high)`), streaming (solo guarda estado por pixel, no un buffer de frames)
- [x] `backend/core/motion_magnifier.py`: pipeline de amplificación — descomposición → filtro temporal por nivel → `+ α·bandpass` → recomposición (la banda base/Gaussiana no se amplifica, por diseño del paper)
- [x] `backend/core/test_motion_magnifier.py`: videos sintéticos de una única frecuencia conocida (uno dentro de banda, uno fuera), verificando que la amplificación discrimina entre ambos

**Bugs reales encontrados y corregidos durante la validación (autoverificación antes de mostrar el código):**
- **Ganancia no unitaria del filtro pasa-banda:** el pasa-banda (diferencia de dos pasa-bajos IIR de primer orden) tiene ganancia ≈`0.182` en su frecuencia central de diseño (`f_center = √(f_low·f_high)`), no `1.0` — verificado analíticamente con `H_lp(w) = a/(1-(1-a)e^{-jw})` y confirmado numéricamente. Sin corregir esto, el parámetro `α` no corresponde al factor de amplificación real.
- **Signo/fase invertidos en el primer intento de corrección:** normalizar dividiendo solo por la *magnitud* de la ganancia (`|H(w0)|`) no bastaba — verificado que `H(w0) ≈ -0.1818 - 0.0003j` (fase ≈ `-180°`, prácticamente un real negativo), así que la señal filtrada salía en antifase respecto a la original y `banda + α·bandpassed` se cancelaba en vez de reforzarse (con `α=1`, la amplitud de la suma caía a ~1.7% de la original). Corregido dividiendo por la parte real **con signo** de `H(w0)` (válido aquí porque la parte imaginaria es <0.03% de la magnitud; el código valida esta condición y lanza error si no se cumple para otra combinación de `f_low`/`f_high`/`fs`).
- **Error de metodología en la prueba (dos veces):** (1) medir la amplificación sobre la *media espacial* de una región del frame reconstruido es inválido, porque esa media está dominada por la banda base (Gaussiana), que por diseño nunca se amplifica — la amplificación real de detalle es mucho mayor de lo que esa métrica sugería. (2) Intentar aislar el detalle *re-descomponiendo* el frame ya reconstruido también es inválido: la pirámide Laplaciana es una representación sobre-completa (más coeficientes que píxeles — para 64×64 con 3 niveles: `64² + 32² + 16² = 5376` contra `4096`), así que `decompose(collapse(P))` no reproduce el `P` original si `P` no vino de descomponer una imagen real (diferencia verificada de hasta `0.21` en valor de píxel). Corregido midiendo en un píxel fijo, restando la banda base obtenida de descomponer el frame de **entrada** una sola vez (nunca la salida ya reconstruida).

**Limitación real y documentada (no es un bug):** el filtro streaming (cascada de dos pasa-bajos IIR de primer orden) tiene un rolloff suave, no es un notch agudo — a diferencia del filtro ideal vía FFT/DCT que el propio paper de Wu et al. (2012) describe como alternativa más selectiva pero que requiere buffer completo de video. Con `α` grande, incluso una atenuación fuera de banda moderada se amplifica de forma no despreciable.

**Criterio de salida:** ✅ cumplido con resultados reales (12-sep-2026), midiendo con `α=10`, `f_low=0.8 Hz`, `f_high=1.2 Hz`, `fs=30 fps`: frecuencia de interés (1 Hz) amplificada ≈`11.0x` (umbral de prueba `>8.0x`); frecuencia fuera de banda (4 Hz) amplificada ≈`5.22x` (umbral de prueba `<7.0x`); separación mínima exigida entre ambas: `1.5x`.

---

## Fase 2 — Capa de API (backend) ✅ COMPLETADA

**Objetivo:** exponer los 3 módulos del núcleo matemático vía FastAPI, con contratos claros y protegidos por los límites que ya definimos en el README (sin DB, sin upload libre, rate limiting).

- [x] **Decisión de diseño cerrada:** el backend tiene los assets del set cerrado localmente (`backend/assets/`); el frontend solo manda un `asset_id` restringido a un `Enum` — nunca un path arbitrario. Se descarta enviar el archivo completo en cada petición.
- [x] Modelos Pydantic de request/response por endpoint (`api/models.py`): `alpha` con rango `1.0–50.0` (documentado explícitamente como decisión de ingeniería, no una cifra del paper), `f_low`/`f_high` con `model_validator` cruzado (`f_low < f_high`), `d0`/`n`/`mode` por notch, `asset_id` restringido a los `Enum` de `api/assets.py`
- [x] `POST /api/spectrum-cleaner` — recibe `asset_id` + `notches: list[NotchParams]` (extendido de un único notch a una lista tras encontrar que un asset real puede tener más de una frecuencia de ruido dominante, ver Fase 3), devuelve espectro antes/después + imagen filtrada en base64
- [x] `POST /api/phase-correlator` — recibe `asset_id`, devuelve `dy`/`dx` + visualización del pico de correlación
- [x] `POST /api/motion-magnifier` — recibe `asset_id` de video + `alpha`/banda de frecuencia, devuelve `frames_png_base64` + `sample_rate`; valida `f_high < sample_rate/2` (Nyquist) a mano porque depende del asset, no es validable solo en Pydantic
- [x] `slowapi` aplicado por endpoint vía `Limiter` en módulo propio (`api/rate_limit.py`), separado de `main.py` para evitar import circular (verificado contra slowapi GitHub issue #25 y su documentación oficial)
- [x] Manejo de errores: `HTTPException` 422 para `asset_id`/parámetros inválidos y `ValueError` del núcleo (ej. ganancia casi nula del filtro), no un 500 genérico
- [x] CORS actualizado en `main.py`

**Limitación de verificación honesta:** el sandbox de desarrollo usado para construir esto no pudo instalar `fastapi`/`slowapi` reales (bloqueo de red hacia `pypi.org`), así que la lógica de negocio se verificó con módulos `fastapi`/`slowapi` simulados a mano en aislamiento, no con una ejecución real del servidor — la verificación end-to-end real la hizo Daniel corriendo el backend en su propia máquina, confirmando que los 3 endpoints funcionan.

**Criterio de salida:** ✅ cumplido — los 3 endpoints responden correctamente en la máquina de Daniel, incluyendo los casos de error.

---

## Fase 3 — Set de datos demo ✅ COMPLETADA

**Objetivo:** curar el set cerrado de assets que reemplaza el upload libre.

- [x] Video real de pulso ocular: `motion_magnifier/Macro Eye HD - Jkouw (360p, h264).mp4` (`asset_id: real_eye_pulse`) — 209 frames @ 29.97fps, cámara fija (se descartó un video de "collage de ojos" previo por tener cortes de escena entre personas distintas, incompatible con el supuesto de escena estática de Eulerian Video Magnification)
- [x] Video real de vibración/motor: `motion_magnifier/Vibration Sound.mp4` (`asset_id: real_speaker_vibration`) — 210 frames @ 30fps
- [x] Imagen real con ruido periódico: `spectrum_cleaner/noisy_image.jpg` (`asset_id: real_mesh_texture`) — un mesh de diamantes que resultó tener **dos** picos de frecuencia dominantes (dos rejillas diagonales cruzadas), no uno como en el ruido sintético — esto fue lo que forzó extender `SpectrumCleanerRequest` a `notches: list[NotchParams]` en la Fase 2
- [x] Par de imágenes para el phase correlator: `phase_correlator/source_photo.jpg` (`asset_id: real_shifted_pair`) — la segunda imagen del par se genera por código vía el teorema de desplazamiento de Fourier sobre la foto real, con desplazamiento conocido exactamente por construcción `(1.6, -2.37)`, no medido
- [x] **Licencia/procedencia documentada** en `backend/assets/README.md`: fuentes de Pexels, YouTube y Pinterest, verificadas y asumidas explícitamente por Daniel ("de uso libre, verificado por Daniel"), con la licencia Pexels confirmada aparte (uso comercial libre, sin atribución)
- [x] Decisión cerrada: se procesan en vivo en cada ajuste de parámetro sobre estos inputs controlados (no precomputados), para que la demo se sienta "real" — según lo ya discutido en README. Los videos reales se recortan a 128×128 / 7.0s para mantenerse dentro de las restricciones de RAM de Render (ver Fase 5)

**Criterio de salida:** ✅ cumplido — los assets están en `backend/assets/`, referenciados por los `asset_id` de la Fase 2, con su procedencia documentada en `backend/assets/README.md`.

---

## Fase 4 — UI (frontend)

**Objetivo:** construir el panel interactivo con React + shadcn/ui. Se descartó explícitamente una estética de dashboard SaaS genérico (decisión de Daniel: "no quiero que hagas una UI básica que se vea a metros que fue creado por IA") a favor de un lenguaje visual propio.

### 4.0 — Decisión de dirección visual y librerías (cerrada)

- **GSAP adoptado** como librería de animación (`gsap` + `@gsap/react`, instalados). Verificado contra el contenido real de `github.com/greensock/gsap-skills` (no asumido): GSAP y todos sus plugins son gratuitos desde la adquisición de Webflow; el hook `useGSAP` requiere `scope` para no filtrar selectores fuera del componente y hace `revert()` automático al desmontar; usar `autoAlpha` en vez de `opacity`, `x`/`y`/`scale`/`rotation` en vez de `transform` crudo.
- **Estética elegida:** panel de control físico de laboratorio retro-futurista ("rack" — inspirado en monitores CRT Sony PVM, sintetizadores Arturia/Teenage Engineering, plugins UAD), fondo oscuro permanente (no hay modo claro para este panel), acentos verde neón (`#00FF66` / `#10B981`) sobre azul-negro (`#0B0F17`–`#0F172A`), tipografía `JetBrains Mono` (datos/etiquetas) + `Space Grotesk` (headings).
- **Google Stitch** se usó solo como generador de boceto visual de referencia (prompt detallado documentado en el chat, no en este archivo), nunca como fuente de código final: el HTML que devolvió usaba Tailwind v3 vía CDN (`tailwind.config` en JS) y Material Symbols — incompatible con este proyecto (Tailwind v4 con `@theme` CSS-first, iconos `lucide-react`) y sin componentes React reales (manipulación directa del DOM por `id`). Se reescribió todo desde cero contra los primitivos reales del proyecto (`@base-ui/react`, `components/ui/*` de shadcn ya existentes), no se copió el HTML.
- **Elementos decorativos vs. datos reales (regla explícita, para no repetir el error en módulos futuros):** cualquier valor mostrado en la UI que no venga de una respuesta real de la API se marca como `locked`/"Próximamente" (ver `VfdMetricCard`), nunca se muestra un número con apariencia de medición real si no lo es. Se descartaron del boceto de Stitch los elementos de "telemetría" inventada (`HV PSU: +18.4kV`, `TRACE SYNC: LOCKED`, EXIF falso sobre la imagen) por la misma razón — quedó solo un rótulo de marca sin cifras.

### 4.1 — Fundaciones de tema (COMPLETADA)

- [x] Tokens de color/tipografía del rack añadidos a `src/index.css` vía `@theme inline` (`--color-rack-*`, `--font-mono`, `--font-display`), separados deliberadamente de `--background`/`--foreground`/`.dark` porque esta estética es oscura de forma permanente, no un tema alternable
- [x] Tipografías `JetBrains Mono` y `Space Grotesk` vía `@fontsource-variable` (mismo patrón que `Geist Variable` ya usado en Fase 0) — **pendiente que Daniel corra `npm install @fontsource-variable/jetbrains-mono @fontsource-variable/space-grotesk`**
- [x] `<html class="dark">` fijo en `index.html`

### 4.2 — Componentes del rack (COMPLETADA para Módulo 1, EVM)

- [x] `RackChassis.tsx` — contenedor del chasis + rótulo de marca
- [x] `ModuleTabs.tsx` (`RackTabs`/`RackTabsList`/`RackTabsTrigger`/`RackTabsContent`) — restyling del `Tabs` de shadcn ya existente, mismo primitivo, sin duplicarlo
- [x] `CrtMonitor.tsx` — bisel + scanlines + overlay de estado
- [x] `Oscilloscope.tsx` — traza SVG animada con GSAP (`stroke-dashoffset`)
- [x] `RotaryKnob.tsx` — perilla reutilizable construida sobre el mismo primitivo `@base-ui/react/slider` que ya usa `components/ui/slider.tsx` (orientación vertical: arrastre vertical "rota" el valor, igual que en plugins de audio de software — Base UI no soporta arrastre circular nativo, no se inventó esa física de puntero), rotación visual animada con `useGSAP`
- [x] `ToggleSwitchGroup.tsx` — radiogroup accesible manual (`role="radiogroup"`/`role="radio"`), no se importó un `RadioGroup` que no existe en `package.json`
- [x] `VfdMetricCard.tsx` — display reutilizable, con estado `locked` para métricas no soportadas todavía por el backend
- [x] `DiagnosticConsole.tsx` — consola inferior
- [x] `App.tsx` reescrito: ensambla el Módulo 1 (EVM) completo con estos componentes y estado de React real (`alpha`, `f_low`, `f_high`, `source`); Módulos 2 y 3 quedan como placeholder explícito ("pendiente de maquetar"), no se inventó su contenido

### 4.2b — Restructuración: scroll-snap, navegación flotante y escalado "TV" (COMPLETADA — parcialmente sustituida por 4.2c)

Pedido explícito de Daniel tras ver el primer resultado de 4.2: eliminar el scroll dentro de cada pantalla, separar la navegación del chasis, y hacer que toda la interfaz escale como una unidad física rígida (estética "TV de los 80"), no que se reacomode con flexbox.

- [x] `App.tsx` reestructurado: dos secciones (`snap-y snap-mandatory`, cada una `h-dvh`/`min-h-dvh` + `snap-start`) — Sección 1 (Home/Hardware Deck) y Sección 2 (documentación interactiva)
- [x] `NavDrawer.tsx` (nuevo) — navegación ÚNICA del sitio (Daniel confirmó explícitamente "no hay más barras de navegación además de los MODs"): drawer vertical fijo en el borde derecho (`position: fixed`), oculto por defecto, con manija de apertura/cierre animada con GSAP. Reemplaza las pestañas que vivían dentro del chasis — `ModuleTabs.tsx` (`RackTabsList`/`RackTabsTrigger`) quedó sin uso y se eliminó (código muerto, no se dejó a medio usar)
- [x] `TvFrame.tsx` (nuevo) — envuelve toda la Sección 1: lienzo de diseño fijo (1440×900) escalado como unidad con `transform: scale()`, factor calculado por `ResizeObserver` (tope máximo `1`, nunca se agranda de más). Aprobado explícitamente por Daniel como "opción (b)" frente a un layout fluido por flexbox
- [x] `CrtMonitor.tsx` ajustado: ya no fuerza su propio `aspect-4/3` (ese trabajo ahora lo hace `TvFrame` a nivel de toda la interfaz); la imagen usa `object-contain` en vez de `object-cover` para no recortar ni deformar el placeholder
- [x] `RackChassis.tsx` ajustado a `flex h-full flex-col` para vivir dentro del lienzo fijo de `TvFrame`
- [x] Grid interno de la Sección 1 reordenado: CRT a la izquierda; Signal Monitor (osciloscopio) independiente arriba a la derecha, panel de mandos debajo — ya no van pegados en un solo bisel como en la 4.2 original
- [x] `Section2.tsx` (nuevo) — documentación interactiva del Módulo 1 con tarjetas (`DocCard.tsx`) y efecto de texto tipo terminal (`TerminalText.tsx`, revelado progresivo con `setInterval` de React — **no** es un plugin de GSAP, GSAP no trae un primitivo de "tipeo"; se aclara para no sugerir una dependencia que no existe), reutilizando `RotaryKnob`/`VfdMetricCard` en modo demostrativo. Contenido tomado literalmente de lo ya verificado en la Fase 1.3 (kernel de 5 taps, cascada de dos pasa-bajos, ganancia real ≈0.182, el bug de antifase, y las cifras 11.0x/5.22x) — nada inventado para la documentación
- [x] Decisión de alcance: la Sección 2 queda **fuera** del escalado rígido de `TvFrame` — es contenido de lectura, y forzar un lienzo de diseño fijo sobre texto arriesgaba tipografía ilegible en pantallas chicas

**Limitación honesta de esta iteración:** los altos internos de la Sección 1 (fila del grid en `560px`, panel de mandos resultante en `~398px`) se calcularon a mano sumando alturas estimadas de cada bloque, sin poder compilar/renderizar `npm run dev` en este entorno (sin shell en la máquina de Daniel). El margen calculado es ajustado (~8px de sobra en el peor caso) — se añadió `overflow-hidden` como red de seguridad en los contenedores más apretados para que, si el cálculo queda corto, se recorte visualmente en vez de romper el "sin scroll" de la Sección 1. Daniel debe verificar visualmente con `npm run dev` y avisar si algo se ve apretado, para ajustar tamaños con datos reales en vez de otra estimación a mano.

**Resultado real (reportado por Daniel al correr `npm run dev`):** la limitación de arriba se materializó en tres bugs concretos, más un bug independiente y crítico en `NavDrawer.tsx`. Ver 4.2c.

### 4.2c — Corrección de bugs reales de renderizado y del NavDrawer no funcional (COMPLETADA)

Daniel reportó, tras ejecutar `npm run dev` y ver la interfaz real, 3 bugs críticos en la Sección 1, 3 en la Sección 2, y el `NavDrawer` completamente inoperativo (clic en la flecha no mostraba navegación, solo una franja negra vacía). Diagnóstico y fix para cada uno:

- **Bug — franjas negras (letterboxing) en Sección 1:** `TvFrame.tsx` calculaba el factor de escala con `Math.min(width/1440, height/900, 1)`, dejando márgenes vacíos cuando el aspecto real del viewport no coincidía con el lienzo fijo de diseño (1440×900). Daniel rechazó explícitamente las dos alternativas evaluadas (`Math.max`/`object-fit: cover`, que recortaría botones interactivos en los bordes; y `scaleX`/`scaleY` independientes, que convertiría las perillas circulares en óvalos). Fix: se abandonó el lienzo fijo con `transform: scale()` para el contenedor exterior de la Sección 1. `App.tsx` ya no envuelve `<Section1>` en `<TvFrame>`; el chasis ahora ocupa `100vw`/`100dvh` de forma nativa y sus contenedores internos absorben el espacio extra vía `flex-1`/`flex-[N]`, mientras que los elementos de forma fija (perilla circular, monitor CRT con `object-contain`) mantienen sus dimensiones y solo se centran dentro de su tarjeta — nunca se deforman ni se recortan. `TvFrame.tsx` queda como **código muerto** (ver nota de archivos a borrar más abajo).
- **Bug — controles `SOURCE`/perillas recortados y hueco muerto bajo la consola de diagnóstico:** dos causas combinadas. (1) `RotaryKnob.tsx` usaba `max-w-[10ch]` en la etiqueta, lo que forzaba el corte a 2 líneas en etiquetas largas ("Bandpass Low (Hz)", "Magnification Factor (α)") sin que ese alto extra estuviera contemplado en el presupuesto de píxeles calculado a mano en la iteración 4.2b. (2) `Section1.tsx` usaba alturas fijas en píxeles (`h-[560px]`, `h-[150px]`, etc.) más un `overflow-hidden` añadido como "red de seguridad" — cuando el contenido real excedió el presupuesto estimado (por el problema de la etiqueta), ese `overflow-hidden` recortó contenido real y necesario en vez de evitar un scroll. Fix: `RotaryKnob.tsx` cambió la etiqueta a un contenedor de alto fijo (`h-8 max-w-[120px] leading-tight`) que siempre reserva el mismo alto, se envuelva o no el texto; `Section1.tsx` se reescribió por completo reemplazando todas las alturas fijas por `flex-1`/`flex-[N]`/`shrink-0` (el navegador calcula los tamaños reales en vez de una estimación a mano), eliminando los `overflow-hidden` defensivos — ya no hacen falta porque flexbox garantiza matemáticamente que no sobra ni falta espacio.
- **Bug — scroll-snap "latigazo" y contenido cortado en Sección 2:** `snap-mandatory` combinado con la constricción de altura forzaba a la Sección 2 (documentación de forma larga, más alta que una pantalla) a encajar en una caja de una sola pantalla exacta, cortando título y tarjetas inferiores, y produciendo un salto brusco al hacer scroll hacia atrás. Fix: `snap-mandatory` → `snap-proximity` en el contenedor `<main>` de `App.tsx` (alinea suavemente cerca del límite entre secciones sin forzar el salto completo); se quitó `overflow-y-auto` del `<section>` de la Sección 2 (evita un contenedor de scroll anidado compitiendo con el scroll del `<main>`). El padding vertical de `Section2.tsx` ya era `py-16` (64px), por encima del mínimo de 48px pedido — no requirió cambio.
- **Bug crítico — `NavDrawer` completamente inoperativo:** causa raíz confirmada: el panel tenía un `style={{ transform: "translateX(100%)" }}` **estático** en el JSX. React reaplica ese `style` en cada re-render (cada vez que cambiaba el estado `open`), pisando la animación de GSAP en curso y dejando el panel atascado en la posición oculta — solo se veía una franja de color de fondo. Fix: la posición inicial (oculto) ahora la establece `gsap.set(panelRef.current, { xPercent: 100 })` dentro de la función de configuración de `useGSAP`, nunca un `style` literal del render; el botón y el panel se separaron en dos elementos `fixed` independientes (antes compartían un contenedor `flex` que reservaba espacio de layout innecesariamente); ancho explícito `width: 280px`, `z-index: 9999` (panel) / `10000` (botón), fondo `#0B0F17` con borde `border-rack-accent/30`, colores de texto vía los tokens `rack-text-dim`/`rack-accent` (`#64748B`/`#00FF66`, verificados contra los valores pedidos por Daniel).

**Archivos que quedaron como código muerto tras esta iteración (esta sesión no tiene `device_bash`/shell en la máquina de Daniel, por lo que no puede borrar archivos — Daniel debe eliminarlos manualmente):**
- `ModuleTabs.tsx` — reemplazado por `NavDrawer.tsx` desde la iteración 4.2b.
- `TvFrame.tsx` — reemplazado por el llenado nativo `100vw`/`100dvh` + `flex-1` desde esta iteración 4.2c.

**Limitación honesta de esta iteración (se mantiene):** igual que en toda la Fase 4, este código fue escrito y verificado manualmente contra los primitivos reales del proyecto, pero no se compiló ni se renderizó en este entorno (sin shell en la máquina de Daniel). Los tres bugs de arriba fueron diagnosticados por análisis estático de las reglas de CSS/React/GSAP involucradas, no reproducidos ni confirmados visualmente por mí — Daniel es quien verificó el comportamiento real y debe volver a correr `npm run dev` para confirmar que esta ronda de fixes efectivamente los resuelve.

### 4.3 — Pendiente (siguiente iteración de esta misma fase)

- [ ] Maquetar Módulo 2 (2D-FFT) y Módulo 3 (Phase Correlator) con el mismo lenguaje visual del rack
- [ ] Envolver la app en `TooltipProvider` en `src/main.tsx` (arrastrado desde Fase 0, todavía no hecho)
- [ ] **Cliente API real:** función centralizada de `fetch`/estado hacia el backend — hoy `App.tsx` solo tiene estado local de React, ninguna llamada real a `/api/motion-magnifier` todavía. Sin esto, el botón "Execute Magnification" es decorativo
- [ ] Manejo explícito del cold-start de Render (mensaje de "servidor despertando…") — depende de tener el cliente API real primero
- [ ] Variable de entorno `VITE_API_URL` (dev vs. producción)
- [ ] Verificación de que el build compila sin errores de tipos (`npm run build` / `tsc -b`) — el código de este documento fue escrito y verificado manualmente contra los primitivos reales del proyecto, pero **no se ejecutó `tsc`/`vite build` en este entorno** (sin acceso de shell a la máquina de Daniel); Daniel debe correrlo y reportar cualquier error de tipos antes de dar esto por cerrado
- [ ] Responsive en ancho de celular (~400px) — el layout de 12 columnas ya colapsa a 1 columna por Tailwind, pero no se verificó visualmente todavía

**Criterio de salida:** los 3 módulos son navegables y funcionales localmente contra el backend corriendo en `localhost:8000`, con manejo visible de estados de carga/error. (Todavía no cumplido: falta el cliente API real y los Módulos 2/3.)

---

## Fase 5 — Integración y rendimiento

**Objetivo:** validar el sistema completo bajo las restricciones reales del hosting gratuito, no solo en local.

- [ ] Prueba de carga básica: medir tiempo real de procesamiento de cada módulo con los assets demo definitivos, en una máquina similar en recursos al plan free de Render (o al menos limitando CPU/RAM localmente para simular)
- [ ] Ajustar límites de tamaño/duración de los assets demo si el módulo de video no cumple un tiempo de respuesta razonable con 512 MB RAM / <1 CPU
- [ ] Verificar que el buffer circular del módulo 1 efectivamente evita picos de memoria con el asset de video definitivo
- [ ] Afinar los valores de `slowapi` con datos reales de cuánto tarda cada endpoint (no un número arbitrario)

**Criterio de salida:** los 3 módulos responden en un tiempo aceptable (a definir con números reales de esta fase, no una promesa vaga) simulando las condiciones del plan free de Render.

---

## Fase 6 — Despliegue

**Objetivo:** llevar frontend y backend a producción.

- [ ] Backend en Render: configurar el servicio (build command con `uv`, start command `uv run fastapi run` o equivalente de producción — **verificar la diferencia entre `fastapi dev` y el comando de producción antes de desplegar**, no asumir que es el mismo), variables de entorno
- [ ] Frontend en Vercel: build de Vite, variable de entorno `VITE_API_URL` apuntando al dominio real de Render
- [ ] Actualizar CORS en el backend con el dominio final de Vercel (reemplazando el placeholder de `localhost`)
- [ ] Prueba end-to-end en producción: los 3 módulos funcionan entre los dominios reales, incluyendo verificar que el cold-start de Render se comporta como se documentó

**Criterio de salida:** URL pública funcional, accesible sin instalar nada, con los 3 módulos operativos.

---

## Fase 7 — Pulido final (antes de compartir con reclutadores)

- [ ] Revisión de que ningún parámetro expuesto en la UI pueda causar un error 500 o un cómputo excesivo en el backend (límites duros en el frontend Y validados de nuevo en el backend — nunca confiar solo en el límite del cliente)
- [ ] `README.md` y este `ROADMAP.md` reflejando el estado final real
- [ ] Revisión de que no quede ningún placeholder (`localhost`, `TODO`, dominio de ejemplo) en el código de producción

---

## Fase 8 — Extensión: simulación en vivo (WebSocket) y comparación original vs. resultado

**Contexto:** decisión explícita de Daniel (no parte del plan original de Fases 0-7): el resultado de cada módulo debe sentirse "en vivo" -- mover una perilla (Módulo 1: `alpha`/`f_low`/`f_high`; Módulo 2: parámetros de `notches`) debe reflejarse en el resultado sin tener que pulsar Execute repetidamente, como el volumen de un radio. Los endpoints HTTP `/api/*` existentes (Fase 2) NO se eliminan ni se modifican en su contrato -- siguen funcionando igual, con su rate limit de `slowapi` intacto. Esta fase AGREGA un mecanismo nuevo en paralelo.

**Objetivo:** el usuario ve el asset original de inmediato al cargar un módulo (sin esperar ningún cómputo); al presionar Execute, arranca una simulación en vivo que muestra original + resultado actualizándose en tiempo real mientras el usuario ajusta parámetros; el selector de asset queda bloqueado mientras la simulación está activa; Stop cierra la simulación y vuelve al estado inicial (solo el original).

- [x] **8.1 — Ruta A (asset original en la respuesta):** agregado `original_frame_png_base64` a `MotionMagnifierResponse`, `original_image_png_base64` a `SpectrumCleanerResponse`, `image1_png_base64`/`image2_png_base64` a `PhaseCorrelatorResponse` (`api/models.py`), codificados en los 3 routers a partir de datos ya en memoria (`frames[0]`, `noisy`, `img1`/`img2`) -- sin tocar ningún algoritmo core.
- [x] **8.2 — Métrica real `reduction_percent`:** agregada a `SpectrumCleanerResponse`, calculada en `spectrum_cleaner.py` como `(1 - energia_despues/energia_antes) * 100` a partir de `magnitude_before`/`magnitude_after` (ya en memoria) -- nunca un número inventado.
- [x] **8.3 — Codificación liviana para el socket:** agregada `array_to_jpeg_base64` en `api/encoding.py` (JPEG vía `cv2.imencode(".jpg", ..., [IMWRITE_JPEG_QUALITY, 80])`), separada de `array_to_png_base64` (que sigue siendo la usada por los endpoints HTTP existentes, sin cambios). Se descarta WebP por no tener certeza de que el build de OpenCV instalado lo soporte.
- [x] **8.4 — Endpoints WebSocket (uno por módulo):** nuevo archivo `api/live.py` con `/ws/motion-magnifier`, `/ws/spectrum-cleaner`, `/ws/phase-correlator`, declarados `async def`, usando `asyncio.to_thread(...)` para llamar a `MotionMagnifier`/`apply_filter`+`notch_filter`+`compute_spectrum`/`phase_correlate_subpixel`+`cross_power_spectrum`+`integer_peak` sin modificarlos, y reutilizando los mismos modelos Pydantic de request (`MotionMagnifierRequest`, `SpectrumCleanerRequest`, `PhaseCorrelatorRequest`) para validar cada mensaje entrante, igual que los endpoints HTTP. Mecanismo de control de carga propio (no cubierto por `slowapi`, que no aplica a WebSocket): un cálculo en curso a la vez por conexión; si llega un parámetro nuevo mientras se calcula, se descarta el cómputo intermedio y se procesa solo el último valor recibido al terminar el actual -- no se cancela el hilo en curso (los algoritmos NumPy/OpenCV no tienen puntos de cancelación seguros sin trocear el core, fuera de alcance de esta fase). Registrados en `main.py` vía `app.include_router(live_router)`, en paralelo a los 3 routers HTTP existentes (no los reemplaza).
  - **Caveat real pendiente, no bloqueante para desarrollo local:** `CORSMiddleware` protege las rutas HTTP, pero el handshake de WebSocket no pasa por el mismo mecanismo de CORS del navegador de la misma forma -- si este backend deja de vivir solo en `localhost`, hay que agregar una verificación manual del header `Origin` dentro de cada handler de `api/live.py`. No implementado todavía, deliberadamente, hasta que haya un dominio real de despliegue (ver Fase 6).
- [x] **8.5 — Frontend: tipos y cliente WS:** extendido `lib/api/types.ts` con los campos nuevos de 8.1/8.2 y los tipos de mensaje de `/ws/*` (`MotionMagnifierLiveResult`, `SpectrumCleanerLiveResult`, `PhaseCorrelatorLiveResult`, `LiveErrorMessage`); nuevo `lib/api/live.ts` con la conexión WebSocket genérica (`connectLive`) y sus 3 envoltorios tipados por módulo. `client.ts` exporta ahora `getBaseUrl()` para no duplicar la resolución de `VITE_API_URL`.
- [x] **8.6 — `useFramePlayer.ts`:** reescrito -- expone `{frameSrc, isPlaying, play(), pause()}` en vez de devolver solo un string; el loop `setInterval` ya no arranca solo, solo corre mientras `isPlaying` es `true`. Acepta un tercer parámetro `mimeType` (`"image/png" | "image/jpeg"`) porque ahora hay dos orígenes de frames (HTTP con PNG, WebSocket con JPEG).
- [x] **8.7 — Módulo 1 (UI):** Execute abre el WS (`connectMotionMagnifierLive`) y arranca la simulación; Stop la cierra (`connection.close()`) y vuelve al estado "solo original" (`originalFrameSrc`, Ruta A, que persiste entre actualizaciones y tras Stop); `ToggleSwitchGroup` (Source) ahora acepta `disabled` y se bloquea mientras `isSimulating`; `Oscilloscope` acepta `active`/`freqHz`/`alpha` y dibuja una onda derivada de la banda real `f_low`-`f_high` y de `alpha` en vez del trazo fijo, mientras la simulación está activa; tarjetas del panel reducidas a `Gain` (`alpha` real, ya no "dB") y `Frecuencia` (banda real `f_low`-`f_high`) -- ambas leen directo del estado de las perillas, así que se actualizan al instante incluso antes de Execute; se eliminan `Noise Reduction` y `Sub-Pixel Shift`. Los cambios de perilla mientras se simula se reenvían al backend debounced (150ms, ver `KNOB_DEBOUNCE_MS`). Bug real encontrado y corregido durante esta implementación: un error de negocio del backend (ej. Nyquist) no debe cerrar la simulación ni el socket -- se separó el estado `isSimulating` del estado `errorMessage` para evitar una conexión huérfana (ver comentario en `Modulo1.tsx`).
- [x] **8.8 — Módulo 2 (UI):** mismo patrón Execute/Stop/bloqueo/WS (`connectSpectrumCleanerLive`); tarjetas reducidas a `Peak Count` (real, notches activos, sin depender del backend) y `Reduction %` (real, `liveResult.reduction_percent` de 8.2); se eliminan `Notch 1 dB`/`Notch 2 dB`. Diferencia de diseño respecto a Módulo 1 (documentada en el propio código): en vez de llamar a un `sendLiveUpdate` desde cada handler de perilla, un solo `useEffect` observa el array `notches` completo y reenvía (debounced) cualquier cambio -- hay demasiados puntos de mutación (RadarPad, SteppedKnob, 2 RotaryKnob, botón ON/OFF, NotchStepper) para instrumentar cada uno sin repetir la misma lógica 6 veces. El envío inicial tras Execute lo dispara ese mismo efecto (al pasar `isSimulating` a `true`), no una llamada explícita duplicada.
- [x] **8.9 — Módulo 3 (UI):** mismo patrón Execute/Stop/bloqueo/WS (`connectPhaseCorrelatorLive`), pero sin `debounceRef` -- a diferencia de Módulo 1 y 2, `PhaseCorrelatorRequest` solo acepta `asset_id`, no hay ningún parámetro continuo que reenviar mientras se simula, así que el único envío es el inicial en `handleExecute` (`connection.send(requestBody)`), disparado una sola vez. `ToggleSwitchGroup` (Source) se bloquea con `disabled={isSimulating}`; se agregó el botón Stop junto a Execute (`grid-cols-2`, mismo estilo `text-hud-error` que Módulo 1/2). Las tarjetas `Δx`/`Δy` siguen siendo reales, ahora leyendo de `liveResult` (WS) en vez de la respuesta HTTP one-shot anterior. `originalImageSrc` (Ruta A) se fija a `image1_jpeg_base64` del primer resultado y persiste tras Stop -- el CRT y el Signal Monitor (zoom del mismo pico, no una imagen nueva) muestran ese original antes de Execute y después de Stop, y el pico de correlación real mientras la simulación está activa. Corrección de comentario: el docstring del archivo afirmaba que `PhaseCorrelatorResponse` "nunca devuelve las dos imágenes de entrada" -- eso dejó de ser cierto con Ruta A (Fase 8.1, que agregó `image1`/`image2` reales tanto en HTTP como en WS); se corrigió el comentario y se aclaró explícitamente que un comparador deslizable `image1`/`image2` es una funcionalidad nueva fuera del alcance de este paso -- no se construyó. Verificado con `tsc` en un proyecto aislado (sin errores reales, solo ruido de configuración de la copia local de `tsc`).
- [ ] **8.10 — Verificación end-to-end:** build/`tsc --noEmit`, y prueba real en el navegador de Daniel (mismo procedimiento ya usado en la Fase 4.3) confirmando el flujo completo en los 3 módulos.

**Extensión 8.11-8.15 (ronda de bugs reales reportados por Daniel tras la primera prueba en su navegador):** la prueba real de 8.10 expuso 5 problemas concretos -- se documentan aquí como continuación de la Fase 8, no como fase nueva, porque son correcciones/ajustes sobre el mismo mecanismo de simulación en vivo, no funcionalidad distinta.

- [x] **8.11 — Tope dinámico de Nyquist en las perillas de Bandpass (Módulo 1):** bug real reportado por Daniel con el error textual del backend (`f_high (15.0 Hz) debe ser menor que la frecuencia de Nyquist...`) -- el `max` de las perillas `f_low`/`f_high` estaba hardcodeado en `30`, sin relación con el `sample_rate` real de cada asset. Corregido con `knobMaxHz = Math.max(0.3, sampleRateForSource / 2 - NYQUIST_SAFETY_MARGIN_HZ)` (margen de seguridad de `0.1` Hz para no dejar el knob exactamente en el límite inválido). Para `synthetic_breathing_1hz` se usa `SYNTHETIC_SAMPLE_RATE = 30.0`, literal fijo en el propio generador del backend (no medido, no supuesto). Para assets reales, `sampleRateForSource` ya no se asume (se había considerado hardcodear `30.0` para `real_speaker_vibration` a partir de la prosa del ROADMAP, sin verificación independiente -- descartado) -- se deriva del campo real `sample_rate` devuelto por el mismo fetch liviano de 8.13, y se re-sincroniza con cada resultado real del WebSocket (`handleResult` también llama `setSampleRateForSource(result.sample_rate)`). Al cambiar de asset, los valores actuales de `fLow`/`fHigh` se recortan (clamp) al nuevo `safeMax` si lo excedían.
- [x] **8.12 — Perillas menos sensibles (`RotaryKnob.tsx`), intento inicial -- SUPERADO por 8.17:** bug real reportado por Daniel ("paso de 1 a 50 en un movimiento muy corto"). Primer intento: subir el multiplicador del alto del `Control` (`dragHeight`) de `diameter * 2` a `diameter * 4`, para diluir el movimiento del mouse en más píxeles. **Este enfoque quedó descartado por completo** -- ver 8.17: Daniel encontró un bug real con evidencia de capturas de pantalla del inspector del navegador (la caja de arrastre invisible, más alta que la perilla, se montaba encima de controles vecinos como el switch de `Source`, impidiendo cambiar de asset) y pidió explícitamente no volver a resolver la sensibilidad agrandando contenedores.
- [x] **8.13 — Cargar el original al cambiar Source, para TODOS los sources (no solo SYN):** corrige/expande 8.1 y la decisión previa de esta misma ronda ("Opción A, solo para SYN") -- Daniel pidió explícitamente que el original se cargue de inmediato al cambiar el switch de Source, para cualquier asset, no solo al presionar Execute. Para los sources sintéticos se mantiene el patrón de 8.1 anterior (imagen estática empaquetada, sin llamada al backend). Para assets reales, se agregó un `useEffect` con dependencia `[source]` que hace un fetch HTTP liviano reutilizando los endpoints one-shot ya existentes (`runMotionMagnifier`, `runSpectrumCleaner`, `runPhaseCorrelator` de `lib/api/client.ts`) -- NO abre WebSocket ni activa `isSimulating`. Módulo 1 usa parámetros fijos seguros (`alpha:1, f_low:0.1, f_high:1.0`) en vez de los valores actuales de las perillas, porque esos valores podrían violar el límite de Nyquist del asset nuevo (aún no conocido) y provocar un error 422 espurio. Módulo 2 requiere al menos un notch activo (`notches.filter(n => n.enabled)`) -- si no hay ninguno, se muestra un mensaje (`"Activa al menos un notch para cargar el original."`) sin hacer fetch. Guardado contra condiciones de carrera: un contador `originalFetchIdRef` incrementado en cada corrida del efecto, verificado dentro del `.then()` antes de aplicar el resultado, para descartar respuestas fuera de orden si el usuario cambia de Source rápidamente.
- [x] **8.14 — Signal Monitor con vida real (`Oscilloscope.tsx`):** bug real reportado por Daniel ("solo muestra onda coseno, ni se mueve ni nada"). Antes, `buildLiveWavePath` se llamaba una sola vez por cambio de parámetro (`useMemo`), dibujando una traza fija. Se agregó un parámetro `timeOffsetMs` a la fórmula (misma fórmula real, `freqHz`/`alpha` reales, sin inventar nada nuevo) y un `useEffect` que, mientras `active`, corre un `gsap.ticker` que en cada frame calcula `elapsedMs = performance.now() - startTime` y escribe el nuevo `d` del `<path>` directo por `ref` (sin pasar por el estado de React, para no re-renderizar 60 veces por segundo). Se usa `performance.now()` en vez de asumir la unidad exacta del parámetro de callback de `gsap.ticker`, que no se pudo verificar con certeza contra la documentación oficial.
- [x] **8.15 — ORIGINAL y LIVE visibles simultáneamente (corrección de un vacío de diseño desde el inicio de la Fase 8, no una funcionalidad nueva):** Daniel señaló que su pedido original para esta fase ya incluía ver el original y el resultado cambiando en tiempo real, lado a lado -- revisando el código, ese comportamiento nunca se implementó: los 3 módulos usaban una única expresión combinada (`crtSrc`/`peakSrc`) que caía al original solo cuando no había resultado en vivo, mostrando uno u otro pero nunca ambos a la vez. Corregido en los 3 módulos: el `CrtMonitor` único se reemplazó por dos instancias lado a lado (`flex`, cada una `flex-1`) -- panel ORIGINAL (`originalFrameSrc`/`originalImageSrc` de 8.1/8.13, con su propio `loading`/`errorMessage`, `statusLabel="ORIGINAL"`) y panel LIVE (`liveSrc`/`livePeakSrc`, derivado solo de `isSimulating`/`liveResult`, sin fallback al original -- si no hay simulación activa, el panel LIVE queda vacío en vez de duplicar el original).

**Extensión 8.16-8.17 (segunda ronda, tras probar 8.11-8.15 en el navegador real):** Daniel encontró dos problemas más en la prueba real -- documentados aquí, misma Fase 8.

- [x] **8.16 — Signal Monitor sin trazo por defecto (`Oscilloscope.tsx`):** pedido explícito de Daniel ("el signal monitor que aparezca vacío al inicio, ya puedes quitar ese dibujo por defecto"). Se eliminó por completo `IDLE_WAVE_PATH` (un trazo decorativo fijo, no una señal real, que se mostraba mientras `active` era `false`). Ahora `wavePath` es una cadena vacía cuando no hay simulación activa -- el `<path>` sigue montado en el DOM (el `ref` lo sigue necesitando el `useEffect` de 8.14 para cuando arranque la simulación), pero no dibuja nada hasta que `active` es `true`. La animación de entrada (`useGSAP`/`stroke-dashoffset`) se saltea cuando `wavePath` está vacío, para no llamar `getTotalLength()` sobre un trazo sin longitud real.
- [x] **8.17 — Bug real de perillas tapando el switch de Source (`RotaryKnob.tsx`), corrección definitiva de 8.12:** Daniel reportó, con capturas de pantalla del inspector del navegador que muestran el elemento exacto (`div.absolute...`, `70 × 280` para una perilla `md`, `120 × 480` para la `lg`), que la caja de arrastre agrandada por 8.12 se montaba encima de `Source` y de otros controles vecinos, dejándolos inutilizables mientras la simulación estaba en Stop. Daniel pidió explícitamente no volver a tocar tamaños de contenedores para resolver esto -- la interacción de arrastre en sí debía sentirse "pesada"/rígida, no la caja debía ser más grande.
  - Verificado contra la documentación oficial de Base UI (`base-ui.com/react/components/slider`) y contra los tipos reales del paquete instalado (`@base-ui/react@^1.8.0`, `node_modules/@base-ui/react/slider/thumb/SliderThumb.d.ts`) antes de implementar, para no inventar una API que no existe: `Slider.Control` no expone ninguna forma de escalar su propio mapeo posición→valor, y `Slider.Thumb` tiene que vivir dentro de `Control` (no se puede separar teclado y arrastre).
  - Se reemplazó el arrastre nativo de `Slider.Control` por un manejador de puntero propio: una capa transparente nueva, del mismo tamaño EXACTO que la perilla (`diameter x diameter`, nunca más grande), colocada encima de `Control` en el DOM -- intercepta el `pointerdown` antes de que llegue a `Control`, así el arrastre nativo de Base UI nunca se dispara. `handlePointerMove` calcula el nuevo valor a partir del delta vertical del mouse (`startY - clientY`) dividido entre una constante ajustable, `DRAG_PIXELS_FOR_FULL_RANGE = 900` (valor de ajuste de UX inicial, no una cifra "correcta" verificable -- pendiente de afinar con la prueba real de Daniel), multiplicado por el rango (`max - min`) y redondeado al `step`. `Slider.Thumb` se mantiene intacto solo para teclado/foco/ARIA -- como no reenvía un ref al contenedor visual (confirmado en `SliderThumb.d.ts`), el foco al hacer clic se da manualmente vía `inputRef` (prop real del paquete instalado) al `<input type="range">` interno.
  - `dragHeight` se elimina por completo -- el `Control` de Base UI vuelve a medir `diameter x diameter`, igual que antes de 8.12, así que ya no puede desbordarse sobre ningún control vecino sin importar cuánta "sensibilidad" se ajuste.
  - Verificado con `tsc` en un sandbox aislado con `@base-ui/react@^1.8.0` instalado de verdad (no solo simulado) -- sin errores en `RotaryKnob.tsx`, `Oscilloscope.tsx`, ni en los 3 `Modulo*.tsx` que los usan.

**Extensión 8.18-8.19 (tercera ronda -- Daniel revierte el split visualmente y pide reproducción sincronizada real, solo Módulo 1):** tras probar 8.11-8.17, Daniel decidió que el split ORIGINAL/LIVE de 8.15 "no le gustó" y pidió volver a un solo CRT con una miniatura, además de que el original deje de ser una imagen fija.

- [x] **8.18 — Un solo CRT + miniatura (reemplaza el split de 8.15 en los 3 módulos... solo Módulo 1 en esta ronda, ver 8.19 para el resto):** `CrtMonitor.tsx` gana dos props opcionales nuevas, `thumbnailSrc`/`thumbnailLabel` -- cuando vienen, dibuja una miniatura con su propio borde/label en la esquina inferior derecha de la PANTALLA del CRT (no de todo el navegador), sin afectar el comportamiento existente si no se pasan. `Modulo1.tsx` vuelve a un solo `<CrtMonitor>`: antes de Execute y tras Stop muestra el original (reproduciéndose, ver 8.19); mientras `isSimulating` es `true`, el CRT principal muestra el procesado y el original se reduce a la miniatura. Confirmado explícitamente por Daniel: la esquina es la de la pantalla del CRT (estética de rack), no la del navegador completo.
- [x] **8.19 — El original se reproduce de verdad, sincronizado frame a frame con el procesado (Módulo 1):** Daniel: "no quiero algo estático... no tiene gracia de mirar el anterior si no se reproduce" + "deben estar sincronizados tanto el original como el procesado". Se leyó `backend/api/assets.py` antes de proponer nada: `load_motion_frames` ya devuelve la secuencia COMPLETA de frames originales (no solo uno), tanto para los assets reales como para `synthetic_breathing_1hz` (que también es una secuencia generada, ~120 frames, no una imagen única) -- antes se descartaba casi toda esa secuencia.
  - **Backend** (`api/models.py`, `api/motion_magnifier.py`, `api/live.py`): `MotionMagnifierResponse.original_frame_png_base64: str` (un solo frame, PNG) pasa a `original_frames_jpeg_base64: list[str]` (secuencia completa, JPEG -- mismo criterio que ya usaba el WS para no inflar el payload). El WS (`/ws/motion-magnifier`) agrega el mismo campo al mensaje de resultado, con la MISMA cantidad de elementos que `frames_jpeg_base64` (el procesado) porque ambas secuencias salen del mismo `frames` en el mismo orden -- sincronización garantizada por construcción, no por coincidencia de dos timers. Optimización real necesaria (detectada antes de escribir el código, no después): la codificación JPEG del original se cachea UNA sola vez por asset dentro del propio caché de frames del WS, no se recalcula en cada movimiento de perilla (evita recodificar cientos de frames cada 150ms de debounce, que le restaría fluidez a la simulación en vivo).
  - **Frontend:** nuevo hook `useSyncedFramePlayer` (agregado a `lib/useFramePlayer.ts`, NO se modificó `useFramePlayer` para no romper `sections/Section1.tsx`, archivo ya muerto pero que Daniel aún no ha borrado) -- reproduce dos secuencias con un único índice y un único `setInterval` compartidos, así que quedan sincronizadas por diseño; `framesB` es opcional, así que el mismo hook sirve para el caso "solo original" (antes de Execute) sin necesitar una instancia separada. `Modulo1.tsx`: el `useEffect` de cambio de Source (8.13) ya no trata a SYN como caso especial -- pide la secuencia completa al backend para los 3 sources por igual (decisión confirmada explícitamente por Daniel: SYN deja de ser gratis/sin red, ahora comparte el mismo rate limit de 5/minuto que Execute, a cambio de poder reproducirse). Nuevo estado `liveOriginalFrames` (llega en cada resultado del WS, junto a `liveFrames`) tiene prioridad sobre `originalFrames` (el de la consulta liviana) cuando hay uno -- ambos se limpian juntos en Stop y en cierre inesperado, para no arrastrar el original de un asset anterior si el usuario cambia de Source estando en Stop.
- [x] **8.20 — SYN no ocupaba toda la pantalla como los assets reales (`assets.py`):** bug real reportado por Daniel tras probar 8.18/8.19. Se midió con OpenCV, sobre los archivos de video reales (no se asumió el aspecto): `real_eye_pulse` (640x360) y `real_speaker_vibration` (1920x1080) son ambos 16:9 nativos, y tras el resize del backend (`_resize_keep_aspect(..., 128)`) quedan exactamente en **128x72** los dos. `synthetic_breathing_1hz` generaba un cuadrado **64x64** -- como `CrtMonitor` usa `object-contain` (a propósito, para no deformar nada), un frame cuadrado dentro de la misma pantalla donde los reales llenan todo el ancho se veía con barras laterales (letterbox), no "ocupando toda la pantalla". Corregido: el generador sintético (`load_motion_frames`, rama `SYNTHETIC_BREATHING_1HZ`) pasa de un `size` cuadrado compartido a `width=128, height=72` -- el mismo 16:9 EXACTO medido en los dos reales, no una aproximación. Verificado ejecutando `load_motion_frames` real tras el cambio: 120 frames, `shape=(72,128)`, ratio `1.7778`, `sample_rate=30.0` sin alterar. Ningún test ni otro archivo dependía del cuadrado 64x64 (verificado con `grep` antes de aplicar el cambio).
  - **Regresión real introducida por el propio 8.20, corregida en el mismo día:** al pasar de 64x64 a 128x72 manteniendo "2 ciclos por dimensión" en la fórmula del patrón (`sin(2π·2·x/width) · cos(2π·2·y/height)`), el período quedó distinto en cada eje (64px en x, 36px en y) -- un patrón NO isotrópico, reportado por Daniel como "se ve estirado". Corregido fijando un período en PÍXELES igual en ambos ejes (`pattern_period_px = 16`, más chico que el período anterior de 32-64px) en vez de una cantidad de ciclos por dimensión -- cada celda del patrón queda cuadrada sin importar que `width != height`, y de paso el patrón se ve más chico/repetitivo, también pedido explícito de Daniel. Verificado con `load_motion_frames` real tras el cambio: mismas 120 frames, `shape=(72,128)`, `sample_rate=30.0`.
  - **Nota de proceso:** en ambos commits de este ítem (el fix de aspecto y el fix del patrón estirado), el primer intento de `device_commit_files` reportó éxito pero el archivo en la máquina de Daniel no reflejó el cambio real (verificado NO solo por tamaño en bytes, sino comparando el contenido/hash) -- se reintentó cada vez con mtime fresco y se verificó contenido real (no solo bytes) antes de dar el commit por bueno. Causa raíz no identificada todavía; documentado aquí para que quede registro si se repite.

**Criterio de salida (actualizado tras 8.11-8.19):** los 3 módulos muestran el asset original al cambiar de Source, sin esperar a Execute; en Módulo 1 el original se reproduce en loop (no es una imagen fija) y, durante Execute, el original (miniatura) y el procesado (CRT principal) avanzan sincronizados frame a frame; Execute inicia una simulación en vivo que refleja cambios de parámetro (incluyendo un Signal Monitor animado en tiempo real, vacío hasta entonces) sin recargar la página; los topes de las perillas de Bandpass respetan el límite real de Nyquist de cada asset; las perillas se pueden arrastrar con control fino sin que su caja de arrastre invada ningún control vecino; Stop siempre devuelve al estado inicial (solo el original, reproduciéndose); ninguna tarjeta del panel muestra un valor que el backend no calcule realmente.

**Pendiente real, no aplicado en esta ronda:** Módulo 2 y Módulo 3 siguen con el split ORIGINAL/LIVE de 8.15 (dos `CrtMonitor` lado a lado) -- Daniel pidió el cambio de layout y reproducción explícitamente "para el Módulo 1", sin extenderlo todavía a los otros dos. Además, ninguno de los dos trabaja con video (Módulo 2 es una imagen con ruido, Módulo 3 es un par de imágenes fijas), así que "reproducirse" no aplica de la misma forma -- si Daniel pide extender el layout de miniatura a esos módulos, sería solo el cambio de 8.18 (un CRT + miniatura), sin el mecanismo de reproducción sincronizada de 8.19, que no tiene sentido ahí.

**Extensión 8.21 (cuarta ronda -- navbar: blur, cierre al hacer click afuera, y botón de contacto por módulo; primeras 3 de 5 piezas pedidas por Daniel sobre navbar/idioma/contacto, ver Decisiones abiertas para el resto):**

- [x] **8.21a — Blur/transparencia en el panel del `NavDrawer` (`NavDrawer.tsx`):** pedido explícito de Daniel ("el navbar tenga un efecto como transparente con difusor"). Cambio de una sola clase: `bg-hud-bg` → `bg-hud-bg/70` + `backdrop-blur-md` en el `<div>` del panel. Verificado antes de aplicar que `--color-hud-bg` es un valor hex plano en `index.css` (no una función CSS que rompiera el modificador `/opacity` de Tailwind v4).
- [x] **8.21b — Cerrar el `NavDrawer` al hacer click/tap afuera (`NavDrawer.tsx`):** pedido explícito de Daniel. Nuevo `useEffect` que, solo mientras `open` es `true`, escucha `pointerdown` en `document` y llama a `toggle()` si el click no cayó dentro del panel (`panelRef`) ni del propio botón toggle (`buttonRef`, ref nuevo agregado al botón para excluirlo y no cerrar-y-reabrir en el mismo click).
- [x] **8.21c — Botón "user" + popup de contacto en cada módulo (`ContactPopover.tsx`, nuevo; `RackChassis.tsx`):** pedido explícito de Daniel, con alcance confirmado vía `AskUserQuestion` -- el botón va junto al título de cada módulo (barra superior de `RackChassis`, compartida por los 3 módulos), no en el navbar ni en la landing (la landing, todavía sin construir, mostrará el contacto de forma distinta -- fija, sin popup -- ver Decisiones abiertas). Nuevo componente `ContactPopover.tsx`: botón circular con ícono `User` de `lucide-react` que abre un popup pequeño con nombre real y link de LinkedIn real (datos provistos por Daniel, no inventados: **Daniel Colmenares Bolivar**, `https://www.linkedin.com/in/ing-mul-daniel`), con el mismo patrón de cierre-al-click-afuera que 8.21b (listener propio de `pointerdown`, sin depender de `NavDrawer`). Insertado en `RackChassis.tsx` una sola vez -- se propaga a Módulo 1/2/3 automáticamente por ser un componente compartido, sin tocar `Modulo1/2/3.tsx`.

**Verificación de este commit (protocolo reforzado desde la nota de proceso de 8.20):** los 3 archivos (`NavDrawer.tsx`, `RackChassis.tsx`, `ContactPopover.tsx`) se re-descargaron de la máquina de Daniel después de `device_commit_files` y se compararon por MD5 contra la versión generada aquí -- coinciden exactamente (`094e8868...` / `5e091289...` / `3e7498e7...`), confirmando que el commit se aplicó de verdad y no es una repetición del bug de reversión silenciosa.

**Nota de verificación honesta pendiente:** igual que el resto del frontend, este cambio no se compiló (`tsc`/`npm run build`) ni se renderizó visualmente en este entorno -- Daniel debe confirmar en su navegador que el blur se ve como espera, que el click afuera cierra el panel sin interferir con el click normal de selección de módulo, y que el popup de contacto se posiciona bien en los 3 módulos (en pantallas angostas podría necesitar ajuste de `right-0`/ancho).

**Extensión 8.21d (ajustes de detalle sobre 8.21a/8.21c, mismo día, pedidos explícitos de Daniel tras ver el resultado):**

- [x] **8.21d — Más translucidez, título profesional, popup más grande:** (1) `NavDrawer.tsx`: `bg-hud-bg/70` → `bg-hud-bg/40` y `backdrop-blur-md` → `backdrop-blur-sm` (menos opacidad y menos desenfoque, para que se perciba mejor lo que hay detrás del panel). (2) `ContactPopover.tsx` gana un prop nuevo `title: string`, renderizado como subtítulo entre el nombre y el link de LinkedIn; `RackChassis.tsx` lo pasa con el valor real dado por Daniel: `"Multimedia Engineering | Software Development"`. (3) `ContactPopover.tsx`: popup de `w-48`/`p-3` a `w-64`/`p-4`, tamaños de texto subidos un escalón (`text-[11px]`→`text-xs`, `text-[10px]`→`text-xs` en el link).
  - **Nota de proceso -- se repitió el bug de reversión silenciosa (tercera vez documentada, ahora sobre 3 archivos a la vez):** el primer `device_commit_files` de esta ronda reportó éxito en los 3 archivos, pero al re-descargarlos el contenido seguía siendo el de 8.21a/8.21c (sin los cambios de translucidez/título/tamaño). Detectado por comparación de contenido real, no solo tamaño -- de hecho `NavDrawer.tsx` es un caso explícito de **coincidencia de tamaño en bytes** entre la versión vieja y la nueva (`/70`↔`/40` y `md`↔`sm` tienen la misma longitud de caracteres, así que el archivo viejo y el nuevo pesan exactamente 6857 bytes los dos -- un chequeo que solo mirara bytes no lo habría detectado). Corregido con el mismo procedimiento ya establecido: se restauraron las copias locales desde la copia de referencia (`outputs`), se obtuvo `mtime` fresco vía `device_list_dir`, y se reintentó el commit pasando `expectedMtimeMs` explícito por archivo. Segundo intento verificado por MD5 exacto (`29d351f3...` / `0428712d...` / `e8172417...`) más `grep` de los 3 marcadores de texto nuevos (`bg-hud-bg/40`, `Multimedia Engineering`, `w-64`) -- los tres presentes. Causa raíz del bug de fondo sigue sin identificarse.

**Extensión 8.21e (correo de contacto + popup ~20% más grande; avatar y GitHub evaluados y descartados explícitamente por Daniel):**

- [x] **8.21e — Correo real en el popup, tamaño del popup escalado ~20%:** tras preguntarle a Daniel si faltaba algo en el popup (correo, GitHub, avatar), pidió agregar solo el correo (`ing.daniel.bolivar757@gmail.com`, dato real dado por él) y descartó explícitamente avatar y GitHub. `ContactPopoverProps` gana `email: string`; nuevo link `mailto:${email}` ("Correo →") debajo del de LinkedIn, mismo estilo. Tamaño del popup escalado ~20% sobre lo que había en 8.21d: `w-64`(256px)→`w-[307px]`, `p-4`(16px)→`p-[19px]`, `text-xs`(12px)→`text-[14px]` (nombre y links), `text-[10px]`→`text-[12px]` (subtítulo del título profesional).
  - **Nota de proceso -- el bug de reversión silenciosa se repitió DOS veces más en esta misma ronda** (una sobre `ContactPopover.tsx`/`RackChassis.tsx` juntos, otra sobre `ROADMAP.md` al documentar 8.21d): mismo patrón que antes -- `device_commit_files` reporta `written`/`rejected: []`, pero el contenido re-descargado no cambia. En el caso del `ROADMAP.md`, un primer reintento incluso actualizó el `mtime` del archivo en el dispositivo sin cambiar su contenido/tamaño -- indicio de que el problema no es solo "no escribió nada", sino que en algún punto de la cadena se escribe con datos obsoletos aunque el archivo sí se toque. Cada caso se resolvió igual: restaurar la copia local desde `outputs`, pedir `mtime` fresco, reintentar con `expectedMtimeMs`, y verificar por MD5 + `grep` de contenido nuevo antes de dar el commit por bueno -- nunca confiando en el reporte `written` por sí solo. Verificado final: `ContactPopover.tsx`/`RackChassis.tsx` con MD5 `a092a31d...`/`3e58ccc2...` coincidente entre dispositivo y referencia, y `grep` positivo de `mailto`, `w-[307px]`, `email=`.

---

## Fase 8.22 — Pieza 4: Landing en "/" + placeholder de avatar (Pieza 5, selector de idioma, queda para después)

**Objetivo:** cuarta de las 5 piezas del pedido original de navbar/idioma/contacto (ver 8.21 y Decisiones abiertas) -- una pantalla de inicio real en la ruta raíz, más un espacio reservado para la foto de perfil de Daniel (todavía en retoque, sin imagen final).

- [x] **8.22a — Placeholder de avatar (`ContactPopover.tsx`):** nuevo prop opcional `avatarUrl?: string`. Sin valor (estado actual), se muestra un círculo del mismo tamaño con el ícono `User` de fallback -- cuando Daniel entregue la imagen retocada, agregar `avatarUrl="..."` en `RackChassis.tsx` es el único cambio necesario, sin tocar layout. El popup se reorganizó: fila superior con avatar + nombre + título profesional, links de LinkedIn/correo debajo, sin cambiar el ancho/padding ya fijados en 8.21e.
- [x] **8.22b — `Landing.tsx` (nuevo) en la ruta raíz "/":** reemplaza el redirect `<Navigate to="/modulo-1" replace />` que existía en `App.tsx` desde la reestructuración a rutas reales -- confirmado explícitamente por Daniel vía `AskUserQuestion` ("Ruta raíz \"/\" (Recomendado)"). Las rutas `/modulo-1`, `/modulo-2`, `/modulo-3` no cambiaron. Contenido: título + subtítulo del proyecto, 3 tarjetas (una por módulo, cada una un `<Link>` real de `react-router-dom` a su ruta) con las MISMAS descripciones ya verificadas en README.md/ROADMAP.md ("Los 3 módulos") -- no se redactó texto nuevo sin fuente -- y un bloque de contacto fijo abajo (avatar placeholder + nombre + título + LinkedIn + correo, todo como texto/links visibles, **sin popup**, confirmado explícitamente por Daniel: "en la landing no necesito el pop up solo necesito que se muestre de una vez"). Los títulos de las tarjetas (`EVM Optical Core`, `Spectrum Cleaner Console`, `Phase Correlation Core`) se tomaron verificando el `title` real que cada `Modulo*.tsx` le pasa a `RackChassis` (`grep` antes de escribir, no se inventaron nombres nuevos).
  - **"Sin scroll" (pedido explícito de Daniel, confirmado vía `AskUserQuestion`):** `h-dvh flex flex-col` nativo sin alturas fijas en píxeles, mismo patrón que ya corrigió el bug real de la Fase 4.2c (evitar el error de presupuestar alturas a mano). El bloque de tarjetas usa `flex-1 min-h-0` para no empujar el bloque de contacto fuera de la pantalla. **Limitación honesta, no verificada:** no se renderizó en este entorno -- en una ventana muy baja (celular en horizontal, zoom de navegador alto) el contenido podría comprimirse más de lo ideal; pendiente que Daniel lo confirme visualmente, igual que el resto del frontend de esta fase.
  - `App.tsx`: `activeModule` ahora es `""` en la ruta `/` (antes forzaba `"modulo-1"` incluso estando en la raíz, por el fallback `|| "modulo-1"` que ya no aplica) -- así `NavDrawer` no resalta ningún módulo como activo mientras se está en la landing, en vez de mentir mostrando Módulo 1 como seleccionado sin estarlo.

**Verificación de este commit:** los 4 archivos (`ContactPopover.tsx`, `RackChassis.tsx`, `Landing.tsx`, `App.tsx`) se re-descargaron de la máquina de Daniel después de `device_commit_files` y coincidieron por MD5 con la versión generada aquí en el primer intento (`34c5a814...` / `070cf0f5...` / `fbfa59bd...` / `c5d4ca86...`) -- sin necesidad de reintento esta vez.

**Nota de verificación honesta pendiente:** no compilado ni renderizado en este entorno -- Daniel debe confirmar `npm run dev` en "/" (layout sin scroll, tarjetas navegan a cada módulo, contacto se ve bien) antes de dar esta pieza por cerrada.

**Pendiente real:** Pieza 5 (selector de idioma real ES/EN, todo el sitio) queda para después, a propósito -- Daniel confirmó ese orden explícitamente para no traducir el texto de la landing dos veces. Ver Decisiones abiertas para el plan técnico ya acordado.

---

## Fase 8.23 — Rediseño de la Landing (estilo real del rack) + espera de cold-start de Render

**Contexto:** Daniel reportó, tras ver 8.22 en su navegador, que la landing "está horrible, no tiene el estilo de nada", y pidió explícitamente: una "pantalla" central como la interfaz de los módulos, la tipografía de `Section2.tsx` para títulos/subtítulos, la tarjeta de contacto debajo de esa pantalla, y un botón "Comenzar" que lleve a `/modulo-1` -- pero como el backend (una vez desplegado en Render, plan free) puede estar dormido, pidió una espera visual con una barra hecha de slashes mientras el servidor arranca.

- [x] **8.23a — Rediseño visual de `Landing.tsx`:** la "pantalla" central ahora COPIA el bisel + scanlines reales de `CrtMonitor.tsx` (mismas clases exactas -- `bg-hud-card`/`bg-rack-bg-deep`/degradado de scanlines/sombra interior -- no un estilo inventado), agrandada, con el título/subtítulo usando la MISMA tipografía que el STEP 01 de `sections/modulo-1/Section2.tsx` (`font-display text-3xl sm:text-5xl font-black uppercase tracking-tight` para el título, y la clase del label de abajo para el subtítulo -- verificado por `grep` antes de escribir, no copiado de memoria). Las 3 tarjetas de módulo pasaron a vivir DENTRO de la pantalla (antes estaban afuera, en 8.22) y dejaron de ser `<Link>` navegables -- con "Comenzar" como única entrada (y la única que maneja el cold-start), tener un segundo camino de navegación sin esa espera era inconsistente; no se pierde alcance real porque `NavDrawer` (global) sigue permitiendo ir a Módulo 2/3 directo. La tarjeta de contacto se mantiene debajo de la pantalla, sin cambios de contenido.
- [x] **8.23b — Espera real de cold-start antes de "Comenzar":** verificado contra la documentación oficial de Render (`render.com/docs/free`, no asumido) que un servicio free se suspende tras 15 min sin tráfico y tarda "about one minute" en reactivarse -- ese es el promedio típico de Render, no una medición real de este backend específico (todavía sin desplegar, Fase 6 sigue pendiente), que además carga NumPy/OpenCV y podría tardar más. Nuevo `checkHealth()` en `lib/api/client.ts`: una única petición real a `/health` (endpoint verificado en `backend/main.py`, devuelve `{"status": "ok"}`) con un timeout de 5 minutos (tope duro pedido por Daniel, "y ojalá que pueda ser menos"). Mientras esa petición está pendiente, un `setInterval` real de 5s enciende un slash más en la barra (`/ / / / / / / / / / / /`, 12 en total) -- **a propósito NO es un porcentaje de progreso inventado** (nadie puede saber cuánto falta realmente; mostrar un "73%" sería un dato falso, misma regla que ya rige `VfdMetricCard`), es un indicador de tiempo real transcurrido esperando una respuesta real. Si se llega al final de la barra sin respuesta, sigue pulsando (no se queda "llena" mintiendo que terminó). Letrero visible durante la espera, pedido explícito de Daniel: "Puede tardar hasta ~2 minutos si el servidor estaba inactivo." Si `checkHealth()` falla o se agotan los 5 minutos: mensaje de error real (el mensaje que devuelve `checkHealth()`, no uno genérico) + botón "Reintentar" que vuelve a intentar el mismo flujo. Si responde 200 antes de eso: la barra se completa y navega a `/modulo-1`.

**Verificación de este commit:** los 2 archivos (`client.ts`, `Landing.tsx`) se re-descargaron de la máquina de Daniel después de `device_commit_files` y coincidieron por MD5 con la versión generada aquí en el primer intento (`ccfc5250...` / `f375eefc...`).

**Nota de verificación honesta pendiente:** no compilado ni renderizado en este entorno -- Daniel debe confirmar en su navegador que el nuevo diseño de la pantalla se ve bien, y que el flujo de "Comenzar" funciona (en local, contra `localhost:8000`, `/health` responde casi instantáneo, así que la barra debería completarse casi de inmediato -- el caso de espera larga solo se podrá probar de verdad una vez el backend esté desplegado en Render, Fase 6).

---

## Fase 8.24 — Acabado de TV antigua, carrusel 3D de módulos, botón fuera de la pantalla, pantalla +30%

**Contexto:** Daniel vio 8.23 y pidió, en un solo mensaje estructurado: (1) acabado más realista de TV antigua/retro, (2) que las 3 tarjetas de módulo tengan una animación de carrusel en 3D con sensación de profundidad real (no un slide plano), (3) que el botón "Comenzar" viva FUERA de la pantalla, (4) que la barra de carga aparezca justo debajo del botón al presionarlo, con la tarjeta de contacto debajo de la barra, y (5) que la pantalla sea 30% más grande. Antes de tocar código se resolvieron 2 decisiones de diseño genuinamente abiertas vía `AskUserQuestion`: nivel de realismo del acabado TV (sutil vs. muy skeuomórfico) y modo del carrusel (automático vs. manual) -- Daniel eligió ambas opciones recomendadas.

- [x] **8.24a — Acabado de TV antigua (sutil, confirmado vía `AskUserQuestion`):** nuevo bisel EXTERIOR envolviendo el bisel real de `CrtMonitor.tsx` (que se mantiene adentro sin cambios) -- degradado gris oscuro a negro tipo plástico (`bg-gradient-to-b from-neutral-700 to-black`), esquinas más redondeadas (`rounded-[28px]`), sombra exterior más pronunciada. Dentro de la pantalla, una viñeta nueva (`box-shadow: inset` radial oscuro en los bordes) simula la curvatura de un tubo CRT. Se descartó explícitamente el acabado muy skeuomórfico (LED de encendido, textura de madera/plástico, placa grabada) -- decisión de Daniel, no mía.
- [x] **8.24b — Carrusel 3D de las 3 tarjetas de módulo (automático, confirmado vía `AskUserQuestion`):** nuevo componente `ModuleCarousel` (dentro de `Landing.tsx`, no se extrajo a archivo propio -- se usa en un solo lugar). Las 3 tarjetas viven superpuestas (`absolute inset-0`) dentro de un contenedor con `perspective` real de CSS; cada una tiene un "slot" de profundidad (0 = de frente, 1 y 2 = cada vez más atrás) definido en `DEPTH_SLOTS` (`z`/`scale`/`opacity`/`y`), y GSAP anima esos 4 valores cada vez que `activeIndex` cambia (cada `CAROUSEL_INTERVAL_MS` = 4s, vía `setInterval`) -- es profundidad 3D genuina (el navegador interpreta `translateZ` bajo `perspective`), no un efecto 2D simulado con solo desplazamiento horizontal. Sin interacción del usuario, como se confirmó.
- [x] **8.24c — Botón "Comenzar" fuera de la pantalla, barra de carga debajo, contacto al final:** el `<Button>` se movió FUERA del bisel (antes vivía dentro, en 8.23) -- ahora es un hermano directo de la pantalla en la columna. La barra de slashes/mensaje de espera (o el estado de error + Reintentar) se renderiza condicionalmente justo debajo del botón, solo mientras `wakeState` es `"waking"`/`"error"` -- mismo mecanismo de 8.23b, sin cambios de lógica, solo de posición en el layout. La tarjeta de contacto sigue siendo el último elemento de la columna, así que queda debajo de lo que esté visible arriba en cada momento (solo el botón, o el botón + la barra). El botón ahora también cambia su propio texto a "Despertando…" y se deshabilita mientras `wakeState==="waking"` (mismo patrón ya usado en el Execute de los módulos -- `"Simulando…"` -- para mantener consistencia visual en vez de inventar un patrón nuevo).
- [x] **8.24d — Pantalla 30% más grande:** el contenedor de la pantalla pasó de `max-w-4xl` (56rem) a `max-w-[72.8rem]` (56×1.3rem exacto), con el padding interno (`p-8 sm:p-12` → `p-10 sm:p-16`) y la tipografía del título/subtítulo (`text-3xl sm:text-5xl` → `text-4xl sm:text-6xl`; `text-sm sm:text-base` → `text-base sm:text-lg`) escalados en proporción similar, para que el agrandado no deje el contenido interno viéndose desproporcionadamente chico.

**Verificación de este commit:** `Landing.tsx` se re-descargó de la máquina de Daniel después de `device_commit_files` y coincidió por MD5 con la versión generada aquí en el segundo intento (el primero sufrió el mismo bug de reversión silenciosa ya documentado varias veces en este archivo -- resuelto con el procedimiento de siempre: restaurar desde `outputs`, `mtime` fresco, reintentar, verificar por MD5 + `grep` de `ModuleCarousel`/`max-w-[72.8rem]`/`DEPTH_SLOTS`).

**Nota de verificación honesta pendiente:** no compilado ni renderizado en este entorno. El carrusel 3D en particular es la pieza más nueva/riesgosa de esta ronda -- Daniel debe confirmar en su navegador que efectivamente se percibe profundidad real (no un slide plano) y que la animación se ve fluida, no entrecortada.

---

## Fase 8.25 — Carrusel "coverflow" (corrige el defecto real del cilindro 360°), botón único sin duplicar, tarjetas con tipografía de Section2

**Contexto:** Daniel vio 8.24 y pidió 3 ajustes: (1) que "Reintentar" no sea un segundo botón debajo de "Comenzar" sino el MISMO botón cambiando de contenido; (2) mejorar el contenido/tamaño/tipografía de las tarjetas de módulo con lo ya indicado antes (la fuente de `Section2.tsx`); (3) una descripción detallada de cómo debía comportarse el carrusel -- trayectoria en "cilindro" 3D con `rotateY()`+`translateZ()`, tarjeta central a tamaño completo, laterales encogiéndose/hundiéndose al fondo, creciendo de vuelta al volver al centro -- citando también Swiper `coverflow` y "GSAP 3D Cylinder Rotator" como referencias técnicas válidas.

- [x] **8.25a — Corrección técnica real, explicada a Daniel antes de programar:** un carrusel cilíndrico de 360° verdadero (`rotateY()` completo sobre cada tarjeta) muestra el REVERSO de la tarjeta pasados los 90° de giro -- sin una cara trasera diseñada, el texto se vería espejado/ilegible en las posiciones laterales. Es una limitación real de CSS 3D (composición de `transform`+`backface-visibility`), no una suposición. Se implementó la variante técnica equivalente sin ese defecto -- "coverflow" (una de las alternativas que el propio Daniel mencionó): 3 posiciones fijas (`CAROUSEL_SLOTS`, centro + atrás-izquierda + atrás-derecha), cada una con su propio `x`/`z`/`rotationY`/`scale`/`opacity`/`zIndex`, animadas TODAS juntas por GSAP cada `CAROUSEL_INTERVAL_MS` (4s) -- el ángulo de giro se acota a 30°, nunca llega a mostrar el reverso, pero conserva el mecanismo real pedido (`rotateY`+`translateZ`+`perspective` de CSS, profundidad 3D genuina, no simulada).
- [x] **8.25b — Botón único, sin duplicar:** el `<Button>` de "Comenzar" ya NO se acompaña de un segundo botón "Reintentar" separado -- es el mismo elemento, que cambia su texto (`"Comenzar"` -> `"Despertando…"` -> `"Reintentar"`) y su clase (`executeButtonClass` -> `retryButtonClass` en estado de error) según `wakeState`, con el mismo `onClick={handleComenzar}` en los 3 estados. El bloque de error debajo del botón se redujo a solo el mensaje de texto (`errorMessage`), sin botón propio -- el botón que ya está arriba ES el reintento.
- [x] **8.25c — Tarjetas de módulo mejoradas:** más grandes (`h-64 sm:h-72`, antes `h-40 sm:h-48`), con una píldora nueva `MOD 0X` que reutiliza EXACTAMENTE las clases del badge `STEP 0X` de `Section2.tsx` (`bg-hud-inner border border-hud-border ... rounded-sm`, verificado por grep antes de escribir), el nombre del módulo reutilizando las clases del label que va debajo de esa píldora en el mismo archivo, y la descripción en un tamaño más legible (`text-xs sm:text-sm`, antes `text-[11px]`).

**Verificación de este commit:** `Landing.tsx` se re-descargó de la máquina de Daniel después de `device_commit_files` y coincidió por MD5 con la versión generada aquí en el segundo intento (el primero volvió a sufrir el bug de reversión silenciosa ya documentado varias veces -- mismo procedimiento de siempre para resolverlo).

**Nota de verificación honesta pendiente:** no compilado ni renderizado en este entorno -- el ajuste de ángulo acotado (30°) en particular es una decisión de diseño sin verificación visual real; si en el navegador de Daniel el efecto de profundidad se siente débil o exagerado, es cuestión de ajustar los valores de `CAROUSEL_SLOTS` (`x`/`z`/`rotationY`) con su feedback real, no de adivinar de nuevo.

---

## Fase 8.26 — Corrige el solapamiento de 8.25 (tarjetas de módulo) + pantalla limitada al 70% del alto

**Contexto:** Daniel vio 8.25 y reportó dos problemas puntuales: (1) en 8.25c se agrandó el CONTENEDOR de las tarjetas de módulo (`h-64 sm:h-72`) cuando el pedido real era solo agrandar la FUENTE -- el contenedor de más, sumado al padding interior de la pantalla ya aumentado en 8.24d (`p-10 sm:p-16`) y al `gap-6` entre el título y el carrusel, hizo que el contenido total excediera el espacio disponible y se viera superpuesto; (2) pidió explícitamente que la "pantalla" (bisel completo) ocupe ~70% del alto de la ventana, dejando márgenes arriba/abajo para el botón, la barra de carga y la tarjeta de contacto.

- [x] **8.26a — Revertir el contenedor del carrusel, conservando la tipografía de 8.25c:** `ModuleCarousel` vuelve de `h-64 sm:h-72` a `h-40 sm:h-48` (su tamaño antes de 8.24) -- los tamaños de fuente de 8.25c (`MOD 0X` en `text-xs sm:text-sm`, label en `text-sm sm:text-base`, descripción en `text-xs sm:text-sm`) NO se tocan, porque el pedido de Daniel fue agrandar solo la fuente, no el contenedor. El padding de cada tarjeta baja de `p-6`/`gap-2.5` a `p-4`/`gap-1.5` para que el texto más grande siga cabiendo sin desbordar la tarjeta.
- [x] **8.26b — Reclamar espacio vertical dentro de la pantalla:** el padding interior de la pantalla (bumped en 8.24d a `p-10 sm:p-16`) baja a `p-6 sm:p-10`, y el `gap-6` entre el bloque de título/subtítulo y el carrusel baja a `gap-4` -- ningún cambio de tipografía del título (Daniel no lo mencionó como problema).
- [x] **8.26c — Pantalla al 70% del alto:** el bisel exterior (el `div` que envuelve toda la "pantalla" TV-antigua) recibe `max-h-[70dvh] overflow-hidden` -- ya vive dentro de un contenedor `flex-1 items-center justify-center`, así que el espacio restante (~30%) queda como margen real arriba/abajo, repartido automáticamente por flexbox, sin presupuestar alturas en píxeles a mano (mismo principio ya establecido desde la Fase 4.2c).

**Verificación de este commit:** `Landing.tsx` se re-descargó de la máquina de Daniel después de `device_commit_files` y coincidió por MD5 con la versión generada aquí en el PRIMER intento (`5971f1d9...`) -- sin necesidad de reintento esta vez.

**Nota de verificación honesta pendiente:** no compilado ni renderizado en este entorno. El `max-h-[70dvh] overflow-hidden` es una protección de seguridad, no una garantía de que el contenido interno (título + carrusel) se vea cómodo dentro de ese 70% en todos los tamaños de pantalla -- si en el navegador de Daniel el título o el carrusel aparecen recortados por el `overflow-hidden` en una ventana muy baja, es necesario reducir más la tipografía del título o el padding, con su feedback real, no adivinando de nuevo.

---

## Fase 8.27 — Avatar real, carrusel más lento, botón Home en el navbar

**Contexto:** Daniel confirmó en su navegador que el Landing (Fases 8.22-8.26) quedó bien, con un solo ajuste: la animación del carrusel pasa muy rápido. Además entregó la imagen final de su avatar y pidió un botón "Home" en el navbar (que hasta ahora solo tenía los 3 módulos, sin forma de volver a la landing).

- [x] **8.27a — Avatar real:** Daniel proveyó la ruta real del archivo ya guardado en el proyecto (`frontend/src/assets/ChatGPT Image 14 sept 2026, 06_54_08 p.m.png`, confirmada por `device_list_dir` antes de usarla, no asumida). Se importa como asset de Vite (mismo patrón ya usado para `syntheticPreview` en Módulo 2/3) en `RackChassis.tsx` (pasado como `avatarUrl` a `ContactPopover`) y en `Landing.tsx` (bloque de contacto) -- ambos ya tenían el placeholder del ícono `User` preparado desde la Fase 8.22 para este cambio de una sola línea, sin tocar layout. El import de `User` en `Landing.tsx` se eliminó por quedar sin uso.
- [x] **8.27b — Carrusel más lento:** pedido explícito de Daniel ("la animación pasa muy rápido"). `CAROUSEL_INTERVAL_MS` sube de 4s a 7s (tiempo entre rotaciones) y la duración de la transición de GSAP sube de 1.1s a 1.8s (nueva constante `CAROUSEL_TRANSITION_S`) -- mismo mecanismo "coverflow" de la Fase 8.25, solo más pausado.
- [x] **8.27c — Botón "Home" en el navbar:** `NavDrawer.tsx` (antes solo listaba los 3 módulos, verificado leyendo el archivo real -- no supuesto) recibe una nueva prop `onHome: () => void` y un botón nuevo arriba de la lista de módulos, mismo patrón visual (icono `Home` de `lucide-react` + label), que se marca activo cuando `active === ""` -- la misma señal que `App.tsx` ya usa para saber que la ruta actual es "/". `App.tsx` pasa `onHome={() => navigate("/")}`.

**Verificación de este commit:** los 4 archivos (`RackChassis.tsx`, `Landing.tsx`, `NavDrawer.tsx`, `App.tsx`) se re-descargaron de la máquina de Daniel después de `device_commit_files` y coincidieron por MD5 con la versión generada aquí en el PRIMER intento (`6b52f2f1...` / `c3eb10e0...` / `55993d8d...` / `b45295ee...`) -- sin bug de reversión silenciosa esta vez.

**Nota de verificación honesta pendiente:** no compilado ni renderizado en este entorno -- Daniel debe confirmar que el avatar se ve bien recortado dentro del círculo (`object-cover`), que el carrusel ahora se siente cómodo (si 7s/1.8s sigue sintiéndose rápido o ahora lento, es cuestión de ajustar esos 2 números con su feedback real), y que el botón Home funciona y navega a "/".

**Pendiente real, todavía sin tocar:** el botón/selector de idioma en el navbar -- depende de la Pieza 5 (i18n real), ver la fase siguiente y la pregunta de alcance pendiente de responder.

---

## Fase 8.28 — Pieza 5: i18n real ES/EN, todo el sitio

**Contexto:** Daniel confirmó el alcance pendiente de la Fase 8.27 -- la jerga técnica de instrumento de laboratorio se queda tal cual en ambos idiomas ("mantengamos la jerga técnica como está por default"). Con esa ambigüedad resuelta, se construyó el sistema de traducción real (no un botón decorativo) y se aplicó a los 10 componentes que Daniel confirmó: `NavDrawer`, `RackChassis`, `ContactPopover`, `Landing`, `Modulo1/2/3`, `RotaryKnob`, `CrtMonitor`, `Oscilloscope`, `VfdMetricCard`, `ToggleSwitchGroup`.

- [x] **8.28a — Infraestructura de i18n (archivos nuevos):** `frontend/src/lib/i18n/translations.ts` (diccionario tipado, un objeto plano `{ clave: { es, en } }`, `TranslationKey = keyof typeof translations`) y `frontend/src/lib/i18n/LanguageProvider.tsx` (contexto de React con `language`, `setLanguage`, `toggleLanguage`, `t(key)`, persistido en `localStorage` bajo la clave `chronospectrum:language`, default `"es"`, con `try/catch` en ambos lados por si `localStorage` falla). No se instaló ninguna librería de i18n (`react-i18next`, etc.) -- el diccionario es chico y fijo, agregar una dependencia nueva hubiera sido sobre-ingeniería sin necesidad real. `main.tsx` envuelve `<App />` con `<LanguageProvider>` (dentro de `BrowserRouter`, fuera de `TooltipProvider`).
- [x] **8.28b — Regla de alcance aplicada mecánicamente:** para decidir qué traducir en cada uno de los 10 componentes, se aplicó una regla simple y verificable (evita adivinar caso por caso): todo string literal que YA estaba en español en el JSX real (verificado leyendo cada archivo, no de memoria) pasa a ser una clave del diccionario con su `t()`; todo string que YA estaba en inglés se deja como literal, sin tocar, en ambos idiomas -- esto cubre automáticamente toda la jerga técnica que Daniel pidió mantener (`Gain`, `Bandpass Low (Hz)`, `Magnification Factor (α)`, `Source`, `Cutoff Radius (d0)`, `Order (n)`, `CH-01/02/03`, `SYN/EYE/VIB`, `Signal Monitor`, `SWEEP: 50 ms/DIV`, botones `Execute *`, `Stop`, `ON/OFF`, `No Signal`). Dos casos límite se trataron igual que la jerga (sin traducir, por consistencia con su rol de etiqueta de parámetro/eje dentro del mismo componente que `Gain`): `Frecuencia` (label de `VfdMetricCard` en Módulo 1, hermana de `Gain`) y `u.a.` (unidad del eje del Osciloscopio).
- [x] **8.28c — Selector real en el navbar:** `NavDrawer.tsx` (pedido explícito de Daniel: "este tiene que ir en el navbar") -- botón nuevo con ícono `Globe`, debajo de los módulos y el botón Home, que llama a `toggleLanguage()` real y muestra el idioma AL QUE se puede cambiar (`EN` si está en español, `ES` si está en inglés). Los `aria-label` del botón toggle del panel y del botón Home también se tradujeron.
- [x] **8.28d — Traducción aplicada en los 10 componentes confirmados:**
  - `ContactPopover.tsx` / `Landing.tsx`: `aria-label="Contacto"`, `"Correo →"`.
  - `Landing.tsx`: subtítulo, las 3 descripciones de módulo (`MODULE_SUMMARIES` pasó de `description` fijo a `descriptionKey`, resuelto con `t()` dentro de `ModuleCarousel`), los 3 textos del botón (`Comenzar`/`Despertando…`/`Reintentar`), el aviso de espera de ~2 minutos.
  - `CrtMonitor.tsx`: `"Procesando…"`.
  - `VfdMetricCard.tsx`: `"Próximamente"` (badge de métrica bloqueada).
  - `Modulo1.tsx`: los 2 `alt` del CRT, el mensaje de conexión perdida, `"Simulando…"`.
  - `Modulo2.tsx`: los 2 `alt` del CRT, `"Antes"`/`"Después"`, `"Sin datos"` (x2), los 2 mensajes de error de negocio (notch), el mensaje de conexión perdida, `"Simulando…"`.
  - `Modulo3.tsx`: los 3 `alt` (CRT x2 + zoom), `"Sin datos"`, el mensaje de conexión perdida, `"Simulando…"`.
  - `RackChassis.tsx`, `RotaryKnob.tsx`, `Oscilloscope.tsx`, `ToggleSwitchGroup.tsx`: verificados leyendo cada archivo -- no tenían ningún string en español hardcodeado en el JSX (todo su texto visible ya era inglés técnico o venía de props), así que no necesitaron ningún cambio para esta pieza.

**Límite honesto, no cubierto por esta fase:** los mensajes de error que devuelve `lib/api/client.ts` (ej. el texto real de `checkHealth()` al fallar por timeout o red) NO pasan por el diccionario -- ese archivo no estaba en la lista de 10 componentes que Daniel confirmó para la Pieza 5. Mientras eso no se traduzca aparte, esos mensajes puntuales seguirán viéndose en español aunque el sitio esté en inglés -- avisar si Daniel quiere que se incluya.

**Verificación de este commit:** los 11 archivos (`translations.ts`, `LanguageProvider.tsx`, `main.tsx`, `NavDrawer.tsx`, `ContactPopover.tsx`, `CrtMonitor.tsx`, `VfdMetricCard.tsx`, `Landing.tsx`, `Modulo1.tsx`, `Modulo2.tsx`, `Modulo3.tsx`) se re-descargaron de la máquina de Daniel después de `device_commit_files` y coincidieron por MD5 con la versión generada aquí en el PRIMER intento -- sin bug de reversión silenciosa esta vez.

**Nota de verificación honesta pendiente:** no compilado ni renderizado en este entorno -- Daniel debe confirmar con `npm run dev` que: el botón de idioma en el navbar cambia de verdad el texto en pantalla (subtítulo del landing, descripciones de módulo, mensajes de estado/error), que la jerga técnica (Gain, Source, CH-01, etc.) se queda igual en ambos idiomas como pidió, y que el idioma elegido sobrevive un refresh de página (persistencia en `localStorage`). También revisar si hace falta traducir los mensajes de `client.ts` (ver límite honesto arriba).

---

## Fase 8.29 — Módulo 3: visualización log-scale del pico de correlación

**Contexto:** Daniel reportó que, al presionar Execute en Módulo 3 (cualquier Source: SYN/REAL/ART), el CRT "en vivo" y el Signal Monitor se veían prácticamente negros, con un solo punto -- sospechaba de un bug. Antes de tocar nada se verificó el código real: `core/phase_correlation.py` (`cross_power_spectrum` + `integer_peak`), `api/phase_correlator.py`, `api/live.py` y `api/encoding.py`. Conclusión confirmada, no un bug: la superficie de correlación de fase es matemáticamente un impulso casi-Dirac (energía casi nula en todos lados salvo un pico agudo en el punto del desplazamiento real) -- así se ve una correlación de fase bien calculada, para cualquier asset. La normalización lineal min-máx que ya usaba `array_to_png_base64`/`array_to_jpeg_base64` (correcta matemáticamente) hacía que ese pico se viera como un punto duro contra negro puro, sin comunicar nada del resultado. `dx`/`dy` (las tarjetas VFD) siempre fueron el dato real y correcto -- nunca estuvieron rotos.

- [x] **8.29a — `array_to_png_base64`/`array_to_jpeg_base64` (`encoding.py`):** nuevo parámetro opcional `log_scale: bool = False` que aplica `np.log1p()` antes de normalizar -- MISMO patrón ya usado y aprobado en `core/fft_filters.compute_spectrum` (el espectro Antes/Después de Módulo 2), no inventado para esta ocasión. `log1p` es monótono creciente -- no mueve la posición del pico, solo comprime su dominancia y levanta el resto lo suficiente para mostrar el halo real alrededor. Default `False`: ningún llamador existente (Módulo 1, Módulo 2, ni las imágenes `image1`/`image2`/`original` de Módulo 3) pasa este parámetro, así que su comportamiento no cambió en absoluto.
- [x] **8.29b — Aplicado solo a la visualización del pico, nunca al cálculo real:** `api/phase_correlator.py` (endpoint HTTP) y `api/live.py` (`phase_correlator_ws`) ahora pasan `log_scale=True` únicamente en la codificación de `correlation_peak_png_base64`/`correlation_peak_jpeg_base64`. El cálculo de `dy`/`dx` (`phase_correlate_subpixel`) sigue operando sobre los valores lineales reales de la correlación, sin tocar -- el número que ve Daniel en las tarjetas VFD es exactamente el mismo de antes.

**Verificación de este commit:** los 3 archivos (`encoding.py`, `phase_correlator.py`, `live.py`) se re-descargaron de la máquina de Daniel después de `device_commit_files` y coincidieron por MD5 con la versión generada aquí en el PRIMER intento (`782cd02c...` / `7973c35e...` / `c3fc176a...`).

**Nota de verificación honesta pendiente:** no ejecutado en este entorno (sin backend corriendo aquí) -- Daniel debe levantar el backend y confirmar en su navegador que el CRT/Signal Monitor de Módulo 3 ahora muestra un halo visible alrededor del pico (no solo negro + un punto), y que `dx`/`dy` siguen siendo el mismo valor de siempre para un mismo asset (para descartar cualquier efecto no previsto sobre el cálculo real).

**ACTUALIZACIÓN (ver Fase 8.30):** Daniel confirmó que, tras probar esta fase, seguía viendo todo negro -- `log_scale` (`log1p`) NO tuvo el efecto esperado. Motivo real, verificado con números: el array de correlación ya viene acotado a ~[0,1] (normalizado por `cross_power_spectrum`), y para valores dentro de [0,1] `log1p(x) ~= x` -- casi no comprime nada. `log1p` sí funciona en `fft_filters.compute_spectrum` porque ahí la entrada es magnitud de FFT SIN normalizar (rango de miles/millones). Reemplazado por corrección gamma en la Fase 8.30 -- ver esa fase para el enfoque correcto.

---

## Fase 8.30 — Módulo 3: corrección del enfoque de la Fase 8.29 (gamma en vez de log_scale)

**Contexto:** Daniel probó la Fase 8.29 y reportó que seguía viendo todo negro -- pidió cambiar de enfoque. Se verificó matemáticamente por qué `log1p` no funcionó (ver nota de actualización en la Fase 8.29) y se reemplazó por corrección gamma, la herramienta correcta para expandir valores YA acotados a [0,1] (a diferencia de `log1p`, que solo comprime valores grandes).

- [x] **8.30a — `array_to_png_base64`/`array_to_jpeg_base64` (`encoding.py`):** el parámetro `log_scale: bool` se retira (no funcionó) y se reemplaza por `gamma: float | None = None`. Tras la normalización lineal existente a [0,1], si `gamma` no es `None` se aplica `normalized ** gamma`. Con `gamma < 1` se expande la parte BAJA del rango (técnica estándar de "abrir sombras" en procesamiento de imágenes) sin tocar el máximo (`1.0 ** gamma == 1.0`, la posición del pico nunca se mueve). Default `None`: cero cambio de comportamiento para Módulo 1/2, igual que el parámetro anterior.
- [x] **8.30b — Aplicado con `gamma=0.3`:** `api/phase_correlator.py` y `api/live.py` (`phase_correlator_ws`) pasan `gamma=0.3` únicamente en la codificación del pico de correlación -- mismo alcance que la Fase 8.29 (nunca toca el cálculo real de `dy`/`dx`). Valor elegido a partir del orden de magnitud típico real del fondo de la correlación (~0.004 tras normalizar, para una imagen de 256×256) -- con `gamma=0.3` ese fondo sube a ~35% de brillo, claramente visible en vez de negro puro.

**Verificación de este commit:** los 3 archivos (`encoding.py`, `phase_correlator.py`, `live.py`) se re-descargaron de la máquina de Daniel después de `device_commit_files` y coincidieron por MD5 con la versión generada aquí en el PRIMER intento (`c28e10f8...` / `dbfd138c...` / `a6b1da79...`).

**Nota de verificación honesta pendiente:** no ejecutado en este entorno -- Daniel debe levantar el backend y confirmar que ahora SÍ se ve un halo/gradiente real alrededor del pico en el CRT y el Signal Monitor de Módulo 3 (no solo negro), y que `dx`/`dy` siguen dando el mismo valor de siempre. Si `gamma=0.3` resulta insuficiente o excesivo (imagen demasiado "lavada"), es cuestión de ajustar ese único número con su feedback visual real, no de adivinar de nuevo.

---

## Decisiones abiertas (a resolver antes o durante la fase que las necesita)

- **Formato de intercambio de resultados** (Fase 2): **cerrada** — base64 dentro del JSON de respuesta (no hay archivos estáticos temporales, no hay DB).
- **Procedencia de los assets demo con contenido real** (Fase 3): **cerrada** — documentada en `backend/assets/README.md`, asumida por Daniel.
- **Comando de arranque de producción de FastAPI** (Fase 6): no verificado todavía si `uv run fastapi dev` sirve en producción o si Render necesita un comando distinto (ej. `uvicorn main:app` directo) — investigar antes de desplegar, no asumir.
- **Métricas de Pulse Rate (BPM) y Gain (dB) en el Módulo 1** (Fase 4, **resuelta en Fase 8**): se descartó implementar una detección real de BPM (el backend no hace detección de picos sobre la señal amplificada, y no había una fuente verificada de qué representaría "Gain (dB)" en este pipeline). Decisión final de Daniel: `Gain` pasa a mostrar el valor real de `alpha` (corrigiendo la unidad, ya no "dB"), `Pulse Rate` se reemplaza por `Frecuencia` mostrando la banda real `f_low`-`f_high`, y `Noise Reduction`/`Sub-Pixel Shift` (que no pertenecían conceptualmente a Módulo 1) se eliminan del panel en vez de mostrar un número inventado. Ver Fase 8.7.
- **Verificación de compilación de la Fase 4** (actualizada tras 4.2c): el código de `frontend/src/components/rack/*`, `sections/*` y `App.tsx` no se compiló/ejecutó en este entorno (sin shell en la máquina de Daniel) — pendiente que Daniel corra `npm run dev` / `tsc -b` sobre esta última ronda de fixes (4.2c) y reporte errores de tipos o visuales antes de considerar la Fase 4.2 verificada, no solo escrita.
- **Archivos muertos pendientes de borrado manual** (nueva, 4.2c): `ModuleTabs.tsx` y `TvFrame.tsx` ya no se usan en ningún import de la app, pero esta sesión no tiene acceso de shell a la máquina de Daniel para borrarlos — Daniel debe eliminarlos manualmente cuando confirme que todo funciona.
- **Pieza 5 del pedido de navbar/idioma/contacto (nueva, tras 8.21; actualizada tras 8.22/8.23 -- la Pieza 4/landing ya está hecha, ver esas fases):** selector de idioma real ES/EN para todo el sitio (Daniel confirmó "Selector real, todo el sitio" vía `AskUserQuestion`) -- requiere contexto de idioma + diccionario + reescribir cada string hardcodeado en `NavDrawer`, `RackChassis`, `ContactPopover`, `Landing`, `Modulo1/2/3`, `RotaryKnob`, `CrtMonitor`, `Oscilloscope`, `VfdMetricCard`, `ToggleSwitchGroup`. Sigue sin empezar, a propósito -- Daniel confirmó ese orden para no traducir la landing dos veces (ver Fase 8.22).

---

## Fase 8.31 — Módulo 3: aplicar el resultado medido (registro/alineación de imagen), no solo mostrarlo

**Contexto:** Daniel probó la Fase 8.30 (`gamma=0.3`) y reportó que el resultado visual no le convenció ("solo genero una línea y ya"). Al preguntarle qué demuestra el módulo, surgió una pregunta más estratégica de Daniel: si el módulo solo demuestra el paso de MEDICIÓN (`dy`/`dx`) sin nunca APLICARLO, y qué se podría hacer con ese resultado además de visualizarlo. Se confirmó que tenía razón -- hasta este punto el módulo mide el desplazamiento sub-píxel pero nunca lo usa para nada. La forma estándar de "aplicar" un desplazamiento sub-píxel medido es el registro/alineación de imagen vía el teorema de desplazamiento de Fourier (multiplicar la FFT de la imagen por una rampa de fase compleja y tomar la parte real de la IFFT) -- técnica real usada en estabilización de video, stitching de panoramas y stacking astrofotográfico, no inventada para esta ocasión: ya existía, probada, como función auxiliar de test en `backend/core/test_phase_correlation.py` (usada para generar desplazamientos conocidos y verificar que `phase_correlate_subpixel` los recupera dentro de `ERROR_MAX_PX`). Se promovió esa misma función, sin reescribirla, a función pública del módulo core. Daniel confirmó explícitamente cómo mostrarlo en la UI, sin agregar paneles nuevos: el CRT derecho (CH-03) reutiliza el mismo patrón `thumbnailSrc`/`thumbnailLabel` que ya usa Módulo 1 -- el contenido PRINCIPAL pasa a ser `image2` alineada sobre `image1`, y lo que hasta la Fase 8.30 era el contenido principal (el pico de correlación) se convierte en la miniatura de la esquina inferior derecha de ese mismo panel.

- [x] **8.31a — `fourier_shift` promovida a función pública (`backend/core/phase_correlation.py`):** se movió tal cual desde `test_phase_correlation.py` (donde ya estaba validada indirectamente por `test_desplazamientos_conocidos`) a `core/phase_correlation.py`, sin cambiar su fórmula (`exp(-2j*pi*(fx*dx + fy*dy))` sobre la FFT2D, parte real de la IFFT2D). `test_phase_correlation.py` se actualizó para importarla (`from core.phase_correlation import fourier_shift, phase_correlate_subpixel`) en vez de duplicar la definición -- ningún test cambia de comportamiento, solo de origen del import. Convención de signo documentada explícitamente en su docstring: `fourier_shift(img, dy, dx)` produce `resultado(x,y) ~= img(x-dx, y-dy)` -- para alinear `image2` sobre `image1` dado `(dy, dx) = phase_correlate_subpixel(image1, image2)`, hay que invertir el signo: `fourier_shift(image2, -dy, -dx)`.
- [x] **8.31b — Nuevo campo de respuesta, HTTP y WebSocket:** `PhaseCorrelatorResponse` (`backend/api/models.py`) gana `image2_aligned_png_base64: str`; el endpoint HTTP (`backend/api/phase_correlator.py`) calcula `image2_aligned = fourier_shift(img2, -dy, -dx)` y lo codifica igual que `image1`/`image2` (sin gamma -- ese ajuste solo aplicaba al pico de correlación, que sigue siendo lineal en su rol de miniatura). El WebSocket (`backend/api/live.py`, `phase_correlator_ws`) recibe el mismo campo como `image2_aligned_jpeg_base64`, mismo cálculo, dentro de la misma función `compute()` que ya corre en `asyncio.to_thread`. `dy`/`dx` y el cálculo real de `phase_correlate_subpixel` NO se tocan -- se sigue mostrando exactamente el mismo número de siempre en las tarjetas VFD.
- [x] **8.31c — Tipos TypeScript reflejados a mano:** `frontend/src/lib/api/types.ts` gana `image2_aligned_png_base64` en `PhaseCorrelatorResponse` e `image2_aligned_jpeg_base64` en `PhaseCorrelatorLiveResult`, mismo patrón de mantenimiento manual (sin generación automática) ya establecido en el proyecto.
- [x] **8.31d — UI de Módulo 3 reorganizada sin paneles nuevos (pedido explícito de Daniel):** `Modulo3.tsx` calcula `liveAlignedSrc` desde `liveResult.image2_aligned_jpeg_base64` (mismo helper `toJpegSrc` ya usado para las demás imágenes). El `<CrtMonitor>` derecho (CH-03) cambia su `src` principal de `livePeakSrc` (pico de correlación) a `liveAlignedSrc` (imagen alineada), y gana `thumbnailSrc={livePeakSrc}` + `thumbnailLabel="CORRELATION"` -- reutilizando el mismo prop `thumbnailSrc`/`thumbnailLabel` que `CrtMonitor` ya soporta desde Módulo 1, sin modificar el componente `CrtMonitor.tsx` en sí. El Signal Monitor (zoom del pico, panel inferior) no se tocó -- sigue mostrando `livePeakSrc` sin cambios, a pedido implícito de Daniel ("no más paneles").
- [x] **8.31e — i18n del nuevo texto (`translations.ts`):** `modulo3AltLive` se actualizó de "Pico de correlación..." a describir el nuevo contenido principal del panel ("Imagen alineada — corregida con el desplazamiento sub-píxel calculado" / "Aligned image — corrected using the computed sub-pixel shift"). El label de la miniatura, `"CORRELATION"`, se dejó como literal (no como clave del diccionario) siguiendo la misma regla mecánica de la Fase 8.28: es jerga técnica ya en inglés, igual que `"CH-03"` o `"SYN"`.

**Límite honesto, no cubierto por esta fase:** no existe un test nuevo que verifique que `image2_aligned` efectivamente queda superpuesta sobre `image1` -- la convención de signo (`fourier_shift(img2, -dy, -dx)`) se derivó releyendo el docstring/uso real de `fourier_shift` en `test_desplazamientos_conocidos`, pero no se ejecutó ningún cálculo aquí para confirmarlo contra datos reales (sin backend corriendo en este entorno). Si al probar en el navegador la imagen alineada NO queda superpuesta sino más desplazada que `image2` original, el signo está invertido y hay que corregirlo a `fourier_shift(img2, dy, dx)` (sin el menos) -- avisar con lo que se vea, no se debe adivinar de nuevo sin ese dato real.

**Verificación de este commit:** los 8 archivos (`backend/core/phase_correlation.py`, `backend/core/test_phase_correlation.py`, `backend/api/models.py`, `backend/api/phase_correlator.py`, `backend/api/live.py`, `frontend/src/lib/api/types.ts`, `frontend/src/lib/i18n/translations.ts`, `frontend/src/sections/modulo-3/Modulo3.tsx`) se re-descargaron de la máquina de Daniel después de `device_commit_files` y coincidieron por MD5 con la versión generada aquí en el PRIMER intento (`d7dd9d65...` / `aae3e978...` / `cecd5c55...` / `12a8eb51...` / `f4c2c74f...` / `e8f490e7...` / `2135c18f...` / `c987ed55...`) -- sin bug de reversión silenciosa esta vez.

**Nota de verificación honesta pendiente:** no ejecutado ni compilado en este entorno (sin backend/frontend corriendo aquí) -- Daniel debe levantar el backend (`fastapi dev`) y el frontend (`npm run dev`) y confirmar en Módulo 3, para SYN/REAL/ART: (1) que el CRT derecho ahora muestra `image2` visiblemente alineada/superpuesta sobre `image1` (no negro, no la imagen sin corregir tal cual estaba antes), (2) que la miniatura en la esquina inferior derecha de ese mismo panel muestra el pico de correlación (gamma 0.3) con el label `CORRELATION`, (3) que `dx`/`dy` en las tarjetas VFD siguen dando el mismo valor de siempre para un mismo asset (para descartar cualquier efecto no previsto sobre el cálculo real), y (4) si la alineación se ve invertida/peor que antes, reportarlo tal cual se ve -- es la señal real que falta para confirmar o corregir el signo de `fourier_shift` (ver "Límite honesto" arriba).

---

## Fase 8.32 — Módulo 3: Signal Monitor con datos reales (fftshift + peak_confidence)

**Contexto:** Daniel pidió analizar (sin editar código todavía) por qué el Signal Monitor de Módulo 3 solo mostraba un círculo verde fijo que "no dice mucho", y pidió que todo lo visible sea información relevante. Se leyó línea por línea `Modulo3.tsx` (el círculo/zoom) y `core/phase_correlation.py`/`api/encoding.py` (el origen del dato) antes de proponer nada. Hallazgo real, no cosmético: `integer_peak()` devuelve `py, px` como índices CRUDOS del array `[0, N)`, sin `fftshift`; para un desplazamiento real pequeño el pico cae cerca de un índice 0 o N (envuelto), es decir, cerca de una ESQUINA de la imagen codificada -- exactamente lo que Daniel había reportado al inicio de este módulo ("un punto blanco en la esquina inferior izquierda"). El círculo fijo en el centro del panel y el zoom ×3 (que siempre magnifica el centro de la imagen) nunca estuvieron apuntando al pico real. Daniel aprobó las dos opciones propuestas.

- [x] **8.32a — Opción A, corrección real (no cosmética): `fftshift` antes de codificar el pico.** En `api/phase_correlator.py` y `api/live.py` (`phase_correlator_ws`), la copia de `correlation` usada para `correlation_peak_png_base64`/`correlation_peak_jpeg_base64` ahora pasa por `np.fft.fftshift()` antes de `array_to_png_base64`/`array_to_jpeg_base64` (gamma 0.3 sin cambios). `fftshift` mueve el bin de desplazamiento-cero al centro geométrico del array -- técnica estándar de visualización de FFT/correlación, no inventada para esta ocasión. Los índices `py`/`px` que usa `phase_correlate_subpixel` internamente (y ahora también `peak_confidence`, ver 8.32b) NO se tocan -- el cálculo real de `dy`/`dx` sigue siendo exactamente el mismo. Con esto, el pico real cae bajo el círculo centrado del Signal Monitor y el zoom ×3 magnifica la zona correcta, en vez del fondo casi-plano del centro sin desplazar.
- [x] **8.32b — Opción B, dato real nuevo: `peak_confidence`.** `PhaseCorrelatorResponse` (`api/models.py`) gana `peak_confidence: float` -- el valor real de `correlation[py, px]` (el mismo número que `argmax` ya usó para elegir el pico dentro de `integer_peak`, hasta ahora calculado y descartado sin exponerse). Rango ~[0,1] por la normalización de `cross_power_spectrum`: cerca de 1.0 = coincidencia nítida entre `image1`/`image2`; valores bajos = correlación ambigua o ruidosa. Mismo campo agregado a `PhaseCorrelatorLiveResult` en el WebSocket. `frontend/src/lib/api/types.ts` refleja ambos a mano, mismo criterio de mantenimiento manual ya establecido en el proyecto.
- [x] **8.32c — Signal Monitor muestra el dato real, no un número inventado en el frontend.** `Modulo3.tsx` calcula `peakConfidenceLabel` a partir de `liveResult.peak_confidence` (formateado a 3 decimales, ej. `CONFIDENCE 0.968`) y reemplaza el label estático `"PEAK ZOOM ×3"` -- que se conserva como fallback solo mientras no hay `liveResult` (antes de Execute / tras Stop), igual que el resto de los paneles de este módulo. El círculo decorativo (línea 269-271 antes de este cambio) no se tocó -- ahora sí es coherente con el contenido real gracias a 8.32a, así que no hacía falta rediseñarlo, solo corregir lo que ya representaba.

**Verificación de este commit:** los 5 archivos (`models.py`, `phase_correlator.py`, `live.py`, `types.ts`, `Modulo3.tsx`) se re-descargaron de la máquina de Daniel después de `device_commit_files` y coincidieron por MD5 con la versión generada aquí en el PRIMER intento (`b7ded9ff...` / `2542a40e...` / `17d32e60...` / `38d436ac...` / `80478a43...`) -- sin bug de reversión silenciosa esta vez. Sintaxis Python de los 3 archivos backend verificada con `ast.parse` antes de desplegar (no reemplaza pruebas reales, pero descarta errores de sintaxis básicos).

**Nota de verificación honesta pendiente:** no ejecutado ni compilado en este entorno (sin backend/frontend corriendo aquí) -- Daniel debe levantar el backend y el frontend y confirmar en Módulo 3, para SYN/REAL/ART: (1) que el Signal Monitor ahora muestra un halo/pico real centrado bajo el círculo verde (no solo fondo uniforme), (2) que el label ya no dice "PEAK ZOOM ×3" sino "CONFIDENCE" seguido de un número entre 0 y 1 mientras la simulación está activa, y (3) que ese número se siente razonable (cercano a 1.0 para SYN, que es el par sintético más limpio; posiblemente más bajo para REAL/ART, que son pares con ruido real). Si el zoom ×3 sigue sin mostrar un halo claro después de `fftshift` -- por ejemplo si el desplazamiento real medido es grande y el pico centrado queda fuera del recorte visible del zoom -- es una señal real para ajustar el nivel de zoom con su feedback, no para adivinar de nuevo.

---

## Fase 8.33 — Módulo 3: error residual real (número + mapa grande) en vez de comparar imágenes "iguales"

**Contexto:** Daniel probó la Fase 8.31/8.32 y notó el problema de fondo: si `image1` (original) e `image2_aligned` (procesada) se ven prácticamente iguales a simple vista, el panel "no tiene gracia" -- no demuestra nada. Se confirmó que tiene razón, y que además es matemáticamente esperable: un desplazamiento sub-píxel casi nunca es perceptible al ojo en ninguna de las dos imágenes por separado (esa es la razón de ser del algoritmo -- medir lo que el ojo no puede). La solución correcta no es comparar las imágenes completas (el mismo problema reaparecería), sino mostrar el error RESIDUAL entre ellas: si la alineación funcionó, `|image1 - image2_aligned|` se ve casi plano/oscuro; si algo falló, aparecen bordes donde no coinciden -- eso SÍ es visible incluso cuando el desplazamiento original no lo era. Daniel eligió mostrar ambas cosas (Opción 3 de la propuesta previa): el mapa de diferencia EN GRANDE como contenido principal del CRT derecho, y un número real de error como tercera tarjeta VFD. También pidió no duplicar el pico de correlación en el CRT ya que ese dato sigue visible en el Signal Monitor (Fase 8.32, con su `CONFIDENCE` real) -- basta con dejarlo señalado ahí, sin repetirlo.

- [x] **8.33a — Backend calcula el error residual real (`api/phase_correlator.py`, `api/live.py`):** tras calcular `image2_aligned` (Fase 8.31), se computa `diff = np.abs(img1 - image2_aligned)` (mapa de diferencia real, pixel a pixel) y `residual_error_pct = 100 * diff.mean() / (img1.max() - img1.min())` -- el error medio absoluto normalizado como porcentaje del rango dinámico REAL de `image1`, para que el número sea comparable entre el asset sintético (escala de punto flotante arbitraria, ver `assets.py`) y los assets reales (escala 0-255) sin necesitar dos escalas distintas de lectura. Nunca inventado -- ambos salen de los mismos arrays que ya estaban en memoria.
- [x] **8.33b — Nuevos campos de respuesta (`api/models.py`, `frontend/src/lib/api/types.ts`):** `PhaseCorrelatorResponse` gana `alignment_diff_png_base64: str` y `residual_error_pct: float`; `PhaseCorrelatorLiveResult` los mismos campos en JPEG. `array_to_png_base64`/`array_to_jpeg_base64` codifican `diff` SIN `gamma` -- a diferencia del pico de correlación (Fase 8.30), este mapa no está degenerado a un único valor dominante, así que la normalización lineal que ya hace la función alcanza para que se vea sin ajustes extra. Los campos de la Fase 8.31 (`image2_aligned_*`) NO se eliminaron -- se agregó a lo que ya existía, no se reemplazó, por si hace falta ese dato más adelante.
- [x] **8.33c — UI de Módulo 3 reorganizada (`Modulo3.tsx`), sin agregar paneles nuevos:** el CRT derecho (CH-03) cambia su `src` principal de `image2_aligned` (Fase 8.31) al mapa de error residual (`liveDiffSrc`) -- pedido explícito de Daniel: que se vea "en grande". Se quitó `thumbnailSrc`/`thumbnailLabel="CORRELATION"` de ese mismo CRT (Fase 8.31/8.32) porque el pico de correlación ya se muestra en el Signal Monitor, con su `CONFIDENCE` real (Fase 8.32) -- pedido explícito de Daniel de no repetirlo. La grilla de tarjetas VFD pasa de `grid-cols-2` (Δx, Δy) a `grid-cols-3`, agregando `Residual Error` con el `residual_error_pct` real formateado a 2 decimales (ej. `1.34%`). Mismo criterio que `Gain`/`Frecuencia` de Módulo 1: `Residual Error` es jerga técnica de instrumento, se queda en inglés en ambos idiomas (no entra al diccionario de i18n).
- [x] **8.33d — i18n actualizado (`translations.ts`):** `modulo3AltLive` se actualizó de describir la imagen alineada a describir el mapa de error residual, coherente con el nuevo contenido real del panel.

**Límite honesto, no cubierto por esta fase:** no se aplicó ningún realce (gamma u otro) al mapa de diferencia -- si en la práctica el error residual real resulta muy chico en términos absolutos y la normalización lineal por sí sola no lo hace visualmente evidente (mismo tipo de problema que tuvo el pico de correlación en la Fase 8.29/8.30, aunque aquí no hay una razón matemática previa para asumir que se repetirá), es una señal real para ajustar con el feedback visual de Daniel, no para adivinar de nuevo un valor de antemano.

**Verificación de este commit:** los 6 archivos (`models.py`, `phase_correlator.py`, `live.py`, `types.ts`, `translations.ts`, `Modulo3.tsx`) se re-descargaron de la máquina de Daniel después de `device_commit_files` y coincidieron por MD5 con la versión generada aquí en el PRIMER intento (`670081c3...` / `0a80a51b...` / `6e84d82c...` / `1aec1776...` / `1c8e2d33...` / `5a445f35...`) -- sin bug de reversión silenciosa esta vez. Sintaxis Python de los 3 archivos backend verificada con `ast.parse` antes de desplegar.

**Nota de verificación honesta pendiente:** no ejecutado ni compilado en este entorno -- Daniel debe levantar el backend y el frontend y confirmar en Módulo 3, para SYN/REAL/ART: (1) que el CRT derecho ahora muestra el mapa de diferencia en grande, y que se ve razonablemente plano/oscuro (si el algoritmo de alineación funciona bien), (2) que la tercera tarjeta VFD muestra un `Residual Error` bajo (idealmente un pequeño porcentaje de un dígito), (3) que ya no aparece la miniatura de correlación en ese CRT (movida conceptualmente al Signal Monitor, que ya la mostraba desde la Fase 8.32), y (4) si el mapa de diferencia se ve uniformemente oscuro sin ningún detalle visible (demasiado plano para distinguir nada) o, al contrario, completamente brillante/sin estructura (posible error real de alineación), avisar con lo que se vea -- ninguno de los dos extremos se puede diagnosticar sin ese dato real.

---

## Verificación real confirmada — Módulo 1, Módulo 2, Landing y Navbar (post Fases 8.21-8.30)

**Contexto:** Daniel corrió `npm run dev` (frontend) junto con el backend en su máquina y confirmó explícitamente que Módulo 1, Módulo 2, la Landing y el Navbar funcionan bien -- "ya todo está bien". Esto cierra, EN LA PRÁCTICA, la mayoría de las notas de "verificación honesta pendiente" que quedaron abiertas desde la Fase 8.21 hasta la 8.30 (blur/cierre del navbar, popup de contacto, landing sin scroll, espera de cold-start, acabado de TV antigua, carrusel 3D/coverflow, límite de 70dvh, avatar real, carrusel más lento, botón Home, i18n ES/EN real) -- todo eso quedó CONFIRMADO visualmente, no solo escrito.

**Lo que esto NO cubre (sigue abierto, Daniel no lo mencionó como probado):**
- `TooltipProvider` global (Fase 4.3).
- Verificación de build de PRODUCCIÓN (`tsc -b` / `npm run build`) -- `npm run dev` es el servidor de desarrollo, no valida lo mismo que un build de producción (minificación, tree-shaking, errores de tipos que a veces `dev` tolera pero `build` no).
- Prueba de responsive real en celular (~400px) -- no fue parte de esta confirmación.
- Traducción de los mensajes de `lib/api/client.ts` (límite honesto documentado desde la Fase 8.28).
- Fase 8.10 (verificación end-to-end completa de la simulación en vivo) -- la confirmación de Daniel fue visual/funcional general, no un recorrido exhaustivo de cada caso de error/reconexión del WebSocket.

**Excepción ya cerrada aparte:** Módulo 3 (Fases 8.31-8.33) ya había sido confirmado por Daniel con datos reales de ejecución (`CONFIDENCE 0.608`, `Residual Error 0.91%`, contrastado contra la verdad de terreno real en `assets.py`) en un turno anterior -- no depende de esta confirmación.

**Pendiente real, explícitamente fuera de esta confirmación:** las mejoras del backlog (ver las dos secciones siguientes) -- Daniel confirmó "a excepción de las mejoras pendientes que no se han hecho", es decir, todo lo ya construido funciona, pero nada del backlog (M1-1 a M1-8, M2-1 a M2-3/M2-4-6 descartadas, M3-1 a M3-5) se implementó todavía.

---

## Fase 8.34 — Límite manual de conexiones WS concurrentes (seguridad, pedido explícito de Daniel)

**Contexto:** Auditoría de seguridad pedida explícitamente por Daniel ("lo que hay que verificar primero seguridad"). Se revisó línea por línea `backend/main.py`, `backend/api/rate_limit.py`, `backend/api/assets.py` y `backend/api/live.py` contra el código real (sin asumir nada). Único hallazgo real: los 3 endpoints WebSocket (`/ws/motion-magnifier`, `/ws/spectrum-cleaner`, `/ws/phase-correlator`) no tenían ningún límite de conexiones -- el rate limit de `slowapi` (`@limiter.limit(...)`, confirmado con `grep` en los 3 endpoints HTTP equivalentes) solo decora rutas HTTP, nunca rutas `@websocket`, hecho que el propio docstring de `live.py` ya admitía ("WebSocket no pasa por slowapi"). Eso dejaba abierta la posibilidad de abrir conexiones WS ilimitadas, cada una disparando cómputo NumPy/OpenCV pesado (ej. `MotionMagnifier` sobre video real) sin ningún tope -- vector real de agotamiento de CPU/RAM (el propio código en `assets.py` ya asume un host con 512 MB de RAM).

1. [x] Se implementó un límite manual en memoria dentro de `backend/api/live.py` (funciones `_reserve_ws_slot`/`_release_ws_slot`), sin depender de que `slowapi` soporte WebSockets (no había fuente verificada de eso, así que no se asumió -- ver el comentario del propio código). La IP se obtiene con `websocket.client.host`, el mismo mecanismo real que usa `get_remote_address` de `slowapi` internamente (`WebSocket` y `Request` comparten la clase base `HTTPConnection` de Starlette).
2. [x] Tope acordado explícitamente con Daniel: **máximo 3 conexiones activas EN TOTAL** entre los 3 endpoints WS, y **máximo 1 conexión activa por IP** (evita que una sola IP consuma los 3 cupos abriendo varias pestañas).
3. [x] La conexión que excede el tope se cierra con código WS `1013` ("Try Again Later") ANTES de `websocket.accept()`, con un mensaje real explicando el motivo (límite global vs. límite por IP) -- nunca un cierre silencioso.
4. [x] El cupo se libera siempre en un bloque `finally` de cada endpoint (`_release_ws_slot`), sin importar si la conexión terminó por Stop del usuario, desconexión inesperada, o un error no manejado -- no puede quedar un cupo "fantasma" ocupado tras una desconexión.
5. [x] Se aplicó el mismo patrón, sin duplicar lógica, a los 3 endpoints (`motion_magnifier_ws`, `spectrum_cleaner_ws`, `phase_correlator_ws`).

**Nota honesta sobre el número 3:** el tope de 3 conexiones simultáneas es una decisión de ingeniería razonable (Daniel + Claude), no una cifra medida con una prueba de carga real -- no existe todavía un benchmark de cuántos usuarios simultáneos soporta el backend real antes de degradarse (esa medición es exactamente el alcance de la Fase 5, "Integración y rendimiento", que sigue pendiente). Si Fase 5 se ejecuta más adelante con datos reales de perfilado, este número debe revisarse contra esa medición, no quedar fijo por intuición para siempre.

**Otros puntos de la auditoría de seguridad, revisados sin hallazgos de bug (confirmado, no se toca):**
- CORS (`main.py`): restringido a `http://localhost:5173`, con `allow_credentials=True` -- correcto y restrictivo, no es una vulnerabilidad. El TODO de agregar el dominio real de Vercel queda para la Fase 6 (deploy), explícitamente fuera de alcance por ahora (decisión de Daniel).
- `asset_id` en los 3 módulos: restringido a `Enum` de Pydantic, nunca llega un path desde el cliente -- sin riesgo de path traversal.
- Sin archivos `.env` ni credenciales/API keys hardcodeadas en el repo (`grep` explícito, sin resultados).
- Sin endpoint de subida de archivos -- sin riesgo de decompression bomb ni contenido de usuario ejecutado.
- Sin autenticación/usuarios/claves en ningún endpoint -- **decisión explícita de Daniel, no un hallazgo pendiente**: "así lo quiero, no necesitamos usuarios o claves".
- Dependencias (`pyproject.toml`/`package.json`): no hay `package-lock.json`/`poetry.lock` sincronizados en la carpeta compartida con Claude, así que no se pudo correr `npm audit`/`pip-audit` de forma verificable desde esta sesión -- pendiente de que Daniel lo corra en su máquina donde sí existe el lockfile real.

## Verificación de este commit

- `backend/api/live.py` — MD5 `210768546e4bfc89ee894b45644bd0bd` (verificado por descarga y comparación tras el despliegue, coincide en `uploads` y en el dispositivo de Daniel).

---

## Fase 8.35 — Responsive real (~400px y Windows Snap): causa raíz corregida en los 3 módulos + App.tsx

**Contexto:** Daniel reportó que a ~400px (celular real, y el ancho mínimo que deja Windows Snap al arrastrar una ventana con Win+flecha) la interfaz "se superpone, se corta". Se auditó línea por línea y se confirmó la causa raíz REAL, no supuesta: los 3 módulos (`Modulo1.tsx`, `Modulo2.tsx`, `Modulo3.tsx`) usaban el mismo layout de 2 columnas fijas lado a lado (`flex ... gap-3` con `flex-3`/`flex-2`) sin ningún breakpoint que las apilara en pantallas angostas, dentro de una `<section>` en `App.tsx` con `h-dvh`/`overflow-hidden` fijo (sin scroll de respaldo). Se confirmó además que `TvFrame.tsx` -- el wrapper que en teoría escalaría todo el rack como una sola unidad rígida, lo que habría evitado este problema -- es un archivo MUERTO: `grep "import.*TvFrame"` no devuelve resultados fuera de comentarios, ningún componente lo usa de verdad.

1. [x] `App.tsx`: las 3 `<section>` de módulo pasan de `h-dvh ... overflow-hidden` fijo a `min-h-dvh ... overflow-visible` por defecto (crecen con el contenido apilado) y **recuperan el comportamiento original exacto** (`h-dvh`/`overflow-hidden`) desde `lg:` (1024px) -- el `<main>` que las contiene ya tenía `overflow-y-auto` desde antes, así que el contenido más alto que la pantalla ahora se puede desplazar en vez de recortarse.
2. [x] `Modulo1.tsx`, `Modulo2.tsx`, `Modulo3.tsx`: el contenedor raíz de 2 columnas pasa de `flex h-full min-h-0 gap-3` a apilarse en `flex-col` por defecto y volver a `flex-row` (con `h-full` real) solo desde `lg:` -- mismo patrón aplicado a las columnas interna izquierda/derecha.
3. [x] `Modulo2.tsx` y `Modulo3.tsx` (2 CRT lado a lado: ORIGINAL + LIVE/residual): también se apilan verticalmente por defecto (`flex-col`, cada CRT con una altura fija `h-56` para no colapsar a 0 sin una altura de referencia) y vuelven a fila desde `lg:`.
4. [x] Grids internos de 3 columnas (Bandpass Low/Source/Bandpass High en Módulo 1; Source/Notches/Enable en Módulo 2; Δx/Δy/Residual Error en Módulo 3) y de 2 columnas (RadarPad/Filter Mode y Cutoff Radius/Order(n) en Módulo 2) pasan a `grid-cols-1` por defecto y recuperan sus columnas originales desde `sm:` (640px) -- ancho holgadamente cubierto tanto por un celular real como por cualquier ancho de Windows Snap.
5. [x] Las tarjetas VFD de 2 columnas (Gain/Frecuencia, Peak Count/Reduction %) y los pares de botones Execute/Stop se dejaron sin cambios a propósito -- ya son lo bastante compactos para no solaparse ni a 360px, cambiarlos habría sido una modificación no pedida.

**Elección del breakpoint `lg:` (1024px) para el layout de 2 columnas grandes, en vez de apuntar a un ancho exacto de Windows Snap:** Daniel no dio un ancho en píxeles exacto de su Snap (varía según resolución/escala de su monitor) -- en vez de asumir un número, se eligió un breakpoint fluido que cubre de sobra cualquier ancho real de Snap (siempre bastante menor a 1024px en cualquier monitor común) y también celulares reales, sin depender de adivinar su resolución exacta.

**Nota honesta pendiente:** no se pudo correr `npm run build`/`tsc -b` ni un chequeo visual real en el navegador desde esta sesión (no hay `node_modules` sincronizados en la carpeta compartida con Claude) -- los cambios son ediciones quirúrgicas de clases de Tailwind ya usadas en el resto del proyecto (ningún nombre de clase inventado), pero la verificación visual real a 400px y al ancho de tu Windows Snap queda pendiente de que la confirmes tú mismo en tu navegador.

## Verificación de este commit

- `frontend/src/App.tsx` — MD5 `d9f6d04f139709d0179fb06c7cb9ec8e`
- `frontend/src/sections/modulo-1/Modulo1.tsx` — MD5 `457c2fb9a9a05f2770770e58606cfdc3`
- `frontend/src/sections/modulo-2/Modulo2.tsx` — MD5 `f74207d3918bb36abef066c05ef4c1e9`
- `frontend/src/sections/modulo-3/Modulo3.tsx` — MD5 `0a872cda1cf1f8e099ad5b18d9b9cfe7`

(Los 4 archivos coinciden entre la copia local y el dispositivo de Daniel, verificado por descarga y comparación tras el despliegue.)

---

## Fase 8.36 — Responsive real: causa raíz corregida en Section2 (documentación técnica de los 3 módulos)

**Contexto:** Tras la Fase 8.35, Daniel reportó que la sección de documentación técnica ("5 Steps", `Section2.tsx` de cada módulo) seguía viéndose "caótica" a anchos angostos -- texto cortado, tarjetas que ya no se ven -- y propuso reducir el tamaño de fuente. Se auditó línea por línea y se confirmó que la causa raíz real era estructural, NO solo de tipografía (aunque el tamaño de fuente sí era parte real del problema en los números grandes): las 15 tarjetas "Step" (5 por módulo × 3 módulos, estructura idéntica replicada) tenían una altura FIJA `h-[calc(50dvh-0.75rem)]` con `overflow-hidden`, combinada con grids anchos sin ningún breakpoint que los apilara (`grid-cols-12` con `col-span-5`/`col-span-7`, `grid-cols-3`, `grid-cols-2`, `grid-cols-2 lg:grid-cols-4`) -- a ancho angosto las columnas se comprimen, el texto necesita más líneas de las que la altura fija permite, y el excedente se recorta contra el `overflow-hidden`.

1. [x] Las 15 tarjetas `.step-card` (5 por archivo × `modulo-1/Section2.tsx`, `modulo-2/Section2.tsx`, `modulo-3/Section2.tsx`) pasan de altura fija a `min-h-[calc(50dvh-0.75rem)] h-auto overflow-visible` por defecto (crecen con el contenido en vez de recortarlo) y recuperan el comportamiento original exacto (altura fija a 50dvh, `overflow-hidden`) desde `lg:` (1024px) -- mismo criterio de breakpoint que la Fase 8.35.
2. [x] Los grids `grid-cols-12` (Step 02 y 03 de cada módulo, con columnas `col-span-5`/`col-span-7`) se apilan a 1 columna por defecto y recuperan las 12 columnas/proporciones originales desde `lg:`.
3. [x] Los grids `grid-cols-3` (Step 01, badges de fase) y `grid-cols-2`/`grid-cols-2 lg:grid-cols-4` (Step 04/05, tarjetas de resultados y decisiones) se apilan a 1 columna por defecto y recuperan sus columnas desde `sm:` (640px).
4. [x] Reducción real de tamaño de fuente (pedido explícito de Daniel) en los números grandes de Step 04 de los 3 módulos -- se agregó un tercer escalón `lg:` a la escala responsive existente en vez de reemplazarla, para que el número más grande (ej. `text-9xl`, ~modulo-1) solo aparezca desde 1024px, con un tamaño intermedio en `sm:` y uno más chico como base para cualquier ancho angosto:
   - Módulo 1 ("11.0X" / "5.22X"): `text-7xl sm:text-9xl` → `text-5xl sm:text-7xl lg:text-9xl`.
   - Módulo 2 ("99.3%" / "5.55e-16"): `text-6xl sm:text-8xl` → `text-4xl sm:text-6xl lg:text-8xl`; `text-4xl sm:text-6xl` → `text-2xl sm:text-4xl lg:text-6xl`.
   - Módulo 3 ("0.40px" / "0.000px"): `text-6xl sm:text-8xl` → `text-4xl sm:text-6xl lg:text-8xl`; `text-5xl sm:text-7xl` → `text-3xl sm:text-5xl lg:text-7xl`.

**Nota honesta pendiente (igual que en la Fase 8.35):** no se pudo correr `npm run build`/`tsc -b` ni una verificación visual real en navegador desde esta sesión (sin `node_modules` sincronizados en la carpeta compartida) -- son ediciones quirúrgicas de clases de Tailwind ya usadas en el resto del proyecto, pero la confirmación visual real a 400px y en el ancho mínimo de Windows Snap queda pendiente de que Daniel la haga en su propio navegador.

## Verificación de este commit

- `frontend/src/sections/modulo-1/Section2.tsx` — MD5 `8e31173a43b59bc362884b2e514719f7`
- `frontend/src/sections/modulo-2/Section2.tsx` — MD5 `653959bbb5d004cf7b7d447da1dc52a2`
- `frontend/src/sections/modulo-3/Section2.tsx` — MD5 `39047c762a66326ac5c4ee2c6df71bb6`

(Los 3 archivos coinciden entre la copia local y el dispositivo de Daniel, verificado por descarga y comparación tras el despliegue.)

---

## Fase 8.37 — M1-2: niveles configurables de la pirámide Laplaciana (Módulo 1)

### Contexto

Primer ítem implementado del backlog de mejoras de Módulo 1 (ver más abajo
la sección "Backlog de mejoras propuestas — Módulo 1"), elegido por Daniel
junto con M1-3 dentro del grupo de "riesgo bajo y más fáciles de aplicar".
Solo se implementó M1-2 en esta ronda -- M1-4 quedó bloqueado por un
choque real con una decisión propia de Daniel ya documentada (ver
"Decisiones abiertas" más abajo) y M1-3 queda pendiente para una ronda
posterior.

Antes, `levels` (cantidad de niveles de la pirámide Laplaciana que usa
`MotionMagnifier`) estaba fijo en 3, hardcodeado por separado en DOS
lugares del backend (`api/motion_magnifier.py` y `api/live.py`) -- el
usuario no tenía forma de cambiarlo.

Rango válido 2-5, verificado contra `core/pyramids.py` (no supuesto):
cada nivel reduce cada dimensión de la imagen con `(h+1)//2`
(`_downsample`); con el tamaño real de los assets de este módulo (~128px
de lado mayor, ~72px el menor tras el resize a 16:9), más de 5 niveles
deja dimensiones de pocos píxeles sin sentido real que amplificar.
`levels=1` es un caso degenerado real, no solo un límite arbitrario:
`build_laplacian_pyramid` con `levels=1` devuelve una lista de una sola
banda (la banda base Gaussiana, sin ninguna banda Laplaciana de detalle),
y `MotionMagnifier.process_frame` amplifica iterando sobre
`pyramid[:-1]` -- con una sola banda esa lista queda vacía, por lo que
`levels=1` no amplificaría nada. Por eso el mínimo válido expuesto al
usuario es 2, no 1.

### Cambios aplicados

- [x] `backend/api/models.py`: agregado el campo `levels: int` a
      `MotionMagnifierRequest` (`Field(3, ge=2, le=5, ...)`, con el
      default en 3 para no cambiar el comportamiento de nadie que no
      toque el control nuevo), con comentario explicando el rango 2-5
      contra `core/pyramids.py`.
- [x] `backend/api/motion_magnifier.py`: `levels=3` hardcodeado →
      `levels=body.levels` en el endpoint HTTP `POST /api/motion-magnifier`.
- [x] `backend/api/live.py`: `levels=3` hardcodeado → `levels=params.levels`
      dentro de `motion_magnifier_ws`/`compute()` (sin tocar el resto del
      archivo, incluyendo el límite de conexiones WS de la Fase 8.34).
- [x] `frontend/src/lib/api/types.ts`: agregado `levels: number` a la
      interfaz `MotionMagnifierRequest`, reflejando el campo Pydantic.
- [x] `frontend/src/lib/api/validation.ts`: agregada la validación en
      cliente `Number.isInteger(body.levels) && body.levels >= 2 &&
      body.levels <= 5` en `validateMotionMagnifierRequest`, espejo
      exacto del límite del backend.
- [x] `frontend/src/sections/modulo-1/Modulo1.tsx`: nuevo estado
      `levels` (default 3), nueva constante `LEVELS_OPTIONS` (4
      posiciones discretas: 2/3/4/5), nuevo control `SteppedKnob`
      ("Pyramid Levels", reutilizando el mismo componente ya usado en
      Módulo 2 para Filter Mode) agregado como fila nueva en el panel
      "EVM Parameter Processor", debajo de la fila Bandpass Low/Source/
      Bandpass High. `levels` se agregó a `requestBody` de
      `handleExecute`, a la firma y payload de `sendLiveUpdate`, y a las
      tres llamadas existentes (`handleAlphaChange`/`handleFLowChange`/
      `handleFHighChange`); nuevo `handleLevelsChange` que actualiza el
      estado y reenvía por el WebSocket ya abierto (mismo patrón
      debounced de 150ms que los demás controles). También se agregó
      `levels: 3` a la petición liviana `runMotionMagnifier` que trae el
      original al cambiar de Source (no depende del valor real de la
      perilla, mismo criterio que ya usaban `alpha`/`f_low`/`f_high` ahí).

### Pendiente / honesto

No hay `node_modules` disponibles en este entorno para correr
`npm run build`/verificación visual del control nuevo -- la verificación
de este commit se limita a sintaxis Python (`py_compile`) en los 3
archivos backend editados y comparación MD5 exacta entre lo escrito en
el dispositivo de Daniel y la copia de referencia. La prueba visual real
(perilla nueva, valores 2/3/4/5 aplicándose de verdad al resultado)
queda pendiente de que Daniel la corra en su entorno.

### Verificación de este commit

`py_compile` sobre `backend/api/models.py`, `backend/api/motion_magnifier.py`
y `backend/api/live.py`: sin errores de sintaxis.

MD5 de los 6 archivos escritos en el dispositivo de Daniel, verificados
por re-descarga inmediata tras el commit (coinciden con la copia de
referencia, primer intento, sin el bug de reversión de `device_commit_files`):

- `backend/api/models.py` — `d8debe215ee588ce1f7e629bcb054b58`
- `backend/api/motion_magnifier.py` — `bcc5adfc55c98b094a7d7a6f9a44a66d`
- `backend/api/live.py` — `ef0f3bc474d1a3506830042993f47bcf`
- `frontend/src/lib/api/types.ts` — `4344e2aaeef434f02276e49b791fce82`
- `frontend/src/lib/api/validation.ts` — `e765096c8544bd412e9db2d6f102742f`
- `frontend/src/sections/modulo-1/Modulo1.tsx` — `c601cd21e06b2d8dde86500ee11eb8c3`

## Fase 8.38 — M1-3: filtro temporal Ideal FFT como alternativa al IIR (Módulo 1)

### Contexto

Segundo ítem implementado del grupo "riesgo bajo y más fáciles de aplicar"
elegido por Daniel -- corrección de encuadre respecto al backlog original:
el propio ROADMAP ya documentaba M1-3 como "riesgo alto", no bajo (el
filtro IIR actual es streaming puro sin historial, y el filtro ideal
necesita la ventana temporal completa de frames, lo cual es un cambio de
arquitectura real, no un simple parámetro más). Se avisó explícitamente
a Daniel antes de implementar, se acordó el diseño exacto con él, y se
implementó bajo su confirmación explícita.

Junto con esto, Daniel confirmó DEFINITIVAMENTE que M1-4 (`EST. PULSE:
BPM`) NO se implementa -- no hay ninguna fuente de dato real disponible
hoy para ese número (ver Fase 8, "Decisiones abiertas"), y no se va a
inventar una. Queda cerrado, no bloqueado -- no hace falta revisitarlo a
menos que en el futuro exista una fuente real (ej. FFT del trazo temporal
del Signal Monitor, M1-5, podría eventualmente dar una frecuencia
dominante real de la que derivar un BPM honesto -- pero eso NO se
implementó acá, es solo una posibilidad para más adelante si Daniel lo
pide).

### Diseño acordado con Daniel (antes de escribir código)

- Un nuevo parámetro `filter_mode` con SOLO 2 valores posibles: `"iir"`
  (default, el único modo que existía antes) o `"ideal_fft"` (nuevo).
  Default `"iir"` para que nadie que no toque el control nuevo note un
  cambio de comportamiento.
- Aplica IGUAL en el endpoint HTTP (`Execute`) y en la simulación en vivo
  (WebSocket) -- se verificó contra el código real que el modo "en vivo"
  YA reprocesa el video completo desde el frame 1 en cada actualización
  de parámetros (no es streaming incremental de verdad, a pesar del
  nombre), así que agregar Ideal FFT ahí no cambia el patrón de
  recómputo existente, solo la fórmula interna.
- UI: switch de 2 posiciones (`ToggleSwitchGroup`, no una perilla
  discreta -- pedido explícito de Daniel porque solo son 2 valores),
  ubicado a la derecha de la perilla "Magnification Factor (α)", en la
  misma fila.

### Cambios aplicados

- [x] `backend/core/temporal_filter.py`: nueva función
      `ideal_bandpass_filter_temporal(band_stack, f_low, f_high,
      sample_rate)`. Recibe una banda de la pirámide apilada en el eje
      temporal (shape `(T, H, W)`), aplica `np.fft.rfft` en el eje
      temporal, pone en cero los bins de frecuencia fuera de
      `[f_low, f_high]` (corte agudo, sin banda de transición suave como
      el IIR), y reconstruye con `np.fft.irfft`. No se toca
      `IIRBandpass` -- queda exactamente igual que antes.
- [x] `backend/core/motion_magnifier.py`: `MotionMagnifier.__init__`
      acepta `filter_mode: str = "iir"` (default, sin cambiar
      comportamiento previo). `f_low`/`f_high`/`sample_rate` ahora se
      guardan en `self` (antes solo se usaban para construir
      `IIRBandpass`) porque el modo `ideal_fft` los necesita de nuevo
      sobre la ventana completa. `self._filters` (los `IIRBandpass` por
      nivel) solo se construyen en modo `"iir"` -- en `"ideal_fft"` no
      hace falta y evita que una restricción propia del IIR (ganancia
      ~0 en el centro de banda) bloquee un caso que sería válido para el
      filtro ideal. Nuevo método `process_video(frames)`: en modo `"iir"`
      es exactamente `[process_frame(f) for f in frames]` de siempre; en
      modo `"ideal_fft"` arma la pirámide de TODOS los frames primero,
      apila cada nivel en el eje temporal, filtra con la función nueva,
      y recompone cada frame -- la banda base (última banda de la
      pirámide) queda sin amplificar en ambos modos, mismo criterio que
      ya usaba el IIR.
- [x] `backend/api/models.py`: agregado `filter_mode: str = Field("iir",
      pattern="^(iir|ideal_fft)$", ...)` a `MotionMagnifierRequest`.
- [x] `backend/api/motion_magnifier.py`: `MotionMagnifier(...,
      filter_mode=body.filter_mode)`, y `output_frames =
      magnifier.process_video(frames)` (antes `[magnifier.process_frame(f)
      for f in frames]` armado a mano en el endpoint -- ahora vive dentro
      de `process_video`, mismo resultado en modo IIR).
- [x] `backend/api/live.py`: mismo cambio dentro de `motion_magnifier_ws`
      /`compute()` -- `filter_mode=params.filter_mode` y `return
      magnifier.process_video(frames)`. No se tocó nada del límite de
      conexiones WS de la Fase 8.34 ni el resto del archivo.
- [x] `frontend/src/lib/api/types.ts`: nuevo tipo exportado
      `MotionFilterMode = "iir" | "ideal_fft"`, agregado como campo
      `filter_mode: MotionFilterMode` a `MotionMagnifierRequest`.
- [x] `frontend/src/lib/api/validation.ts`: validación en cliente de que
      `filter_mode` sea uno de los 2 valores válidos.
- [x] `frontend/src/sections/modulo-1/Modulo1.tsx`: nuevo estado
      `filterMode` (default `"iir"`), constante `FILTER_MODE_OPTIONS`
      (`DEFAULT`/`IDEAL`), nuevo `handleFilterModeChange` (mismo patrón
      debounced de 150ms que los demás controles). `filter_mode`
      agregado a `requestBody` de `handleExecute`, a la firma y payload
      de `sendLiveUpdate`, a las cuatro llamadas existentes
      (alpha/fLow/fHigh/levels cada una ahora también reenvía
      `filterMode` actual), y a la petición liviana `runMotionMagnifier`
      que trae el original al cambiar Source (fijo en `"iir"`, mismo
      criterio conservador que ya usaban `alpha`/`f_low`/`f_high` ahí).
      Layout: el contenedor que antes tenía solo la perilla de
      Magnification Factor centrada ahora es una fila con la perilla y,
      a la derecha, el switch nuevo (`ToggleSwitchGroup`, prop
      `compact`, reutilizado tal cual del que ya existía para Source).

### Verificación de este commit

`py_compile` sobre los 5 archivos backend editados: sin errores de
sintaxis.

Se corrió el test YA EXISTENTE `core/test_motion_magnifier.py` (modo IIR,
sin tocar el archivo) DESPUÉS del refactor de `MotionMagnifier` -- los
factores medidos coinciden EXACTO con los ya documentados antes del
cambio (in-band 10.996x ≈ 11.0x, out-of-band 5.223x ≈ 5.22x), confirmando
que el refactor no alteró el comportamiento del modo IIR.

Se escribió y corrió un script de validación nuevo (no forma parte del
repo, ad-hoc en esta sesión) con la MISMA metodología ya validada del
test existente (amplificación "solo detalle", restando la banda base del
frame de ENTRADA, nunca re-descomponiendo la salida) para medir el modo
`ideal_fft` nuevo: in-band (1.0 Hz) = 11.000x (coincide con el teórico
1+alpha=11x, igual que IIR), out-of-band (4.0 Hz) = 1.000x (prácticamente
anulado -- corte mucho más agudo que el IIR, que dejaba pasar 5.22x, tal
como predice la teoría: un filtro ideal en frecuencia no tiene banda de
transición). Esto confirma que la implementación nueva realmente filtra
como se espera, no solo que corre sin errores.

MD5 de los 8 archivos escritos en el dispositivo de Daniel, verificados
por re-descarga inmediata tras el commit (coinciden con la copia de
referencia, primer intento, sin el bug de reversión de
`device_commit_files`):

- `backend/core/temporal_filter.py` — `60f9464094e7b1e59b11aaccc3ddc530`
- `backend/core/motion_magnifier.py` — `5d5c578144d666a82ddb29074130af3b`
- `backend/api/models.py` — `c297fdcec360e450f40bff2fa85c248f`
- `backend/api/motion_magnifier.py` — `14d16ad7a5f052c1cc90b85c4084ac73`
- `backend/api/live.py` — `8e3dd9fb79278a9329fa33b341bfdf89`
- `frontend/src/lib/api/types.ts` — `f15282a51e5886b84b5e5a8243ff9446`
- `frontend/src/lib/api/validation.ts` — `7e184b827ec178abea6c871df13b0319`
- `frontend/src/sections/modulo-1/Modulo1.tsx` — `7fae3ba0bc7db3cc0a5c65ffde1f1f23`

### Pendiente / honesto

Sigue sin haber `node_modules` en este entorno para correr `npm run
build` o probar visualmente el switch nuevo en el navegador -- la
verificación visual real (que el switch se vea y se comporte como
Daniel pidió, que el resultado se note distinto entre DEFAULT/IDEAL en
pantalla) queda pendiente de que él la corra en su entorno.

### Corrección de layout (mismo commit, reportada por Daniel tras probarlo)

Daniel probó el resultado en su entorno y reportó que agregar
`Pyramid Levels` como fila propia, debajo de Bandpass Low/Source/
Bandpass High, rompía el layout del panel (el contenedor padre,
`EVM Parameter Processor`, es `flex-col justify-between` con altura fija
en `lg:` -- una fila de más lo desbordaba/apretaba). Corrección aplicada
en `frontend/src/sections/modulo-1/Modulo1.tsx`: `SteppedKnob` de
`Pyramid Levels` se movió a la misma fila que `Magnification Factor (α)`
y el switch de `Temporal Filter`, quedando los 3 controles auxiliares
agrupados en una sola fila (`RotaryKnob` α, `ToggleSwitchGroup` filtro
temporal, `SteppedKnob` niveles) en vez de 2 filas separadas. Se eliminó
la fila que había quedado sola debajo del grid de Bandpass/Source. MD5
verificado tras el commit (con 1 retry, mismo bug de reversión de
siempre -- ver Errores y fixes de esta sesión):
`f6234a16fd2fda9bde77cb8a51f4339b`.

### Segunda corrección de layout: reagrupación por tipo de control

Daniel volvió a ver la interfaz desorganizada tras la corrección
anterior y pidió revisar (sin editar todavía) antes de tocar nada de
nuevo. Diagnóstico real, verificado contra los componentes: la fila que
agrupaba α + Temporal Filter + Pyramid Levels mezclaba 3 tamaños muy
distintos -- `RotaryKnob size="lg"` (120px, `RotaryKnob.tsx` línea 75),
`ToggleSwitchGroup compact` (~14px de ancho por palanca) y `SteppedKnob`
(82px fijo, `SteppedKnob.tsx` línea 55) -- con etiquetas de largo
dispar, lo que rompía la alineación visual de la fila.

Propuesta presentada y aprobada por Daniel ("ok aplicalo"): reorganizar
los mismos 6 controles en las mismas 2 filas ya existentes (sin agregar
contenedores nuevos), agrupados por TIPO en vez de por orden de
agregado:

- Fila 1 (perillas continuas, grid parejo de 3 columnas -- mismo grid
  que antes usaba Bandpass/Source): Magnification Factor (α), Bandpass
  Low, Bandpass High. Los 3 son `RotaryKnob`.
- Fila 2 (selectores discretos): Source, Temporal Filter, Pyramid
  Levels.

Dos decisiones de diseño tomadas sin confirmación explícita de Daniel
(ofrecidas como pregunta abierta en el mensaje anterior, pero él
respondió solo "ok aplicalo" sin elegir) -- documentadas aquí para que
las revise, no se asumieron como hechos:

1. `Magnification Factor (α)` bajó de `size="lg"` (120px) al tamaño
   default (`md`, 70px) para quedar igual a Bandpass Low/High dentro de
   la misma fila -- antes dominaba visualmente sobre las otras dos
   perillas.
2. `Source` (`ToggleSwitchGroup`) pasó de su variante grande/default a
   `compact` -- mismo prop que ya usaba `Temporal Filter` -- para que
   ambos switches queden del mismo porte entre sí y no choquen en
   tamaño con `SteppedKnob` (82px) al lado.

Si Daniel prefiere α más grande (`size="lg"`) o Source en su variante
grande original, son cambios de una sola línea cada uno, sin tocar el
resto del layout.

### Verificación de este ajuste

Balance de llaves/paréntesis del archivo verificado por script (127/127,
228/228) antes de desplegar -- no reemplaza un build real de TypeScript
(sigue sin haber `node_modules` en este entorno), pero descarta un error
de sintaxis grosero por una edición mal cerrada. MD5 verificado tras el
commit (con 1 retry, mismo bug de reversión de siempre):
`1ed2d9b5d36e2ec9026ad8f0b706f2fe`.

**Pendiente:** verificación visual real en el entorno de Daniel --
sigue sin poder correrse `npm run build` ni abrir un navegador desde
esta sesión.

### Tercera corrección: bug real de label recortado + tamaño + espaciado

Daniel probó el resultado y reportó 3 problemas: el label de
`Magnification Factor (α)` se veía cortado ("=agnification Factor (α"),
la perilla quedó muy chica, y las filas seguían desperdiciando espacio.
Se investigó cada uno contra el código real antes de tocar nada (a
pedido explícito de Daniel: "Revisa eso").

**Bug real encontrado (no solo percepción):** en la corrección anterior
se le agregó `compactLabel` a la perilla de α para igualarla a Bandpass
Low/High. Ese prop fuerza una sola línea (`whitespace-nowrap`) dentro de
un contenedor fijo `max-w-[120px]` con `overflow-hidden`
(`RotaryKnob.tsx`, líneas 164-171). `"Magnification Factor (α)"` es más
largo que `"Bandpass Low (Hz)"` y no entra en 120px a 9px en una línea
-- como el texto está centrado dentro de esa caja, el recorte se come
simétricamente el principio Y el final, exactamente lo que Daniel
reportó. Corrección: se le sacó `compactLabel` a esta perilla puntual
(vuelve a envolver en 2 líneas, como antes de esa edición) -- Bandpass
Low/High mantienen el prop porque sus labels sí entran bien.

**Tamaño:** `RotaryKnob` ya tenía un prop `diameter` sin usar en este
módulo (`RotaryKnob.tsx`, líneas 51-57, sobrescribe el diámetro
calculado por `size` -- ya usado en Módulo 2 para otro caso) que permite
un valor exacto en vez de solo `md`(70)/`lg`(120). Se usó
`diameter={82}` en la perilla de α para que quede EXACTO al mismo
tamaño fijo que `SteppedKnob` (Pyramid Levels), como pidió Daniel.

**Espaciado:** reducido un escalón en 3 lugares de
`frontend/src/sections/modulo-1/Modulo1.tsx`: contenedor padre del
panel `EVM Parameter Processor` (`p-3 gap-3` → `p-2 gap-2`), fila de
perillas continuas (`p-2 gap-2` → `p-1.5 gap-1.5`), fila de selectores
discretos (`py-3 gap-6` → `py-2 gap-4`).

Balance de llaves/paréntesis verificado por script (128/128, 233/233)
antes de desplegar. MD5 verificado tras el commit (con 1 retry, mismo
bug de reversión de siempre): `bac32fb83c5448d69343b334dbca76ac`.

**Pendiente:** verificación visual real en el entorno de Daniel, mismo
motivo que las correcciones anteriores.

### Cuarta corrección: rediseño de área útil (doble marco, escala, hueco lateral)

Daniel compartió un análisis externo (revisión visual de la UI en
funcionamiento) con 4 críticas y una propuesta de 3 puntos. Se verificó
cada afirmación contra el código real antes de aplicar nada, siguiendo
el mismo criterio que el backlog de Módulo 2/3.

**Confirmado contra el código:** doble capa de tarjetas real -- el
panel `EVM Parameter Processor` (`bg-hud-card`) ya envolvía 2 cajas
grises internas (`bg-rack-bg-deep`, una por fila) con su propio padding
y sombra, un marco duplicado real. Fila de selectores con
`justify-center` dejando espacio vacío a los costados (el análisis
decía "solo a la izquierda"; verificado que con `justify-center` el
hueco debería repartirse simétrico a ambos lados, no solo uno -- se
corrige igual, pero la descripción de "solo izquierda" no se pudo
confirmar como exacta).

**No confirmado / no verificable desde esta sesión:** la cifra "24px a
32px" de padding y el "40% del área" -- los valores reales en el código
antes de este ajuste eran 8px/6px/8px, no 24-32px. Sin un navegador real
acá no se puede medir el "40% del área" -- se avisó a Daniel que esa
cifra específica del análisis externo no se pudo verificar, en vez de
darla por buena.

### Cambios aplicados

- [x] `frontend/src/components/rack/SteppedKnob.tsx`: nuevo prop
      `diameter?: number` (mismo patrón que `RotaryKnob.tsx`), default
      82px sin pasar el prop -- Módulo 2 (Filter Mode) no lo pasa, así
      que su tamaño no cambió.
- [x] `frontend/src/components/rack/RotaryKnob.tsx`: nuevo prop
      `largeReadout?: boolean` que cambia la lectura digital de
      `text-lg` a `text-xl` -- separado de `diameter` a propósito, para
      no afectar Módulo 2 ni `Section1.tsx` (otros llamadores de este
      componente) si solo cambian el diámetro. Default `false`.
- [x] `frontend/src/sections/modulo-1/Modulo1.tsx`: se sacó el fondo
      gris/sombra/padding propio (`bg-rack-bg-deep`, etc.) de las 2
      filas internas -- quedan como agrupadores transparentes, con un
      borde de 1px (`border-b border-white/5`) separando la fila de
      perillas de la fila de selectores, en vez de una segunda caja.
      Las 4 perillas/dial (α, Bandpass Low, Bandpass High, Pyramid
      Levels) subieron a `diameter={100}` (antes 70px default / 82px
      para α y Pyramid Levels -- ahora las 4 son iguales entre sí, ~40%
      sobre el 70px original). α y Bandpass Low/High usan el
      `largeReadout` nuevo. La fila de selectores pasó de
      `flex justify-center` a `grid grid-cols-3` (igual que la fila de
      arriba) para ocupar todo el ancho sin huecos a los costados;
      `Source` y `Temporal Filter` (`ToggleSwitchGroup`) dejaron el
      prop `compact` (ya no hace falta encajar en un espacio angosto
      dentro de un `flex` centrado) para quedar en su variante default,
      más acorde al tamaño más grande del resto de los controles.

### Verificación de este commit

Balance de llaves verificado por script en los 3 archivos (Modulo1.tsx
133/133, RotaryKnob.tsx 57/57, SteppedKnob.tsx 43/43). El conteo de
paréntesis de `SteppedKnob.tsx` dio 62/64 por un motivo identificado y
descartado: una lista en prosa dentro de un comentario preexistente
("1) ... 2) ...", ya en el archivo ANTES de esta edición, no introducida
ahora) usa ")" como numeración, no como paréntesis real -- un chequeo de
profundidad línea por línea confirmó que el código cierra en 0, sin
error de sintaxis real.

MD5 de los 3 archivos, verificados por re-descarga inmediata tras el
commit (coinciden con la copia de referencia, primer intento, sin el
bug de reversión esta vez):

- `frontend/src/components/rack/RotaryKnob.tsx` — `a2cec8578ee17343448d7b82a07b7888`
- `frontend/src/components/rack/SteppedKnob.tsx` — `7b9a58fe548fc1293c300ca6b2dd7cab`
- `frontend/src/sections/modulo-1/Modulo1.tsx` — `5b4b1f2b5b6707d85ce6c78d5a2735c5`

**Pendiente:** verificación visual real en el entorno de Daniel, mismo
motivo que las correcciones anteriores -- particularmente importante
acá porque cambia el "look" del panel (sin las cajas grises internas) y
toca 2 componentes compartidos con Módulo 2.

### Quinta corrección: tamaño Bandpass y contraste de fondo

Daniel: "me gusto tal cual pero" -- dos ajustes finos sobre el resultado
anterior, ambos aplicados directamente (pedidos concretos, sin ambigüedad
de diseño que requiriera presentar opciones):

- [x] `Bandpass Low (Hz)` y `Bandpass High (Hz)` (`RotaryKnob`) bajan de
      `diameter={100}` a `diameter={85}` -- 15% menos, pedido explícito
      de Daniel para diferenciarlas un poco de α y Pyramid Levels (que
      quedan en 100) sin volver al tamaño chico de antes.
- [x] El panel `EVM Parameter Processor` (contenedor que envuelve las 2
      filas de controles) cambia su fondo de `bg-hud-card` (`#181b19`,
      verificado en `index.css` línea 87) a `bg-rack-bg-deep`
      (`#0e0e0e`, línea 67) -- Daniel pidió recuperar "el gris más
      oscuro, el que había antes" para más contraste, tras notar que
      sacar las 2 cajas internas (corrección anterior) había aclarado
      visualmente el panel. Se cambia el fondo del panel ÚNICO, no se
      reintroducen las cajas internas -- mantiene el marco simple de la
      corrección anterior, solo más oscuro.

Balance de llaves/paréntesis verificado por script (134/134, 224/224)
antes de desplegar. MD5 verificado tras el commit (con 1 retry, mismo
bug de reversión de siempre): `96383e7f122635cdb84b821a7fe07798`.

**Pendiente:** verificación visual real en el entorno de Daniel.

### Sexta corrección: contraste de los recuadros internos (Source, Temporal Filter, título del panel)

Daniel: "y los recuadros de Source, Temporal Filter, EVM Parameter
Processor un gris más claro para que se note y ya quedaría" -- efecto
colateral esperable de haber oscurecido el panel exterior en la
corrección anterior: 3 elementos que antes contrastaban contra
`bg-hud-card` quedaron del mismo tono que su nuevo contenedor
`bg-rack-bg-deep` y dejaron de notarse.

### Cambios aplicados

- [x] `frontend/src/components/rack/ToggleSwitchGroup.tsx`: nuevo prop
      `light?: boolean` (default `false`) que cambia el fondo de
      `bg-rack-bg-deep/60` a `bg-hud-card` en las 2 variantes del
      componente (`compact` y default/`large`) -- mismo patrón que
      `diameter` en `RotaryKnob`/`SteppedKnob`: Módulo 2 y Módulo 3
      (que también usan este componente compartido) no pasan el prop,
      así que su apariencia no cambia.
- [x] `frontend/src/sections/modulo-1/Modulo1.tsx`: `Source` y
      `Temporal Filter` (`ToggleSwitchGroup`) pasan `light`. El título
      `EVM Parameter Processor` cambia su fondo de `bg-rack-bg-deep` a
      `bg-hud-card` directamente (contenedor local de este módulo, no
      compartido -- no hizo falta un prop nuevo).

### Verificación de este commit

Balance de llaves/paréntesis verificado por script en ambos archivos
(Modulo1.tsx 135/135, ToggleSwitchGroup.tsx 34/34). MD5 verificado tras
el commit -- primer intento, sin el bug de reversión esta vez:

- `frontend/src/components/rack/ToggleSwitchGroup.tsx` — `4737ee58d3b464dcde8912c8a0166aaf`
- `frontend/src/sections/modulo-1/Modulo1.tsx` — `1e8cb686cc24cb80877cff7b02a1b7b0`

**Pendiente:** verificación visual real en el entorno de Daniel -- esta
ronda de ajustes de contraste (oscurecer el panel, aclarar los 3
recuadros internos) es la que más depende de verse en pantalla real
para confirmar que el balance quedó bien.

### Séptima corrección: coherencia de sombra con VfdMetricCard (Gain/Frecuencia)

Daniel probó el resultado de la sexta corrección y no le gustó: "quiero
que tengan la misma coherencia de las tarjetas de abajo Frecuencia y
gain... porque no pega bien... pero sí necesito el contraste actual".

**Diagnóstico real (verificado contra el código, no supuesto):**
`VfdMetricCard.tsx` (línea 29) usa exactamente el mismo `bg-hud-card`
que ya le había puesto a Source/Temporal Filter/el título en la
corrección anterior -- el color de fondo YA coincidía. La diferencia
real estaba en la sombra: `VfdMetricCard` usa
`shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.6)]`
(inset CLARO sutil + sombra hacia afuera, look "tarjeta elevada"),
mientras que `ToggleSwitchGroup` seguía con su sombra default,
`shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]` (inset OSCURO, look
"hundido/presionado") -- combinada con el fondo claro nuevo, esa
sombra oscura hundida es lo que se veía incoherente, no el color.

### Cambios aplicados

- [x] `frontend/src/components/rack/ToggleSwitchGroup.tsx`: cuando
      `light` es `true` (ambas variantes, `compact` y default/`large`),
      la sombra pasa a ser la misma exacta de `VfdMetricCard` en vez de
      la sombra default del componente. Cuando `light` es `false`
      (Módulo 2/3, que no lo pasan), la sombra queda exactamente igual
      que antes -- sin cambios para esos módulos.
- [x] `frontend/src/sections/modulo-1/Modulo1.tsx`: el título `EVM
      Parameter Processor` (que no tenía ninguna sombra antes) recibe
      la misma sombra de `VfdMetricCard` para quedar coherente con
      Source/Temporal Filter y con Gain/Frecuencia.
- Contraste: sin cambios -- ambos siguen en `bg-hud-card`, el gris
  claro que Daniel pidió mantener.

### Verificación de este commit

Balance de llaves/paréntesis verificado por script en ambos archivos
(Modulo1.tsx 135/135, ToggleSwitchGroup.tsx 34/34). MD5 verificado tras
el commit -- primer intento, sin el bug de reversión esta vez:

- `frontend/src/components/rack/ToggleSwitchGroup.tsx` — `89bb8e777b17e1109b317c8c2494b6ae`
- `frontend/src/sections/modulo-1/Modulo1.tsx` — `5fccc43d4fe4892c7c9a1974efddaeee`

**Pendiente:** verificación visual real en el entorno de Daniel.

### Octava corrección: marco de Pyramid Levels (crítica externa pegada por Daniel)

Daniel pegó un texto de "indicaciones exactas para el desarrollador"
(análisis externo) pidiendo 4 cosas: (1) aplicar un "borde gris claro
estandarizado" a EVM Parameter Processor y sub-tarjetas igual al de
FRECUENCIA, (2) encapsular Pyramid Levels con el mismo marco que
Source/Temporal Filter, (3) estandarizar el borde de las cajas de
lectura numérica, (4) igualar el tono de fondo.

**Verificación real contra el código (no se aceptó el texto tal
cual):**

- Puntos 1 y 3 (bordes `border-neutral-700`/`border-white/10`):
  **falsos contra el código actual.** `VfdMetricCard.tsx` (Gain/
  Frecuencia) no tiene ninguna clase `border` -- ni ese componente ni
  el `RotaryKnob` de la caja de lectura. El aspecto de "borde gris
  claro" que se percibe viene del inset claro sutil de la sombra
  (`shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),...]`), no de un
  borde real. Se verificó con `grep` en todo `components/rack/` que
  ningún borde de ese tipo existe en `VfdMetricCard` ni en el
  `RotaryKnob`. No se inventó un borde nuevo solo porque el texto
  externo lo daba por hecho.
- Punto 4 (tono de fondo uniforme): ya estaba resuelto desde la Sexta/
  Séptima corrección (`bg-hud-card` en Source/Temporal Filter/título,
  mismo token que Gain/Frecuencia).
- Punto 2 (Pyramid Levels sin marco): **real y verificado.** Source y
  Temporal Filter (vía el prop `light` de `ToggleSwitchGroup`) tienen
  su propio contenedor `bg-hud-card` + sombra; `SteppedKnob` (Pyramid
  Levels) no tenía ningún `<div>` contenedor, flotaba directo sobre el
  panel `bg-rack-bg-deep`.

Se presentaron 2 caminos a Daniel: envolver Pyramid Levels con el
mismo `bg-hud-card` + sombra que ya usan Source/Temporal Filter (sin
inventar ningún borde nuevo), o agregar un borde real nuevo a las 4
cajas (incluyendo `VfdMetricCard`, que usan otros paneles). Daniel
eligió la primera opción.

### Cambios aplicados

- [x] `frontend/src/sections/modulo-1/Modulo1.tsx`: `SteppedKnob`
      (Pyramid Levels) se envolvió en un `<div>` con las mismas clases
      EXACTAS que usa `ToggleSwitchGroup` en su variante `light`
      no-`large` (`bg-hud-card`, `shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.6)]`,
      `rounded`, `px-3 py-2`, `flex flex-col items-center gap-2`) --
      ningún valor nuevo, solo reutilización de un estilo que ya existe
      en el proyecto.
- [x] `frontend/src/components/rack/SteppedKnob.tsx`: **sin cambios**
      -- el envoltorio va solo en el call site de Módulo 1, así que
      Módulo 2 (Filter Mode, que no envuelve su `SteppedKnob`) no se ve
      afectado.
- No se agregó ningún borde nuevo (puntos 1 y 3 del texto externo
  descartados por ser falsos contra el código real).

### Verificación de este commit

Balance de llaves/paréntesis verificado por script (`Modulo1.tsx`
136/136 llaves, 233/233 paréntesis). MD5 verificado tras el commit --
necesitó 1 retry (mismo bug de reversión silenciosa de siempre en este
archivo, ya visto varias veces esta sesión):

- `frontend/src/sections/modulo-1/Modulo1.tsx` — `df99cb82a0ba9aadd0e69fca712dda4d`

**Pendiente:** verificación visual real en el entorno de Daniel.

### Revertida: Octava corrección deshecha a pedido de Daniel

Daniel probó el resultado en su entorno y no le gustó: "esta mal no
quiero eso deshazlo". No especificó qué exactamente estaba mal
visualmente (no se le preguntó, fue una instrucción directa e
inequívoca de deshacer) -- se revirtió el cambio completo sin dejar
ningún resto de la Octava corrección.

### Cambios aplicados

- [x] `frontend/src/sections/modulo-1/Modulo1.tsx`: se quitó el
      `<div>` envoltorio (`bg-hud-card` + sombra) que envolvía
      `SteppedKnob` (Pyramid Levels) -- vuelve exactamente al estado
      previo a la Octava corrección. `Pyramid Levels` vuelve a estar
      sin marco propio, igual que antes de esa ronda.
- `frontend/src/components/rack/SteppedKnob.tsx`: no tuvo cambios en
  la Octava corrección, así que tampoco necesita revertirse.

### Verificación de este commit

Balance de llaves/paréntesis verificado por script (`Modulo1.tsx`
135/135 llaves, 228/228 paréntesis -- mismo conteo que antes de la
Octava corrección). MD5 verificado tras el commit -- coincide
exactamente con la versión previa a la Octava corrección
(confirmando que el revert es byte-exacto, no una reescritura
aproximada), primer intento sin retry:

- `frontend/src/sections/modulo-1/Modulo1.tsx` — `5fccc43d4fe4892c7c9a1974efddaeee`

**Pendiente:** confirmar con Daniel qué específicamente no le gustó de
este ajuste, por si hay una alternativa distinta que sí sirva para
Pyramid Levels.

### Novena corrección: borde real `border-hud-border` en EVM Parameter Processor

Daniel dio instrucciones explícitas y exactas (no un texto externo
pegado esta vez): agregar un "borde fino gris claro" real a (1) el
contenedor exterior del panel EVM Parameter Processor, (2) las 3
sub-tarjetas Source/Temporal Filter/Pyramid Levels (encapsulando esta
última, que seguía sin marco tras el revert de la Octava corrección),
y (3) las cajas de lectura digital de las 3 perillas (α, Bandpass Low,
Bandpass High).

**Token de color usado:** Daniel no especificó el tono exacto. Se le
propuso reutilizar `--color-hud-border` (`#2b322d`), el único token de
borde "gris" que ya existe en el proyecto (lo usa `RackChassis.tsx`
para el marco exterior de todo el módulo) en vez de inventar un valor
nuevo -- confirmado por Daniel ("aplicalo") antes de tocar código.

### Cambios aplicados

- [x] `frontend/src/sections/modulo-1/Modulo1.tsx`: el panel exterior
      ("EVM Parameter Processor") recibe `border border-hud-border`.
      Las 3 `RotaryKnob` (α, Bandpass Low, Bandpass High) reciben el
      nuevo prop `readoutBordered`. `SteppedKnob` (Pyramid Levels)
      vuelve a envolverse en un `<div>` local `bg-hud-card border
      border-hud-border shadow-[...]` -- mismo patrón que la Octava
      corrección (revertida), esta vez con el borde real pedido.
- [x] `frontend/src/components/rack/ToggleSwitchGroup.tsx`: la
      variante `light` (única que usan Source/Temporal Filter) agrega
      `border border-hud-border`. La variante default (`light=false`)
      no cambia -- Módulo 2/3 no se ven afectados.
- [x] `frontend/src/components/rack/RotaryKnob.tsx`: nuevo prop
      opcional `readoutBordered?: boolean` (default `false`) que
      agrega `border border-hud-border` a la caja de lectura digital.
      Módulo 2/`Section1.tsx` no lo pasan, así que su caja de lectura
      no cambia.
- `frontend/src/components/rack/SteppedKnob.tsx`: sin cambios -- el
  envoltorio va solo en el call site de Módulo 1.

### Verificación de este commit

Balance de llaves/paréntesis verificado por script en los 3 archivos
editados (`Modulo1.tsx` 137/137 llaves 234/234 paréntesis,
`ToggleSwitchGroup.tsx` 34/34 / 52/52, `RotaryKnob.tsx` 58/58 / 81/81).
MD5 verificado tras el commit -- los 3 archivos coincidieron en el
PRIMER intento, sin el bug de reversión esta vez:

- `frontend/src/sections/modulo-1/Modulo1.tsx` — `f871a640b72ab294dd8740f2b18eed16`
- `frontend/src/components/rack/ToggleSwitchGroup.tsx` — `b62d84c89288eb2ba6460265cf33d969`
- `frontend/src/components/rack/RotaryKnob.tsx` — `d1401b9c23cb195a1b8ebab3515d9863`

**Pendiente:** verificación visual real en el entorno de Daniel.

### Décima corrección: fondo oscuro + borde grueso en todo EVM Parameter Processor

Daniel pidió, tras revisar la tarjeta `VfdMetricCard` (Frecuencia/Gain)
y confirmar que no tiene borde real, un tratamiento uniforme para TODO
el bloque de "EVM Parameter Processor": título, las 3 cajas de lectura
(α/Bandpass Low/Bandpass High), Source, Temporal Filter y Pyramid
Levels -- "borde gris medio ancho y fondo oscuro", con Source/Temporal
Filter en particular pidiendo "negro oscuro para mas contraste".

**Conflicto real marcado antes de aplicar:** esto revierte
textualmente la Sexta corrección de esta sesión (fondo claro
`bg-hud-card` en esos mismos elementos, pedida explícitamente por
Daniel en ese momento porque el fondo oscuro se perdía contra el
panel). Se le presentó este conflicto a Daniel explícitamente antes de
tocar código -- confirmó que quiere el reemplazo: con el borde real ya
puesto (Novena corrección), el fondo oscuro ya no se pierde, el borde
cumple ahora el rol de diferenciarlo que antes cumplía el fondo claro.

### Cambios aplicados

- [x] `frontend/src/sections/modulo-1/Modulo1.tsx`:
  - Panel exterior: borde `border` (1px) → `border-2` (2px).
  - Título "EVM Parameter Processor": ganó `border-2 border-hud-border`
    (no tenía borde antes) y su fondo pasó de `bg-hud-card` a
    `bg-rack-bg-deep`.
  - Envoltorio de `SteppedKnob` (Pyramid Levels): fondo `bg-hud-card` →
    `bg-rack-bg-deep`, borde `border` → `border-2`.
- [x] `frontend/src/components/rack/ToggleSwitchGroup.tsx`: la
  variante `light` (Source/Temporal Filter) cambia su fondo de
  `bg-hud-card` a `bg-rack-bg-deep` y su borde de `border` a
  `border-2`, en ambas ramas (`compact` y default/`large`). La
  variante default (`light=false`) no cambia -- Módulo 2/3 no se ven
  afectados. El nombre del prop `light` queda desactualizado respecto
  a lo que hace ahora (ya no aclara un fondo "claro"), documentado en
  el JSDoc para no perder el porqué.
- [x] `frontend/src/components/rack/RotaryKnob.tsx`: el borde de
  `readoutBordered` sube de `border` a `border-2`. Módulo 2/
  `Section1.tsx` no pasan este prop, sin cambios para ellos.

### Verificación de este commit

Balance de llaves/paréntesis verificado por script en los 3 archivos
(`Modulo1.tsx` 137/137 llaves 237/237 paréntesis,
`ToggleSwitchGroup.tsx` 34/34 / 55/55, `RotaryKnob.tsx` 58/58 / 82/82).
MD5 verificado tras el commit -- los 3 archivos coincidieron en el
PRIMER intento:

- `frontend/src/sections/modulo-1/Modulo1.tsx` — `c28619d2ba44dae598fcc737e90cace5`
- `frontend/src/components/rack/ToggleSwitchGroup.tsx` — `aee46eab82ab77b7804335f8172abbcc`
- `frontend/src/components/rack/RotaryKnob.tsx` — `a9cb723fbb8d94278494fdf4ac9f4c4f`

**Pendiente:** verificación visual real en el entorno de Daniel.

### Undécima corrección: patrón real de VfdMetricCard aplicado al panel completo (reemplaza Novena y Décima)

Daniel marcó que las 2 rondas anteriores (Novena: bordes finos sueltos;
Décima: fondo oscuro + borde grueso) "no estuvo ni cerca". El pedido
real: la tarjeta que encierra TODO el panel (título + 3 perillas +
Source/Temporal Filter/Pyramid Levels + Execute/Stop) debe copiar el
estilo de `VfdMetricCard` (Gain/Frecuencia) -- no bordes sueltos en
cada elemento.

**Diagnóstico correcto contra el código real de `VfdMetricCard.tsx`:**
el patrón real es de 2 niveles, SIN ningún borde: una tarjeta exterior
CLARA (`bg-hud-card` + `shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.6)]`,
look "elevado") que contiene una caja interior OSCURA "hundida"
(`bg-rack-bg-deep` + `shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]`). El
aspecto de "borde" nunca fue un `border` real -- es el contraste entre
esos 2 niveles. Además, pedido explícito adicional: Source/Temporal
Filter usan `bg-black` (más oscuro que el `bg-rack-bg-deep` del resto)
para más contraste.

### Cambios aplicados

- [x] `frontend/src/sections/modulo-1/Modulo1.tsx`:
  - Panel exterior: de `border-2 border-hud-border bg-rack-bg-deep
    shadow-[inset_0_2px_4px...]` → `bg-hud-card
    shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.6)]`
    (la sombra EXACTA de la tarjeta exterior de `VfdMetricCard`), sin
    borde.
  - Título "EVM Parameter Processor": de `border-2 border-hud-border
    bg-rack-bg-deep shadow-[inset_0_1px_2px...]` (sombra "elevada"
    incorrecta sobre fondo oscuro) → `bg-rack-bg-deep
    shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]` (sombra "hundida"
    correcta, la de la caja de valor de `VfdMetricCard`), sin borde.
  - Envoltorio de `SteppedKnob` (Pyramid Levels): mismo cambio que el
    título -- `bg-rack-bg-deep` + sombra hundida, sin borde.
  - Las 3 `RotaryKnob` (α, Bandpass Low, Bandpass High): se les quitó
    el prop `readoutBordered` (ya no se pasa).
- [x] `frontend/src/components/rack/ToggleSwitchGroup.tsx`: la
  variante `light` (Source/Temporal Filter) cambia de `bg-rack-bg-deep
  border-2 border-hud-border shadow-[inset_0_1px_2px...]` a `bg-black
  shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)]` -- fondo negro puro (más
  oscuro que el resto del panel, pedido explícito de Daniel), sombra
  hundida, sin borde. Precedente: `bg-black` ya se usa en
  `CrtMonitor.tsx` y `Landing.tsx`, no es un valor nuevo inventado. La
  variante default (`light=false`) no cambia -- Módulo 2/3 no se ven
  afectados.
- [x] `frontend/src/components/rack/RotaryKnob.tsx`: se **eliminó**
  por completo el prop `readoutBordered` (ya no tenía ningún uso tras
  quitarlo de `Modulo1.tsx`) -- código muerto removido, no solo
  desactivado. La caja de lectura vuelve a su estado original (mismo
  MD5 que la Cuarta corrección: `a2cec8578ee17343448d7b82a07b7888`),
  que ya coincidía con el patrón de `VfdMetricCard` desde el principio.
- `frontend/src/components/rack/SteppedKnob.tsx`: sin cambios.

### Verificación de este commit

Balance de llaves/paréntesis verificado por script en los 3 archivos
(`Modulo1.tsx` 137/137 llaves 235/235 paréntesis, `ToggleSwitchGroup.tsx`
34/34 / 53/53, `RotaryKnob.tsx` 57/57 / 78/78). Se verificó con `grep`
que `readoutBordered` no queda referenciado en ningún archivo del
proyecto. MD5 verificado tras el commit -- los 3 archivos coincidieron
en el PRIMER intento:

- `frontend/src/sections/modulo-1/Modulo1.tsx` — `f73a4d9dccfc5afaf69c79d74d54c011`
- `frontend/src/components/rack/ToggleSwitchGroup.tsx` — `f896736e4f56b212543f0b7511966599`
- `frontend/src/components/rack/RotaryKnob.tsx` — `a2cec8578ee17343448d7b82a07b7888`

**Pendiente:** verificación visual real en el entorno de Daniel.

## Backlog de mejoras propuestas — Módulo 2 y Módulo 3 (pendientes de implementación, sin aprobación de código todavía)

**Contexto:** Daniel compartió dos textos de análisis externos (revisiones visuales de la UI en funcionamiento) proponiendo mejoras para Módulo 2 (2D-FFT Spectrum Cleaner) y Módulo 3 (Phase Correlator). Antes de agregar nada al código se verificó cada afirmación línea por línea contra el código real (`core/fft_filters.py`, `api/spectrum_cleaner.py`, `Modulo2.tsx`, `core/phase_correlation.py`) -- varias resultaron ser correcciones válidas de UI/nombres, y varias resultaron ser afirmaciones FALSAS sobre lo que el sistema realmente hace (no hay detección automática de picos, no hay pre-acondicionamiento por fuente, no se encontró el bug de unidad reportado). Se documentan aquí todas, marcando claramente cuáles están confirmadas y cuáles fueron descartadas, para no perder el registro de esta auditoría. NINGUNA de estas mejoras se implementó todavía -- son propuestas a futuro, pendientes de que Daniel confirme cuáles ejecutar.

### Módulo 2 — 2D-FFT Interactive Spectrum Cleaner

**Confirmadas como mejoras válidas (verificadas contra el código real):**

- [ ] **M2-1 — Renombrar/clarificar `Reduction %`.** Verificado en `api/spectrum_cleaner.py` (líneas 43-47): `reduction_percent = (1 - energy_after/energy_before) * 100`, donde `energy_before`/`energy_after` son la suma de `magnitude_before`/`magnitude_after` -- pero esos valores NO son magnitud FFT cruda, son `log1p(|F|)` normalizado a [0,1] de forma INDEPENDIENTE en cada llamada (`core/fft_filters.py`, `compute_spectrum`, líneas 29-33) -- "antes" y "después" se normalizan cada uno contra su propio máximo, no contra una escala común. No es energía espectral cruda, ni dB, ni varianza de imagen. Propuesta: renombrar a algo como `Spectral Magnitude Reduction %` (no `Noise Energy Reduction`, que sobre-promete que aísla ruido puro) y opcionalmente agregar un tooltip con la fórmula real.
- [ ] **M2-2 — Visualizar la máscara `H(u,v)` aislada.** Confirmado que hoy NO se codifica ni se envía -- `spectrum_cleaner.py` (líneas 30-36) solo la usa internamente para filtrar. Implementación: codificar `mask` con `array_to_png_base64`/`array_to_jpeg_base64` (mismo patrón que las demás imágenes) y agregar un campo nuevo a `SpectrumCleanerResponse`/`SpectrumCleanerLiveResult`.
- [ ] **M2-3 — Lectura cartesiana (u,v) normalizada junto al `RadarPad`.** Confirmado que el par `(u0, v0)` ya se calcula en el frontend (`buildNotchParams`, `Modulo2.tsx` líneas 89-100) antes de enviarlo al backend, pero no se muestra en pantalla (solo Radio/Ángulo). Mejora trivial: mostrar el valor ya calculado, sin tocar el backend.

**Afirmaciones descartadas (verificadas como FALSAS contra el código real, documentadas para no reabrirlas sin motivo):**

- [x] **M2-4 (descartada) — `PEAK COUNT` NO es detección automática de armónicos.** Verificado en `Modulo2.tsx` línea 332: `activeNotchCount = notches.filter((n) => n.enabled).length` -- es el conteo de notches MANUALES que el usuario configuró y activó, no hay ningún algoritmo de detección de picos en `fft_filters.py` ni en `spectrum_cleaner.py`. El diccionario `SPECTRUM_ASSET_NOISE_PEAKS` en `assets.py` existe pero está comentado explícitamente como "informativo, ningún router lo usa hoy" -- confirmado sin uso real.
- [x] **M2-5 (descartada) — El selector `SOURCE` NO aplica pre-filtros de acondicionamiento por tipo de asset.** `load_spectrum_asset` (`assets.py`) solo carga/genera la imagen; el pipeline de filtrado es idéntico para cualquier asset. Además, las opciones reales (`Modulo2.tsx` líneas 33-37) son `SYN`/`MESH`/`HALF` -- no existe una opción `POS` como decía el texto original.
- [x] **M2-6 (descartada) — No se encontró el bug de unidad `CUTOFF RADIUS (DB)`.** El label real en el código (`Modulo2.tsx` línea 538) es `"Cutoff Radius (d0)"` -- coincide con el nombre real del parámetro (`NotchParams.d0`), no dice `(DB)` en ningún lugar del código fuente actual. Si Daniel lo ve distinto en pantalla, sería un problema de render/fuente a investigar con una captura real, no un string incorrecto en el código.

**Confirmada como exacta (sin cambios necesarios):** la navegación individual de notches (`NOTCH #N ON/OFF`, dial ligado al notch activo vía `activeIndex`) ya funciona tal como se describió -- no requiere ninguna acción.

### Módulo 3 — Sub-Pixel Phase Correlator

- [ ] **M3-1 — PSR (Peak-to-Sidelobe Ratio), riesgo bajo.** `PSR = (pico - media_sidelobe) / desviación_std_sidelobe` (mismo criterio que el tracker MOSSE, Bolme et al.), calculado excluyendo una ventana pequeña alrededor del pico real. Archivos: `core/phase_correlation.py` (nueva función `peak_to_sidelobe_ratio(correlation, py, px, exclude_radius=5)`, con manejo de wraparound en los bordes), `api/phase_correlator.py`/`api/live.py` (se llama junto a `peak_confidence`, mismos `py`/`px`/`correlation`), `api/models.py`/`types.ts` (nuevo campo `psr: float`), `Modulo3.tsx` (se agrega al label del Signal Monitor, junto a `CONFIDENCE`). Punto abierto: `exclude_radius` es una decisión de ingeniería, no un estándar universal -- ajustable con feedback visual real, mismo criterio que `gamma`.
- [ ] **M3-2 — Etiqueta del método sub-píxel, trivial.** Solo frontend: texto estático en el panel "Phase Correlator Processor" (ej. `SUBPIXEL METHOD: FOROOSH-ZERUBIA-BERTHOD`) -- dato ya real y verificado (`subpixel_refine_1d`), jerga técnica, no entra al diccionario i18n. Cero riesgo, no toca cálculo.
- [x] **M3-3 (descartada) — Ventaneo Hann real, medido y rechazado.** Se implementó y corrió `test_phase_correlation.py::test_desplazamientos_conocidos` localmente (no en la máquina de Daniel) ANTES de aplicar nada a producción, tal como exige el protocolo -- no se asumió que funcionaba. Resultado real: con `cross_power_spectrum` ventaneando `img1`/`img2` (`np.outer(np.hanning(h), np.hanning(w))`), el caso de desplazamiento entero exacto `(5.0, -5.0)` pasa de error `0.000` px (código actual, sin ventaneo) a error `0.500` px -- justo en el borde de `ERROR_MAX_PX=0.5`, rompiendo la aserción estricta (`<`, no `<=`). Se investigó además una variante más suave (ventaneo Tukey, `alpha` ajustable entre 0 y 1, implementado a mano con NumPy -- verificado contra `scipy.signal.windows.tukey`, diff ~1e-15, sin agregar `scipy` como dependencia nueva -- no está instalado en el `.venv` real de Daniel). Resultado: el fallo NO es gradual ni depende de qué tan suave sea el ventaneo -- con `alpha=0.001` (prácticamente sin atenuación) el mismo caso ya falla igual que con `alpha=1.0` (Hann completo). Causa raíz real: en un desplazamiento entero exacto, `subpixel_refine_1d` decide entre el vecino `+1`/`-1` comparando cuál es mayor -- sin ventaneo, ambos vecinos quedan casi perfectamente empatados en cero (pico limpio); con CUALQUIER ventaneo, ese empate se rompe lo suficiente para que el estimador "elija bando" y calcule un `arcsin` con ratio cercano a 1, dando siempre exactamente 0.5 px de error. No es un problema de magnitud de ventaneo, es una incompatibilidad estructural entre el ventaneo (cualquiera) y el estimador subpíxel de 2 puntos en ese caso límite. **Descartada por decisión de Daniel** tras ver los números reales -- no se aplicó ningún cambio a `core/phase_correlation.py`.
- [x] **M3-4 (descartada) — Rotación/Escala vía Fourier-Mellin, medida y rechazada.** Daniel decidió NO usar `cv2.warpPolar` (rompería la premisa central del proyecto, ROADMAP.md línea 15: "implementación propia... no wrappers prehechos para el núcleo algorítmico"), así que se implementó el remapeo log-polar a mano con NumPy puro (interpolación bilineal propia, `_bilinear_sample`) en un `core/fourier_mellin.py` de prueba, NUNCA aplicado al proyecto real. Validado con rotaciones conocidas de antemano sobre una imagen con estructura direccional real (no la imagen isotrópica de `test_phase_correlation.py`, que no sirve para esto -- su espectro no tiene información angular). Resultado del primer intento: error grande e inconsistente en varios casos (ej. `5° → est. 181.4°`) -- causa raíz real identificada, no asumida: la magnitud del espectro de una imagen real es simétrica bajo 180° (`|F(-u,-v)| = |F(u,v)|`, simetría de Friedel), así que hay una ambigüedad de ±180° inherente al método, documentada en la literatura de Fourier-Mellin. Se agregó el paso de desambiguación estándar (calcular los dos candidatos `theta`/`theta+180`, deshacer cada uno sobre la imagen y quedarse con el que da mejor pico de correlación directa) -- mejoró varios casos (5 de 9 con error <4°) pero **3 de 9 casos siguieron fallando con más de 60° de error**, sin relación con la ambigüedad de 180° (ya corregida) -- indica un problema más profundo (el eje radial del remapeo log-polar no es periódico, pero la correlación de fase basada en FFT asume que sí lo es). Se intentó corroborar con `cv2.warpPolar` como referencia externa (nunca para producción, solo diagnóstico) pero el propio arnés de comparación mostró un bug de convención de ejes (`est_scale` absurdo, ej. `7.25`, en una prueba de solo rotación donde debía dar `~1.0`) -- la comparación no llegó a ser concluyente. **Descartada por decisión de Daniel** tras ver que ya eran dos intentos reales (M3-3 con ventaneo, M3-4 con Fourier-Mellin) fallando en validación medida -- ningún archivo del proyecto real fue modificado.
- [ ] **M3-5 — Malla 3D de la superficie de correlación, riesgo alto -- BLOQUEADA, pendiente de acción de Daniel.** Requiere una librería 3D nueva en el frontend (ej. Three.js), no instalada hoy en el proyecto. Se puede escribir el componente (`CorrelationSurface3D.tsx`, reutilizando la imagen del pico ya codificada como mapa de altura vía `canvas.getImageData`, sin mandar un array numérico nuevo por la red) y el `import` correspondiente, pero esta sesión no puede correr `npm install` en la máquina de Daniel (el bridge de dispositivo aquí es solo de copia de archivos, sin shell remoto) -- Daniel tendría que correr `npm install three` (o el paquete que se defina) él mismo antes de que el proyecto compile con este cambio.

**Nota honesta:** ninguno de los 8 ítems de este backlog (M2-1/2/3, M3-1/2/3/4/5) se implementó en esta fase -- es documentación de la auditoría y el plan, pendiente de que Daniel confirme cuáles ejecutar y en qué orden.

---

## Backlog de mejoras propuestas — Módulo 1 (pendientes de implementación, sin aprobación de código todavía)

**Contexto:** mismo procedimiento que el backlog de Módulo 2/3 -- Daniel compartió un análisis externo de la UI de Módulo 1 en funcionamiento. Se verificó cada afirmación contra el código real (`Modulo1.tsx`, `CrtMonitor.tsx`, `Oscilloscope.tsx`, `RackChassis.tsx`, `core/motion_magnifier.py`, `core/temporal_filter.py`) antes de documentar nada. Varias observaciones sobre el estado actual resultaron incorrectas (SOURCE mal identificado, artefacto de scanlines mal interpretado, color de botón STOP incorrecto), y una de las propuestas de mejora ("Corrección de idioma") CONTRADICE una decisión explícita de Daniel de la Fase 8.28 -- se documenta como conflicto abierto, no se aplica. Ninguna mejora de este backlog se implementó todavía.

### Observaciones sobre el estado actual -- verificación

**Confirmadas como exactas:**
- [x] Ecosistema `CH-01`/`CH-02`/`CH-03` -- correcto en esencia, con una corrección de nombre: el título real de Módulo 2 es `"Spectrum Cleaner Console"`, no `"Cleaver"`.
- [x] `SWEEP: 50 ms/DIV` -- confirmado exacto y funcional. `Oscilloscope.tsx` línea 36: `sweepMs = 400` (8 divisiones × 50 ms/DIV), coincide con la rejilla real de 9 líneas verticales y las etiquetas 0/200ms/400ms.
- [x] `GAIN` duplica `MAGNIFICATION FACTOR (α)`, y `FRECUENCIA` resume `BANDPASS LOW`/`HIGH` -- confirmado, mismo estado (`alpha`, `fLow`, `fHigh`) mostrado en dos controles distintos (`Modulo1.tsx`, líneas 368-369 y 386-441). Nota: puede ser redundancia intencional de diseño de instrumento real (dial + lectura digital), no necesariamente un defecto.

**Descartadas (verificadas como incorrectas contra el código real):**
- [x] (descartada) `SOURCE` `SYN`/`EYE`/`SKIN` con "perfiles de filtrado optimizados por fuente (ocular vs rPPG facial)". Las opciones reales (`Modulo1.tsx` líneas 20-24) son `SYN`/`EYE`/`VIB` -- la tercera es `real_speaker_vibration` (vibración de un parlante), no piel/hemodinámica facial. Verificado en `motion_magnifier.py`/`temporal_filter.py`: no existe ningún perfil de filtrado condicionado por tipo de fuente, el pipeline es idéntico para cualquier asset.
- [x] (descartada) Scanlines como "simulación de rolling shutter / artefacto de la amplificación". Es un overlay CSS constante (`CrtMonitor.tsx`, líneas 87-94) aplicado a TODA pantalla del CRT en los 3 módulos, en cualquier estado (ORIGINAL o LIVE) -- estética retro fija, no un efecto del algoritmo. La miniatura no lo muestra solo porque es un `<div>` separado renderizado después en el DOM (por encima de esa capa), no por ningún procesamiento distinto.
- [x] (descartada) Botón `STOP` en paleta naranja/ámbar. Verificado: usa `text-hud-error` con sombra `rgba(220,38,38,...)` -- rojo, no naranja/ámbar, igual en los 3 módulos.
- [x] (descartada, parcialmente) Panel lateral oculto para "configuraciones avanzadas o exportación de logs". Es casi con certeza el `NavDrawer` ya construido en la Fase 8.27/8.28 (Home + selector de idioma + lista de módulos) -- no es un panel nuevo ni de logs. No se verificó el lado exacto (izquierda/derecha) en este repaso.

### Mejoras propuestas -- Controles del Algoritmo EVM

- [ ] **M1-1 — Selección de método Linear (Wu et al.) vs Phase-Based (Wadhwa et al., Complex Steerable Pyramids), riesgo alto.** Hoy SOLO existe el método lineal (`core/pyramids.py`, pirámide Laplaciana). El método de fase es un algoritmo nuevo completo (descomposición piramidal compleja + unwrapping de fase), esfuerzo alto, posible dependencia nueva -- no es un simple conmutador.
- [ ] **M1-2 — Nivel de pirámide espacial (ℓmin-ℓmax) configurable, riesgo medio.** Hoy `levels=3` está FIJO en código (`MotionMagnifier`, instanciado así desde `api/live.py`/`api/motion_magnifier.py`), no expuesto al usuario. Exponerlo es esfuerzo moderado -- pendiente verificar `core/pyramids.py` en detalle para confirmar que soporta bien un rango de niveles específico antes de prometer el alcance exacto.
- [ ] **M1-3 — Arquitectura del filtro temporal seleccionable (`Ideal FFT`/`Butterworth`/`IIR`), riesgo alto -- con corrección de planteamiento.** El filtro YA es IIR (`core/temporal_filter.py`, confirmado en su propio docstring) -- no es algo por agregar, es lo único que existe hoy. Agregar `Ideal FFT` como alternativa SÍ sería nuevo, y requeriría cambiar de arquitectura streaming (sin buffer) a acumular una ventana completa de frames -- el propio código documenta por qué se eligió IIR justamente para evitar eso.

### Mejoras propuestas -- Análisis de Señal e Instrumental

- [ ] **M1-4 — Estimador `EST. PULSE: BPM`, riesgo bajo -- con aclaración honesta necesaria.** Fácil de calcular (`(f_low+f_high)/2 * 60`), pero no sería una detección real de pulso -- solo convertiría la banda YA CONFIGURADA a BPM, igual de "configurado, no medido" que la tarjeta `Frecuencia` actual. Debe etiquetarse de forma que no sugiera medición real.
- [ ] **M1-5 — PSD/FFT del trazo temporal en el Signal Monitor, riesgo medio-alto.** Requiere un buffer temporal nuevo que hoy NO existe -- el filtro IIR es streaming puro, sin historial (`temporal_filter.py`, confirmado en su docstring: "no hace falta un buffer de video completo"). Implica agregar acumulación de una señal medida (ej. intensidad promedio de una región) a lo largo del tiempo antes de poder calcular su FFT.
- [ ] **M1-6 — ROI Selector (córnea/esclerótica/tejido periorbital), riesgo alto.** Hoy el algoritmo procesa el frame COMPLETO sin ninguna región ni máscara (`core/motion_magnifier.py`, `process_frame`). Funcionalidad nueva real: selector interactivo en frontend + lógica de recorte/máscara en backend.

### Mejoras propuestas -- Supresión de Ruido y Pulido UI

- [ ] **M1-7 — Máscara de umbralización de movimiento (spatial masking), riesgo alto.** Relacionada con M1-6 -- requeriría lógica de enmascarado por región/desplazamiento dentro de `process_frame`, hoy inexistente. Funcionalidad nueva real.
- [ ] **M1-8 — "Corrección de idioma": `FRECUENCIA` → `FREQUENCY`, CONFLICTO ABIERTO, no se aplica sin confirmación explícita.** Esta propuesta contradice una decisión ya tomada por Daniel en la Fase 8.28: `translations.ts` documenta que `"Frecuencia"` se dejó A PROPÓSITO sin traducir, como jerga técnica (mismo criterio que `"Gain"`), por instrucción explícita de Daniel ("mantengamos la jerga técnica como está por default"). No se implementa a menos que Daniel confirme que quiere revertir esa decisión específica.

**Nota honesta:** ninguno de los 8 ítems de este backlog (M1-1 a M1-8) se implementó en esta fase -- es documentación de la auditoría y el plan, pendiente de que Daniel confirme cuáles ejecutar y en qué orden, y de que resuelva el conflicto abierto de M1-8 antes de tocarlo.

**Explicación beneficio/costo de M1-1, M1-6, M1-7 (turno de chat, verificado contra `core/motion_magnifier.py`/`core/pyramids.py` reales antes de explicar -- NINGUNA se implementó):**

- **M1-1:** beneficio -- el método de fase (Wadhwa et al.) amplifica desplazamiento en vez de intensidad de píxel, típicamente menos ruido en movimientos muy pequeños (el caso de uso real de este módulo). Costo -- no reemplaza el lineal, se agregaría como segunda opción; requiere una pirámide compleja (steerable pyramids) nueva desde cero + unwrapping de fase, posible dependencia nueva sin confirmar en `requirements.txt`. La más pesada de las tres.
- **M1-6:** beneficio -- evita amplificar ruido fuera de la región clínica de interés y reduce cómputo real (pirámide solo sobre la región recortada). Costo -- cruza frontend (selector interactivo nuevo) y backend (`api/models.py`, `motion_magnifier.py` Y `live.py`, porque ambos instancian `MotionMagnifier`); no elimina el modo full-frame actual, quedaría como default sin ROI.
- **M1-7:** beneficio -- hoy `band + self.alpha * bandpassed` amplifica TODA la banda de forma uniforme, incluso donde solo hay ruido residual sin movimiento real; enmascarar por magnitud de movimiento da un resultado visualmente más limpio. Costo -- cambio localizado (una línea de `process_frame`), pero de bajo valor aislado sin M1-6 (la ROI limita dónde buscar movimiento; el masking limita cuánto amplificar dentro de esa región).

**Confirmado con Daniel:** con esto, el backlog completo de Módulo 1 queda auditado -- M1-2/M1-3 ya implementados (Fase 8.37/8.38), M1-4 descartada explícitamente, M1-5 y M1-8 ya implementados en este turno, M1-1/M1-6/M1-7 documentadas arriba, pendientes de decisión, ninguna en curso.
