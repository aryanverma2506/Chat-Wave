import { RequestHandler } from "express-serve-static-core";

import HttpError from "../models/http-error.js";
import MessageModel from "../models/message-model.js";
import ChatModel from "../models/chat-model.js";
import mongoose from "mongoose";
import UserModel from "../models/user-model.js";

export const getChatMessages: RequestHandler = async (req, res, next) => {
  const { chatId } = req.params;
  const userId = req.userData?.userId!;

  try {
    const chatInstance = await ChatModel.findOne({
      _id: chatId,
      users: { $all: [userId] },
    });

    if (!chatInstance) {
      throw new HttpError(
        "Could not found the chat that you are looking for!",
        400
      );
    }

    const messages = await MessageModel.find({ chat: chatId })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    res.status(200).json({ messages: messages });
  } catch (error: any) {
    if (error instanceof HttpError) {
      next(error);
    } else {
      console.error(error);
      next(new HttpError(error.message, 500));
    }
  }
};

export const sendChatMessage: RequestHandler = async (req, res, next) => {
  const {
    chatOrUserId,
    formattedText: formattedTextStringify,
    urlPreviewData: urlPreviewDataStringify,
  } = req.body;
  const senderId = req.userData?.userId!;

  try {
    const formattedText =
      formattedTextStringify && formattedTextStringify !== "undefined"
        ? JSON.parse(formattedTextStringify)
        : undefined;
    const urlPreviewData = urlPreviewDataStringify
      ? JSON.parse(urlPreviewDataStringify)
      : undefined;
    if (
      !(Array.isArray(formattedText) || urlPreviewData || req.file?.filename) ||
      !chatOrUserId
    ) {
      throw new HttpError("Invalid chat message content", 400);
    }

    if (Array.isArray(formattedText) && formattedText.length > 0) {
      // const firstOp = content.formattedText[0];
      // firstOp.insert = firstOp.insert.replace(/^[\s\n]+/, "");
      const lastOp = formattedText[formattedText.length - 1];
      lastOp.insert = lastOp.insert?.replace(/[\s\n]+$/g, "\n");
    }

    let chatInstance = await ChatModel.findOne({
      $or: [
        { _id: chatOrUserId, users: { $all: [senderId] } },
        { isGroupChat: false, users: { $all: [senderId, chatOrUserId] } },
      ],
    });

    if (!chatInstance) {
      const existingUser = await UserModel.findOne({ _id: chatOrUserId })
        .lean()
        .exec();
      if (!existingUser) {
        throw new HttpError("You are trying to chat with no one!", 404);
      }

      chatInstance = new ChatModel({
        isGroupChat: false,
        users: [senderId, existingUser._id],
      });
    }

    if (!chatInstance.users.toString().includes(senderId)) {
      throw new HttpError("You are not allowed to message here!", 404);
    }

    const newMessage = new MessageModel({
      sender: senderId,
      content: {
        formattedText: formattedText || undefined,
        urlPreviewData: urlPreviewData || undefined,
        filename: req.file?.path.toString().replace(/\\/g, "/") || undefined,
      },
      chat: chatInstance.id,
    });

    const session = await mongoose.startSession();

    session.startTransaction();
    chatInstance.latestMessage = await newMessage.save({ session: session });
    await chatInstance.save({ session: session });
    await session.commitTransaction();

    res.status(201).json({
      chatInstanceId: chatInstance.id,
      newMessage: (
        await newMessage.populate({
          path: "chat",
          select: "users",
        })
      ).toObject(),
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
