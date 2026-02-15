// server/routes/agencySupportRoutes.js
import express from "express";
import { createAgencySupportTicketController } from "../controllers/agencySupportController.js";

const router = express.Router();

router.post("/tickets", createAgencySupportTicketController);

export default router;
