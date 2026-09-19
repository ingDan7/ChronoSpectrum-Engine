import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.live import router as live_router
from api.motion_magnifier import router as motion_magnifier_router
from api.phase_correlator import router as phase_correlator_router
from api.rate_limit import limiter
from api.spectrum_cleaner import router as spectrum_cleaner_router

# Carga `.env` en local si existe; no falla si no hay archivo (en Render las variables se inyectan directo).
load_dotenv()

app = FastAPI(title="ChronoSpectrum Engine API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Orígenes CORS por env var, separados por coma; default a localhost para desarrollo sin configurar nada.
origins = [
    origin.strip()
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(spectrum_cleaner_router)
app.include_router(phase_correlator_router)
app.include_router(motion_magnifier_router)
app.include_router(live_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
