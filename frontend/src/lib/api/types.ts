// Tipos TypeScript que reflejan los esquemas Pydantic reales del backend (api/models.py, api/assets.py).

export type MotionAssetId = "synthetic_breathing_1hz" | "real_eye_pulse" | "real_speaker_vibration"

export type SpectrumAssetId = "synthetic_grid_noise" | "real_mesh_texture" | "real_halftone_print"

export type PhaseAssetId = "synthetic_shifted_pair" | "real_shifted_pair" | "real_painting_pair"

export interface NotchParams {
  u0: number
  v0: number
  /** (0, 200] */
  d0: number
  mode?: "ideal" | "gaussian" | "butterworth"
  /** [1, 10], solo aplica en modo "butterworth" */
  n?: number
}

export interface SpectrumCleanerRequest {
  asset_id: SpectrumAssetId
  /** 1 a 10 elementos */
  notches: NotchParams[]
}

export interface SpectrumCleanerResponse {
  spectrum_before_png_base64: string
  spectrum_after_png_base64: string
  filtered_image_png_base64: string
  original_image_png_base64: string
  reduction_percent: number
  mask_png_base64: string
}

export interface PhaseCorrelatorRequest {
  asset_id: PhaseAssetId
}

export interface PhaseCorrelatorResponse {
  dy: number
  dx: number
  correlation_peak_png_base64: string
  image1_png_base64: string
  image2_png_base64: string
  image2_aligned_png_base64: string
  peak_confidence: number
  psr: number
  alignment_diff_png_base64: string
  residual_error_pct: number
}

export type MotionFilterMode = "iir" | "ideal_fft"

export interface MotionMagnifierRequest {
  asset_id: MotionAssetId
  /** [2, 5] */
  levels: number
  filter_mode: MotionFilterMode
  /** [1.0, 50.0] */
  alpha: number
  f_low: number
  f_high: number
}

export interface TemporalPsd {
  freqs: number[]
  magnitude: number[]
}

export interface MotionMagnifierResponse {
  /** PNG en base64 sin el prefijo `data:image/png;base64,`. */
  frames_png_base64: string[]
  sample_rate: number
  original_frames_jpeg_base64: string[]
  psd: TemporalPsd
}

// Mensajes WebSocket de `/ws/*`: mismos campos que las respuestas HTTP, pero en JPEG.

export interface LiveErrorMessage {
  type: "error"
  detail: string
}

export interface MotionMagnifierLiveResult {
  type: "result"
  frames_jpeg_base64: string[]
  sample_rate: number
  original_frames_jpeg_base64: string[]
  alpha: number
  f_low: number
  f_high: number
  psd: TemporalPsd
}

export interface SpectrumCleanerLiveResult {
  type: "result"
  spectrum_before_jpeg_base64: string
  spectrum_after_jpeg_base64: string
  filtered_image_jpeg_base64: string
  original_image_jpeg_base64: string
  reduction_percent: number
  peak_count: number
  mask_jpeg_base64: string
}

export interface PhaseCorrelatorLiveResult {
  type: "result"
  dy: number
  dx: number
  correlation_peak_jpeg_base64: string
  image1_jpeg_base64: string
  image2_jpeg_base64: string
  image2_aligned_jpeg_base64: string
  peak_confidence: number
  psr: number
  alignment_diff_jpeg_base64: string
  residual_error_pct: number
}
