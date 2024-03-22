import jwt from "jsonwebtoken";
import { CatchAsyncError } from "../middlewares/CatchAsyncError.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import userModel from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { refreshTokenOptions } from "../utils/Jwt.js";

// Admin login

export const adminLogin = CatchAsyncError(async (req, res, next) => {
    const { secrect_key } = req.body;

    if (!secrect_key) {
        return next(new ErrorHandler("Please enter secrect key", 400));
    }

    const isMatched =
        secrect_key === (process.env.ADMIN_SECRET_KEY || "batman");

    if (!isMatched) {
        return next(new ErrorHandler("Invalid secrect key", 401));
    }

    const token = jwt.sign(secrect_key, process.env.ADMIN_JWT_SECRET_KEY);

    res.status(200)
        .cookie("skapp_admin_token", token, refreshTokenOptions)
        .json({
            success: true,
            message: "Login Successfully",
        });
});

// Get Admin Data

export const getAdminData = CatchAsyncError(async (req, res, next) => {
    res.status(200).json({
        admin: true,
    });
});

// Admin logout

export const adminLogout = CatchAsyncError(async (req, res, next) => {
    res.status(200)
        .cookie("skapp_admin_token", "", { ...refreshTokenOptions, maxAge: 0 })
        .json({
            success: true,
            message: "Logout Successfully",
        });
});

// get all users
export const getAllUsers = CatchAsyncError(async (req, res, next) => {
    const users = await userModel.find({});

    const transFromedUsers = await Promise.all(
        users.map(async ({ name, username, avatar, _id }) => {
            const [groupCount, friendsCount] = await Promise.all([
                chatModel.countDocuments({ groupChat: true, members: _id }),
                chatModel.countDocuments({ groupChat: false, members: _id }),
            ]);

            return {
                name,
                username,
                avatar: avatar.url,
                _id,
                groupCount,
                friendsCount,
            };
        })
    );

    res.status(200).json({
        success: true,
        users: transFromedUsers,
    });
});

// all chats
export const getAllChats = CatchAsyncError(async (req, res, next) => {
    const chats = await chatModel
        .find({})
        .populate("members", "name avatar")
        .populate("creator", "name avatar");

    const transfromedChats = await Promise.all(
        chats.map(async ({ members, _id, groupChat, name, creator }) => {
            const totalMessages = await messageModel.countDocuments({
                chat: _id,
            });

            return {
                _id,
                groupChat,
                name,
                avatar: members.slice(0, 3).map((member) => member.avatar.url),

                members: members.map((member) => {
                    return {
                        _id: member._id,
                        name: member.name,
                        avatar: member.avatar.url,
                    };
                }),

                creator: {
                    name: creator?.name || "None",
                    avatar: creator?.avatar?.url || "",
                },
                totalMessages,

                totalMembers: members.length,
            };
        })
    );

    res.status(200).json({
        success: true,
        transfromedChats,
    });
});

// all messages
export const getAllMessages = CatchAsyncError(async (req, res, next) => {
    const messages = await messageModel
        .find({})
        .populate("sender", "name avatar")
        .populate("chat", "groupChat");

    const transfromedMessages = messages.map(
        ({ content, attachments, _id, createdAt, chat, sender }) => ({
            _id,
            attachments,
            createdAt,
            content,
            chat: chat._id,
            groupChat: chat.groupChat,
            sender: {
                _id: sender._id,
                name: sender.name,
                avatar: sender.avatar.url,
            },
        })
    );

    res.status(200).json({
        success: true,
        messages: transfromedMessages,
    });
});

// Get dashboard Stats

// 5h 46 min
export const getAdminStats = CatchAsyncError(async (req, res, next) => {
    const [groupsCount, userCount, messageCount, totalChatsCount] =
        await Promise.all([
            chatModel.countDocuments({ groupChat: true }),
            userModel.countDocuments(),
            messageModel.countDocuments(),
            chatModel.countDocuments(),
        ]);

    const today = new Date();

    const last7days = new Date();

    last7days.setDate(last7days.getDate() - 7);

    const last7daysMessage = await messageModel
        .findOne({
            createdAt: { $gte: last7days, $lte: today },
        })
        .select("createdAt");

    const messages = new Array(7).fill(0);

    last7daysMessage.forEach((message) => {
        const indexApprox =
            (today.getTime() - message.createdAt.getTime()) /
            (1000 * 60 * 60 * 24);

        const index = Math.floor(indexApprox);

        messages[6 - index]++;
    });

    const stats = {
        groupsCount,
        userCount,
        messageCount,
        totalChatsCount,
        messagesChart: messages,
    };

    res.status(200).json({
        success: true,
        stats,
    });
});
