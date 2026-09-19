// Diccionario de traducción ES/EN; la jerga técnica de instrumento de laboratorio se queda igual en ambos idiomas.
export const translations = {
  navHome: { es: "Inicio", en: "Home" },
  navOpenDrawer: { es: "Abrir navegación de módulos", en: "Open module navigation" },
  navCloseDrawer: { es: "Cerrar navegación de módulos", en: "Close module navigation" },
  navLanguageToggle: { es: "Cambiar a inglés", en: "Switch to Spanish" },

  contactAriaLabel: { es: "Contacto", en: "Contact" },
  contactEmailLink: { es: "Correo →", en: "Email →" },

  landingSubtitle: {
    es: "Laboratorio de procesamiento de señales e imágenes",
    en: "Signal and image processing laboratory",
  },
  landingModule1Description: {
    es: "Eulerian Motion & Pulse Magnifier -- amplifica variaciones invisibles al ojo (pulso, micro-vibración) en video.",
    en: "Eulerian Motion & Pulse Magnifier -- amplifies variations invisible to the eye (pulse, micro-vibration) in video.",
  },
  landingModule2Description: {
    es: "2D-FFT Interactive Spectrum Cleaner -- elimina ruido periódico/Moiré de una imagen filtrando su espectro de frecuencia.",
    en: "2D-FFT Interactive Spectrum Cleaner -- removes periodic/Moiré noise from an image by filtering its frequency spectrum.",
  },
  landingModule3Description: {
    es: "Sub-Pixel Phase Correlator -- mide desplazamientos sub-píxel entre dos imágenes por correlación de fase.",
    en: "Sub-Pixel Phase Correlator -- measures sub-pixel shifts between two images via phase correlation.",
  },
  landingComenzar: { es: "Comenzar", en: "Start" },
  landingDespertando: { es: "Despertando…", en: "Waking up…" },
  landingReintentar: { es: "Reintentar", en: "Retry" },
  landingWaitNotice: {
    es: "Puede tardar hasta ~2 minutos si el servidor estaba inactivo.",
    en: "It can take up to ~2 minutes if the server was inactive.",
  },

  simulando: { es: "Simulando…", en: "Simulating…" },
  procesando: { es: "Procesando…", en: "Processing…" },
  sinDatos: { es: "Sin datos", en: "No data" },
  antes: { es: "Antes", en: "Before" },
  despues: { es: "Después", en: "After" },
  conexionPerdida: {
    es: "Se perdió la conexión en tiempo real con el backend.",
    en: "The real-time connection to the backend was lost.",
  },
  proximamente: { es: "Próximamente", en: "Coming soon" },

  modulo1AltLive: {
    es: "Video amplificado — simulación en vivo /ws/motion-magnifier",
    en: "Amplified video — live simulation /ws/motion-magnifier",
  },
  modulo1AltOriginal: { es: "Asset original -- sin modificar", en: "Original asset -- unmodified" },

  modulo2AltOriginal: { es: "Asset original -- sin filtrar", en: "Original asset -- unfiltered" },
  modulo2AltLive: {
    es: "Imagen filtrada — simulación en vivo /ws/spectrum-cleaner",
    en: "Filtered image — live simulation /ws/spectrum-cleaner",
  },
  modulo2ErrorNoNotch: {
    es: "Al menos un notch debe estar ENABLED para ejecutar.",
    en: "At least one notch must be ENABLED to run.",
  },
  modulo2ErrorLoadOriginal: {
    es: "Activa al menos un notch para cargar el original.",
    en: "Enable at least one notch to load the original.",
  },

  modulo3AltOriginal: { es: "Asset original -- image1", en: "Original asset -- image1" },
  // El CRT principal muestra el error residual entre image1/image2_aligned, no la imagen alineada tal cual.
  modulo3AltLive: {
    es: "Error residual — diferencia real entre el original y la imagen ya alineada",
    en: "Residual error — real difference between the original and the aligned image",
  },
  modulo3AltZoom: {
    es: "Acercamiento del pico de correlación",
    en: "Close-up of the correlation peak",
  },
} as const

export type TranslationKey = keyof typeof translations
export type Language = "es" | "en"
