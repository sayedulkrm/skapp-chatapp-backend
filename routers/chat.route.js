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

const chatRoute = express.Router();

// chatRoute.route()

chatRoute.use(isAuthenticated);

chatRoute.route("/chat/new/group-chat").post(newGroupChat);

chatRoute.route("/chat/my").get(getMyChats);
chatRoute.route("/chat/my/groups").get(getMyGroups);
chatRoute.route("/chat/add-members").put(addMembers);
chatRoute.route("/chat/remove-members").put(removeMembers);
chatRoute.route("/chat/leave/:id").delete(leaveGroup);

//  sent attachments

// we use name `files` in multerUpload.array(). So while uploading fromt postman or frontend name that as files
chatRoute
    .route("/chat/message")
    .post(multerUpload.array("files", 5), sendAttachments);

// /messages/chatId
chatRoute.route("/chat/message/:id").get(getMessages);

// Get Chat Details, rename, delete
chatRoute
    .route("/chat/:id")
    .get(getChatDetails)
    .put(renameGroup)
    .delete(deleteChat);

export default chatRoute;
