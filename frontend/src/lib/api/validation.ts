import type {
  MotionAssetId,
  MotionMagnifierRequest,
  PhaseAssetId,
  PhaseCorrelatorRequest,
  SpectrumAssetId,
  SpectrumCleanerRequest,
} from "./types"

// Validación en el cliente, espejo de los límites del backend (api/models.py) -- defensa en profundidad, no reemplazo.

export const MOTION_ASSET_IDS: readonly MotionAssetId[] = [
  "synthetic_breathing_1hz",
  "real_eye_pulse",
  "real_speaker_vibration",
]

export interface FieldError {
  field: string
  message: string
}

export function validateMotionMagnifierRequest(body: MotionMagnifierRequest): FieldError[] {
  const errors: FieldError[] = []

  if (!MOTION_ASSET_IDS.includes(body.asset_id)) {
    errors.push({ field: "asset_id", message: `asset_id inválido: "${body.asset_id}"` })
  }
  if (!(Number.isInteger(body.levels) && body.levels >= 2 && body.levels <= 5)) {
    errors.push({ field: "levels", message: "Los niveles de la pirámide deben ser un entero entre 2 y 5" })
  }
  if (body.filter_mode !== "iir" && body.filter_mode !== "ideal_fft") {
    errors.push({ field: "filter_mode", message: `filter_mode inválido: "${body.filter_mode}"` })
  }
  if (!(body.alpha >= 1.0 && body.alpha <= 50.0)) {
    errors.push({ field: "alpha", message: "El factor de amplificación debe estar entre 1.0 y 50.0" })
  }
  if (!(body.f_low > 0)) {
    errors.push({ field: "f_low", message: "Bandpass Low debe ser mayor que 0 Hz" })
  }
  if (!(body.f_high > 0)) {
    errors.push({ field: "f_high", message: "Bandpass High debe ser mayor que 0 Hz" })
  }
  if (body.f_low >= body.f_high) {
    errors.push({ field: "f_low/f_high", message: "Bandpass Low debe ser menor que Bandpass High" })
  }

  return errors
}

export const SPECTRUM_ASSET_IDS: readonly SpectrumAssetId[] = [
  "synthetic_grid_noise",
  "real_mesh_texture",
  "real_halftone_print",
]

const NOTCH_MODES = ["ideal", "gaussian", "butterworth"] as const

export function validateSpectrumCleanerRequest(body: SpectrumCleanerRequest): FieldError[] {
  const errors: FieldError[] = []

  if (!SPECTRUM_ASSET_IDS.includes(body.asset_id)) {
    errors.push({ field: "asset_id", message: `asset_id inválido: "${body.asset_id}"` })
  }
  if (body.notches.length < 1 || body.notches.length > 10) {
    errors.push({ field: "notches", message: "Debe haber entre 1 y 10 notches activos" })
  }
  body.notches.forEach((notch, i) => {
    if (!(notch.d0 > 0 && notch.d0 <= 200)) {
      errors.push({ field: `notches[${i}].d0`, message: `Notch #${i + 1}: el radio de corte (d0) debe estar entre 0 y 200` })
    }
    if (notch.mode && !NOTCH_MODES.includes(notch.mode)) {
      errors.push({ field: `notches[${i}].mode`, message: `Notch #${i + 1}: modo inválido "${notch.mode}"` })
    }
    if (notch.n !== undefined && !(notch.n >= 1 && notch.n <= 10)) {
      errors.push({ field: `notches[${i}].n`, message: `Notch #${i + 1}: el orden (n) debe estar entre 1 y 10` })
    }
  })

  return errors
}

export const PHASE_ASSET_IDS: readonly PhaseAssetId[] = [
  "synthetic_shifted_pair",
  "real_shifted_pair",
  "real_painting_pair",
]

export function validatePhaseCorrelatorRequest(body: PhaseCorrelatorRequest): FieldError[] {
  const errors: FieldError[] = []

  if (!PHASE_ASSET_IDS.includes(body.asset_id)) {
    errors.push({ field: "asset_id", message: `asset_id inválido: "${body.asset_id}"` })
  }

  return errors
}
