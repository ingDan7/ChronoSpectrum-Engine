# Assets demo — Fase 3

Esta carpeta contiene los archivos FUENTE reales usados por el set cerrado
de demostración (ver ROADMAP.md, Fase 3, y README.md, sección "Sin upload
libre de video/imagen"). Estos NO se sirven directamente al cliente: el
backend los carga vía `backend/api/assets.py` y responde con el resultado
procesado, nunca con el archivo original.

## Estructura y nombres de archivo reales

```
backend/assets/
├── phase_correlator/
│   └── source_photo.jpg                                        <- asset_id "real_shifted_pair"
├── spectrum_cleaner/
│   └── noisy_image.jpg                                         <- asset_id "real_mesh_texture"
└── motion_magnifier/
    ├── Macro Eye HD - Jkouw (360p, h264).mp4                    <- asset_id "real_eye_pulse"
    └── Vibration Sound.mp4                                      <- asset_id "real_speaker_vibration"
```

## Procedencia y licencia

- `spectrum_cleaner/noisy_image.jpg`: [https://co.pinterest.com/pin/517421444683764617/](https://co.pinterest.com/pin/517421444683764617/) — de uso libre, verificado por Daniel.
- `phase_correlator/source_photo.jpg`: [https://co.pinterest.com/pin/571253534007641134/](https://co.pinterest.com/pin/571253534007641134/) — de uso libre, verificado por Daniel.
- `motion_magnifier/Macro Eye HD - Jkouw (360p, h264).mp4`: [https://www.youtube.com/watch?v=Jwbu5-UiohY](https://www.youtube.com/watch?v=Jwbu5-UiohY) — de uso libre, verificado por Daniel.
- `motion_magnifier/Vibration Sound.mp4`: [https://www.pexels.com/video/close-up-of-vibrating-wooden-speaker-cone-29594574/](https://www.pexels.com/video/close-up-of-vibrating-wooden-speaker-cone-29594574/) — Pexels License (autor "ed br"), libre para uso comercial sin atribución, confirmado directamente en la página de Pexels.
