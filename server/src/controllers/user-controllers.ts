import { RequestHandler } from "express-serve-static-core";
import mongoose from "mongoose";
import HttpError from "../models/http-error.js";

import UserModel from "../models/user-model.js";
import MessageModel from "../models/message-model.js";
import generateToken from "../util/generate-token.js";
import * as fileHelper from "../util/file-helper.js";

const expirationTimeInMs = +process.env.JWT_TOKEN_MAX_AGE!;

export const getAllUsers: RequestHandler = async (req, res, next) => {
  try {
    const usersToSearch = req.query.searchUsers;
    const searchedUsers = await UserModel.find({
      _id: { $ne: req.userData?.userId },
      $or: [
        { _id: usersToSearch },
        { name: { $regex: usersToSearch, $options: "i" } },
        { email: { $regex: usersToSearch, $options: "i" } },
      ],
    })
      .select("name email profilePic")
      .lean()
      .exec();
    res.json({ searchedUsers });
  } catch (error: any) {
    if (error instanceof HttpError) {
      next(error);
    } else {
      console.error(error);
      next(new HttpError(error.message, 500));
    }
  }
};

export const getProfile: RequestHandler = (req, res, next) => {
  res.status(200).json(req.userData);
};

export const getMessages: RequestHandler = async (req, res, next) => {
  const { recipientUserId } = req.params;
  const userId = req.userData?.userId;
  try {
    if (userId && recipientUserId) {
      const messages = await MessageModel.find({
        sender: { $in: [userId, recipientUserId] },
        recipient: { $in: [userId, recipientUserId] },
      })
        .sort({ createdAt: 1 })
        .exec();
      res.status(200).json({
        messages: messages,
      });
    }
  } catch (error: any) {
    if (error instanceof HttpError) {
      next(error);
    } else {
      console.error(error);
      next(new HttpError(error.message, 500));
    }
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const existingUser = await UserModel.findOne({ email: email });

    if (!existingUser || !(await existingUser.matchPassword(password))) {
      throw new HttpError("Invalid credentials, could not log you in.", 403);
    }

    const token = generateToken({
      userId: existingUser.id,
      name: existingUser.name,
      profilePic: existingUser.profilePic,
    });

    res
      .status(201)
      .cookie("token", token, {
        httpOnly: true,
        maxAge: expirationTimeInMs,
        sameSite: "none",
        secure: true,
      })
      .json({
        userId: existingUser.id,
        name: existingUser.name,
        profilePic: existingUser.profilePic,
        maxAge: expirationTimeInMs,
      });
  } catch (error: any) {
    if (error instanceof HttpError) {
      next(error);
    } else {
      console.error(error);
      next(new HttpError(error.message, 500));
    }
  }
};

export const logout: RequestHandler = (req, res, next) => {
  return res
    .status(200)
    .cookie("token", "", {
      httpOnly: true,
      maxAge: 0,
      sameSite: "none",
      secure: true,
    })
    .json({ logoutStatus: "Logged Out Successfully" });
};

export const register: RequestHandler = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await UserModel.findOne({ email: email });

    if (existingUser) {
      throw new HttpError("User already exist", 422);
    }

    const newUser = new UserModel({
      _id: req.file?.forUserId || new mongoose.Types.ObjectId(),
      name: name,
      email: email,
      password: password,
      profilePic: req.file?.path.toString().replace(/\\/g, "/"),
    });
    await newUser.save();

    const token = generateToken({
      userId: newUser.id,
      name: name,
      profilePic: newUser.profilePic,
    });

    res
      .status(201)
      .cookie("token", token, {
        httpOnly: true,
        maxAge: expirationTimeInMs,
        sameSite: "none",
        secure: true,
      })
      .json({
        userId: newUser.id,
        profilePic: newUser.profilePic,
        maxAge: expirationTimeInMs,
      });
  } catch (error: any) {
    try {
      await fileHelper.deleteFolder(
        req.file?.forUserId ? `./uploads/${req.file?.forUserId}` : undefined
      );
    } catch (error: any) {
      console.error(error);
    }
    if (error instanceof HttpError) {
      next(error);
    } else {
      console.error(error);
      next(new HttpError(error.message, 500));
    }
  }
};
