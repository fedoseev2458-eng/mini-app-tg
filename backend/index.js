require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { getAIProvider } = require("./ai/factory");
const { saveProject, getProjects, clearProjects } = require("./storage");

const app = express();
const PORT = process.env.PORT || 8000;
const DIST = path.join(__dirname, "..", "frontend", "dist");

// Multer: любой формат изображения, до 25 MB, без проверки MIME
const multerStorage = multer.memoryStorage();
const multerOpts = {
  storage: multerStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, _file, cb) => cb(null, true),
};
const upload = multer(multerOpts);

// Принять файл из поля "image" или "file" (комната)
const uploadRoom = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);
// Принять файл из поля "plan" или "file" (квартира)
const uploadPlan = upload.fields([
  { name: "plan", maxCount: 1 },
  { name: "file", maxCount: 1 },
]);

function getUploadedFile(req, fieldNames) {
  if (req.file) return req.file;
  if (!req.files) return null;
  for (const name of fieldNames) {
    const arr = req.files[name];
    if (Array.isArray(arr) && arr[0]) return arr[0];
  }
  return null;
}

app.use(cors({ origin: "*", credentials: true }));
app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});
app.use(express.json());
app.use("/assets", express.static(path.join(DIST, "assets")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const redesignHandler = async (req, res) => {
  try {
    const userId = req.headers["x-telegram-user-id"];
    const image = getUploadedFile(req, ["image", "file"]);
    if (!image || !(image.buffer && image.buffer.length > 0)) {
      return res.status(400).json({ error: "Загрузите фото комнаты (файл не получен или пустой)" });
    }
    const { room_type, style, budget, text } = req.body || {};
    const provider = getAIProvider();
    const imageUrl = await provider.redesignRoom(
      image.buffer,
      room_type || "living_room",
      style || "minimalist",
      budget || "medium",
      text || "",
      image.mimetype || ""
    );
    saveProject(userId, { room_type, style, image: imageUrl });
    res.json({ image: imageUrl });
  } catch (err) {
    if (err.status === 402 || (err.code && String(err.code).includes("rate_limit"))) {
      return res.status(402).json({
        error: "Закончился лимит OpenAI. Пополните баланс на platform.openai.com",
      });
    }
    console.error("redesign failed", err);
    res.status(500).json({ error: err.message || "Internal error" });
  }
};

app.post("/redesign", uploadRoom, redesignHandler);
app.post("/api/redesign", uploadRoom, redesignHandler);

app.post("/redesign-apartment", uploadPlan, async (req, res) => {
  try {
    const userId = req.headers["x-telegram-user-id"];
    const plan = getUploadedFile(req, ["plan", "file"]);
    if (!plan || !(plan.buffer && plan.buffer.length > 0)) {
      return res.status(400).json({ error: "Загрузите изображение планировки (файл не получен или пустой)" });
    }
    const preferences = req.body?.preferences || "";
    const provider = getAIProvider();
    const imageUrls = await provider.redesignApartment(plan.buffer, preferences, plan.mimetype || "");
    saveProject(userId, { type: "apartment", images: imageUrls });
    res.json({ images: imageUrls });
  } catch (err) {
    if (err.status === 402 || (err.code && String(err.code).includes("rate_limit"))) {
      return res.status(402).json({
        error: "Закончился лимит OpenAI. Пополните баланс на platform.openai.com",
      });
    }
    console.error("redesign-apartment failed", err);
    res.status(500).json({ error: err.message || "Internal error" });
  }
});

app.post("/api/redesign-apartment", uploadPlan, async (req, res) => {
  try {
    const userId = req.headers["x-telegram-user-id"];
    const plan = getUploadedFile(req, ["plan", "file"]);
    if (!plan || !(plan.buffer && plan.buffer.length > 0)) {
      return res.status(400).json({ error: "Загрузите изображение планировки (файл не получен или пустой)" });
    }
    const preferences = req.body?.preferences || "";
    const provider = getAIProvider();
    const imageUrls = await provider.redesignApartment(plan.buffer, preferences, plan.mimetype || "");
    saveProject(userId, { type: "apartment", images: imageUrls });
    res.json({ images: imageUrls });
  } catch (err) {
    if (err.status === 402 || (err.code && String(err.code).includes("rate_limit"))) {
      return res.status(402).json({
        error: "Закончился лимит OpenAI. Пополните баланс на platform.openai.com",
      });
    }
    console.error("redesign-apartment failed", err);
    res.status(500).json({ error: err.message || "Internal error" });
  }
});

app.post("/api/redesign-apartment-single", uploadPlan, async (req, res) => {
  try {
    const userId = req.headers["x-telegram-user-id"];
    const plan = getUploadedFile(req, ["plan", "file"]);
    if (!plan || !(plan.buffer && plan.buffer.length > 0)) {
      return res.status(400).json({ error: "Загрузите изображение планировки (файл не получен или пустой)" });
    }
    const preferences = req.body?.preferences || "";
    const index = parseInt(req.body?.index, 10);
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ error: "Invalid index parameter" });
    }
    const provider = getAIProvider();
    const imageUrl = await provider.redesignApartmentSingle(plan.buffer, preferences, index, plan.mimetype || "");
    // Сохраняем проект (будет обновляться при каждом запросе, но это нормально)
    if (userId) {
      const existingProjects = getProjects(userId);
      const existingApartment = existingProjects.find((p) => p.type === "apartment");
      const images = existingApartment?.images || [];
      images[index] = imageUrl;
      saveProject(userId, { type: "apartment", images: images.filter(Boolean) });
    }
    res.json({ image: imageUrl, index });
  } catch (err) {
    if (err.status === 402 || (err.code && String(err.code).includes("rate_limit"))) {
      return res.status(402).json({
        error: "Закончился лимит OpenAI. Пополните баланс на platform.openai.com",
      });
    }
    console.error("redesign-apartment-single failed", err);
    res.status(500).json({ error: err.message || "Internal error" });
  }
});

app.get("/projects", (req, res) => {
  const userId = req.headers["x-telegram-user-id"];
  res.json(getProjects(userId));
});

app.delete("/projects", (req, res) => {
  const userId = req.headers["x-telegram-user-id"];
  clearProjects(userId);
  res.status(204).end();
});

app.get("*", (req, res) => {
  res.sendFile(path.join(DIST, "index.html"));
});

// Ошибки multer (лимит размера и т.д.) — не 500, а 400 с текстом
app.use((err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Файл слишком большой (макс. 25 МБ)" });
  }
  if (err && err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ error: "Неверное имя поля загрузки. Используйте «image» или «plan»" });
  }
  next(err);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Room AI backend listening on port", PORT);
});
