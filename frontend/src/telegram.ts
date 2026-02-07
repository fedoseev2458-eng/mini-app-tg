declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        initDataUnsafe: { user?: { id: number; username?: string } }
      }
    }
  }
}

export function initTelegram() {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready()
    window.Telegram.WebApp.expand()
  }
}

export function getTelegramUserId(): string | null {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user
  return user ? String(user.id) : null
}
