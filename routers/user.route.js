import express from "express";
import { userRegister } from "../controller/user.controller.js";

const userRoute = express.Router();

userRoute.route("/user/register").post(userRegister);

export default userRoute;
