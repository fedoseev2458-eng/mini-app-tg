"""
Абстрактный провайдер ИИ. Реализации: OpenAI, Gemini.
Смена провайдера через переменную окружения AI_PROVIDER=openai|gemini
"""
from abc import ABC, abstractmethod


class AIProvider(ABC):
    @abstractmethod
    async def redesign_room(
        self,
        image_bytes: bytes,
        room_type: str,
        style: str,
        budget: str,
        user_text: str,
    ) -> str:
        """Генерация дизайна комнаты по фото. Возвращает URL или base64 изображения."""
        pass

    @abstractmethod
    async def redesign_apartment(
        self,
        plan_image_bytes: bytes,
        user_preferences: str,
    ) -> list[str]:
        """Генерация дизайн-проекта квартиры. Несколько картинок (всю планировку в одну не уместить)."""
        pass
