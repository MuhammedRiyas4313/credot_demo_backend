import express from "express";
import { addToCart, getCartByUserId } from "v1/controllers/cart.controller";

const router = express.Router();

router.post("/", addToCart);
router.get("/:id", getCartByUserId);

export default router;
