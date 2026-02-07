def get_room_prompt(room_type: str, style_desc: str, budget_desc: str, user_text: str) -> str:
    """Сохранить ракурс и общий layout. Мебель может меняться под новый стиль."""
    user_part = f" Client wishes: {user_text}." if user_text.strip() else ""
    return (
        "Keep camera angle and room layout from the description. Same viewpoint and perspective. "
        "Furniture can be updated to match the new style — same positions preferred, but new pieces allowed. "
        "Walls, floor, windows, light positions — same. Furniture may be replaced with style-appropriate pieces. "
        f"Room: {room_type}. Style: {style_desc}. Budget: {budget_desc}.{user_part} "
        "Photorealistic interior, natural lighting."
    ).strip()


def get_apartment_prompt(user_preferences: str) -> str:
    """Общий промпт для квартиры — реалистичный дизайн."""
    return (
        "Photorealistic interior photography. Professional interior design visualization. "
        "Real materials, natural lighting, realistic furniture. "
        f"Client preferences: {user_preferences}. "
    ).strip()


def get_apartment_view_prompts(user_preferences: str) -> list[str]:
    """
    Несколько зон квартиры — по одной реалистичной фотографии на зону.
    """
    base = get_apartment_prompt(user_preferences)
    return [
        f"Generate a photorealistic interior photo: living room and kitchen. {base} High-end interior photography, natural daylight.",
        f"Generate a photorealistic interior photo: bedroom. {base} Cozy, professional photo, soft lighting.",
        f"Generate a photorealistic interior photo: bathroom and toilet. {base} Clean, modern, realistic materials.",
        f"Generate a photorealistic interior photo: corridor, entrance, hallway. {base} Welcoming space, realistic lighting.",
    ]


def get_vision_analysis_prompt() -> str:
    return (
        "Describe this room photo for redesign. Format: "
        "CAMERA: viewpoint, height, angle. "
        "FURNITURE: each piece, position, orientation. "
        "WINDOWS: positions, sizes. LIGHT: sources and positions. ROOM: shape, ceiling. "
        "Write in English. Be concise."
    ).strip()


def get_plan_analysis_prompt() -> str:
    return (
        "Describe this floor plan in detail: list EVERY space. "
        "For each: room name (living room, bedroom 1, bedroom 2, kitchen, bathroom, toilet, corridor, entrance, etc.), "
        "approximate size and position, connections to other rooms, windows and doors. "
        "Write in English. Be exhaustive — no room, corridor, or bathroom may be omitted."
    ).strip()
