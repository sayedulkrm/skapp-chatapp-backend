import app from "./app.js";
import { v4 as uuid } from "uuid";
import { Server } from "socket.io";
import { createServer } from "http";
import { NEW_MESSAGE, NEW_MESSAGE_ALEART } from "./constants/Events.js";

import { connectDB } from "./config/db.js";
import { getSockets } from "./lib/helper.js";
import messageModel from "./models/message.model.js";
// Cloudinary Import
import { v2 as cloudinary } from "cloudinary";

connectDB();

// Connect to cloudinary

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Users socket ids

export const usersSocketIDs = new Map();

const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
    },
});

// 6h 47 min in video

io.on("connection", (socket) => {
    console.log("user connected", socket.id);

    const user = { _id: "asd", name: "asd" };

    usersSocketIDs.set(user._id.toString(), socket.id);

    socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
        const messageForRealTime = {
            content: message,
            _id: uuid(),
            sender: {
                _id: "asd", //user.id,
                name: "asd", //user.name
            },
            chatId,

            createdAt: new Date().toISOString(),
        };

        const messageForDb = {
            content: message,
            sender: "asd", //user.id,
            chatId,
        };

        const membersSocket = getSockets(members);

        console.log("Heere All users Socket", membersSocket);

        io.to(membersSocket).emit(NEW_MESSAGE, {
            chatId,
            message: messageForRealTime,
        });

        io.to(membersSocket).emit(NEW_MESSAGE_ALEART, { chatId });

        console.log("New message", messageForRealTime);

        try {
            await messageModel.create(messageForDb);
        } catch (error) {
            console.log(error);
        }
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
        usersSocketIDs.delete(user._id.toString());
    });
});

server.listen(process.env.PORT, () =>
    console.log(`Server is running on port ${process.env.PORT}`)
);
