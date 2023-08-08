import { Router } from "express";
import authMiddleware from "../middleware/auth-middleware.js";
import uploadMiddleware from "../middleware/upload-middleware.js";
import * as messageControllers from "../controllers/message-controller.js";
const router = Router();
router
    .route("/")
    .post(authMiddleware, uploadMiddleware().single("file"), messageControllers.sendChatMessage);
router
    .route("/:chatId")
    .get(authMiddleware, messageControllers.getChatMessages);
export default router;
