import jwt from "jsonwebtoken";
import { CatchAsyncError } from "../middlewares/CatchAsyncError.js";
import userModel from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import path from "path";
import SendMail from "../utils/SendMail.js";
import ejs from "ejs";

// import fs from "fs";
import { fileURLToPath } from "url";

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
