import {
    ALERT,
    NEW_ATTACHMENT,
    NEW_MESSAGE_ALEART,
    REFETCH_CHATS,
} from "../constants/Events.js";
import { getOtherMembers } from "../lib/helper.js";
import { CatchAsyncError } from "../middlewares/CatchAsyncError.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import userModel from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { deleteFilesFromCloudinary, emitEvent } from "../utils/Features.js";

// new group    chat
export const newGroupChat = CatchAsyncError(async (req, res, next) => {
    const { name, members } = req.body;

    if (!name || !members) {
        return next(new ErrorHandler("Please fill all the fields"));
    }

    if (members.length < 2) {
        return next(
            new ErrorHandler(
                "More than 2 members are required to form a group chat"
            )
        );
    }

    // Here members is users IDs

    const allMembers = [...members, req.user._id];

    await chatModel.create({
        name,
        groupChat: true,

        creator: req.user._id,
        members: allMembers,
    });

    // emit

    emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);

    // Here passing only    members not the creator

    emitEvent(req, REFETCH_CHATS, members);

    res.status(201).json({
        success: true,
        message: "Group chat created successfully",
    });
});

// its basically in Frontend user sidebar
export const getMyChats = CatchAsyncError(async (req, res, next) => {
    // find by id
    const chats = await chatModel
        .find({ members: req.user._id })
        .populate("members", "name avatar");

    // we can do aggregation

    const transFormedChats = chats.map((chat) => {
        console.log("heyyyy this is chats", chat.members);

        const otherMember = getOtherMembers(chat.members, req.user._id);

        console.log("heyyyy this is otherMember", otherMember);

        return {
            _id: chat._id,
            name: chat.groupChat ? chat.name : otherMember.name,
            groupChat: chat.groupChat,
            members: chat?.members?.reduce((previousValue, currentValue) => {
                if (currentValue._id.toString() !== req.user._id.toString()) {
                    previousValue.push(currentValue._id);
                }

                return previousValue;
            }, []),
            avatar: chat.groupChat
                ? chat.members.slice(0, 3).map((member) => member.avatar.url)
                : [otherMember.avatar.url],
            //    latestMessage: chat.latestMessage,
        };
    });

    res.status(200).json({
        success: true,
        chats: transFormedChats,
    });
});

// to see my group
export const getMyGroups = CatchAsyncError(async (req, res, next) => {
    const chats = await chatModel
        .find({
            members: req.user._id,
            groupChat: true,
            creator: req.user._id,
        })
        .populate("members", "name avatar");

    const groups = chats.map(({ members, _id, groupChat, name }) => ({
        _id,
        groupChat,
        name,
        avatar: members.slice(0, 3).map((avatar) => avatar.url),
    }));

    res.status(200).json({
        success: true,
        groups,
    });
});

// add memebrs

export const addMembers = CatchAsyncError(async (req, res, next) => {
    const { members, chatId } = req.body;

    const chat = await chatModel.findById(chatId);

    if (!chat) {
        return next(new ErrorHandler("Chat not found", 404));
    }

    if (!members) {
        return next(new ErrorHandler("Please Provide Members", 404));
    }

    if (!chat.groupChat) {
        return next(new ErrorHandler("This is not a group Chat", 404));
    }

    if (chat.creator.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Only creator can add members", 404));
    }

    const allNewMembersPromise = members.map((i) =>
        userModel.findById(i, "name")
    );

    const allNewMembers = await Promise.all(allNewMembersPromise);

    const uniqueMembers = allNewMembers
        .filter((i) => !chat.members.includes(i._id.toString()))
        .map((i) => i._id);

    chat.members.push(...uniqueMembers);

    if (chat.members.length > 100) {
        return next(new ErrorHandler("Group can have only 100 members", 400));
    }

    await chat.save();

    const allUsersName = allNewMembers.map((i) => i.name).join(",");

    emitEvent(
        req,
        ALERT,
        chat.members,
        `${allUsersName} added to ${chat.name} group`
    );

    emitEvent(req, REFETCH_CHATS, chat.members);

    res.status(200).json({
        success: true,
        message: "Members added successfully",
    });
});

// Remove memebrs

export const removeMembers = CatchAsyncError(async (req, res, next) => {
    const { userId, chatId } = req.body;

    const [chat, userThatWillBeRemoved] = await Promise.all([
        chatModel.findById(chatId),
        userModel.findById(userId, "name"),
    ]);

    if (!chat) {
        return next(new ErrorHandler("Chat not found", 404));
    }

    if (!chat.groupChat) {
        return next(new ErrorHandler("This is not a group Chat", 404));
    }

    if (chat.creator.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Only creator can add members", 404));
    }

    if (chat.members.length <= 3) {
        return next(
            new ErrorHandler("Group must have at least 3 members", 400)
        );
    }

    chat.members = chat.members.filter(
        (i) => i.toString() !== userId.toString()
    );

    await chat.save();

    emitEvent(
        req,
        ALERT,
        chat.members,
        `${userThatWillBeRemoved.name} Has been kicked from the ${chat.name} group`
    );

    res.status(200).json({
        success: true,
        message: "Members removed successfully",
    });
});

// leave group
export const leaveGroup = CatchAsyncError(async (req, res, next) => {
    const chatId = req.params.id;

    const chat = await chatModel.findById(chatId);

    if (!chat) {
        return next(new ErrorHandler("Chat not found", 404));
    }

    if (!chat.groupChat) {
        return next(new ErrorHandler("This is not a group Chat", 404));
    }

    const remainingMembers = chat.members.filter(
        (member) => member.toString() !== req.user._id.toString()
    );

    if (chat.creator.toString() !== req.user._id.toString()) {
        // const newCreator = remainingMembers[0]

        const randomElement = Math.floor(
            Math.random() * remainingMembers.length
        );

        const newCreator = remainingMembers[randomElement];

        chat.creator = newCreator;
    }

    // video 2h 52 min
    chat.members = remainingMembers;

    const [user] = await Promise.all([
        userModel.findById(req.user._id, "name"),
        chat.save(),
    ]);

    emitEvent(
        req,
        ALERT,
        chat.members,
        `${user.name} have left the ${chat.name} group`
    );

    res.status(200).json({
        success: true,
        message: "Group left successfully",
    });
});

// send attachments

export const sendAttachments = CatchAsyncError(async (req, res, next) => {
    const { chatId } = req.body;

    const [chat, user] = await Promise.all([
        chatModel.findById(chatId),
        userModel.findById(req.user._id, "name"),
    ]);

    if (!chat) {
        return next(new ErrorHandler("Chat not found", 404));
    }

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    const files = req.files || [];

    if (files.length < 1) {
        return next(new ErrorHandler("Please upload at least one file", 404));
    }

    // upload files

    const attachments = [];

    const messageForRealTime = {
        content: "",
        attachments,
        sender: {
            _id: user._id,
            name: user.name,
            avatar:
                user?.avatar?.url ??
                "https://w7.pngwing.com/pngs/87/237/png-transparent-male-avatar-boy-face-man-user-flat-classy-users-icon.png",
        },
        chat: chatId,
    };

    const messageForDB = {
        content: "",
        attachments,
        sender: user._id,
        chat: chatId,
    };

    const message = await messageModel.create(messageForDB);

    emitEvent(req, NEW_ATTACHMENT, chat.members, {
        message: messageForRealTime,
        chatId,
    });

    emitEvent(req, NEW_MESSAGE_ALEART, chat.members, { chatId });

    res.status(200).json({
        success: true,
        message,
    });
});

// Get chat details

export const getChatDetails = CatchAsyncError(async (req, res, next) => {
    if (req.query.populate === "true") {
        const chat = await chatModel
            .findById(req.params.id)
            .populate("members", "name avatar")
            .lean();

        if (!chat) {
            return next(new ErrorHandler("Chat not found", 404));
        }

        chat.members = chat.members.map(({ _id, name, avatar }) => ({
            _id,
            name,
            avatar: avatar.url,
        }));

        res.status(200).json({
            success: true,
            chat,
        });
    } else {
        const chat = await chatModel.findById(req.params.id);

        if (!chat) {
            return next(new ErrorHandler("Chat not found", 404));
        }

        res.status(200).json({
            success: true,
            chat,
        });
    }
});

// Rename Group

export const renameGroup = CatchAsyncError(async (req, res, next) => {
    const chatId = req.params.id;

    const { name } = req.body;

    if (!name) {
        return next(new ErrorHandler("Please provide a name", 404));
    }

    const chat = await chatModel.findById(chatId);

    if (!chat) {
        return next(new ErrorHandler("Chat not found", 404));
    }

    if (!chat.groupChat) {
        return next(new ErrorHandler("This is not a group Chat", 404));
    }

    console.log("Creator of chat From ====> renameGroup", chat);

    if (chat.creator.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Only creator can rename group", 404));
    }

    chat.name = name;

    await chat.save();

    emitEvent(req, REFETCH_CHATS, chat.members);

    res.status(200).json({
        success: true,
        message: "Group name updated successfully",
    });
});

// Delete chat

export const deleteChat = CatchAsyncError(async (req, res, next) => {
    const chatId = req.params.id;

    const chat = await chatModel.findById(chatId);

    if (!chat) {
        return next(new ErrorHandler("Chat not found", 404));
    }

    const members = chat.members;

    if (chat.groupChat && chat.creator.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("Only creator can delete group", 404));
    }

    if (!chat.groupChat && !chat.members.includes(req.user._id.toString())) {
        return next(new ErrorHandler("Only members can delete chat", 404));
    }

    // Here we have to delete all the message as well as attachments or files from cloudinary

    const messagesWithAttachments = await messageModel.find({
        chat: chatId,
        attachments: { $exists: true, $ne: [] },
    });

    const public_ids = [];

    messagesWithAttachments.forEach(({ attachment }) => {
        attachment.forEach(({ public_id }) => public_ids.push(public_id));
    });

    await Promise.all([
        // delete files from cloudinary
        deleteFilesFromCloudinary(public_ids),
        chat.deleteOne(),
        messageModel.deleteMany({ chat: chatId }),
    ]);

    emitEvent(req, REFETCH_CHATS, members);

    res.status(200).json({
        success: true,
        message: "Chat deleted successfully",
    });
});

// Get Chat details
export const getMessages = CatchAsyncError(async (req, res, next) => {
    //  Watch 3h 37 min in video for this part
    const chatId = req.params.id;

    const chat = await chatModel.findById(chatId);

    if (!chat) {
        return next(new ErrorHandler("Chat not found", 404));
    }

    const { page = 1 } = req.query;

    // Result Per Page
    const limit = 20;

    const skip = (page - 1) * limit;

    const [messages, totalMessageCount] = await Promise.all([
        messageModel
            .find({ chat: chatId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("sender", "name avatar")
            .lean(),
        messageModel.countDocuments({ chat: chatId }),
    ]);

    const totalPages = Math.ceil(totalMessageCount / limit) || 0;

    res.status(200).json({
        success: true,
        messages: messages.reverse(),
        totalPages,
    });
});
