"""Pirámides Gaussiana/Laplaciana para Eulerian Motion & Pulse Magnifier (filtro binomial 5, Wu et al. 2012)."""

import numpy as np
from numpy.typing import NDArray

_BINOMIAL_5 = np.array([1, 4, 6, 4, 1], dtype=np.float64) / 16.0


def _blur_separable(image: NDArray) -> NDArray:
    """Convolución 2D separable con el kernel binomial (bordes reflejados)."""
    pad = 2
    padded = np.pad(image, pad, mode="reflect")
    tmp = np.zeros_like(padded)
    for i, w in enumerate(_BINOMIAL_5):
        tmp += w * np.roll(padded, i - pad, axis=1)
    out = np.zeros_like(padded)
    for i, w in enumerate(_BINOMIAL_5):
        out += w * np.roll(tmp, i - pad, axis=0)
    return out[pad:-pad, pad:-pad]


def _downsample(image: NDArray) -> NDArray:
    blurred = _blur_separable(image)
    return blurred[::2, ::2]


def _upsample(image: NDArray, target_shape: tuple[int, int]) -> NDArray:
    h, w = target_shape
    up = np.zeros((h, w), dtype=image.dtype)
    up[::2, ::2] = image[: (h + 1) // 2, : (w + 1) // 2]
    return 4.0 * _blur_separable(up)


def build_gaussian_pyramid(image: NDArray, levels: int) -> list[NDArray]:
    pyramid = [image]
    current = image
    for _ in range(levels - 1):
        current = _downsample(current)
        pyramid.append(current)
    return pyramid


def build_laplacian_pyramid(image: NDArray, levels: int) -> list[NDArray]:
    """Últimas `levels-1` bandas son Laplacianas (detalle); la última es la Gaussiana base."""
    gaussian = build_gaussian_pyramid(image, levels)
    laplacian = []
    for i in range(levels - 1):
        upsampled = _upsample(gaussian[i + 1], gaussian[i].shape)
        laplacian.append(gaussian[i] - upsampled)
    laplacian.append(gaussian[-1])
    return laplacian


def collapse_laplacian_pyramid(pyramid: list[NDArray]) -> NDArray:
    current = pyramid[-1]
    for level in reversed(pyramid[:-1]):
        current = _upsample(current, level.shape) + level
    return current
