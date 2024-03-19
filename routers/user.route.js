import express from "express";
import {
    activateUser,
    getUserInfo,
    searchUsers,
    updateAccessToken,
    userLogin,
    userLogout,
    userRegister,
} from "../controller/user.controller.js";
import { isAuthenticated } from "../middlewares/Auth.js";
import multerUpload from "../middlewares/Multer.js";

const userRoute = express.Router();

userRoute
    .route("/user/register")
    .post(multerUpload.single("avatar"), userRegister);

userRoute.route("/user/activate").post(activateUser);

userRoute.route("/user/login").post(userLogin);

userRoute
    .route("/user/logout")
    .get(updateAccessToken, isAuthenticated, userLogout);

userRoute.route("/user/refreshtoken").get(updateAccessToken);

userRoute
    .route("/user/me")
    .get(updateAccessToken, isAuthenticated, getUserInfo);

// search users

userRoute
    .route("/user/search")
    .get(updateAccessToken, isAuthenticated, searchUsers);

// Social Login

// userRoute.route("/user/socialAuth").post(socialAuth);

export default userRoute;
