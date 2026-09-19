import { useEffect, useState } from "react"

export interface FramePlayer {
  /** URL usable como `<img src>` del frame actual, o `null` si no hay frames. */
  frameSrc: string | null
  isPlaying: boolean
  play: () => void
  pause: () => void
}

// Reproduce en loop una lista de frames (base64) a la velocidad `sampleRate` (fps) real del backend.
export function useFramePlayer(
  frames: string[] | null,
  sampleRate: number | null,
  mimeType: "image/png" | "image/jpeg" = "image/png"
): FramePlayer {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Reinicia al frame 0 y arranca automáticamente con cada `frames`/`sampleRate` nuevo.
  useEffect(() => {
    setIndex(0)
    setIsPlaying(!!frames && frames.length > 0 && !!sampleRate && sampleRate > 0)
  }, [frames, sampleRate])

  useEffect(() => {
    if (!isPlaying || !frames || frames.length === 0 || !sampleRate || sampleRate <= 0) return
    const intervalMs = 1000 / sampleRate
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % frames.length)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [isPlaying, frames, sampleRate])

  const hasFrames = !!frames && frames.length > 0
  const frameSrc = hasFrames ? `data:${mimeType};base64,${frames![index % frames!.length]}` : null

  return {
    frameSrc,
    isPlaying,
    play: () => {
      if (hasFrames) setIsPlaying(true)
    },
    pause: () => setIsPlaying(false),
  }
}

export interface SyncedFramePlayer {
  frameSrcA: string | null
  frameSrcB: string | null
  isPlaying: boolean
  play: () => void
  pause: () => void
}

// Igual que useFramePlayer, pero reproduce dos secuencias con un único índice/timer compartido (sincronizadas).
export function useSyncedFramePlayer(
  framesA: string[] | null,
  framesB: string[] | null,
  sampleRate: number | null,
  mimeType: "image/png" | "image/jpeg" = "image/jpeg"
): SyncedFramePlayer {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Usa la secuencia más corta si hay dos; si `framesB` no vino, reproduce solo `framesA`.
  const length = framesB !== null ? Math.min(framesA?.length ?? 0, framesB.length) : (framesA?.length ?? 0)

  useEffect(() => {
    setIndex(0)
    setIsPlaying(length > 0 && !!sampleRate && sampleRate > 0)
  }, [framesA, framesB, sampleRate, length])

  useEffect(() => {
    if (!isPlaying || length === 0 || !sampleRate || sampleRate <= 0) return
    const intervalMs = 1000 / sampleRate
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % length)
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [isPlaying, length, sampleRate])

  const frameSrcA = length > 0 && framesA ? `data:${mimeType};base64,${framesA[index % length]}` : null
  const frameSrcB = length > 0 && framesB ? `data:${mimeType};base64,${framesB[index % length]}` : null

  return {
    frameSrcA,
    frameSrcB,
    isPlaying,
    play: () => {
      if (length > 0) setIsPlaying(true)
    },
    pause: () => setIsPlaying(false),
  }
}
