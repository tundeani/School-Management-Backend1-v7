// src/controllers/userController.js

import { pool } from "../config/db.js"; // Assuming you use Postgres

// Fetch all users
export const getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role FROM users");
    res.json(result.rows); // Return the user data to frontend
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  const { id } = req.params; // Get user ID from the URL params
  const { role } = req.body; // Get role from request body

  try {
    const result = await pool.query(
      "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role",
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  const { id } = req.params; // Get user ID from the URL params

  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully", id: result.rows[0].id });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};
