import type {
  MotionMagnifierRequest,
  MotionMagnifierResponse,
  PhaseCorrelatorRequest,
  PhaseCorrelatorResponse,
  SpectrumCleanerRequest,
  SpectrumCleanerResponse,
} from "./types"

// Cliente HTTP centralizado hacia el backend FastAPI; todo el manejo de errores vive aquí.

const DEFAULT_BASE_URL = "http://127.0.0.1:8000"

// Generoso: Render (plan free) puede tardar ~1 min en despertar tras estar inactivo.
const REQUEST_TIMEOUT_MS = 90_000

export type ApiResult<T> =
  | { kind: "ok"; data: T }
  | { kind: "validation"; message: string }
  | { kind: "rate_limited"; message: string }
  | { kind: "network"; message: string }
  | { kind: "server"; status: number; message: string }

export function getBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_BASE_URL
}

async function safeParseJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

// `detail` puede ser un string (HTTPException) o un array de errores de esquema de Pydantic.
function extractDetailMessage(parsed: unknown): string {
  if (parsed && typeof parsed === "object" && "detail" in parsed) {
    const detail = (parsed as { detail: unknown }).detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail)) {
      return detail
        .map((entry) =>
          entry && typeof entry === "object" && "msg" in entry
            ? String((entry as { msg: unknown }).msg)
            : JSON.stringify(entry)
        )
        .join("; ")
    }
  }
  return "El backend devolvió un error sin detalle reconocible."
}

async function apiPost<TReq, TRes>(path: string, body: TReq): Promise<ApiResult<TRes>> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    const aborted = err instanceof DOMException && err.name === "AbortError"
    return {
      kind: "network",
      message: aborted
        ? "El servidor no respondió a tiempo (puede estar despertando tras estar inactivo — Render tarda hasta ~1 min en el plan free)."
        : "No se pudo conectar con el backend. Verifica que esté corriendo y que VITE_API_URL apunte al lugar correcto.",
    }
  }
  clearTimeout(timeoutId)

  if (response.status === 429) {
    return {
      kind: "rate_limited",
      message: "Demasiadas peticiones en poco tiempo — espera un momento antes de volver a ejecutar.",
    }
  }

  if (response.status === 422) {
    const parsed = await safeParseJson(response)
    return { kind: "validation", message: extractDetailMessage(parsed) }
  }

  if (!response.ok) {
    const parsed = await safeParseJson(response)
    return {
      kind: "server",
      status: response.status,
      message: extractDetailMessage(parsed) || `El backend respondió con un error (${response.status}).`,
    }
  }

  const data = (await safeParseJson(response)) as TRes | null
  if (data === null) {
    return {
      kind: "server",
      status: response.status,
      message: "El backend respondió 200 pero el cuerpo no es JSON válido.",
    }
  }
  return { kind: "ok", data }
}

export function runMotionMagnifier(body: MotionMagnifierRequest): Promise<ApiResult<MotionMagnifierResponse>> {
  return apiPost<MotionMagnifierRequest, MotionMagnifierResponse>("/api/motion-magnifier", body)
}

export function runSpectrumCleaner(body: SpectrumCleanerRequest): Promise<ApiResult<SpectrumCleanerResponse>> {
  return apiPost<SpectrumCleanerRequest, SpectrumCleanerResponse>("/api/spectrum-cleaner", body)
}

export function runPhaseCorrelator(body: PhaseCorrelatorRequest): Promise<ApiResult<PhaseCorrelatorResponse>> {
  return apiPost<PhaseCorrelatorRequest, PhaseCorrelatorResponse>("/api/phase-correlator", body)
}

// Espera a que el backend responda antes de navegar (evita mandar al usuario a una pantalla que falle si Render está dormido).
const HEALTH_CHECK_TIMEOUT_MS = 5 * 60_000

export async function checkHealth(): Promise<ApiResult<{ status: string }>> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${getBaseUrl()}/health`, { signal: controller.signal })
  } catch (err) {
    clearTimeout(timeoutId)
    const aborted = err instanceof DOMException && err.name === "AbortError"
    return {
      kind: "network",
      message: aborted
        ? "El servidor no respondió dentro del tiempo de espera."
        : "No se pudo conectar con el backend. Verifica que esté corriendo y que VITE_API_URL apunte al lugar correcto.",
    }
  }
  clearTimeout(timeoutId)

  if (!response.ok) {
    return {
      kind: "server",
      status: response.status,
      message: `El backend respondió con un error (${response.status}).`,
    }
  }

  const data = (await safeParseJson(response)) as { status: string } | null
  if (data === null) {
    return {
      kind: "server",
      status: response.status,
      message: "El backend respondió 200 pero el cuerpo no es JSON válido.",
    }
  }
  return { kind: "ok", data }
}
