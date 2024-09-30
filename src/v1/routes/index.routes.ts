import express from "express";
import { testController } from "v1/controllers/index.controller";

const router = express.Router();

/* For initiate route setup */
router.get('/', testController);

export default router;