// server/routes/notificationRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  listMyNotificationsController,
  markOneReadController,
  markAllReadController,
  getUnreadCountController,      // added
  deleteOneNotificationController // added (optional)
} from "../controllers/notificationController.js";

const router = express.Router();

/*
  GET /api/notifications
  List current user's notifications
*/
router.get("/", authMiddleware, listMyNotificationsController);

/*
  GET /api/notifications/unread-count
  Return unread notifications count
*/
router.get("/unread-count", authMiddleware, getUnreadCountController);

/*
  PUT /api/notifications/:id/read
  Mark one notification as read
*/
router.put("/:id/read", authMiddleware, markOneReadController);

/*
  PUT /api/notifications/read-all
  Mark all notifications as read
*/
router.put("/read-all", authMiddleware, markAllReadController);

/*
  DELETE /api/notifications/:id
  Delete one notification
*/
router.delete("/:id", authMiddleware, deleteOneNotificationController);

export default router;
