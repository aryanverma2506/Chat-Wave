import { Router } from "express";

import checkAuth from "../middleware/check-auth.js";

const router = Router();

import * as routeControllers from "../controllers/route-controllers.js";

router.route("/").get(routeControllers.getUsers);

router.route("/profile").get(checkAuth, routeControllers.getProfile);

router
  .route("/messages/:recipientUserId")
  .get(checkAuth, routeControllers.getMessages);

router.route("/login").post(routeControllers.login);

router.route("/logout").post(routeControllers.logout);

router.route("/register").post(routeControllers.register);

export default router;
