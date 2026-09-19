"""Router del módulo Sub-Pixel Phase Correlator."""

import numpy as np
from fastapi import APIRouter, HTTPException, Request

from api.assets import load_phase_pair
from api.encoding import array_to_png_base64
from api.models import PhaseCorrelatorRequest, PhaseCorrelatorResponse
from api.rate_limit import limiter
from core.phase_correlation import (
    cross_power_spectrum,
    fourier_shift,
    integer_peak,
    peak_to_sidelobe_ratio,
    phase_correlate_subpixel,
)

router = APIRouter()


@router.post("/api/phase-correlator", response_model=PhaseCorrelatorResponse)
@limiter.limit("20/minute")
def phase_correlator(request: Request, body: PhaseCorrelatorRequest) -> PhaseCorrelatorResponse:
    try:
        img1, img2 = load_phase_pair(body.asset_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    dy, dx = phase_correlate_subpixel(img1, img2)

    r = cross_power_spectrum(img1, img2)
    py, px, correlation = integer_peak(r)

    # fftshift centra el pico para visualización; py/px crudos siguen igual.
    correlation_for_display = np.fft.fftshift(correlation)

    peak_confidence = float(correlation[py, px])
    psr = peak_to_sidelobe_ratio(correlation, py, px)

    # Signo invertido: corrige img2 de vuelta sobre img1 (ver fourier_shift).
    image2_aligned = fourier_shift(img2, -dy, -dx)

    diff = np.abs(img1 - image2_aligned)
    dynamic_range = float(img1.max() - img1.min())
    residual_error_pct = 100.0 * float(diff.mean()) / dynamic_range if dynamic_range > 1e-12 else 0.0

    return PhaseCorrelatorResponse(
        dy=dy,
        dx=dx,
        correlation_peak_png_base64=array_to_png_base64(correlation_for_display, gamma=0.3),
        image1_png_base64=array_to_png_base64(img1),
        image2_png_base64=array_to_png_base64(img2),
        image2_aligned_png_base64=array_to_png_base64(image2_aligned),
        peak_confidence=peak_confidence,
        psr=psr,
        alignment_diff_png_base64=array_to_png_base64(diff),
        residual_error_pct=residual_error_pct,
    )
