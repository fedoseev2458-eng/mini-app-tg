"""
Image-to-image: OpenAI images.edit (gpt-image) — фото комнаты или планировка → новый дизайн.
"""
import io
import os
import logging
from openai import OpenAI
from ai.base import AIProvider
from ai.config import PROMPT_MAX_CHARS, APARTMENT_IMAGES_COUNT
from ai.prompts import get_room_prompt, get_apartment_view_prompts
from ai.styles import STYLES, BUDGETS

log = logging.getLogger(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _edit_image(image_bytes: bytes, prompt: str, filename: str = "room.jpg") -> str:
    """Image-to-image: редактирование фото/планировки по промпту."""
    prompt = prompt[:PROMPT_MAX_CHARS] if len(prompt) > PROMPT_MAX_CHARS else prompt
    f = io.BytesIO(image_bytes)
    f.name = filename
    result = client.images.edit(
        model="gpt-image-1.5",
        image=f,
        prompt=prompt,
    )
    d = result.data[0]
    if getattr(d, "url", None):
        return d.url
    if getattr(d, "b64_json", None):
        return f"data:image/png;base64,{d.b64_json}"
    raise ValueError("No image data in response")


def _generate_from_text(prompt: str) -> str:
    """Fallback: text-to-image, если image edit недоступен."""
    prompt = prompt[:PROMPT_MAX_CHARS] if len(prompt) > PROMPT_MAX_CHARS else prompt
    result = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        size="1024x1024",
        quality="standard",
        style="natural",
    )
    return (result.data[0].url or "").strip()


class OpenAIProvider(AIProvider):
    async def redesign_room(
        self,
        image_bytes: bytes,
        room_type: str,
        style: str,
        budget: str,
        user_text: str,
    ) -> str:
        """Image-to-image: фото комнаты → новый дизайн по стилю."""
        style_desc = STYLES.get(style, STYLES["minimalist"])
        budget_desc = BUDGETS.get(budget, BUDGETS["medium"])
        prompt = get_room_prompt(room_type, style_desc, budget_desc, user_text)
        full = f"Redesign this room. Keep the same layout and camera angle. {prompt} Photorealistic interior."
        return _edit_image(image_bytes, full)

    async def redesign_apartment(
        self,
        plan_image_bytes: bytes,
        user_preferences: str,
    ) -> list[str]:
        """Планировка: image-to-image — планировка → реалистичные фото по зонам."""
        view_prompts = get_apartment_view_prompts(user_preferences)[:APARTMENT_IMAGES_COUNT]
        images = []
        for i, view_prompt in enumerate(view_prompts):
            full = f"Based on this floor plan, generate a photorealistic interior photo. {view_prompt} Professional interior photography, natural lighting."
            images.append(_edit_image(plan_image_bytes, full, filename="plan.jpg"))
        return images
