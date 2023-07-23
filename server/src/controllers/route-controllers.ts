import { RequestHandler } from "express-serve-static-core";
import jwt from "jsonwebtoken";
import HttpError from "../models/http-error.js";

import UserModel from "../models/user-model.js";
import MessageModel from "../models/message-model.js";

const jwtSecret = process.env.JWT_SECRET!;
const expirationTimeInMs = +process.env.JWT_TOKEN_MAX_AGE!;

export const getUsers: RequestHandler = async (req, res, next) => {
  const users = await UserModel.find({}, { _id: 1, username: 1 }).exec();
  res.json({ users: users });
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
    console.log(error);
    next(new HttpError(error.message, 500));
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const existingUser = await UserModel.findOne({ username: username });

    if (!existingUser) {
      return next(
        new HttpError("Invalid credentials, could not log you in.", 403)
      );
    }

    const isValidPassword = await existingUser.matchPassword(password);
    if (!isValidPassword) {
      return next(
        new HttpError("Invalid credentials, could not log you in.", 403)
      );
    }

    const token = jwt.sign(
      { userId: existingUser.id, username: username },
      jwtSecret,
      {
        expiresIn: expirationTimeInMs,
      }
    );

    return res
      .status(201)
      .cookie("token", token, {
        httpOnly: true,
        maxAge: expirationTimeInMs,
        sameSite: "none",
        secure: true,
      })
      .json({
        userId: existingUser.id,
        maxAge: expirationTimeInMs,
      });
  } catch (error: any) {
    console.log(error);
    next(new HttpError(error.message, 500));
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
    const { username, password } = req.body;
    const existingUser = await UserModel.findOne({ username: username });

    if (existingUser) {
      return next(new HttpError("User already exist", 422));
    }

    const createdUser = new UserModel({
      username: username,
      password: password,
    });

    await createdUser.save();
    const token = jwt.sign(
      { userId: createdUser.id, username: username },
      jwtSecret,
      {
        expiresIn: expirationTimeInMs,
      }
    );

    res
      .status(201)
      .cookie("token", token, {
        httpOnly: true,
        maxAge: expirationTimeInMs,
        sameSite: "none",
        secure: true,
      })
      .json({
        userId: createdUser.id,
        maxAge: expirationTimeInMs,
      });
  } catch (error: any) {
    console.log(error);
    next(new HttpError(error.message, 500));
  }
};
