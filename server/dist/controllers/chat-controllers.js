import HttpError from "../models/http-error.js";
import ChatModel from "../models/chat-model.js";
export const fetchChats = async (req, res, next) => {
    try {
        const chatList = await ChatModel.find({
            users: { $elemMatch: { $eq: req.userData?.userId } },
        })
            .populate([
            {
                path: "users",
                select: "name email profilePic",
                match: { _id: { $ne: req.userData?.userId } },
            },
            { path: "groupAdmins", select: "name email profilePic" },
            { path: "latestMessage" },
        ])
            .sort({ updatedAt: -1 })
            .lean()
            .exec();
        res.status(200).json({ chatList });
    }
    catch (error) {
        console.error(error.message);
    }
};
export const accessChat = async (req, res, next) => {
    try {
        const { chatId } = req.params;
        if (!chatId) {
            throw new HttpError("No user Id provided!", 404);
        }
        const isChat = await ChatModel.findOne({
            isGroupChat: false,
            _id: chatId,
            users: { $all: [req.userData?.userId] },
        })
            .populate([
            { path: "users", select: "-password" },
            { path: "latestMessage" },
        ])
            .populate({
            path: "latestMessage.sender",
            select: "name profilePic email",
        })
            .lean()
            .exec();
        if (isChat) {
            res.status(200).json(isChat);
        }
        else {
            throw new HttpError("You did not chat with this user before.", 404);
            //   const createdChat = new ChatModel({
            //     isGroupChat: false,
            //     users: [req.userData?.userId, userId],
            //   });
            //   await createdChat.save();
            //   res
            //     .status(200)
            //     .json(
            //       (
            //         await createdChat.populate({ path: "users", select: "-password" })
            //       ).toObject()
            //     );
        }
    }
    catch (error) {
        console.error(error.message);
        if (error instanceof HttpError) {
            next(error);
        }
        else {
            console.error(error);
            next(new HttpError(error.message, 500));
        }
    }
};
export const createGroup = async (req, res, next) => {
    const { userIds, chatName } = req.body;
    if (!userIds || !chatName) {
        throw new HttpError("Please Fill all the fields.", 400);
    }
    if (userIds.length < 1) {
        throw new HttpError("2 ore more users are required to form a group!", 400);
    }
    try {
        const createdGroup = new ChatModel({
            chatName: chatName,
            isGroupChat: true,
            users: [req.userData?.userId, ...userIds],
            groupAdmins: req.userData?.userId,
        });
        await createdGroup.save();
        res.status(200).json({
            newGroupInfo: (await createdGroup.populate([
                {
                    path: "users",
                    select: "name email profilePic",
                    match: { _id: { $ne: req.userData?.userId } },
                },
                { path: "groupAdmins", select: "name email profilePic" },
                { path: "latestMessage" },
            ])).toObject(),
        });
    }
    catch (error) {
        console.error(error.message);
        if (error instanceof HttpError) {
            next(error);
        }
        else {
            console.error(error);
            next(new HttpError(error.message, 500));
        }
    }
};
export const renameGroup = async (req, res, next) => {
    try {
        const groupId = req.params.groupId;
        const { chatName } = req.body;
        if (!groupId || chatName.trim()) {
            throw new HttpError("", 403);
        }
        const updatedGroup = await ChatModel.findByIdAndUpdate(groupId, {
            chatName: chatName.trim(),
        }, { new: true });
        res.status(200).json(updatedGroup);
    }
    catch (error) {
        console.error(error.message);
        if (error instanceof HttpError) {
            next(error);
        }
        else {
            console.error(error);
            next(new HttpError(error.message, 500));
        }
    }
};
export const addMembers = async (req, res, next) => {
    try {
        const groupId = req.params.groupId;
        const { userIds } = req.body;
        if (!userIds.length) {
            throw new HttpError("No users to add", 400);
        }
        const addGroupMembers = await ChatModel.findOneAndUpdate({
            _id: groupId,
            groupAdmins: req.userData?.userId,
            users: { $nin: userIds },
        }, {
            $push: { users: { $each: userIds } },
        }, {
            new: true,
            select: "-password",
        })
            .lean()
            .exec();
        if (!addGroupMembers) {
            throw new HttpError("You are not authorized to add users to this group or the users already exist in the group", 403);
        }
        res.status(200).json(addGroupMembers);
    }
    catch (error) {
        if (error instanceof HttpError) {
            next(error);
        }
        else {
            console.error(error);
            next(new HttpError(error.message, 500));
        }
    }
};
export const removeMembers = async (req, res, next) => {
    try {
        const groupId = req.params.groupId;
        const { userIds } = req.body;
        if (!userIds.length) {
            throw new HttpError("No users to remove", 400);
        }
        const removeGroupMembers = await ChatModel.findOneAndUpdate({
            _id: groupId,
            groupAdmins: { $elemMatch: { $eq: req.userData?.userId } },
        }, {
            $pullAll: { users: userIds },
        }, {
            new: true,
        })
            .lean()
            .exec();
        if (!removeGroupMembers) {
            throw new HttpError("You are not authorized to add users to this group or the group doesn't exist", 403);
        }
        res.status(200).json(removeGroupMembers);
    }
    catch (error) {
        if (error instanceof HttpError) {
            next(error);
        }
        else {
            console.error(error);
            next(new HttpError(error.message, 500));
        }
    }
};
