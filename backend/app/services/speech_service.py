"""Multilingual speech-to-text for bedside voice notes, backed by Sarvam AI.

The Sarvam API key stays on the server; clients upload audio to
`POST /api/speech/transcribe` and receive the transcript in the spoken
language plus an English version.
"""

import asyncio
import logging
from dataclasses import dataclass
from typing import Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"
REQUEST_TIMEOUT_S = 60.0
MAX_AUDIO_BYTES = 25 * 1024 * 1024

# Languages accepted by Sarvam speech-to-text (BCP-47).
SUPPORTED_LANGUAGES: dict[str, str] = {
    "en-IN": "English",
    "hi-IN": "Hindi",
    "bn-IN": "Bengali",
    "kn-IN": "Kannada",
    "ml-IN": "Malayalam",
    "mr-IN": "Marathi",
    "od-IN": "Odia",
    "pa-IN": "Punjabi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "gu-IN": "Gujarati",
    "as-IN": "Assamese",
    "ur-IN": "Urdu",
    "ne-IN": "Nepali",
    "kok-IN": "Konkani",
    "ks-IN": "Kashmiri",
    "sd-IN": "Sindhi",
    "sa-IN": "Sanskrit",
    "sat-IN": "Santali",
    "mni-IN": "Manipuri",
    "brx-IN": "Bodo",
    "mai-IN": "Maithili",
    "doi-IN": "Dogri",
}
AUTO_DETECT = "unknown"


class SpeechServiceError(Exception):
    """Raised for transcription failures; `status_code` is the HTTP status to return."""

    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


@dataclass
class Transcription:
    transcript: str
    english: str
    language_code: Optional[str]
    language_probability: Optional[float]
    model: str


SARVAM_CONTENT_TYPE_MAP = {
    "audio/m4a": "audio/x-m4a",
    "video/mp4": "audio/mp4",
    "audio/3gpp": "audio/amr",
    "audio/3gp": "audio/amr",
}

SARVAM_ALLOWED_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/mpeg3", "audio/x-mpeg-3", "audio/x-mp3",
    "audio/wav", "audio/x-wav", "audio/wave", "audio/pcm_s16le", "audio/l16",
    "audio/raw", "application/octet-stream", "audio/aac", "audio/x-aac",
    "audio/aiff", "audio/x-aiff", "audio/ogg", "audio/opus", "audio/flac",
    "audio/x-flac", "audio/mp4", "audio/x-m4a", "audio/amr", "audio/x-ms-wma",
    "audio/webm", "video/webm",
}


def normalize_content_type(ct: str, filename: str = "") -> str:
    cleaned = (ct or "").lower().split(";")[0].strip()
    if cleaned in SARVAM_CONTENT_TYPE_MAP:
        return SARVAM_CONTENT_TYPE_MAP[cleaned]
    if cleaned in SARVAM_ALLOWED_TYPES:
        return cleaned
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext == "m4a":
        return "audio/x-m4a"
    if ext in ("mp3", "wav", "webm", "aac", "ogg", "flac"):
        return f"audio/{ext}"
    if ext == "mp4":
        return "audio/mp4"
    return "audio/x-m4a" if "m4a" in cleaned else (cleaned or "application/octet-stream")


def _is_english(code: Optional[str]) -> bool:
    return bool(code) and code.startswith("en")


def _error_detail(response: httpx.Response) -> str:
    try:
        body = response.json()
        err = body.get("error") if isinstance(body, dict) else None
        if isinstance(err, dict) and err.get("message"):
            return str(err["message"])
        if isinstance(body, dict) and body.get("detail"):
            return str(body["detail"])
    except ValueError:
        pass
    return response.text[:200] or f"HTTP {response.status_code}"


async def _call_sarvam(
    client: httpx.AsyncClient,
    audio: bytes,
    filename: str,
    content_type: str,
    mode: str,
    language_code: str,
    api_key: str,
    model: str,
) -> dict:
    try:
        response = await client.post(
            SARVAM_STT_URL,
            headers={"api-subscription-key": api_key},
            files={"file": (filename, audio, content_type)},
            data={"model": model, "mode": mode, "language_code": language_code},
        )
    except httpx.TimeoutException:
        raise SpeechServiceError(504, "Transcription service timed out.")
    except httpx.HTTPError as exc:
        logger.warning("Sarvam STT request failed: %s", exc.__class__.__name__)
        raise SpeechServiceError(502, "Could not reach the transcription service.")

    if response.status_code == 200:
        return response.json()

    detail = _error_detail(response)
    logger.warning("Sarvam STT %s (%s): %s", mode, response.status_code, detail)
    if response.status_code in (400, 422):
        raise SpeechServiceError(422, f"Audio could not be transcribed: {detail}")
    if response.status_code in (401, 403):
        # Don't surface as 401 — that would look like the *client's* auth failed.
        raise SpeechServiceError(502, "Transcription service rejected the server's API key.")
    if response.status_code == 429:
        raise SpeechServiceError(429, "Transcription rate limit reached. Try again shortly.")
    raise SpeechServiceError(502, f"Transcription service error ({response.status_code}).")


async def transcribe_audio(
    audio: bytes,
    filename: str,
    content_type: str,
    language_code: str = AUTO_DETECT,
    translate: bool = True,
) -> Transcription:
    """Transcribe audio in its spoken language and (optionally) translate to English.

    With `language_code="unknown"` Sarvam auto-detects the language. When
    translation is requested and the language isn't known to be English, the
    transcribe and translate calls run concurrently to keep latency low.
    """
    settings = get_settings()
    if not settings.SARVAM_API_KEY:
        raise SpeechServiceError(503, "Speech-to-text is not configured on the server.")
    if not audio:
        raise SpeechServiceError(400, "Uploaded audio file is empty.")
    if len(audio) > MAX_AUDIO_BYTES:
        raise SpeechServiceError(413, "Audio file is too large (max 25 MB).")
    if language_code != AUTO_DETECT and language_code not in SUPPORTED_LANGUAGES:
        raise SpeechServiceError(400, f"Unsupported language_code '{language_code}'.")

    model = settings.SARVAM_STT_MODEL
    safe_content_type = normalize_content_type(content_type, filename)
    common = dict(
        audio=audio,
        filename=filename,
        content_type=safe_content_type,
        language_code=language_code,
        api_key=settings.SARVAM_API_KEY,
        model=model,
    )
    need_translation = translate and not _is_english(language_code)

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_S) as client:
        if need_translation:
            native, translated = await asyncio.gather(
                _call_sarvam(client, mode="transcribe", **common),
                _call_sarvam(client, mode="translate", **common),
            )
        else:
            native = await _call_sarvam(client, mode="transcribe", **common)
            translated = None

    transcript = (native.get("transcript") or "").strip()
    detected = native.get("language_code") or (
        language_code if language_code != AUTO_DETECT else None
    )
    if translated is not None and not _is_english(detected):
        english = (translated.get("transcript") or "").strip()
    else:
        english = transcript

    return Transcription(
        transcript=transcript,
        english=english,
        language_code=detected,
        language_probability=native.get("language_probability"),
        model=model,
    )
