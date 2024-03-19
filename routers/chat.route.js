import express from "express";
import {
    addMembers,
    getMyChats,
    getMyGroups,
    leaveGroup,
    newGroupChat,
    removeMembers,
} from "../controller/chat.controller.js";
import { isAuthenticated } from "../middlewares/Auth.js";

const chatRoute = express.Router();

// chatRoute.route()

chatRoute.use(isAuthenticated);

chatRoute.route("/chat/new/group-chat").post(newGroupChat);

chatRoute.route("/chat/my").get(getMyChats);
chatRoute.route("/chat/my/groups").get(getMyGroups);
chatRoute.route("/chat/add-members").put(addMembers);
chatRoute.route("/chat/remove-members").put(removeMembers);
chatRoute.route("/chat/leave/:id").delete(leaveGroup);

// new groupchat

export default chatRoute;
