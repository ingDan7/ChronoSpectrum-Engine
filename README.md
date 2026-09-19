# ChronoSpectrum Engine

Una plataforma web interactiva que reúne tres motores de procesamiento de señales e imágenes, implementados desde cero en Python (NumPy/OpenCV) y expuestos en tiempo real a través de una interfaz con estética de rack de laboratorio retro-futurista. Sin base de datos, sin upload libre de archivos: cualquiera puede abrir el sitio, elegir un asset de demostración y ver el algoritmo trabajando en vivo, moviendo perillas como en un instrumento físico real.

Es, ante todo, una pieza de portafolio técnico: cada módulo está construido sobre matemática aplicada real (no una simulación visual), verificado con pruebas contra casos sintéticos de resultado conocido, y documentado con honestidad — incluyendo los bugs reales que aparecieron durante el desarrollo y cómo se corrigieron.

## ¿Qué hace?

El proyecto expone tres módulos independientes, cada uno resolviendo un problema real de visión por computador:

### 1. Eulerian Motion & Pulse Magnifier

Amplifica variaciones que ocurren en un video pero son invisibles a simple vista: el pulso cardíaco que sutilmente cambia el color de la piel, o la micro-vibración de una máquina en funcionamiento. El usuario elige un video de demostración, ajusta el factor de amplificación y la banda de frecuencia de interés, y ve en tiempo real cómo esos movimientos imperceptibles se vuelven visibles — sin necesidad de sensores adicionales, solo procesando la imagen.

### 2. 2D-FFT Interactive Spectrum Cleaner

Limpia una imagen de ruido periódico: patrones de interferencia, tramados tipo Moiré, o rejillas repetitivas que contaminan una foto o el sensor de una cámara industrial. El usuario ve el espectro de frecuencia de la imagen, ubica los filtros sobre los picos de ruido, y observa en vivo cómo la imagen reconstruida se limpia a medida que ajusta los filtros.

### 3. Sub-Pixel Phase Correlator

Mide con precisión sub-píxel cuánto se desplazó una imagen respecto a otra — útil para detectar deformaciones mecánicas diminutas o vibraciones microscópicas sin usar sensores físicos. El usuario elige un par de imágenes de demostración y el sistema calcula el desplazamiento exacto entre ambas.

En los tres casos, la experiencia es la misma: se ve el asset original de inmediato, al presionar Execute arranca una simulación en vivo que responde a cada cambio de parámetro sin recargar la página, y Stop siempre regresa al punto de partida. Ningún número que se muestra en el panel es inventado — todo lo que aparece como medición viene de un cómputo real del backend.

## Cómo está construido

**Frontend** — React + Vite + TypeScript, con Tailwind CSS v4 para los estilos y GSAP para las animaciones del panel (agujas, osciloscopio, transiciones). Los componentes de interfaz (perillas, monitores tipo CRT, tarjetas de métricas) están construidos a medida para lograr la estética de instrumento de laboratorio, sobre una base de componentes accesibles de shadcn/ui.

**Backend** — FastAPI (Python), gestionado con `uv`. Todo el procesamiento numérico (transformadas de Fourier, pirámides de imagen, filtros temporales, correlación de fase) está implementado a mano con NumPy, sin apoyarse en funciones ya resueltas de OpenCV para el núcleo del algoritmo — OpenCV se usa únicamente para tareas de soporte como lectura/escritura de video e imagen. La comunicación en vivo entre la interfaz y el backend corre sobre WebSockets, además de una API HTTP tradicional para las peticiones puntuales.

**Sin base de datos ni infraestructura pesada** — el proyecto está pensado para vivir en hosting gratuito. No hay upload libre de archivos: el usuario elige entre un set cerrado de videos e imágenes de demostración, lo que mantiene acotado el consumo de recursos del servidor y evita abuso. El estado de cada sesión es efímero: se pide, se procesa, se responde.

## Stack tecnológico

**Frontend**
- React + Vite + TypeScript
- Tailwind CSS v4
- shadcn/ui (componentes base accesibles)
- GSAP (animaciones)

**Backend**
- FastAPI (Python), gestionado con `uv`
- NumPy para el núcleo de los tres algoritmos
- OpenCV, solo para lectura/escritura de video e imagen (no para el procesamiento)
- WebSockets para la simulación en vivo, en paralelo a una API HTTP convencional
- Rate limiting propio para proteger el servidor sin depender de infraestructura adicional

## Estructura del repositorio

```
chronospectrum-engine/
├── frontend/     # React + Vite + TS + Tailwind v4 + shadcn/ui
└── backend/      # FastAPI + NumPy/OpenCV
```

## Estado del proyecto

El núcleo matemático de los tres módulos, la API HTTP, el set de datos de demostración y la simulación en vivo por WebSocket están implementados y verificados con pruebas reales. Quedan pendientes el despliegue a producción y una ronda final de pulido antes de compartir el proyecto ampliamente. El detalle completo de avance, fase por fase, vive en `ROADMAP.md`.

## Referencias

Los algoritmos de este proyecto están basados en investigación académica real, no en heurísticas inventadas:

- Wu, H.-Y. et al. (2012). *Eulerian Video Magnification for Revealing Subtle Changes in the World*. MIT CSAIL / SIGGRAPH 2012. [Paper](http://people.csail.mit.edu/mrub/papers/vidmag.pdf) · [Página del proyecto](https://people.csail.mit.edu/mrub/evm/)
- Foroosh, H., Zerubia, J., & Berthod, M. *Extension of Phase Correlation to Subpixel Registration*. [PDF](https://www.cs.ucf.edu/~foroosh/subreg.pdf)
- [Phase correlation — Wikipedia](https://en.wikipedia.org/wiki/Phase_correlation)
- [OpenCV — Periodic Noise Removing Filter (tutorial)](https://docs.opencv.org/4.x/d2/d0b/tutorial_periodic_noise_removing_filter.html)
- [Butterworth filter — Wikipedia](https://en.wikipedia.org/wiki/Butterworth_filter)
- Gonzalez, R. & Woods, R. *Digital Image Processing*, 3rd ed., Sección 4.10.2 (filtros notch reject).

El fundamento matemático completo de cada módulo (fórmulas, derivaciones y las decisiones de implementación verificadas contra estas fuentes) está documentado en `ROADMAP.md` y en los comentarios del código fuente, no aquí — este documento es la presentación del proyecto, no la referencia técnica de implementación.
