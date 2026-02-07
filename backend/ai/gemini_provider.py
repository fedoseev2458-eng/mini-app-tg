import os
import google.generativeai as genai
from ai.base import AIProvider
from ai.config import IMAGE_SIZE, IMAGE_QUALITY, PROMPT_MAX_CHARS, APARTMENT_IMAGES_COUNT
from ai.prompts import (
    get_room_prompt,
    get_vision_analysis_prompt,
    get_plan_analysis_prompt,
    get_apartment_view_prompts,
)
from ai.styles import STYLES, BUDGETS

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def _analyze_image(image_bytes: bytes, prompt: str) -> str:
    model = genai.GenerativeModel("gemini-1.5-flash")
    img_part = {"mime_type": "image/jpeg", "data": image_bytes}
    resp = model.generate_content([prompt, img_part])
    return (resp.text or "").strip()


def _generate_image_fallback(prompt: str) -> str:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        if not client.api_key:
            return ""
        prompt = prompt[:PROMPT_MAX_CHARS] if len(prompt) > PROMPT_MAX_CHARS else prompt
        result = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=IMAGE_SIZE,
            quality=IMAGE_QUALITY,
        )
        return (result.data[0].url or "").strip()
    except Exception:
        return ""


class GeminiProvider(AIProvider):
    async def redesign_room(
        self,
        image_bytes: bytes,
        room_type: str,
        style: str,
        budget: str,
        user_text: str,
    ) -> str:
        analysis = _analyze_image(image_bytes, get_vision_analysis_prompt())
        style_desc = STYLES.get(style, STYLES["minimalist"])
        budget_desc = BUDGETS.get(budget, BUDGETS["medium"])
        prompt = get_room_prompt(room_type, style_desc, budget_desc, user_text)
        full_prompt = f"Based on this room description: {analysis}. {prompt}"
        url = _generate_image_fallback(full_prompt)
        if url:
            return url
        raise NotImplementedError(
            "Image generation: set OPENAI_API_KEY for DALL-E fallback or use AI_PROVIDER=openai."
        )

    async def redesign_apartment(
        self,
        plan_image_bytes: bytes,
        user_preferences: str,
    ) -> list[str]:
        analysis = _analyze_image(plan_image_bytes, get_plan_analysis_prompt())
        view_prompts = get_apartment_view_prompts(user_preferences)[:APARTMENT_IMAGES_COUNT]
        images = []
        for view_prompt in view_prompts:
            full_prompt = f"Floor plan: {analysis}. {view_prompt}"
            url = _generate_image_fallback(full_prompt)
            if not url:
                raise NotImplementedError(
                    "Image generation: set OPENAI_API_KEY for DALL-E fallback or use AI_PROVIDER=openai."
                )
            images.append(url)
        return images
