import { usersSocketIDs } from "../server.js";

export const getOtherMembers = (members, userId) => {
    return members.find(
        (member) => member._id.toString() !== userId.toString()
    );
};

export const getSockets = (users = []) => {
    const sockets = users.map((user) => usersSocketIDs.get(user.toString()));

    return sockets;
};

export const getBase64 = (file) =>
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const registerGetBase64 = (file) =>
    `data:${file.mimetype};base64,${Buffer.from(file.buffer.data).toString(
        "base64"
    )}`;
