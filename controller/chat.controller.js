import { ALERT, REFETCH_CHATS } from "../constants/Events.js";
import { getOtherMembers } from "../lib/helper.js";
import { CatchAsyncError } from "../middlewares/CatchAsyncError.js";
import chatModel from "../models/chat.model.js";
import userModel from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { emitEvent } from "../utils/Features.js";

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
        const otherMember = getOtherMembers(chat.members, req.user._id);

        return {
            _id: chat._id,
            name: chat.groupChat ? chat.name : otherMember.name,
            groupChat: chat.groupChat,
            members: chat.members.reduce((previousValue, currentValue) => {
                if (currentValue._id.toString() !== req.user._id.toString()) {
                    previousValue.push(currentValue._id);
                }

                return previousValue;
            }, []),
            avatar: chat.groupChat
                ? members.slice(0, 3).map((avatar) => avatar.url)
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
