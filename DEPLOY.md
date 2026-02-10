# Инструкция по деплою на Railway

## Первый деплой

### 1. Подготовка репозитория

```bash
# Инициализируйте git (если ещё не сделано)
git init

# Проверьте, что .env файлы не попадут в git
git status
# Убедитесь, что backend/.env и frontend/.env не показываются

# Добавьте все файлы
git add .

# Сделайте первый коммит
git commit -m "Initial commit: Room AI app"

# Создайте репозиторий на GitHub и подключите
git remote add origin https://github.com/ваш-username/room-ai.git
git branch -M main
git push -u origin main
```

### 2. Настройка Railway

1. Зайдите на [railway.app](https://railway.app) и войдите через GitHub
2. Нажмите **New Project** → **Deploy from GitHub repo**
3. Выберите репозиторий `room-ai`
4. Railway автоматически определит проект и начнёт деплой

### 3. Переменные окружения

В настройках проекта Railway (Settings → Variables) добавьте:

```
AI_PROVIDER=openai
OPENAI_API_KEY=ваш-ключ-openai
```

Или для Gemini:

```
AI_PROVIDER=gemini
GEMINI_API_KEY=ваш-ключ-gemini
```

### 4. Получите URL

После деплоя Railway выдаст URL вида:
```
https://room-ai-production.up.railway.app
```

### 5. Настройте Telegram Bot

В BotFather укажите этот URL как Web App URL для вашего бота.

---

## Обновление приложения

Просто делайте `git push`:

```bash
git add .
git commit -m "Описание изменений"
git push
```

Railway автоматически пересоберёт и задеплоит новую версию.

---

## Проверка логов

В Railway Dashboard → ваш проект → **Deployments** → выберите деплой → **View Logs** можно посмотреть логи сборки и запуска.

---

## Устранение проблем

### Ошибка "Module not found"

Убедитесь, что `railway.json` правильно настроен на сборку фронтенда перед запуском бэкенда.

### Фронтенд не загружается

Проверьте, что `frontend/dist` собран и существует. Railway должен собрать его автоматически по `buildCommand` из `railway.json`.

### Порт не определён

Railway автоматически устанавливает переменную `PORT`. Убедитесь, что в `Procfile` используется `$PORT`.
