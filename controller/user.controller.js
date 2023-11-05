import jwt from "jsonwebtoken";
import { CatchAsyncError } from "../middlewares/CatchAsyncError.js";
import userModel from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import path from "path";
import SendMail from "../utils/SendMail.js";
import ejs from "ejs";

// import fs from "fs";
import { fileURLToPath } from "url";
import {
    accessTokenOptions,
    refreshTokenOptions,
    sendToken,
} from "../utils/Jwt.js";
import { getUserById } from "../services/user.service.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const filePath = path.join(__dirname, "../mails/activation-mail.ejs");

// Check if the file exists

export const userRegister = CatchAsyncError(async (req, res, next) => {
    try {
        const { email, password, name, avatar } = req.body;

        if (!email || !password || !name) {
            return next(new ErrorHandler("Please enter all fields", 400));
        }

        const isEmailExist = await userModel.findOne({ email });

        if (isEmailExist) {
            return next(new ErrorHandler("Email already exist", 400));
        }

        const userData = {
            name,
            email,
            password,
        };

        const activationCodeandToken = createActivationToken(userData);

        const activationCode = activationCodeandToken.activationCode;

        const data = {
            user: {
                name: userData.name,
            },
            activationCode,
        };

        // Use import.meta.url to obtain the current module's URL and convert it to a file path
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const html = await ejs.renderFile(
            path.join(__dirname, "../mails/activation-mail.ejs"),
            data
        );

        try {
            await SendMail({
                email: userData.email,
                subject: "Account activation",
                template: "activation-mail.ejs",
                data,
            });

            res.status(200).json({
                success: true,
                message: `Email sent ${userData.email} successfully. Please activate your account`,
                activationToken: activationCodeandToken.token,
            });
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// activation token

export const createActivationToken = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const token = jwt.sign(
        {
            user,
            activationCode,
        },
        process.env.ACTIVATION_SECRET,
        {
            expiresIn: "5m",
        }
    );

    return { token, activationCode };
};

// Activate User
export const activateUser = CatchAsyncError(async (req, res, next) => {
    try {
        const { activation_code, activation_token } = req.body;

        const newUser = jwt.verify(
            activation_token,
            process.env.ACTIVATION_SECRET
        );

        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler("Invalid Activation Code", 400));
        }

        const { name, email, password } = newUser.user;

        const existUser = await userModel.findOne({ email });

        if (existUser) {
            return next(new ErrorHandler("User already exist", 400));
        }

        const user = await userModel.create({
            name,
            email,
            password,
        });

        res.status(200).json({
            success: true,
            message: "Account activated successfully",
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Login user
export const userLogin = CatchAsyncError(async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new ErrorHandler("Please enter all fields", 400));
        }

        const user = await userModel.findOne({ email }).select("+password");

        if (!user) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }

        const isPasswordMatched = await user.comparePassword(password);

        if (!isPasswordMatched) {
            return next(new ErrorHandler("Invalid email or password", 400));
        }

        sendToken(user, 200, `Welcome Back ${user.name}`, res);
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Logout user

export const userLogout = CatchAsyncError(async (req, res, next) => {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });

        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Update Access Token
export const updateAccessToken = CatchAsyncError(async (req, res, next) => {
    try {
        const { refresh_token } = req.cookies;

        const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN);

        if (!decoded) {
            return next(new ErrorHandler("Invalid refresh token", 400));
        }

        const user = await userModel.findById(decoded._id);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        const accessToken = jwt.sign(
            { _id: user._id },
            process.env.ACCESS_TOKEN,
            {
                expiresIn: "5m",
            }
        );

        const refreshToken = jwt.sign(
            { _id: user._id },
            process.env.REFRESH_TOKEN,
            { expiresIn: "7d" }
        );

        res.cookie("access_token", accessToken, accessTokenOptions);
        res.cookie("refresh_token", refreshToken, refreshTokenOptions);

        // res.status(200).json({
        //     success: true,
        //     accessToken,
        // });

        next();
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get Single User
export const getUserInfo = CatchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?._id;

        console.log(req.user);

        getUserById(userId, res);
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// social auth
export const socialAuth = CatchAsyncError(async (req, res, next) => {
    try {
        const { email, name, avatar } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            const newUser = await userModel.create({ email, name, avatar });
            sendToken(newUser, 200, `Welcome ${newUser.name}`, res);
        } else {
            sendToken(user, 200, `Welcome Back ${user.name}`, res);
        }
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});
