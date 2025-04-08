import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

const protect = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1]; // ✅ Fixed header name and split
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB
    const user = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [
      decoded.id,
    ]);

    if (user.rows.length === 0) return res.status(404).json({ message: "User not found" });

    req.user = user.rows[0]; // Attach full user details to request
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export default protect;
