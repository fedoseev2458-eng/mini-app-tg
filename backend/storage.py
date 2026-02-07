import time

_DB = {}

def save_project(user_id, project):
    if not user_id:
        return
    record = {
        **project,
        "created_at": time.time(),
    }
    _DB.setdefault(user_id, []).append(record)

def get_projects(user_id):
    if not user_id:
        return []
    items = _DB.get(user_id, [])
    # Нормализация: image → images для квартиры
    for item in items:
        if "images" not in item and "image" in item:
            item["images"] = [item["image"]]
    return sorted(items, key=lambda x: x.get("created_at", 0), reverse=True)
