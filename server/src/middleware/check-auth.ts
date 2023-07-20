import { RequestHandler } from "express-serve-static-core";
import jwt from "jsonwebtoken";

import HttpError from "../models/http-error.js";

export interface UserData {
  userId: string;
  username: string;
}

declare global {
  namespace Express {
    interface Request {
      userData?: UserData;
    }
  }
}

const checkAuth: RequestHandler = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new Error("Authentication failed");
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as UserData;
    req.userData = {
      userId: decodedToken.userId,
      username: decodedToken.username,
    };
    return next();
  } catch (error: any) {
    return next(new HttpError(error.message || "Authentication failed", 403));
  }
};

export default checkAuth;
