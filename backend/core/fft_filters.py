"""Núcleo matemático del módulo 2D-FFT Interactive Spectrum Cleaner (NumPy puro, ver README.md)."""

import numpy as np
from numpy.typing import NDArray


def compute_spectrum(image: NDArray) -> tuple[NDArray, NDArray]:
    """FFT2D centrada; devuelve (F_shifted, magnitude_log normalizada a [0,1])."""
    if image.ndim != 2:
        raise ValueError("compute_spectrum espera una imagen 2D en escala de grises")

    f = np.fft.fft2(image)
    f_shifted = np.fft.fftshift(f)

    magnitude = np.abs(f_shifted)
    magnitude_log = np.log1p(magnitude)
    magnitude_log = (magnitude_log - magnitude_log.min()) / (
        magnitude_log.max() - magnitude_log.min() + 1e-12
    )

    return f_shifted, magnitude_log


def _distance_grid(shape: tuple[int, int], u0: float, v0: float) -> NDArray:
    """Distancia euclidiana de cada punto (u,v) a (u0,v0), origen en el centro (fftshift)."""
    h, w = shape
    v, u = np.meshgrid(np.arange(h) - h // 2, np.arange(w) - w // 2, indexing="ij")
    return np.sqrt((u - u0) ** 2 + (v - v0) ** 2)


def notch_filter(
    shape: tuple[int, int],
    u0: float,
    v0: float,
    d0: float,
    mode: str = "gaussian",
    n: int = 2,
) -> NDArray:
    """Máscara notch reject centrada en el par simétrico (u0,v0)/(-u0,-v0)."""
    d1 = _distance_grid(shape, u0, v0)
    d2 = _distance_grid(shape, -u0, -v0)

    if mode == "ideal":
        mask = np.ones(shape)
        mask[(d1 <= d0) | (d2 <= d0)] = 0.0
        return mask

    if mode == "gaussian":
        return (1 - np.exp(-(d1**2) / (2 * d0**2))) * (
            1 - np.exp(-(d2**2) / (2 * d0**2))
        )

    if mode == "butterworth":
        eps = 1e-12
        h1 = 1 / (1 + (d0 / (d1 + eps)) ** (2 * n))
        h2 = 1 / (1 + (d0 / (d2 + eps)) ** (2 * n))
        return h1 * h2

    raise ValueError(f"mode desconocido: {mode!r} (usar 'ideal', 'gaussian' o 'butterworth')")


def apply_filter(f_shifted: NDArray, mask: NDArray) -> NDArray:
    """Aplica la máscara en frecuencia y reconstruye la imagen filtrada vía IFFT2D."""
    filtered = f_shifted * mask
    f_unshifted = np.fft.ifftshift(filtered)
    reconstructed = np.fft.ifft2(f_unshifted)
    return np.real(reconstructed)
