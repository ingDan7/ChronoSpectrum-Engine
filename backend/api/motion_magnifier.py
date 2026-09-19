"""Router del módulo Eulerian Motion & Pulse Magnifier."""

from fastapi import APIRouter, HTTPException, Request

from api.assets import load_motion_frames
from api.encoding import array_to_jpeg_base64, array_to_png_base64
from api.models import MotionMagnifierRequest, MotionMagnifierResponse, TemporalPsd
from api.rate_limit import limiter
from core.motion_magnifier import MotionMagnifier
from core.temporal_filter import compute_temporal_psd

router = APIRouter()


@router.post("/api/motion-magnifier", response_model=MotionMagnifierResponse)
@limiter.limit("20/minute")
def motion_magnifier(request: Request, body: MotionMagnifierRequest) -> MotionMagnifierResponse:
    try:
        frames, sample_rate = load_motion_frames(body.asset_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # f_high debe respetar Nyquist; depende del asset, no se valida en el esquema.
    nyquist = sample_rate / 2.0
    if body.f_high >= nyquist:
        raise HTTPException(
            status_code=422,
            detail=(
                f"f_high ({body.f_high} Hz) debe ser menor que la frecuencia de "
                f"Nyquist de este asset ({nyquist} Hz, sample_rate={sample_rate} fps)"
            ),
        )

    try:
        magnifier = MotionMagnifier(
            frame_shape=frames[0].shape,
            levels=body.levels,
            alpha=body.alpha,
            f_low=body.f_low,
            f_high=body.f_high,
            sample_rate=sample_rate,
            filter_mode=body.filter_mode,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    output_frames = magnifier.process_video(frames)
    psd = compute_temporal_psd(output_frames, sample_rate)

    return MotionMagnifierResponse(
        frames_png_base64=[array_to_png_base64(frame) for frame in output_frames],
        sample_rate=sample_rate,
        original_frames_jpeg_base64=[array_to_jpeg_base64(frame) for frame in frames],
        psd=TemporalPsd(**psd),
    )
