import HttpError from "../models/http-error.js";
export const routeNotFound = (req, res, next) => {
    const error = new HttpError("Could not find this route.", 404);
    next(error);
};
export const errorOccurred = async (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }
    return res
        .status(error.code || 500)
        .json({ message: error.message || "An unknown error occurred!" });
};
