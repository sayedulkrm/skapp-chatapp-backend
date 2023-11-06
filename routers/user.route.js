import express from "express";
import {
    activateUser,
    getUserInfo,
    socialAuth,
    updateAccessToken,
    userLogin,
    userLogout,
    userRegister,
} from "../controller/user.controller.js";
import { authorizeRoles, isAuthenticated } from "../middlewares/Auth.js";
import passport from "passport";

const userRoute = express.Router();

userRoute.route("/user/register").post(userRegister);

userRoute.route("/user/activate").post(activateUser);

userRoute.route("/user/login").post(userLogin);

userRoute
    .route("/user/logout")
    .get(updateAccessToken, isAuthenticated, userLogout);

userRoute.route("/user/refreshtoken").get(updateAccessToken);

userRoute
    .route("/user/me")
    .get(updateAccessToken, isAuthenticated, getUserInfo);

// Social Login

userRoute.route("/user/socialAuth").post(socialAuth);

export default userRoute;
