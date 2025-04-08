// src/routes/userRoutes.js

import express from "express";
import { getUsers, updateUserRole, deleteUser } from "../controllers/userController.js";

const router = express.Router();

// Get all users
router.get("/users", getUsers);

// Update user role
router.put("/users/:id", updateUserRole);

// Delete user
router.delete("/users/:id", deleteUser);

export default router;
