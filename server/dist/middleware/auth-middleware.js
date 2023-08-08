import jwt from "jsonwebtoken";
import HttpError from "../models/http-error.js";
const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            throw new Error("Authentication failed");
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.userData = {
            userId: decodedToken.userId,
            name: decodedToken.name,
            profilePic: decodedToken.profilePic,
        };
        return next();
    }
    catch (error) {
        return next(new HttpError(error.message || "Authentication failed", 403));
    }
};
export default authMiddleware;
