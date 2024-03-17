import mongoose, { Schema, Types } from "mongoose";

const requestSchema = new Schema(
    {
        status: {
            type: String,
            default: "pending",
            enum: ["pending", "accepted", "rejected"],
        },

        sender: {
            type: Types.ObjectId,
            ref: "User",
            required: [true, "Please enter a sender"],
        },

        receiver: {
            type: Types.ObjectId,
            ref: "User",
            required: [true, "Please enter a receiver"],
        },
    },
    { timestamps: true }
);

const requestModel =
    mongoose.models.Request || mongoose.model("Request", requestSchema);

export default requestModel;
