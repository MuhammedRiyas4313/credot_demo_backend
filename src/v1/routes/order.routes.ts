import express from "express";
import { createOrder, getOrders, getOrdersForUsers, udpateOrderStatus } from "v1/controllers/order.controller";

const router = express.Router();

router.post("/", createOrder);
router.get("/", getOrders); //for admin
router.get("/user", getOrdersForUsers); //for admin
router.patch("/:id", udpateOrderStatus); //for admin

export default router;
