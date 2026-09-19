"""Script de validación del módulo fft_filters — no es parte de la API."""

import numpy as np
from core.fft_filters import compute_spectrum, notch_filter, apply_filter


def make_synthetic_noisy_image(size=256, noise_freq_u=30, noise_freq_v=0, amplitude=50):
    """Imagen base (degradado) + ruido periódico senoidal en una frecuencia conocida."""
    x, y = np.meshgrid(np.arange(size), np.arange(size))
    base = (x + y) / 2.0
    noise = amplitude * np.sin(2 * np.pi * (noise_freq_u * x + noise_freq_v * y) / size)
    return base + noise, base


def test_roundtrip_sin_filtro():
    """FFT2D -> IFFT2D sin filtro debe reconstruir la imagen original."""
    img = np.random.rand(64, 64)
    f_shifted, _ = compute_spectrum(img)
    mask = np.ones_like(img)
    reconstructed = apply_filter(f_shifted, mask)
    error = np.abs(img - reconstructed).max()
    print(f"[roundtrip] error máximo: {error:.2e}")
    assert error < 1e-9, "El roundtrip FFT/IFFT no reconstruye la imagen original"


def test_notch_elimina_ruido_conocido():
    noisy, base = make_synthetic_noisy_image()
    size = noisy.shape[0]

    f_shifted, _ = compute_spectrum(noisy)
    # El ruido está en (u=30, v=0) respecto al centro del espectro.
    mask = notch_filter(noisy.shape, u0=30, v0=0, d0=5, mode="gaussian")
    cleaned = apply_filter(f_shifted, mask)

    mse_antes = np.mean((noisy - base) ** 2)
    mse_despues = np.mean((cleaned - base) ** 2)

    print(f"[notch] MSE contra imagen base — antes: {mse_antes:.4f}, después: {mse_despues:.4f}")
    assert mse_despues < mse_antes * 0.2, "El filtro notch no redujo suficientemente el ruido"


if __name__ == "__main__":
    test_roundtrip_sin_filtro()
    test_notch_elimina_ruido_conocido()
    print("Todas las pruebas pasaron.")
