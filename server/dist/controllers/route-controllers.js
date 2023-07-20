import jwt from "jsonwebtoken";
import HttpError from "../models/http-error.js";
import UserModel from "../models/user-model.js";
import MessageModel from "../models/message-model.js";
const jwtSecret = process.env.JWT_SECRET;
const expirationTimeInMs = 1000 * 60 * 60;
export const getUsers = async (req, res, next) => {
    const users = await UserModel.find({}, { _id: 1, username: 1 }).exec();
    res.json({ users: users });
};
export const getProfile = (req, res, next) => {
    res.status(200).json(req.userData);
};
export const getMessages = async (req, res, next) => {
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
    }
    catch (error) {
        console.log(error);
        next(new HttpError(error.message, 500));
    }
};
export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const existingUser = await UserModel.findOne({ username: username });
        if (!existingUser) {
            return next(new HttpError("Invalid credentials, could not log you in.", 403));
        }
        const isValidPassword = await existingUser.matchPassword(password);
        if (!isValidPassword) {
            return next(new HttpError("Invalid credentials, could not log you in.", 403));
        }
        const token = jwt.sign({ userId: existingUser.id, username: username }, jwtSecret, {
            expiresIn: expirationTimeInMs,
        });
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
        });
    }
    catch (error) {
        console.log(error);
        next(new HttpError(error.message, 500));
    }
};
export const logout = (req, res, next) => {
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
export const register = async (req, res, next) => {
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
        const token = jwt.sign({ userId: createdUser.id, username: username }, jwtSecret, {
            expiresIn: expirationTimeInMs,
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
            userId: createdUser.id,
        });
    }
    catch (error) {
        console.log(error);
        next(new HttpError(error.message, 500));
    }
};
