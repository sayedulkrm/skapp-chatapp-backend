import express from "express";

import {
    adminOnly,
    authorizeRoles,
    isAuthenticated,
} from "../middlewares/Auth.js";
import {
    adminLogin,
    adminLogout,
    getAdminData,
    getAdminStats,
    getAllChats,
    getAllMessages,
    getAllUsers,
} from "../controller/admin.controller.js";
import { updateAccessToken } from "../controller/user.controller.js";

const adminRoute = express.Router();

adminRoute.use(updateAccessToken, isAuthenticated, authorizeRoles("admin"));

adminRoute.post("/admin/verify", adminLogin);

adminRoute.get("/admin/logout", adminLogout);

adminRoute.use(adminOnly);

adminRoute.get("/admin", getAdminData);
adminRoute.get("/admin/users", getAllUsers);
adminRoute.get("/admin/chats", getAllChats);
adminRoute.get("/admin/messages", getAllMessages);

adminRoute.get("/admin/stats", getAdminStats);

export default adminRoute;
