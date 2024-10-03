import express from "express";
import {
  createAddress,
  deleteAddress,
  getAddressById,
  getAddressByUserId,
  updateAddress,
} from "v1/controllers/address.controller";

const router = express.Router();

router.post("/", createAddress);
router.get("/user/:id", getAddressByUserId);
router.get("/:id", getAddressById);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

export default router;
