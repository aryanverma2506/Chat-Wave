import { Router } from "express";

import * as chatControllers from "../controllers/chat-controllers.js";
import authMiddleware from "../middleware/auth-middleware.js";

const router = Router();

router.route("/").get(authMiddleware, chatControllers.fetchChats);

router.route("/:chatId").get(authMiddleware, chatControllers.accessChat);

router.route("/group").post(authMiddleware, chatControllers.createGroup);

router
  .route("/group/:groupId")
  .patch(authMiddleware, chatControllers.renameGroup);

router
  .route("/group/:groupId/members")
  .patch(authMiddleware, chatControllers.addMembers)
  .delete(authMiddleware, chatControllers.removeMembers);

export default router;
