// Пусто = тот же origin (когда фронт раздаётся с бэкенда, один ngrok)
const API_BASE = import.meta.env.VITE_API_URL ?? ""

function headers(): HeadersInit {
  const h: HeadersInit = { Accept: "application/json" }
  const userId = (window as unknown as { __tgUserId?: string }).__tgUserId
  if (userId) (h as Record<string, string>)["x-telegram-user-id"] = userId
  return h
}

export type Project = {
  image?: string
  images?: string[]
  room_type?: string
  style?: string
  type?: string
  created_at?: number
}

export async function getProjects(): Promise<Project[]> {
  const r = await fetch(`${API_BASE}/projects`, { headers: headers() })
  if (!r.ok) return []
  return r.json()
}

export async function clearProjects(): Promise<void> {
  const r = await fetch(`${API_BASE}/projects`, {
    method: "DELETE",
    headers: headers(),
  })
  if (!r.ok) throw new Error("Не удалось очистить историю")
}

export async function redesignRoom(
  image: File,
  roomType: string,
  style: string,
  budget: string,
  text: string
): Promise<{ image: string }> {
  const form = new FormData()
  form.append("image", image)
  form.append("room_type", roomType)
  form.append("style", style)
  form.append("budget", budget)
  form.append("text", text)
  const r = await fetch(`${API_BASE}/api/redesign`, {
    method: "POST",
    headers: headers(),
    body: form,
  })
  if (!r.ok) {
    const data = await r.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || await r.text())
  }
  return r.json()
}

export async function redesignApartment(
  plan: File,
  preferences: string
): Promise<{ images: string[] }> {
  const form = new FormData()
  form.append("plan", plan)
  form.append("preferences", preferences)
  const r = await fetch(`${API_BASE}/api/redesign-apartment`, {
    method: "POST",
    headers: headers(),
    body: form,
  })
  if (!r.ok) {
    const data = await r.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || await r.text())
  }
  return r.json()
}
