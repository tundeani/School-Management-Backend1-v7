import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // Import the routes
import { pool, connectDB } from "./config/db.js";
import protect from "./middlewares/authMiddleware.js"; // ✅ Import protect middleware
import { getProfile } from "./controllers/authController.js"; // ✅ Import getUserProfile controller

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL, // Allow only your frontend domain
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

app.use(cors(corsOptions));
app.use(express.json());

connectDB();

// Use the user routes
app.use("/api/auth", authRoutes);

// Use the user routes
app.use("/api", userRoutes);

// ✅ Add the user profile route
app.get("/api/user/profile", protect, getProfile);

app.listen(PORT, () => {
  console.log(`App listening on port: ${PORT}`);
});
