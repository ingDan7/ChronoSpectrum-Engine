"""Endpoints WebSocket para simulación en vivo (uno por módulo), en paralelo a los endpoints HTTP existentes."""

import asyncio

import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from api.assets import load_motion_frames, load_phase_pair, load_spectrum_asset
from api.encoding import array_to_jpeg_base64
from api.models import (
    MotionMagnifierRequest,
    PhaseCorrelatorRequest,
    SpectrumCleanerRequest,
)
from core.fft_filters import apply_filter, compute_spectrum, notch_filter
from core.motion_magnifier import MotionMagnifier
from core.phase_correlation import (
    cross_power_spectrum,
    fourier_shift,
    integer_peak,
    peak_to_sidelobe_ratio,
    phase_correlate_subpixel,
)
from core.temporal_filter import compute_temporal_psd

router = APIRouter()

# Tope manual de conexiones WS concurrentes (slowapi no cubre rutas @websocket).
MAX_TOTAL_WS_CONNECTIONS = 3
MAX_WS_CONNECTIONS_PER_IP = 1

_active_connections_by_ip: dict[str, int] = {}
_total_active_connections = 0


def _client_ip(websocket: WebSocket) -> str:
    return websocket.client.host if websocket.client else "unknown"


async def _reserve_ws_slot(websocket: WebSocket) -> bool:
    """Reserva un cupo de conexión antes de aceptar el WebSocket; cierra si no hay cupo."""
    global _total_active_connections
    ip = _client_ip(websocket)

    if _total_active_connections >= MAX_TOTAL_WS_CONNECTIONS:
        await websocket.close(
            code=1013,
            reason="Límite de simulaciones en vivo simultáneas alcanzado, intenta de nuevo en unos segundos",
        )
        return False
    if _active_connections_by_ip.get(ip, 0) >= MAX_WS_CONNECTIONS_PER_IP:
        await websocket.close(
            code=1013,
            reason="Ya tienes una simulación en vivo activa en otra pestaña",
        )
        return False

    _total_active_connections += 1
    _active_connections_by_ip[ip] = _active_connections_by_ip.get(ip, 0) + 1
    return True


def _release_ws_slot(websocket: WebSocket) -> None:
    """Libera el cupo reservado por `_reserve_ws_slot`."""
    global _total_active_connections
    ip = _client_ip(websocket)
    if ip not in _active_connections_by_ip:
        return
    _total_active_connections = max(0, _total_active_connections - 1)
    _active_connections_by_ip[ip] -= 1
    if _active_connections_by_ip[ip] <= 0:
        del _active_connections_by_ip[ip]


async def _receive_validated(websocket: WebSocket, model):
    """Espera el próximo mensaje JSON y lo valida contra `model`; None si falla la validación."""
    data = await websocket.receive_json()
    try:
        return model(**data)
    except ValidationError as exc:
        await websocket.send_json({"type": "error", "detail": str(exc)})
        return None


@router.websocket("/ws/motion-magnifier")
async def motion_magnifier_ws(websocket: WebSocket) -> None:
    if not await _reserve_ws_slot(websocket):
        return
    await websocket.accept()

    cache: dict = {
        "asset_id": None,
        "frames": None,
        "sample_rate": None,
        "original_frames_jpeg_base64": None,
    }
    busy = False
    pending: MotionMagnifierRequest | None = None

    async def process(params: MotionMagnifierRequest) -> None:
        nonlocal busy, pending
        busy = True
        try:
            if cache["asset_id"] != params.asset_id:
                frames, sample_rate = await asyncio.to_thread(load_motion_frames, params.asset_id)
                cache["frames"] = frames
                cache["sample_rate"] = sample_rate
                cache["asset_id"] = params.asset_id
                cache["original_frames_jpeg_base64"] = await asyncio.to_thread(
                    lambda: [array_to_jpeg_base64(f) for f in frames]
                )

            frames = cache["frames"]
            sample_rate = cache["sample_rate"]
            original_frames_jpeg_base64 = cache["original_frames_jpeg_base64"]

            nyquist = sample_rate / 2.0
            if params.f_high >= nyquist:
                await websocket.send_json(
                    {
                        "type": "error",
                        "detail": (
                            f"f_high ({params.f_high} Hz) debe ser menor que la "
                            f"frecuencia de Nyquist de este asset ({nyquist} Hz, "
                            f"sample_rate={sample_rate} fps)"
                        ),
                    }
                )
                return

            def compute() -> list[np.ndarray]:
                magnifier = MotionMagnifier(
                    frame_shape=frames[0].shape,
                    levels=params.levels,
                    alpha=params.alpha,
                    f_low=params.f_low,
                    f_high=params.f_high,
                    sample_rate=sample_rate,
                    filter_mode=params.filter_mode,
                )
                return magnifier.process_video(frames)

            try:
                output_frames = await asyncio.to_thread(compute)
            except ValueError as exc:
                await websocket.send_json({"type": "error", "detail": str(exc)})
                return

            psd = await asyncio.to_thread(compute_temporal_psd, output_frames, sample_rate)

            await websocket.send_json(
                {
                    "type": "result",
                    "frames_jpeg_base64": [array_to_jpeg_base64(f) for f in output_frames],
                    "sample_rate": sample_rate,
                    "original_frames_jpeg_base64": original_frames_jpeg_base64,
                    "alpha": params.alpha,
                    "f_low": params.f_low,
                    "f_high": params.f_high,
                    "psd": psd,
                }
            )
        except ValueError as exc:
            await websocket.send_json({"type": "error", "detail": str(exc)})
        finally:
            busy = False
            if pending is not None:
                next_params, pending = pending, None
                asyncio.create_task(process(next_params))

    try:
        while True:
            params = await _receive_validated(websocket, MotionMagnifierRequest)
            if params is None:
                continue
            if busy:
                pending = params
            else:
                asyncio.create_task(process(params))
    except WebSocketDisconnect:
        pass
    finally:
        _release_ws_slot(websocket)


@router.websocket("/ws/spectrum-cleaner")
async def spectrum_cleaner_ws(websocket: WebSocket) -> None:
    if not await _reserve_ws_slot(websocket):
        return
    await websocket.accept()

    cache: dict = {"asset_id": None, "noisy": None}
    busy = False
    pending: SpectrumCleanerRequest | None = None

    async def process(params: SpectrumCleanerRequest) -> None:
        nonlocal busy, pending
        busy = True
        try:
            if cache["asset_id"] != params.asset_id:
                noisy = await asyncio.to_thread(load_spectrum_asset, params.asset_id)
                cache["noisy"] = noisy
                cache["asset_id"] = params.asset_id

            noisy = cache["noisy"]

            def compute():
                f_shifted, magnitude_before = compute_spectrum(noisy)
                mask = np.ones(noisy.shape)
                for notch in params.notches:
                    mask = mask * notch_filter(
                        noisy.shape, notch.u0, notch.v0, notch.d0, mode=notch.mode, n=notch.n
                    )
                filtered = apply_filter(f_shifted, mask)
                _, magnitude_after = compute_spectrum(filtered)

                energy_before = float(np.sum(magnitude_before))
                energy_after = float(np.sum(magnitude_after))
                reduction_percent = (
                    (1.0 - energy_after / energy_before) * 100.0
                    if energy_before > 1e-12
                    else 0.0
                )
                return magnitude_before, magnitude_after, filtered, reduction_percent, mask

            magnitude_before, magnitude_after, filtered, reduction_percent, mask = await asyncio.to_thread(
                compute
            )

            await websocket.send_json(
                {
                    "type": "result",
                    "spectrum_before_jpeg_base64": array_to_jpeg_base64(magnitude_before),
                    "spectrum_after_jpeg_base64": array_to_jpeg_base64(magnitude_after),
                    "filtered_image_jpeg_base64": array_to_jpeg_base64(filtered),
                    "original_image_jpeg_base64": array_to_jpeg_base64(noisy),
                    "reduction_percent": reduction_percent,
                    "peak_count": len(params.notches),
                    "mask_jpeg_base64": array_to_jpeg_base64(mask),
                }
            )
        except ValueError as exc:
            await websocket.send_json({"type": "error", "detail": str(exc)})
        finally:
            busy = False
            if pending is not None:
                next_params, pending = pending, None
                asyncio.create_task(process(next_params))

    try:
        while True:
            params = await _receive_validated(websocket, SpectrumCleanerRequest)
            if params is None:
                continue
            if busy:
                pending = params
            else:
                asyncio.create_task(process(params))
    except WebSocketDisconnect:
        pass
    finally:
        _release_ws_slot(websocket)


@router.websocket("/ws/phase-correlator")
async def phase_correlator_ws(websocket: WebSocket) -> None:
    if not await _reserve_ws_slot(websocket):
        return
    await websocket.accept()

    busy = False
    pending: PhaseCorrelatorRequest | None = None

    async def process(params: PhaseCorrelatorRequest) -> None:
        nonlocal busy, pending
        busy = True
        try:
            img1, img2 = await asyncio.to_thread(load_phase_pair, params.asset_id)

            def compute():
                dy, dx = phase_correlate_subpixel(img1, img2)
                r = cross_power_spectrum(img1, img2)
                py, px, correlation = integer_peak(r)
                correlation_for_display = np.fft.fftshift(correlation)
                peak_confidence = float(correlation[py, px])
                psr = peak_to_sidelobe_ratio(correlation, py, px)
                image2_aligned = fourier_shift(img2, -dy, -dx)
                diff = np.abs(img1 - image2_aligned)
                dynamic_range = float(img1.max() - img1.min())
                residual_error_pct = (
                    100.0 * float(diff.mean()) / dynamic_range if dynamic_range > 1e-12 else 0.0
                )
                return dy, dx, correlation_for_display, peak_confidence, psr, image2_aligned, diff, residual_error_pct

            (
                dy,
                dx,
                correlation_for_display,
                peak_confidence,
                psr,
                image2_aligned,
                diff,
                residual_error_pct,
            ) = await asyncio.to_thread(compute)

            await websocket.send_json(
                {
                    "type": "result",
                    "dy": dy,
                    "dx": dx,
                    "correlation_peak_jpeg_base64": array_to_jpeg_base64(correlation_for_display, gamma=0.3),
                    "image1_jpeg_base64": array_to_jpeg_base64(img1),
                    "image2_jpeg_base64": array_to_jpeg_base64(img2),
                    "image2_aligned_jpeg_base64": array_to_jpeg_base64(image2_aligned),
                    "alignment_diff_jpeg_base64": array_to_jpeg_base64(diff),
                    "peak_confidence": peak_confidence,
                    "psr": psr,
                    "residual_error_pct": residual_error_pct,
                }
            )
        except ValueError as exc:
            await websocket.send_json({"type": "error", "detail": str(exc)})
        finally:
            busy = False
            if pending is not None:
                next_params, pending = pending, None
                asyncio.create_task(process(next_params))

    try:
        while True:
            params = await _receive_validated(websocket, PhaseCorrelatorRequest)
            if params is None:
                continue
            if busy:
                pending = params
            else:
                asyncio.create_task(process(params))
    except WebSocketDisconnect:
        pass
    finally:
        _release_ws_slot(websocket)
