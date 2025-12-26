const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const Post = require("./models/Post");

const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/layout", require("./routes/layoutRoutes"));

/* -------------------- STATIC FOLDER -------------------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* -------------------- ROUTES -------------------- */
app.use("/api/posts", require("./routes/postRoutes"));

/* -------------------- MONGODB -------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

/* -------------------- SIMPLE ADMIN LOGIN -------------------- */
const ADMIN = { username: "admin", password: "admin123" };

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN.username && password === ADMIN.password) {
    res.json({ success: true, message: "Login successful" });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

/* -------------------- MULTER CONFIG -------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* -------------------- CREATE POST -------------------- */
app.post("/api/posts", upload.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;

    const post = new Post({
      title,
      content,
      image: req.file ? `/uploads/${req.file.filename}` : "",
    });

    await post.save();
    res.status(201).json({ message: "Post added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to create post" });
  }
});

/* -------------------- GET POSTS -------------------- */
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
