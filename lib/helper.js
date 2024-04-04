import { usersSocketIDs } from "../server.js";

export const getOtherMembers = (members, userId) => {
    console.log(
        "HEY AM GET OTHER MEMBERS===========\n",
        members,
        "\n=============="
    );
    console.log(
        "HEY AM GET OTHER userId===========\n",
        userId.toString(),
        "\n=============="
    );

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

export const getBase64 = (file) =>
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const registerGetBase64 = (file) =>
    `data:${file.mimetype};base64,${Buffer.from(file.buffer.data).toString(
        "base64"
    )}`;
