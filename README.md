# Room AI

Telegram Mini App для дизайна интерьера с ИИ.

## Разделы

1. **Комната по фото** — загрузите фото, выберите стиль и бюджет → получите новый дизайн (та же расстановка, ракурс, свет).
2. **Квартира по планировке** — загрузите планировку и пожелания → дизайн всех комнат, коридоров, ванных и кухни.
3. **AR** — раздел под подключение магазинов мебели (заглушка).
4. **Мои генерации** — профиль привязан к Telegram, все дизайны сохраняются автоматически.

## Технологии

- **Backend:** Node.js (Express) с OpenAI или Gemini
- **Frontend:** React + TypeScript + Vite
- **Деплой:** Railway

## Локальная разработка

### Бэкенд

```bash
cd backend
cp .env.example .env
# Заполните OPENAI_API_KEY или GEMINI_API_KEY
npm install
npm start
```

Порт по умолчанию: 8000 (или задайте `PORT` в `.env`).

### Фронтенд

```bash
cd frontend
npm install
npm run dev
```

Переменная `VITE_API_URL` в `frontend/.env` — URL бэкенда (по умолчанию `http://localhost:8000`).

### Для Telegram Mini App

Используйте **ngrok** для публичного URL:

```bash
ngrok http 8000
```

Скопируйте HTTPS URL (например `https://abc123.ngrok.io`) и укажите его в BotFather как Web App URL.

---

## Деплой на Railway

### Подготовка

1. **Создайте репозиторий на GitHub** и запушьте код:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/ваш-username/room-ai.git
   git push -u origin main
   ```

2. **Зарегистрируйтесь на [Railway](https://railway.app)** и подключите GitHub аккаунт.

### Настройка проекта

1. **Создайте новый проект** в Railway → **New Project** → **Deploy from GitHub repo** → выберите репозиторий.

2. **Настройте переменные окружения** (Settings → Variables):
   - `OPENAI_API_KEY` — ваш ключ OpenAI (обязательно, если используете OpenAI)
   - `AI_PROVIDER` — `openai` или `gemini` (по умолчанию `openai`)
   - `GEMINI_API_KEY` — только если `AI_PROVIDER=gemini`
   - `PORT` — Railway установит автоматически, не меняйте

3. **Настройка деплоя:**
   - Railway собирает фронтенд по `railway.json` (buildCommand), затем запускает бэкенд по `Procfile` (Node.js)

4. **Получите URL:** Railway выдаст HTTPS URL вида `https://room-ai-production.up.railway.app`

5. **В BotFather** укажите этот URL как Web App URL.

### Как обновить приложение

Просто сделайте `git push` в репозиторий — Railway автоматически пересоберёт и задеплоит:

```bash
git add .
git commit -m "Обновление..."
git push
```

Railway покажет прогресс деплоя в панели.

---

## Структура проекта

```
room-ai-project/
├── backend/          # FastAPI бэкенд
│   ├── main.py      # Главный файл приложения
│   ├── ai/          # Провайдеры ИИ (OpenAI, Gemini)
│   ├── storage.py   # Хранение проектов
│   └── requirements.txt
├── frontend/         # React фронтенд
│   ├── src/
│   ├── dist/        # Собранный фронтенд (генерируется)
│   └── package.json
├── Procfile          # Команда запуска для Railway
├── railway.json      # Конфигурация Railway
└── README.md
```

---

## Переменные окружения

### Backend (`backend/.env`)

```env
AI_PROVIDER=openai          # openai | gemini
OPENAI_API_KEY=sk-xxx       # Ключ OpenAI
GEMINI_API_KEY=xxx          # Только если AI_PROVIDER=gemini
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000  # URL бэкенда
```

На Railway `VITE_API_URL` не нужен — фронтенд будет использовать тот же домен, что и бэкенд.

---

## Примечания

- **Хранение проектов:** Сейчас проекты хранятся в памяти (при перезапуске теряются). Для постоянного хранения можно добавить базу данных (PostgreSQL на Railway) или внешнее хранилище.
- **3D модели:** Файлы `chair.glb` и `chair.usdz` не включены в деплой для уменьшения размера. Если нужен AR, добавьте их вручную или используйте CDN.
