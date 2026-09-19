import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { translations, type Language, type TranslationKey } from "./translations"

// Selector de idioma ES/EN, contexto simple de React (diccionario chico y fijo, sin librería de i18n).

const STORAGE_KEY = "chronospectrum:language"
const DEFAULT_LANGUAGE: Language = "es"

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === "en" ? "en" : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readStoredLanguage)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // Sin persistencia disponible: sigue funcionando en memoria durante la sesión.
    }
  }, [language])

  const setLanguage = useCallback((lang: Language) => setLanguageState(lang), [])
  const toggleLanguage = useCallback(() => setLanguageState((prev) => (prev === "es" ? "en" : "es")), [])
  const t = useCallback((key: TranslationKey) => translations[key][language], [language])

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error("useTranslation() debe usarse dentro de <LanguageProvider>.")
  }
  return ctx
}
