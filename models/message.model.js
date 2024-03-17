import mongoose, { Schema, Types } from "mongoose";

const messageSchema = new Schema(
    {
        content: String,

        attachments: [
            {
                public_id: {
                    type: String,
                    required: true,
                },
                url: {
                    type: String,
                    required: true,
                },
            },
        ],

        sender: {
            type: Types.ObjectId,
            ref: "User",
            required: [true, "Please enter a sender"],
        },
        // on bellow chat there will be basically chat id
        chat: {
            type: Types.ObjectId,
            ref: "Chat",
            required: [true, "Please enter a chat"],
        },
    },
    { timestamps: true }
);

const messageModel =
    mongoose.models.Message || mongoose.model("Message", messageSchema);

export default messageModel;
