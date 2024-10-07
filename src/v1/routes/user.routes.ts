import express from "express";
import { authorizeJwt } from "middlewares/auth.middleware";
import {
  deleteUser,
  getUserById,
  getUsers,
  loginUser,
  registerUser,
  updateUser,
  updateUserStatus,
} from "v1/controllers/user.controller";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", authorizeJwt, getUsers);
router.get("/:id", authorizeJwt, getUserById);
router.put("/:id", authorizeJwt, updateUser);
router.patch("/:id", authorizeJwt, updateUserStatus);
router.delete("/:id", authorizeJwt, deleteUser);

export default router;
