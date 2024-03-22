import { usersSocketIDs } from "../server.js";

export const getOtherMembers = (members, userId) => {
    return members.find(
        (member) => member._id.toString() !== userId.toString()
    );
};

export const getSockets = (users = []) => {
    const sockets = users.map((user) =>
        usersSocketIDs.get(user._id.toString())
    );

    return sockets;
};
