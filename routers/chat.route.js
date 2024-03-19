import express from "express";
import { getMyChats, newGroupChat } from "../controller/chat.controller.js";

const chatRoute = express.Router();

// chatRoute.route()

chatRoute.route("/chat/new/group-chat").post(newGroupChat);

chatRoute.route("/chat/my").get(getMyChats);

// new groupchat

export default chatRoute;
