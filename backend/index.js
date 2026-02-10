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
const upload = multer({ storage: multer.memoryStorage() });

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
    const image = req.file;
    if (!image || !image.buffer) {
      return res.status(400).json({ error: "No image file" });
    }
    const { room_type, style, budget, text } = req.body || {};
    const provider = getAIProvider();
    const imageUrl = await provider.redesignRoom(
      image.buffer,
      room_type || "living_room",
      style || "minimalist",
      budget || "medium",
      text || ""
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

app.post("/redesign", upload.single("image"), redesignHandler);
app.post("/api/redesign", upload.single("image"), redesignHandler);

app.post("/redesign-apartment", upload.single("plan"), async (req, res) => {
  try {
    const userId = req.headers["x-telegram-user-id"];
    const plan = req.file;
    if (!plan || !plan.buffer) {
      return res.status(400).json({ error: "No plan file" });
    }
    const preferences = req.body?.preferences || "";
    const provider = getAIProvider();
    const imageUrls = await provider.redesignApartment(plan.buffer, preferences);
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

app.post("/api/redesign-apartment", upload.single("plan"), async (req, res) => {
  try {
    const userId = req.headers["x-telegram-user-id"];
    const plan = req.file;
    if (!plan || !plan.buffer) {
      return res.status(400).json({ error: "No plan file" });
    }
    const preferences = req.body?.preferences || "";
    const provider = getAIProvider();
    const imageUrls = await provider.redesignApartment(plan.buffer, preferences);
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

app.listen(PORT, "0.0.0.0", () => {
  console.log("Room AI backend listening on port", PORT);
});
