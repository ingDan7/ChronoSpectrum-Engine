"""Filtro pasa-banda temporal IIR de primer orden (Eulerian Video Magnification, streaming, sin buffer)."""

import numpy as np
from numpy.typing import NDArray


class IIRBandpass:
    """Pasa-banda = pasa-bajo(f_low) - pasa-bajo(f_high), cada uno IIR de primer orden."""

    def __init__(self, f_low: float, f_high: float, sample_rate: float, shape: tuple[int, ...]):
        if f_low >= f_high:
            raise ValueError("f_low debe ser menor que f_high")
        dt = 1.0 / sample_rate
        self._alpha_low = dt / (1.0 / (2 * np.pi * f_low) + dt)
        self._alpha_high = dt / (1.0 / (2 * np.pi * f_high) + dt)
        self._lo1 = np.zeros(shape, dtype=np.float64)
        self._lo2 = np.zeros(shape, dtype=np.float64)
        self._initialized = False

        # Normaliza por la parte REAL de H(w0) en f_center, no solo la magnitud: corrige un bug real de antifase.
        f_center = np.sqrt(f_low * f_high)
        w0 = 2 * np.pi * f_center / sample_rate
        h_low = self._alpha_low / (1 - (1 - self._alpha_low) * np.exp(-1j * w0))
        h_high = self._alpha_high / (1 - (1 - self._alpha_high) * np.exp(-1j * w0))
        h_center = h_low - h_high
        if abs(np.imag(h_center)) > 0.05 * abs(h_center):
            raise ValueError(
                "H(w0) tiene una parte imaginaria no despreciable; la normalización "
                "por parte real ya no es válida para esta combinación de f_low/f_high/fs "
                "y requiere un tratamiento distinto (revisar antes de usar)."
            )
        self._gain_at_center = float(np.real(h_center))
        if abs(self._gain_at_center) < 1e-9:
            raise ValueError(
                "Ganancia del pasa-banda en f_center ~= 0; revisar f_low/f_high/sample_rate"
            )

    def update(self, frame: NDArray) -> NDArray:
        if not self._initialized:
            self._lo1[...] = frame
            self._lo2[...] = frame
            self._initialized = True
            return np.zeros_like(frame)

        self._lo1 += self._alpha_low * (frame - self._lo1)
        self._lo2 += self._alpha_high * (frame - self._lo2)
        return (self._lo1 - self._lo2) / self._gain_at_center


def ideal_bandpass_filter_temporal(
    band_stack: NDArray, f_low: float, f_high: float, sample_rate: float
) -> NDArray:
    """Pasa-banda temporal ideal (corte agudo en frecuencia) sobre la ventana completa (T,H,W)."""
    n_frames = band_stack.shape[0]
    freqs = np.fft.rfftfreq(n_frames, d=1.0 / sample_rate)
    spectrum = np.fft.rfft(band_stack, axis=0)
    band_mask = (freqs >= f_low) & (freqs <= f_high)
    spectrum[~band_mask, ...] = 0
    return np.fft.irfft(spectrum, n=n_frames, axis=0)


def compute_temporal_psd(frames: list[NDArray], sample_rate: float) -> dict[str, list[float]]:
    """PSD real de la intensidad promedio de píxel por frame (ya amplificados)."""
    signal = np.array([float(np.mean(frame)) for frame in frames], dtype=np.float64)
    n_frames = signal.shape[0]
    if n_frames < 2:
        return {"freqs": [], "magnitude": []}

    signal = signal - signal.mean()
    freqs = np.fft.rfftfreq(n_frames, d=1.0 / sample_rate)
    magnitude = np.abs(np.fft.rfft(signal))
    return {"freqs": freqs.tolist(), "magnitude": magnitude.tolist()}
