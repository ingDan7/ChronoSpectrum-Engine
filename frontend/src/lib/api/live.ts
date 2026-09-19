import { getBaseUrl } from "./client"
import type {
  MotionMagnifierLiveResult,
  MotionMagnifierRequest,
  PhaseCorrelatorLiveResult,
  PhaseCorrelatorRequest,
  SpectrumCleanerLiveResult,
  SpectrumCleanerRequest,
} from "./types"

// Cliente WebSocket centralizado hacia los endpoints `/ws/*` (simulación en vivo, en paralelo a client.ts).

function wsUrl(path: string): string {
  return getBaseUrl().replace(/^http/, "ws") + path
}

export interface LiveConnection<TParams> {
  /** Envía parámetros nuevos. Si el socket todavía no terminó de conectar, se encola y se envía en cuanto abra. */
  send: (params: TParams) => void
  /** Cierra la conexión. Después de llamar esto no se debe volver a usar `send`. */
  close: () => void
}

export interface LiveConnectionHandlers<TResult> {
  onResult: (result: TResult) => void
  onError: (message: string) => void
  onClose?: () => void
}

function connectLive<TParams, TResult>(
  path: string,
  handlers: LiveConnectionHandlers<TResult>
): LiveConnection<TParams> {
  const socket = new WebSocket(wsUrl(path))
  const pendingQueue: TParams[] = []

  socket.addEventListener("open", () => {
    while (pendingQueue.length > 0) {
      socket.send(JSON.stringify(pendingQueue.shift()))
    }
  })

  socket.addEventListener("message", (event) => {
    let parsed: { type?: string; detail?: unknown }
    try {
      parsed = JSON.parse(event.data as string)
    } catch {
      handlers.onError("El backend envió un mensaje en tiempo real que no es JSON válido.")
      return
    }

    if (parsed.type === "error") {
      handlers.onError(
        typeof parsed.detail === "string"
          ? parsed.detail
          : "El backend devolvió un error sin detalle reconocible."
      )
      return
    }

    handlers.onResult(parsed as unknown as TResult)
  })

  socket.addEventListener("error", () => {
    handlers.onError(
      "No se pudo conectar con el backend en tiempo real. Verifica que esté corriendo y que VITE_API_URL apunte al lugar correcto."
    )
  })

  socket.addEventListener("close", () => {
    handlers.onClose?.()
  })

  return {
    send: (params: TParams) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(params))
      } else {
        pendingQueue.push(params)
      }
    },
    close: () => {
      pendingQueue.length = 0
      socket.close()
    },
  }
}

export function connectMotionMagnifierLive(
  handlers: LiveConnectionHandlers<MotionMagnifierLiveResult>
): LiveConnection<MotionMagnifierRequest> {
  return connectLive("/ws/motion-magnifier", handlers)
}

export function connectSpectrumCleanerLive(
  handlers: LiveConnectionHandlers<SpectrumCleanerLiveResult>
): LiveConnection<SpectrumCleanerRequest> {
  return connectLive("/ws/spectrum-cleaner", handlers)
}

export function connectPhaseCorrelatorLive(
  handlers: LiveConnectionHandlers<PhaseCorrelatorLiveResult>
): LiveConnection<PhaseCorrelatorRequest> {
  return connectLive("/ws/phase-correlator", handlers)
}
