"""Registro cerrado de assets de demostración (sintéticos y reales)."""

from enum import Enum
from pathlib import Path

import cv2
import numpy as np
from numpy.typing import NDArray

ASSETS_DIR = Path(__file__).resolve().parent.parent / "assets"


class SpectrumAssetId(str, Enum):
    """Assets para el módulo 2D-FFT Interactive Spectrum Cleaner."""

    SYNTHETIC_GRID_NOISE = "synthetic_grid_noise"
    REAL_MESH_TEXTURE = "real_mesh_texture"
    REAL_HALFTONE_PRINT = "real_halftone_print"


class PhaseAssetId(str, Enum):
    """Assets para el módulo Sub-Pixel Phase Correlator."""

    SYNTHETIC_SHIFTED_PAIR = "synthetic_shifted_pair"
    REAL_SHIFTED_PAIR = "real_shifted_pair"
    REAL_PAINTING_PAIR = "real_painting_pair"


class MotionAssetId(str, Enum):
    """Assets para el módulo Eulerian Motion & Pulse Magnifier."""

    SYNTHETIC_BREATHING_1HZ = "synthetic_breathing_1hz"
    REAL_EYE_PULSE = "real_eye_pulse"
    REAL_SPEAKER_VIBRATION = "real_speaker_vibration"


# Picos de ruido conocidos, para valores por defecto en el frontend.
SPECTRUM_ASSET_NOISE_PEAKS: dict[SpectrumAssetId, list[tuple[float, float]]] = {
    SpectrumAssetId.SYNTHETIC_GRID_NOISE: [(30.0, 0.0)],
    SpectrumAssetId.REAL_MESH_TEXTURE: [(39.0, -80.0), (-41.0, -82.0)],
}

# Desplazamiento impuesto por construcción (teorema de desplazamiento de Fourier).
PHASE_ASSET_GROUND_TRUTH_SHIFT: dict[PhaseAssetId, tuple[float, float]] = {
    PhaseAssetId.REAL_SHIFTED_PAIR: (1.6, -2.37),
    PhaseAssetId.REAL_PAINTING_PAIR: (1.6, -2.37),
}


def _resize_keep_aspect(img: NDArray, max_dim: int) -> NDArray:
    """Escala `img` a `max_dim` en su lado mayor, preservando la proporción."""
    h, w = img.shape[:2]
    scale = max_dim / max(h, w)
    new_w, new_h = max(1, round(w * scale)), max(1, round(h * scale))
    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)


def load_spectrum_asset(asset_id: SpectrumAssetId) -> NDArray:
    """Devuelve la imagen con ruido (en escala de grises, float64)."""
    if asset_id == SpectrumAssetId.SYNTHETIC_GRID_NOISE:
        size, noise_freq_u, noise_freq_v, amplitude = 256, 30, 0, 50
        x, y = np.meshgrid(np.arange(size), np.arange(size))
        base = (x + y) / 2.0
        noise = amplitude * np.sin(
            2 * np.pi * (noise_freq_u * x + noise_freq_v * y) / size
        )
        return base + noise

    if asset_id == SpectrumAssetId.REAL_MESH_TEXTURE:
        path = ASSETS_DIR / "spectrum_cleaner" / "noisy_image.jpg"
        img = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError(f"No se pudo leer el asset real en {path}")
        img = _resize_keep_aspect(img, 256)
        return img.astype(np.float64)

    if asset_id == SpectrumAssetId.REAL_HALFTONE_PRINT:
        path = ASSETS_DIR / "spectrum_cleaner" / "noisy_image2.jpg"
        img = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError(f"No se pudo leer el asset real en {path}")
        img = _resize_keep_aspect(img, 256)
        return img.astype(np.float64)

    raise ValueError(f"asset_id no reconocido: {asset_id}")


def load_phase_pair(asset_id: PhaseAssetId) -> tuple[NDArray, NDArray]:
    """Devuelve (img1, img2) donde img2 = img1 desplazada un valor subpíxel conocido."""
    if asset_id == PhaseAssetId.SYNTHETIC_SHIFTED_PAIR:
        size, seed, cutoff = 128, 0, 0.15
        dy_true, dx_true = 1.6, -2.37

        rng = np.random.default_rng(seed)
        noise = rng.standard_normal((size, size))
        f = np.fft.fft2(noise)
        fy = np.fft.fftfreq(size)
        fx = np.fft.fftfreq(size)
        fx_grid, fy_grid = np.meshgrid(fx, fy)
        radius = np.sqrt(fx_grid**2 + fy_grid**2)
        lowpass = np.exp(-(radius**2) / (2 * cutoff**2))
        img1 = np.real(np.fft.ifft2(f * lowpass))

        phase = np.exp(-2j * np.pi * (fx_grid * dx_true + fy_grid * dy_true))
        img2 = np.real(np.fft.ifft2(np.fft.fft2(img1) * phase))
        return img1, img2

    if asset_id == PhaseAssetId.REAL_SHIFTED_PAIR:
        path = ASSETS_DIR / "phase_correlator" / "source_photo.jpg"
        img = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError(f"No se pudo leer el asset real en {path}")
        img1 = _resize_keep_aspect(img, 256).astype(np.float64)

        dy_true, dx_true = PHASE_ASSET_GROUND_TRUTH_SHIFT[asset_id]
        h, w = img1.shape
        fy = np.fft.fftfreq(h)
        fx = np.fft.fftfreq(w)
        fx_grid, fy_grid = np.meshgrid(fx, fy)
        phase = np.exp(-2j * np.pi * (fx_grid * dx_true + fy_grid * dy_true))
        img2 = np.real(np.fft.ifft2(np.fft.fft2(img1) * phase))
        return img1, img2

    if asset_id == PhaseAssetId.REAL_PAINTING_PAIR:
        path = ASSETS_DIR / "phase_correlator" / "source_photo2.jpg"
        img = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError(f"No se pudo leer el asset real en {path}")
        img1 = _resize_keep_aspect(img, 256).astype(np.float64)

        dy_true, dx_true = PHASE_ASSET_GROUND_TRUTH_SHIFT[asset_id]
        h, w = img1.shape
        fy = np.fft.fftfreq(h)
        fx = np.fft.fftfreq(w)
        fx_grid, fy_grid = np.meshgrid(fx, fy)
        phase = np.exp(-2j * np.pi * (fx_grid * dx_true + fy_grid * dy_true))
        img2 = np.real(np.fft.ifft2(np.fft.fft2(img1) * phase))
        return img1, img2

    raise ValueError(f"asset_id no reconocido: {asset_id}")


def _load_video_frames(
    path: Path, max_dim: int, max_duration_s: float
) -> tuple[list[NDArray], float]:
    """Lee un video real, lo reduce de resolución y lo recorta a `max_duration_s`."""
    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        raise ValueError(f"No se pudo abrir el video en {path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if not fps or fps <= 0:
        cap.release()
        raise ValueError(f"No se pudo determinar el fps del video en {path}")

    max_frames = int(fps * max_duration_s)
    frames: list[NDArray] = []
    while len(frames) < max_frames:
        ok, frame_bgr = cap.read()
        if not ok:
            break
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        resized = _resize_keep_aspect(gray, max_dim)
        frames.append(resized.astype(np.float64) / 255.0)
    cap.release()

    if not frames:
        raise ValueError(f"El video en {path} no tiene fotogramas legibles")

    return frames, fps


def load_motion_frames(asset_id: MotionAssetId) -> tuple[list[NDArray], float]:
    """Devuelve (frames, sample_rate)."""
    if asset_id == MotionAssetId.SYNTHETIC_BREATHING_1HZ:
        # Mismo aspecto 16:9 que los assets reales tras el resize.
        width, height, sample_rate, duration_s, freq_hz = 128, 72, 30.0, 4.0, 1.0
        n_frames = int(sample_rate * duration_s)
        t = np.arange(n_frames) / sample_rate
        x, y = np.meshgrid(np.arange(width), np.arange(height))
        # Período fijo en px (no en ciclos/eje) para que el patrón sea isotrópico.
        pattern_period_px = 16
        base = 0.5 + 0.3 * np.sin(2 * np.pi * x / pattern_period_px) * np.cos(
            2 * np.pi * y / pattern_period_px
        )
        frames = [
            base * (1.0 + 0.05 * np.sin(2 * np.pi * freq_hz * ti)) for ti in t
        ]
        return frames, sample_rate

    if asset_id == MotionAssetId.REAL_EYE_PULSE:
        path = ASSETS_DIR / "motion_magnifier" / "Macro Eye HD - Jkouw (360p, h264).mp4"
        return _load_video_frames(path, max_dim=128, max_duration_s=7.0)

    if asset_id == MotionAssetId.REAL_SPEAKER_VIBRATION:
        path = ASSETS_DIR / "motion_magnifier" / "Vibration Sound.mp4"
        return _load_video_frames(path, max_dim=128, max_duration_s=7.0)

    raise ValueError(f"asset_id no reconocido: {asset_id}")
