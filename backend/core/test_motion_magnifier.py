"""Script de validación del módulo motion_magnifier — no es parte de la API."""

import numpy as np
from core.motion_magnifier import MotionMagnifier

SAMPLE_RATE = 30.0  # fps
DURATION_S = 6.0
FREQ_IN_BAND_HZ = 1.0  # dentro de [f_low, f_high] = [0.8, 1.2]
FREQ_OUT_BAND_HZ = 4.0  # fuera de banda
SIZE = 64
LEVELS = 3
ALPHA = 10.0
F_LOW, F_HIGH = 0.8, 1.2

# Cada frecuencia se prueba en un video separado (frame completo oscilando), midiendo un único píxel de detalle.


def _make_single_frequency_video(freq_hz: float) -> list[np.ndarray]:
    """Video sintético donde todo el frame oscila a una única frecuencia."""
    n_frames = int(SAMPLE_RATE * DURATION_S)
    t = np.arange(n_frames) / SAMPLE_RATE

    x, y = np.meshgrid(np.arange(SIZE), np.arange(SIZE))
    base = 0.5 + 0.3 * np.sin(2 * np.pi * 2 * x / SIZE) * np.cos(2 * np.pi * 2 * y / SIZE)

    frames = []
    for ti in t:
        frames.append(base * (1.0 + 0.05 * np.sin(2 * np.pi * freq_hz * ti)))
    return frames


def _signal_amplitude(values: np.ndarray) -> float:
    """Amplitud pico-a-pico / 2, descartando el transitorio inicial del IIR."""
    steady = values[len(values) // 3 :]
    return (steady.max() - steady.min()) / 2.0


def _detail_only_amplification_ratio(freq_hz: float, pixel: tuple[int, int]) -> float:
    """Factor de amplificación real sobre la señal de detalle, en un píxel fijo (banda base sin tocar)."""
    from core.pyramids import build_laplacian_pyramid, collapse_laplacian_pyramid

    frames = _make_single_frequency_video(freq_hz)

    magnifier = MotionMagnifier(
        frame_shape=(SIZE, SIZE),
        levels=LEVELS,
        alpha=ALPHA,
        f_low=F_LOW,
        f_high=F_HIGH,
        sample_rate=SAMPLE_RATE,
    )

    detail_in, detail_out = [], []
    for frame in frames:
        pyramid = build_laplacian_pyramid(frame, LEVELS)

        zero_base = pyramid[:-1] + [np.zeros_like(pyramid[-1])]
        detail_in_frame = collapse_laplacian_pyramid(zero_base)

        zero_detail = [np.zeros_like(band) for band in pyramid[:-1]] + [pyramid[-1]]
        base_only_frame = collapse_laplacian_pyramid(zero_detail)

        out_frame = magnifier.process_frame(frame)
        out_detail_frame = out_frame - base_only_frame

        detail_in.append(detail_in_frame[pixel])
        detail_out.append(out_detail_frame[pixel])

    amp_in = _signal_amplitude(np.array(detail_in))
    amp_out = _signal_amplitude(np.array(detail_out))
    print(
        f"  freq={freq_hz} Hz: amplitud_detalle_entrada={amp_in:.6f} "
        f"amplitud_detalle_salida={amp_out:.6f} factor={amp_out / amp_in:.3f}x"
    )
    return amp_out / amp_in


def test_amplifica_frecuencia_de_interes_mas_que_fuera_de_banda():
    pixel = (10, 10)

    ratio_in_band = _detail_only_amplification_ratio(FREQ_IN_BAND_HZ, pixel)
    ratio_out_band = _detail_only_amplification_ratio(FREQ_OUT_BAND_HZ, pixel)

    # Umbrales con margen sobre lo medido (in-band ≈ 11.0x, out-of-band ≈ 5.22x).
    assert ratio_in_band > 8.0, "La frecuencia de interés no se amplificó lo suficiente"
    assert ratio_out_band < 7.0, "La frecuencia fuera de banda se amplificó demasiado"
    assert ratio_in_band > ratio_out_band * 1.5, (
        "El pipeline no está discriminando de forma significativa entre "
        "la frecuencia de interés y la frecuencia fuera de banda"
    )


if __name__ == "__main__":
    test_amplifica_frecuencia_de_interes_mas_que_fuera_de_banda()
    print("Todas las pruebas pasaron.")
