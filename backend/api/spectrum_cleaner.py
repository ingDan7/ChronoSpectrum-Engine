"""Router del módulo 2D-FFT Interactive Spectrum Cleaner."""

import numpy as np
from fastapi import APIRouter, HTTPException, Request

from api.assets import load_spectrum_asset
from api.encoding import array_to_png_base64
from api.models import SpectrumCleanerRequest, SpectrumCleanerResponse
from api.rate_limit import limiter
from core.fft_filters import apply_filter, compute_spectrum, notch_filter

router = APIRouter()


@router.post("/api/spectrum-cleaner", response_model=SpectrumCleanerResponse)
@limiter.limit("20/minute")
def spectrum_cleaner(request: Request, body: SpectrumCleanerRequest) -> SpectrumCleanerResponse:
    try:
        noisy = load_spectrum_asset(body.asset_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    f_shifted, magnitude_before = compute_spectrum(noisy)

    # Varios notches se combinan multiplicando sus máscaras.
    mask = np.ones(noisy.shape)
    for notch in body.notches:
        mask = mask * notch_filter(
            noisy.shape, notch.u0, notch.v0, notch.d0, mode=notch.mode, n=notch.n
        )

    filtered = apply_filter(f_shifted, mask)
    _, magnitude_after = compute_spectrum(filtered)

    energy_before = float(np.sum(magnitude_before))
    energy_after = float(np.sum(magnitude_after))
    reduction_percent = (
        (1.0 - energy_after / energy_before) * 100.0 if energy_before > 1e-12 else 0.0
    )

    return SpectrumCleanerResponse(
        spectrum_before_png_base64=array_to_png_base64(magnitude_before),
        spectrum_after_png_base64=array_to_png_base64(magnitude_after),
        filtered_image_png_base64=array_to_png_base64(filtered),
        original_image_png_base64=array_to_png_base64(noisy),
        reduction_percent=reduction_percent,
        mask_png_base64=array_to_png_base64(mask),
    )
