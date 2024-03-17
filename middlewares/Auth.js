import userModel from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { CatchAsyncError } from "./CatchAsyncError.js";
import jwt from "jsonwebtoken";

// Authenticated Users

export const isAuthenticated = CatchAsyncError(async (req, res, next) => {
    const access_token = req.cookies.access_token;

    if (!access_token) {
        return next(
            new ErrorHandler("Please login to access this resource", 400)
        );
    }

    try {
        const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN);

        // if (!decoded) {
        //     return next(new ErrorHandler("Invalid access_token", 400));
        // }

        // find the user
        const user = await userModel.findById(decoded._id);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        req.user = user; // Set req.user to the decoded user data
    } catch (error) {
        return next(new ErrorHandler("Access token is not valid", 400));
    }

    // redis come here

    // then next

    next();
});

// validate user role

export const authorizeRoles =
    (...roles) =>
    (req, res, next) => {
        // console.log(req);
        if (!roles.includes(req.user?.role)) {
            return next(
                new ErrorHandler(
                    `Role: ${req.user?.role} is not allowed to access this resource`,
                    403
                )
            );
        }

        next();
    };
