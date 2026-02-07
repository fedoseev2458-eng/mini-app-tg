import os
from ai.base import AIProvider
from ai.openai_provider import OpenAIProvider
from ai.gemini_provider import GeminiProvider


def get_ai_provider() -> AIProvider:
    """Провайдер задаётся переменной AI_PROVIDER=openai|gemini. По умолчанию openai."""
    provider = (os.getenv("AI_PROVIDER") or "openai").strip().lower()
    if provider == "gemini":
        return GeminiProvider()
    return OpenAIProvider()
