import express from "express";
import { agencyLoginController, agencyMeController } from "../controllers/agencyAuthController.js";
import { authRequired } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", agencyLoginController);
router.get("/me", authRequired, agencyMeController);

export default router;
