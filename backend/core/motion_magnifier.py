"""Pipeline de amplificación Euleriana: descomposición -> filtro temporal -> x alpha -> recomposición (ver README.md)."""

import numpy as np
from numpy.typing import NDArray

from core.pyramids import build_laplacian_pyramid, collapse_laplacian_pyramid
from core.temporal_filter import IIRBandpass, ideal_bandpass_filter_temporal


class MotionMagnifier:
    def __init__(
        self,
        frame_shape: tuple[int, int],
        levels: int,
        alpha: float,
        f_low: float,
        f_high: float,
        sample_rate: float,
        filter_mode: str = "iir",
    ):
        self.levels = levels
        self.alpha = alpha
        self.filter_mode = filter_mode
        self.f_low = f_low
        self.f_high = f_high
        self.sample_rate = sample_rate

        dummy_pyramid_shapes = self._pyramid_shapes(frame_shape, levels)
        # IIRBandpass solo se construye en modo "iir"; "ideal_fft" filtra la ventana completa en process_video.
        if filter_mode == "iir":
            self._filters = [
                IIRBandpass(f_low, f_high, sample_rate, shape)
                for shape in dummy_pyramid_shapes[:-1]
            ]
        else:
            self._filters = None

    @staticmethod
    def _pyramid_shapes(shape: tuple[int, int], levels: int) -> list[tuple[int, int]]:
        shapes = [shape]
        h, w = shape
        for _ in range(levels - 1):
            h, w = (h + 1) // 2, (w + 1) // 2
            shapes.append((h, w))
        return shapes

    def process_frame(self, frame: NDArray) -> NDArray:
        """Amplifica un frame en modo streaming; solo válido para filter_mode == "iir"."""
        pyramid = build_laplacian_pyramid(frame, self.levels)

        amplified_pyramid = []
        for level, band in enumerate(pyramid[:-1]):
            bandpassed = self._filters[level].update(band)
            amplified_pyramid.append(band + self.alpha * bandpassed)
        amplified_pyramid.append(pyramid[-1])  # banda base sin amplificar

        return collapse_laplacian_pyramid(amplified_pyramid)

    def process_video(self, frames: list[NDArray]) -> list[NDArray]:
        """Procesa el video completo; en "ideal_fft" filtra cada nivel sobre el eje temporal completo."""
        if self.filter_mode == "iir":
            return [self.process_frame(frame) for frame in frames]

        pyramids = [build_laplacian_pyramid(frame, self.levels) for frame in frames]
        n_frames = len(frames)

        amplified_bands_by_level = []
        for level in range(self.levels - 1):
            band_stack = np.stack([pyramids[t][level] for t in range(n_frames)], axis=0)
            filtered = ideal_bandpass_filter_temporal(band_stack, self.f_low, self.f_high, self.sample_rate)
            amplified_bands_by_level.append(band_stack + self.alpha * filtered)

        output_frames = []
        for t in range(n_frames):
            amplified_pyramid = [amplified_bands_by_level[level][t] for level in range(self.levels - 1)]
            amplified_pyramid.append(pyramids[t][-1])  # banda base sin amplificar
            output_frames.append(collapse_laplacian_pyramid(amplified_pyramid))
        return output_frames
