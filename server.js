import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDatabase } from "./config/db.js";
import { authenticateToken } from "./middleware/auth.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

const db = await initDatabase(); 
app.get("/", (req, res) => {
  res.send({ msg: "hey there" });
});

app.use("/api/auth", authRoutes(db));
app.use("/api/users", userRoutes(db, authenticateToken));
app.use("/api/feedback", feedbackRoutes(db, authenticateToken));

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
