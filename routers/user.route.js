import express from "express";
import { activateUser, userRegister } from "../controller/user.controller.js";

const userRoute = express.Router();

userRoute.route("/user/register").post(userRegister);
userRoute.route("/user/activate").post(activateUser);

export default userRoute;
