import express from "express";
import { createBrand, deleteBrand, getBrandById, getBrands, updateBrand } from "v1/controllers/brand.controller";

const router = express.Router();

router.post("/", createBrand);
router.get("/", getBrands);
router.get("/:id", getBrandById);
router.put("/:id", updateBrand);
router.delete("/:id", deleteBrand);

export default router;
