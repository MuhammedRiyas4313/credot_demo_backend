import express from "express";
import {
  createBanner,
  deleteBanner,
  getActiveBanner,
  getBannerById,
  getBanners,
  updateBanner,
} from "v1/controllers/banner.controller";

const router = express.Router();

router.post("/", createBanner);
router.get("/", getBanners); //for admin
router.get("/active", getActiveBanner);
router.get("/:id", getBannerById);
router.put("/:id", updateBanner);
router.delete("/:id", deleteBanner);

export default router;
