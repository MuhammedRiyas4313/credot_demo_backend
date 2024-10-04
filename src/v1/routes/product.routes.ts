import express from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getProductsForUsers,
  updateProduct,
  updateProductIsBestSeller,
} from "v1/controllers/product.controller";

const router = express.Router();

router.post("/", createProduct);
router.get("/", getProducts); //for admin
router.get("/user/", getProductsForUsers); //for user
router.get("/:id", getProductById);
router.put("/:id", updateProduct);
router.patch("/:id", updateProductIsBestSeller);
router.delete("/:id", deleteProduct);

export default router;
