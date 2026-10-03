from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.dependencies import get_current_user
from app.schemas.speech import SpeechLanguage, TranscriptionResponse
from app.services.speech_service import (
    AUTO_DETECT,
    SUPPORTED_LANGUAGES,
    SpeechServiceError,
    transcribe_audio,
)

router = APIRouter(prefix="/api/speech", tags=["speech"])


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    file: UploadFile = File(..., description="Audio clip (wav, mp3, m4a/aac, ogg/opus, webm, flac...). Up to ~30 s."),
    language_code: str = Form(AUTO_DETECT, description="BCP-47 code, or 'unknown' to auto-detect."),
    translate: bool = Form(True, description="Also return an English translation."),
    current_user=Depends(get_current_user),
):
    """Transcribe a multilingual voice note; returns the original transcript and English."""
    if file.content_type and not (
        file.content_type.startswith("audio/")
        or file.content_type.startswith("video/")  # m4a/mp4/webm are often labelled video/*
        or file.content_type == "application/octet-stream"
    ):
        raise HTTPException(status_code=415, detail=f"Unsupported content type '{file.content_type}'.")

    audio = await file.read()
    try:
        result = await transcribe_audio(
            audio=audio,
            filename=file.filename or "voice-note",
            content_type=file.content_type or "application/octet-stream",
            language_code=language_code,
            translate=translate,
        )
    except SpeechServiceError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)

    return TranscriptionResponse(
        transcript=result.transcript,
        english=result.english,
        language_code=result.language_code,
        language_name=SUPPORTED_LANGUAGES.get(result.language_code or ""),
        language_probability=result.language_probability,
        model=result.model,
    )


@router.get("/languages", response_model=List[SpeechLanguage])
def languages():
    """Languages that can be spoken in voice notes."""
    return [SpeechLanguage(code=code, name=name) for code, name in SUPPORTED_LANGUAGES.items()]
