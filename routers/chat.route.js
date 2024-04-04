import express from "express";
import {
    addMembers,
    deleteChat,
    getChatDetails,
    getMessages,
    getMyChats,
    getMyGroups,
    leaveGroup,
    newGroupChat,
    removeMembers,
    renameGroup,
    sendAttachments,
} from "../controller/chat.controller.js";
import { isAuthenticated } from "../middlewares/Auth.js";
import multerUpload from "../middlewares/Multer.js";
import { updateAccessToken } from "../controller/user.controller.js";

const chatRoute = express.Router();

// chatRoute.route()

chatRoute.use(updateAccessToken);

chatRoute.route("/chat/new/group-chat").post(isAuthenticated, newGroupChat);

chatRoute.route("/chat/my").get(isAuthenticated, getMyChats);
chatRoute.route("/chat/my/groups").get(isAuthenticated, getMyGroups);
chatRoute.route("/chat/add-members").put(isAuthenticated, addMembers);
chatRoute.route("/chat/remove-members").put(isAuthenticated, removeMembers);
chatRoute.route("/chat/leave/:id").delete(isAuthenticated, leaveGroup);

//  sent attachments

// we use name `files` in multerUpload.array(). So while uploading fromt postman or frontend name that as files
chatRoute
    .route("/chat/message")
    .post(isAuthenticated, multerUpload.array("files", 5), sendAttachments);

// /messages/chatId
chatRoute.route("/chat/message/:id").get(isAuthenticated, getMessages);

// Get Chat Details, rename, delete
chatRoute
    .route("/chat/:id")
    .get(isAuthenticated, getChatDetails)
    .put(isAuthenticated, renameGroup)
    .delete(isAuthenticated, deleteChat);

export default chatRoute;
