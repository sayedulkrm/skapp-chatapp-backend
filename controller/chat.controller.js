import { ALERT, REFETCH_CHATS } from "../constants/Events.js";
import { CatchAsyncError } from "../middlewares/CatchAsyncError.js";
import chatModel from "../models/chat.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { emitEvent } from "../utils/Features.js";

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
    const chats = await chatModel.find({ members: req.user._id }).populate();
});
