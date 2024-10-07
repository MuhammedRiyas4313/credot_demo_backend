import express from "express";
import { addToCart, deleteCartItem, getCartByUserId } from "v1/controllers/cart.controller";

const router = express.Router();

router.post("/", addToCart);
router.get("/", getCartByUserId);
router.delete("/:id", deleteCartItem);

export default router;
