import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import nodemailer from "nodemailer"; // For email functionality
import multer from "multer"; // For handling profile picture uploads

// Configure Multer for profile picture uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory (can later save to cloud or DB)
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// Register a new user
export const register = async (req, res) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Received file:", req.file);

    let { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Convert role to lowercase
    role = role.toLowerCase();

    // Check if user already exists
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle profile picture upload
    let profilePictureUrl = null;
    if (req.file) {
      profilePictureUrl = `uploads/${req.file.filename}`; // Example: store file path
    }

    // Insert user into database
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, role, profile_picture) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, profile_picture",
      [name, email, hashedPassword, role, profilePictureUrl]
    );

    res.status(201).json({ message: "User registered successfully", user: newUser.rows[0] });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login user and return token
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.rows[0].id, name: user.rows[0].name, email: user.rows[0].email, role: user.rows[0].role }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user profile (Protected Route)
export const getProfile = async (req, res) => {
  try {
    const user = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [req.user.id]);

    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.rows[0]);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Forgot Password - Sends reset email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    // Generate password reset token
    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "10m" });

    // Send reset email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      text: `Click the link to reset your password: ${resetLink}`,
    });

    res.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, decoded.id]);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Invalid or expired token" });
  }
};
