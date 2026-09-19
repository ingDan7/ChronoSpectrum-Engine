"""Núcleo matemático del Sub-Pixel Phase Correlator (Kuglin & Hines + Foroosh, Zerubia & Berthod, ver README.md)."""

import numpy as np
from numpy.typing import NDArray


def cross_power_spectrum(img1: NDArray, img2: NDArray) -> NDArray:
    """R(u,v) = (F1 · F2*) / |F1 · F2*|, sin shift, listo para IFFT2D."""
    if img1.shape != img2.shape:
        raise ValueError("Las dos imágenes deben tener la misma forma")

    f1 = np.fft.fft2(img1)
    f2 = np.fft.fft2(img2)

    cross = f1 * np.conj(f2)
    magnitude = np.abs(cross)
    magnitude[magnitude == 0] = 1e-12  # evita división por cero

    return cross / magnitude


def integer_peak(r: NDArray) -> tuple[int, int, NDArray]:
    """IFFT2D de R y localización del pico; (py, px) son índices crudos en [0, N)."""
    correlation = np.fft.ifft2(r)
    correlation_real = np.abs(correlation)

    py, px = np.unravel_index(np.argmax(correlation_real), correlation_real.shape)
    return py, px, correlation_real


def _wrap(idx: int, n: int) -> int:
    """Envuelve un índice de array al rango de desplazamiento [-n/2, n/2)."""
    return idx if idx < n // 2 else idx - n


def subpixel_refine_1d(val_peak: float, val_plus: float, val_minus: float) -> float:
    """Refinamiento subpíxel de Foroosh et al.: reparte energía como sinc(pi*delta) entre vecinos."""
    if val_plus >= val_minus:
        neighbor, sign = val_plus, 1.0
    else:
        neighbor, sign = val_minus, -1.0

    if neighbor <= val_peak * 1e-6:
        # Vecino despreciable -> desplazamiento ~ entero exacto.
        return 0.0

    ratio = np.clip(val_peak / neighbor, 0.0, 1.0)
    return sign * np.arcsin(np.sqrt(ratio)) / np.pi


def phase_correlate_subpixel(img1: NDArray, img2: NDArray) -> tuple[float, float]:
    """Desplazamiento (dy, dx) subpíxel tal que img2 ~ img1 desplazada (dy, dx)."""
    r = cross_power_spectrum(img1, img2)
    py, px, correlation = integer_peak(r)
    h, w = correlation.shape

    val_peak = correlation[py, px]
    val_plus_x = correlation[py, (px + 1) % w]
    val_minus_x = correlation[py, (px - 1) % w]
    val_plus_y = correlation[(py + 1) % h, px]
    val_minus_y = correlation[(py - 1) % h, px]

    delta_x = subpixel_refine_1d(val_peak, val_plus_x, val_minus_x)
    delta_y = subpixel_refine_1d(val_peak, val_plus_y, val_minus_y)

    # Signo verificado empíricamente contra un desplazamiento entero conocido (ver test_phase_correlation.py).
    dy = -(_wrap(py, h) + delta_y)
    dx = -(_wrap(px, w) + delta_x)
    return dy, dx


def peak_to_sidelobe_ratio(
    correlation: NDArray, py: int, px: int, exclude_radius: int = 5
) -> float:
    """PSR = (pico - media_sidelobe) / std_sidelobe, excluyendo una ventana circular alrededor del pico."""
    h, w = correlation.shape
    excluded = np.zeros((h, w), dtype=bool)
    for dy_off in range(-exclude_radius, exclude_radius + 1):
        for dx_off in range(-exclude_radius, exclude_radius + 1):
            excluded[(py + dy_off) % h, (px + dx_off) % w] = True

    sidelobe = correlation[~excluded]
    if sidelobe.size == 0:
        return 0.0

    peak = float(correlation[py, px])
    sidelobe_mean = float(sidelobe.mean())
    sidelobe_std = float(sidelobe.std())
    if sidelobe_std < 1e-12:
        return 0.0
    return (peak - sidelobe_mean) / sidelobe_std


def fourier_shift(img: NDArray, dy: float, dx: float) -> NDArray:
    """Desplaza `img` por (dy, dx) subpíxel vía el teorema de desplazamiento de Fourier."""
    h, w = img.shape
    fy = np.fft.fftfreq(h)
    fx = np.fft.fftfreq(w)
    fx_grid, fy_grid = np.meshgrid(fx, fy)
    f = np.fft.fft2(img)
    phase = np.exp(-2j * np.pi * (fx_grid * dx + fy_grid * dy))
    return np.real(np.fft.ifft2(f * phase))
