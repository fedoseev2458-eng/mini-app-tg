# Room AI

Telegram Mini App для дизайна интерьера с ИИ.

## Разделы

1. **Комната по фото** — загрузите фото, выберите стиль и бюджет → получите новый дизайн (та же расстановка, ракурс, свет).
2. **Квартира по планировке** — загрузите планировку и пожелания → дизайн всех комнат, коридоров, ванных и кухни.
3. **AR** — раздел под подключение магазинов мебели (заглушка).
4. **Мои генерации** — профиль привязан к Telegram, все дизайны сохраняются автоматически.

## Смена нейросети (OpenAI / Gemini)

В `.env` задайте `AI_PROVIDER=openai` или `AI_PROVIDER=gemini`. По умолчанию — OpenAI.

## Запуск

**Бэкенд:**
```bash
cd backend
cp .env.example .env
# Заполните OPENAI_API_KEY
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Фронтенд:**
```bash
cd frontend
npm install
npm run dev
```

Переменная `VITE_API_URL` — URL бэкенда (по умолчанию `http://localhost:8000`).

## Деплой на Vercel (вместо ngrok)

Постоянный HTTPS URL без ngrok.

1. **Подключите репозиторий** на [vercel.com](https://vercel.com) → New Project.

2. **Переменные окружения** (Settings → Environment Variables):
   - `OPENAI_API_KEY` — обязательно
   - `AI_PROVIDER` — `openai` или `gemini` (по умолчанию openai)
   - `GEMINI_API_KEY` — только если `AI_PROVIDER=gemini`

3. **Deploy** — Vercel соберёт фронт и задеплоит API.

4. **В BotFather** укажите URL вида `https://room-ai-xxx.vercel.app` как Web App.

5. Готово — Mini App работает по постоянному адресу.

---

## Mini App в Telegram (ngrok для локальной разработки)

Фронт раздаётся с бэкенда — нужен **один** ngrok на порт 8000.

1. **Соберите фронт:** `cd frontend && npm run build`
2. **Запустите бэкенд:** `cd backend && uvicorn main:app --reload --port 8000`
3. **Запустите ngrok:** `ngrok http 8000` — скопируйте HTTPS-URL
4. **В BotFather** укажите этот URL как Web App для Mini App
