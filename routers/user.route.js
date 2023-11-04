import express from "express";
import {
    activateUser,
    userLogin,
    userLogout,
    userRegister,
} from "../controller/user.controller.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/Auth.js";

const userRoute = express.Router();

userRoute.route("/user/register").post(userRegister);

userRoute.route("/user/activate").post(activateUser);

userRoute.route("/user/login").post(userLogin);

userRoute.route("/user/logout").get(isAuthenticated, userLogout);

export default userRoute;
