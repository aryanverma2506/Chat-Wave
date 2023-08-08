import { Router } from "express";
import * as userControllers from "../controllers/user-controllers.js";
import authMiddleware from "../middleware/auth-middleware.js";
import uploadMiddleware from "../middleware/upload-middleware.js";
const router = Router();
router.route("/").get(authMiddleware, userControllers.getAllUsers);
router.route("/profile").get(authMiddleware, userControllers.getProfile);
router
    .route("/register")
    .post(uploadMiddleware("profilePic").single("profilePic"), userControllers.register);
router.route("/login").post(uploadMiddleware().none(), userControllers.login);
router
    .route("/messages/:recipientUserId")
    .get(authMiddleware, userControllers.getMessages);
router.route("/logout").post(userControllers.logout);
export default router;
