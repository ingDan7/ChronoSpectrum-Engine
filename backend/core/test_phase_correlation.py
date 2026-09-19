"""Script de validación del módulo phase_correlation — no es parte de la API."""

import numpy as np
from core.phase_correlation import fourier_shift, phase_correlate_subpixel

# Umbral con margen sobre el error medido empíricamente (0.1-0.4 px, ver README/ROADMAP).
ERROR_MAX_PX = 0.5


def make_smooth_noise_image(size=128, seed=0, cutoff=0.15):
    """Ruido gaussiano filtrado paso-bajo: espectro de banda ancha, más representativo que sinusoides puras."""
    rng = np.random.default_rng(seed)
    noise = rng.standard_normal((size, size))
    f = np.fft.fft2(noise)
    fy = np.fft.fftfreq(size)
    fx = np.fft.fftfreq(size)
    fx_grid, fy_grid = np.meshgrid(fx, fy)
    radius = np.sqrt(fx_grid**2 + fy_grid**2)
    lowpass = np.exp(-(radius**2) / (2 * cutoff**2))
    return np.real(np.fft.ifft2(f * lowpass))


def test_desplazamientos_conocidos():
    casos = [(1.6, -2.37), (0.3, 0.3), (-3.9, 4.2), (0.0, 0.0), (5.0, -5.0), (10.25, 10.25)]
    base = make_smooth_noise_image()

    for dy_true, dx_true in casos:
        shifted = fourier_shift(base, dy_true, dx_true)
        dy_est, dx_est = phase_correlate_subpixel(base, shifted)
        error_y = abs(dy_est - dy_true)
        error_x = abs(dx_est - dx_true)

        print(
            f"real=({dy_true:6.2f},{dx_true:6.2f})  "
            f"estimado=({dy_est:6.3f},{dx_est:6.3f})  "
            f"error=({error_y:.3f},{error_x:.3f})"
        )
        assert error_y < ERROR_MAX_PX, f"Error en Y ({error_y:.3f}) excede el umbral {ERROR_MAX_PX}"
        assert error_x < ERROR_MAX_PX, f"Error en X ({error_x:.3f}) excede el umbral {ERROR_MAX_PX}"


if __name__ == "__main__":
    test_desplazamientos_conocidos()
    print("Todas las pruebas pasaron.")
