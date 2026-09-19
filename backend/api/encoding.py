"""Utilidades de codificación de resultados a base64 para las respuestas de la API."""

import base64

import cv2
import numpy as np
from numpy.typing import NDArray


def array_to_png_base64(array: NDArray, gamma: float | None = None) -> str:
    """Normaliza un array 2D de floats a 8 bits y lo codifica como PNG en base64."""
    if array.ndim != 2:
        raise ValueError("array_to_png_base64 espera un array 2D")

    normalized = array - array.min()
    max_val = normalized.max()
    if max_val > 1e-12:
        normalized = normalized / max_val
    if gamma is not None and gamma > 0:
        # gamma < 1 expande la parte baja del rango [0,1] sin mover el máximo.
        normalized = np.power(normalized, gamma)
    img_uint8 = (normalized * 255).astype(np.uint8)

    ok, buffer = cv2.imencode(".png", img_uint8)
    if not ok:
        raise RuntimeError("No se pudo codificar la imagen a PNG")
    return base64.b64encode(buffer).decode("ascii")


def array_to_jpeg_base64(array: NDArray, quality: int = 80, gamma: float | None = None) -> str:
    """Igual que `array_to_png_base64` pero codifica a JPEG (para WebSocket en vivo)."""
    if array.ndim != 2:
        raise ValueError("array_to_jpeg_base64 espera un array 2D")

    normalized = array - array.min()
    max_val = normalized.max()
    if max_val > 1e-12:
        normalized = normalized / max_val
    if gamma is not None and gamma > 0:
        normalized = np.power(normalized, gamma)
    img_uint8 = (normalized * 255).astype(np.uint8)

    ok, buffer = cv2.imencode(".jpg", img_uint8, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise RuntimeError("No se pudo codificar la imagen a JPEG")
    return base64.b64encode(buffer).decode("ascii")
