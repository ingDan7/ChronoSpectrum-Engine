"""Esquemas Pydantic de request/response de la capa de API."""

from pydantic import BaseModel, Field, model_validator

from api.assets import MotionAssetId, PhaseAssetId, SpectrumAssetId


class NotchParams(BaseModel):
    """Un filtro notch individual, centrado en (u0,v0)/(-u0,-v0) del espectro."""

    u0: float = Field(..., description="Coordenada u del pico de ruido a eliminar")
    v0: float = Field(..., description="Coordenada v del pico de ruido a eliminar")
    d0: float = Field(..., gt=0, le=200, description="Radio de corte del notch")
    mode: str = Field("gaussian", pattern="^(ideal|gaussian|butterworth)$")
    n: int = Field(2, ge=1, le=10, description="Orden del filtro (solo Butterworth)")


class SpectrumCleanerRequest(BaseModel):
    asset_id: SpectrumAssetId
    notches: list[NotchParams] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="Uno o más filtros notch a aplicar, combinados por multiplicación de máscaras",
    )


class SpectrumCleanerResponse(BaseModel):
    spectrum_before_png_base64: str
    spectrum_after_png_base64: str
    filtered_image_png_base64: str
    original_image_png_base64: str
    reduction_percent: float
    mask_png_base64: str


class PhaseCorrelatorRequest(BaseModel):
    asset_id: PhaseAssetId


class PhaseCorrelatorResponse(BaseModel):
    dy: float
    dx: float
    correlation_peak_png_base64: str
    image1_png_base64: str
    image2_png_base64: str
    image2_aligned_png_base64: str
    peak_confidence: float
    psr: float
    alignment_diff_png_base64: str
    residual_error_pct: float


class MotionMagnifierRequest(BaseModel):
    asset_id: MotionAssetId
    levels: int = Field(
        3,
        ge=2,
        le=5,
        description="Niveles de la pirámide Laplaciana. Rango 2-5, ver core/pyramids.py.",
    )
    filter_mode: str = Field(
        "iir",
        pattern="^(iir|ideal_fft)$",
        description="Arquitectura del filtro temporal: 'iir' (default) o 'ideal_fft'.",
    )
    alpha: float = Field(
        10.0,
        ge=1.0,
        le=50.0,
        description="Factor de amplificación (1.0-50.0, decisión de ingeniería, no del paper).",
    )
    f_low: float = Field(0.8, gt=0, description="Límite inferior de la banda, en Hz")
    f_high: float = Field(1.2, gt=0, description="Límite superior de la banda, en Hz")

    @model_validator(mode="after")
    def check_band(self) -> "MotionMagnifierRequest":
        if self.f_low >= self.f_high:
            raise ValueError("f_low debe ser menor que f_high")
        return self


class TemporalPsd(BaseModel):
    """PSD real del trazo temporal (ver core/temporal_filter.py::compute_temporal_psd)."""

    freqs: list[float]
    magnitude: list[float]


class MotionMagnifierResponse(BaseModel):
    frames_png_base64: list[str]
    sample_rate: float
    original_frames_jpeg_base64: list[str]
    psd: TemporalPsd
