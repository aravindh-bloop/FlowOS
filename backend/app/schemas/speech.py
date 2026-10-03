from typing import Optional

from pydantic import BaseModel


class TranscriptionResponse(BaseModel):
    """Result of a multilingual voice-note transcription."""

    transcript: str
    """Transcript in the language that was spoken."""
    english: str
    """English rendering for clinicians (equals `transcript` when spoken in English)."""
    language_code: Optional[str] = None
    """Detected (or provided) BCP-47 language code, e.g. `hi-IN`."""
    language_name: Optional[str] = None
    language_probability: Optional[float] = None
    """0-1 confidence of language detection (only when auto-detecting)."""
    model: str


class SpeechLanguage(BaseModel):
    code: str
    name: str
