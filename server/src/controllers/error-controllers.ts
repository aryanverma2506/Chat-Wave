import { ErrorRequestHandler, RequestHandler } from "express-serve-static-core";

import HttpError from "../models/http-error.js";

export const routeNotFound: RequestHandler = (req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  next(error);
};

export const errorOccurred: ErrorRequestHandler = async (
  error,
  req,
  res,
  next
) => {
  if (res.headersSent) {
    return next(error);
  }
  return res
    .status(error.code || 500)
    .json({ message: error.message || "An unknown error occurred!" });
};
