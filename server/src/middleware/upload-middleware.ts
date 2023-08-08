import fs from "fs/promises";
import multer from "multer";
import { Request } from "express-validator/src/base";

import HttpError from "../models/http-error.js";
import mongoose from "mongoose";

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        forUserId?: string;
      }
    }
  }
}

function uploadMiddleware(folderName?: string) {
  const storage = multer.diskStorage({
    destination: async (req, file, callback) => {
      try {
        const userId = req.userData?.userId || new mongoose.Types.ObjectId();
        file.forUserId = userId.toString();
        const destinationFolder = `./uploads/${userId}/${
          folderName ? folderName : file.mimetype.split("/")[0]
        }`;

        await fs
          .access(destinationFolder) // Find the destination folder
          .catch(() => fs.mkdir(destinationFolder, { recursive: true })) // Create the destination folder if it doesn't exist
          .catch((err) => console.error("Error creating upload folder:", err));

        callback(null, destinationFolder);
      } catch (error: any) {
        console.log(error.message);
      }
    },
    filename: (req, file, callback) => {
      callback(
        null,
        `${new Date().toISOString().replace(/:/g, "_")}-${file.originalname}`
      );
    },
  });

  function fileFilter(
    req: Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback
  ) {
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
    } else {
      callback(new HttpError("Invalid file type!!!", 403));
    }
  }

  return multer({
    limits: { fileSize: 5000000 },
    storage: storage,
    fileFilter: fileFilter,
  });
}

export default uploadMiddleware;
