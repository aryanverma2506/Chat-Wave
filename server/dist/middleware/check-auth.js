import jwt from "jsonwebtoken";
import HttpError from "../models/http-error.js";
const checkAuth = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            throw new Error("Authentication failed");
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.userData = {
            userId: decodedToken.userId,
            username: decodedToken.username,
        };
        return next();
    }
    catch (error) {
        return next(new HttpError(error.message || "Authentication failed", 403));
    }
};
export default checkAuth;
