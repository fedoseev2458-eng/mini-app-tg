import { useState, useEffect, useRef } from "react"
import { initTelegram, getTelegramUserId } from "./telegram"
import { getProjects, clearProjects, redesignRoom, redesignApartment, type Project } from "./api"
import "./styles.css"

type Screen = "home" | "room" | "apartment" | "ar" | "profile"

function App() {
  const [splash, setSplash] = useState(true)
  const [screen, setScreen] = useState<Screen>("home")
  const [splashExiting, setSplashExiting] = useState(false)

  useEffect(() => {
    initTelegram()
    const id = getTelegramUserId()
    if (typeof window !== "undefined") {
      (window as unknown as { __tgUserId?: string }).__tgUserId = id ?? undefined
    }
  }, [])

  useEffect(() => {
    const startExit = setTimeout(() => setSplashExiting(true), 2000)
    const hide = setTimeout(() => setSplash(false), 2500)
    return () => {
      clearTimeout(startExit)
      clearTimeout(hide)
    }
  }, [])

  return (
    <>
      {splash && (
        <div className={`splash ${splashExiting ? "splash-out" : ""}`}>
          <div className="splash-logo">Room AI</div>
          <div className="splash-tagline">Дизайн интерьера с ИИ</div>
          <div className="splash-line" />
        </div>
      )}

      {!splash && (
        <div className="app">
          {screen === "home" && (
            <HomeScreen
              onRoom={() => setScreen("room")}
              onApartment={() => setScreen("apartment")}
              onAr={() => setScreen("ar")}
              onProfile={() => setScreen("profile")}
            />
          )}
          {screen === "room" && <RoomScreen onBack={() => setScreen("home")} />}
          {screen === "apartment" && <ApartmentScreen onBack={() => setScreen("home")} />}
          {screen === "ar" && <ArScreen onBack={() => setScreen("home")} />}
          {screen === "profile" && <ProfileScreen onBack={() => setScreen("home")} />}
        </div>
      )}
    </>
  )
}

function HomeScreen({
  onRoom,
  onApartment,
  onAr,
  onProfile,
}: {
  onRoom: () => void
  onApartment: () => void
  onAr: () => void
  onProfile: () => void
}) {
  return (
    <div className="page page--home">
      <h1>Room AI</h1>
      <p className="subtitle">Выберите, что хотите спроектировать</p>

      <div
        className="card card-interactive"
        role="button"
        tabIndex={0}
        onClick={onRoom}
        onKeyDown={(e) => e.key === "Enter" && onRoom()}
      >
        <div className="card-title">Комната по фото</div>
        <p className="section-label">
          Загрузите фото комнаты, выберите стиль и бюджет — получите новый дизайн в той же расстановке
        </p>
      </div>

      <div
        className="card card-interactive"
        role="button"
        tabIndex={0}
        onClick={onApartment}
        onKeyDown={(e) => e.key === "Enter" && onApartment()}
      >
        <div className="card-title">Квартира по планировке</div>
        <p className="section-label">
          Загрузите планировку и пожелания — получите дизайн всех комнат, коридоров, ванных и кухни
        </p>
      </div>

      <div
        className="card card-interactive"
        role="button"
        tabIndex={0}
        onClick={onAr}
        onKeyDown={(e) => e.key === "Enter" && onAr()}
      >
        <div className="card-title">
          AR — мебель в комнате
          <span className="card-badge">Магазины</span>
        </div>
        <p className="section-label">
          Подключите магазин мебели и смотрите товары в своей комнате в дополненной реальности
        </p>
      </div>

      <div
        className="card card-interactive"
        role="button"
        tabIndex={0}
        onClick={onProfile}
        onKeyDown={(e) => e.key === "Enter" && onProfile()}
      >
        <div className="card-title">Мои генерации</div>
        <p className="section-label">
          Все сохранённые дизайны — профиль привязан к вашему Telegram
        </p>
      </div>
    </div>
  )
}

function ResultFullScreen({
  images,
  onClose,
  title,
  subtitle,
  initialIndex = 0,
}: {
  images: string[]
  onClose: () => void
  title: string
  subtitle: string
  initialIndex?: number
}) {
  const [index, setIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [transX, setTransX] = useState(0)
  const [transY, setTransY] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0, transX: 0, transY: 0 })
  const touchStartX = useRef(0)
  const imageWrapRef = useRef<HTMLDivElement>(null)

  const url = images[index]
  const hasMultiple = images.length > 1

  useEffect(() => {
    setIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    setScale(1)
    setTransX(0)
    setTransY(0)
  }, [index])

  const goPrev = () => {
    if (!hasMultiple) return
    setIndex((i) => (i <= 0 ? images.length - 1 : i - 1))
  }
  const goNext = () => {
    if (!hasMultiple) return
    setIndex((i) => (i >= images.length - 1 ? 0 : i + 1))
  }

  useEffect(() => {
    const el = imageWrapRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.15 : 0.15
      setScale((s) => Math.min(4, Math.max(1, s + delta)))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    e.preventDefault()
    setIsPanning(true)
    panStart.current = { x: e.clientX, y: e.clientY, transX, transY }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    setTransX(panStart.current.transX + e.clientX - panStart.current.x)
    setTransY(panStart.current.transY + e.clientY - panStart.current.y)
  }
  const handleMouseUp = () => setIsPanning(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    if (scale > 1) {
      setIsPanning(true)
      panStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        transX,
        transY,
      }
    }
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && scale > 1) {
      setTransX(panStart.current.transX + e.touches[0].clientX - panStart.current.x)
      setTransY(panStart.current.transY + e.touches[0].clientY - panStart.current.y)
    }
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (scale <= 1 && hasMultiple) {
      const endX = e.changedTouches[0].clientX
      const delta = touchStartX.current - endX
      if (Math.abs(delta) > 50) {
        if (delta > 0) goNext()
        else goPrev()
      }
    }
    setIsPanning(false)
  }

  return (
    <div className="result-fullscreen">
      <div className="result-fullscreen-backdrop" onClick={onClose} />
      <div className="result-fullscreen-content">
        <div className="result-fullscreen-frame">
          <div className="result-fullscreen-header">
            <span className="result-fullscreen-badge">Room AI</span>
            <button
              type="button"
              className="result-fullscreen-close"
              onClick={onClose}
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
          <div
            ref={imageWrapRef}
            className="result-fullscreen-image-wrap result-fullscreen-image-wrap--zoom"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="result-fullscreen-image-inner"
              style={{
                transform: `scale(${scale}) translate(${transX}px, ${transY}px)`,
              }}
            >
              <img src={url} alt={title} draggable={false} />
            </div>
          </div>
          <div className="result-fullscreen-footer">
            <p className="result-fullscreen-title">{title}</p>
            <p className="result-fullscreen-subtitle">{subtitle}</p>
            {hasMultiple && (
              <>
                <div className="result-fullscreen-nav">
                  <button type="button" className="result-fullscreen-arrow" onClick={goPrev} aria-label="Назад">
                    ‹
                  </button>
                  <span className="result-fullscreen-counter">
                    {index + 1} / {images.length}
                  </span>
                  <button type="button" className="result-fullscreen-arrow" onClick={goNext} aria-label="Вперёд">
                    ›
                  </button>
                </div>
                <div className="result-fullscreen-dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`result-fullscreen-dot ${i === index ? "active" : ""}`}
                      onClick={() => setIndex(i)}
                      aria-label={`Картинка ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <button type="button" className="btn btn-primary result-fullscreen-cta" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  )
}

function RoomScreen({ onBack }: { onBack: () => void }) {
  const [image, setImage] = useState<File | null>(null)
  const [roomType, setRoomType] = useState("living_room")
  const [style, setStyle] = useState("minimalist")
  const [budget, setBudget] = useState("medium")
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const roomTypes = [
    { id: "living_room", label: "Гостиная" },
    { id: "bedroom", label: "Спальня" },
    { id: "kitchen", label: "Кухня" },
    { id: "bathroom", label: "Ванная" },
    { id: "office", label: "Кабинет" },
    { id: "kids", label: "Детская" },
    { id: "corridor", label: "Коридор" },
    { id: "dining", label: "Столовая" },
  ]

  const styles = [
    { id: "minimalist", label: "Минимализм" },
    { id: "modern", label: "Современный" },
    { id: "japandi", label: "Джапанди" },
    { id: "scandinavian", label: "Сканди" },
    { id: "industrial", label: "Лофт" },
    { id: "classic", label: "Классика" },
  ]

  const budgets = [
    { id: "low", label: "Эконом" },
    { id: "medium", label: "Средний" },
    { id: "high", label: "Премиум" },
  ]

  const handleSubmit = async () => {
    if (!image) {
      setError("Загрузите фото комнаты")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await redesignRoom(image, roomType, style, budget, text)
      setResultUrl(res.image)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка генерации"
      const isNetwork = /failed to fetch|load failed|network/i.test(msg)
      setError(
        isNetwork
          ? "Не удалось подключиться к серверу. Укажите HTTPS-URL бэкенда в frontend/.env (VITE_API_URL) и перезапустите."
          : msg
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith("image/")) setImage(f)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setImage(f)
  }

  return (
    <div className="page">
      <button type="button" className="back-btn" onClick={onBack}>
        ← Назад
      </button>

      <h1>Дизайн комнаты</h1>
      <p className="subtitle">Фото комнаты, стиль и бюджет</p>

      <label className="label">Фото комнаты</label>
      <div
        className={`upload-zone ${image ? "upload-zone--has-file" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById("room-file")?.click()}
      >
        {image && <span className="upload-zone-check" aria-hidden>✓</span>}
        <input
          id="room-file"
          type="file"
          accept="image/*"
          onChange={handleFile}
        />
        {image ? (
          <p><strong>{image.name}</strong></p>
        ) : (
          <p>Нажмите или перетащите фото</p>
        )}
      </div>

      <label className="label">Тип комнаты</label>
      <div className="chips" style={{ marginBottom: 16 }}>
        {roomTypes.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`chip ${roomType === r.id ? "selected" : ""}`}
            onClick={() => setRoomType(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <label className="label">Стиль</label>
      <div className="chips" style={{ marginBottom: 16 }}>
        {styles.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`chip ${style === s.id ? "selected" : ""}`}
            onClick={() => setStyle(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <label className="label">Бюджет</label>
      <div className="chips" style={{ marginBottom: 16 }}>
        {budgets.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`chip ${budget === b.id ? "selected" : ""}`}
            onClick={() => setBudget(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>

      <label className="label">Дополнительные пожелания (необязательно)</label>
      <textarea
        placeholder="Например: больше света, растения, тёмные стены..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      {error && <p className="error">{error}</p>}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-overlay-content">
            <div className="loading-spinner" />
            <p className="loading-overlay-title">Подождите</p>
            <p className="loading-overlay-desc">Идёт генерация дизайна...</p>
          </div>
        </div>
      )}

      {resultUrl ? (
        <ResultFullScreen
          images={[resultUrl]}
          onClose={() => setResultUrl(null)}
          title="Ваш новый дизайн"
          subtitle="Сгенерировано Room AI"
        />
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={handleSubmit}
          disabled={!image || loading}
        >
          Сгенерировать дизайн
        </button>
      )}
    </div>
  )
}

function ApartmentScreen({ onBack }: { onBack: () => void }) {
  const [plan, setPlan] = useState<File | null>(null)
  const [preferences, setPreferences] = useState("")
  const [loading, setLoading] = useState(false)
  const [resultUrls, setResultUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!plan) {
      setError("Загрузите планировку")
      return
    }
    if (!preferences.trim()) {
      setError("Опишите пожелания к дизайну")
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await redesignApartment(plan, preferences.trim())
      setResultUrls(res.images || [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка генерации"
      const isNetwork = /failed to fetch|load failed|network/i.test(msg)
      setError(
        isNetwork
          ? "Не удалось подключиться к серверу. Укажите HTTPS-URL бэкенда в frontend/.env (VITE_API_URL) и перезапустите."
          : msg
      )
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type.startsWith("image/")) setPlan(f)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setPlan(f)
  }

  return (
    <div className="page">
      <button type="button" className="back-btn" onClick={onBack}>
        ← Назад
      </button>

      <h1>Дизайн квартиры</h1>
      <p className="subtitle">Планировка и ваши пожелания</p>

      <label className="label">Планировка квартиры</label>
      <div
        className={`upload-zone ${plan ? "upload-zone--has-file" : ""}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById("plan-file")?.click()}
      >
        {plan && <span className="upload-zone-check" aria-hidden>✓</span>}
        <input
          id="plan-file"
          type="file"
          accept="image/*"
          onChange={handleFile}
        />
        {plan ? (
          <p><strong>{plan.name}</strong></p>
        ) : (
          <p>Нажмите или перетащите изображение планировки</p>
        )}
      </div>

      <label className="label">Пожелания к дизайну</label>
      <textarea
        placeholder="Например: белые стены везде, минимум мебели, большие шкафы в прихожей, светлая кухня..."
        value={preferences}
        onChange={(e) => setPreferences(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      {error && <p className="error">{error}</p>}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-overlay-content">
            <div className="loading-spinner" />
            <p className="loading-overlay-title">Подождите</p>
            <p className="loading-overlay-desc">Идёт генерация дизайн-проекта (5 фотографий)...</p>
          </div>
        </div>
      )}

      {resultUrls.length > 0 ? (
        <ResultFullScreen
          images={resultUrls}
          onClose={() => setResultUrls([])}
          title="Ваш дизайн-проект"
          subtitle="Сгенерировано Room AI"
        />
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={handleSubmit}
          disabled={!plan || !preferences.trim() || loading}
        >
          Сгенерировать дизайн-проект
        </button>
      )}
    </div>
  )
}

// USDZ для iOS — хостится на нашем домене после деплоя (файл в public/)
function getArDemoIosUsdz() {
  if (typeof window === "undefined") return "/chair.usdz"
  return window.location.origin + "/chair.usdz"
}

function isMobile() {
  return /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent)
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent)
}

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function ArScreen({ onBack }: { onBack: () => void }) {
  const [arHint, setArHint] = useState<string | null>(null)

  const handleArClick = async () => {
    setArHint(null)
    if (!isMobile()) {
      setArHint("AR работает только на телефоне. Откройте приложение с телефона.")
      return
    }
    if (!isAndroid()) return
    const glbUrl = typeof window !== "undefined" ? window.location.origin + "/chair.glb" : "/chair.glb"
    const sceneViewerUrl = `https://arvr.google.com/scene-viewer/1.2?mode=ar_preferred&file=${encodeURIComponent(glbUrl)}`
    const opened = window.open(sceneViewerUrl, "_blank", "noopener")
    setArHint(opened ? "Открылась вкладка — нажмите «Посмотреть в комнате» там." : "Разрешите всплывающие окна и нажмите снова.")
  }

  return (
    <div className="page">
      <button type="button" className="back-btn" onClick={onBack}>
        ← Назад
      </button>

      <h1>AR — мебель в комнате</h1>
      <p className="subtitle">
        Подключите магазин мебели или попробуйте тестовый диван в дополненной реальности
      </p>

      <section className="ar-demo">
        <h2 className="ar-demo-title">Попробовать AR</h2>
        <p className="ar-demo-desc">
          Нажмите «Посмотреть в комнате» и наведите камеру на пол — стул появится у вас в комнате.
          Лучше всего открыть с телефона.
        </p>
        <div className="ar-demo-viewer">
          <div className="ar-demo-preview">
            <div className="ar-demo-preview-icon" aria-hidden>AR</div>
            <p className="ar-demo-preview-text">Стул в AR</p>
          </div>
          {isIOS() ? (
            <a
              rel="ar"
              href={getArDemoIosUsdz()}
              className="ar-view-in-room-btn"
            >
              Посмотреть в комнате
            </a>
          ) : (
            <button type="button" className="ar-view-in-room-btn" onClick={handleArClick}>
              Посмотреть в комнате
            </button>
          )}
        </div>
        {arHint && <p className="ar-demo-feedback">{arHint}</p>}
        <p className="ar-demo-hint">
          {isIOS()
            ? "Нажмите кнопку — AR откроется прямо здесь."
            : "На Android откроется вкладка с просмотром в AR."}
        </p>
      </section>

      <div className="ar-placeholder">
        <div className="ar-placeholder-icon">AR</div>
        <p className="ar-placeholder-title">Подключить свой магазин</p>
        <p className="ar-placeholder-desc">
          Здесь можно будет подключить любой магазин мебели. После подключения вы сможете выбирать
          товары и смотреть их в своей комнате через камеру в режиме AR.
        </p>
        <p className="ar-placeholder-note">
          Раздел готов к интеграции: укажите API или каталог магазина — мебель из каталога будет
          отображаться в комнате пользователя.
        </p>
      </div>
    </div>
  )
}

function ProfileScreen({ onBack }: { onBack: () => void }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedImages, setExpandedImages] = useState<string[] | null>(null)
  const [expandedTitle, setExpandedTitle] = useState("")
  const [expandedIndex, setExpandedIndex] = useState(0)

  useEffect(() => {
    getProjects().then((data) => {
      setProjects(data)
      setLoading(false)
    })
  }, [])

  const handleClearHistory = async () => {
    if (!confirm("Очистить всю историю генераций?")) return
    try {
      await clearProjects()
      setProjects([])
    } catch {
      // ignore
    }
  }

  const label = (p: Project) => {
    if (p.type === "apartment") return "Квартира"
    const types: Record<string, string> = {
      living_room: "Гостиная",
      bedroom: "Спальня",
      kitchen: "Кухня",
      bathroom: "Ванная",
      office: "Кабинет",
      kids: "Детская",
      corridor: "Коридор",
      dining: "Столовая",
    }
    return types[p.room_type || ""] || "Комната"
  }

  return (
    <div className="page">
      <button type="button" className="back-btn" onClick={onBack}>
        ← Назад
      </button>

      <h1>Мои генерации</h1>
      <p className="subtitle">
        Профиль привязан к вашему Telegram — все дизайны сохраняются автоматически
      </p>

      {projects.length > 0 && (
        <button type="button" className="clear-history-btn" onClick={handleClearHistory}>
          Очистить историю
        </button>
      )}

      {expandedImages && (
        <ResultFullScreen
          images={expandedImages}
          onClose={() => setExpandedImages(null)}
          title={expandedTitle}
          subtitle="Сохранённая генерация"
          initialIndex={expandedIndex}
        />
      )}

      {loading ? (
        <div className="loading">
          <div className="loading-spinner" />
          <p>Загрузка...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>Пока нет сохранённых генераций</p>
          <p className="empty-hint">
            Используйте разделы «Комната по фото» или «Квартира по планировке» — результаты
            появятся здесь
          </p>
        </div>
      ) : (
        <div className="gallery">
          {projects.flatMap((p, i) => {
            const imgs = p.images?.length ? p.images : (p.image ? [p.image] : [])
            return imgs.map((src, j) => (
              <div
                key={`${i}-${j}`}
                className="gallery-item"
                onClick={() => {
                  setExpandedImages(imgs)
                  setExpandedTitle(label(p))
                  setExpandedIndex(j)
                }}
              >
                <div className="gallery-image-wrap">
                  <img src={src} alt={label(p)} />
                </div>
                <span className="gallery-label">{label(p)}{imgs.length > 1 ? ` (${j + 1}/${imgs.length})` : ""}</span>
              </div>
            ))
          })}
        </div>
      )}
    </div>
  )
}

export default App
