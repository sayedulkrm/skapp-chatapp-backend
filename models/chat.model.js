import mongoose, { Schema, Types } from "mongoose";

const chatSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter a name"],
        },

        groupChat: {
            type: Boolean,
            default: false,
        },

        creator: {
            type: Types.ObjectId,
            ref: "User",
        },

        members: [
            {
                type: Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

const chatModel = mongoose.models.Chat || mongoose.model("Chat", chatSchema);

export default chatModel;
