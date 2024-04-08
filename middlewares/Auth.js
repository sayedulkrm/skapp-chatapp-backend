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

// admin only

export const adminOnly = CatchAsyncError(async (req, res, next) => {
    const skapp_admin_token = req.cookies.skapp_admin_token;

    console.log("TOKENN", skapp_admin_token);

    if (!skapp_admin_token) {
        return next(
            new ErrorHandler("Only Admin can access this resource", 400)
        );
    }

    try {
        const secrect_key = jwt.verify(
            skapp_admin_token,
            process.env.ADMIN_JWT_SECRET_KEY
        );

        console.log("secrect_key", secrect_key);

        const isMatched =
            secrect_key === (process.env.ADMIN_SECRET_KEY || "batman");

        console.log("isMatched", isMatched);

        if (!isMatched) {
            return next(new ErrorHandler("Invalid secrect key", 401));
        }
    } catch (error) {
        return next(new ErrorHandler("Access token is not valid", 400));
    }

    // redis come here

    // then next

    next();
});

export const socketAuthentication = async (err, socket, next) => {
    try {
        if (err) {
            return next(new ErrorHandler("Access token is not valid", 400));
        }

        const access_token = socket.request.cookies.access_token;

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

            socket.user = user; // Set req.user to the decoded user data
        } catch (error) {
            return next(new ErrorHandler("Access token is not valid", 400));
        }

        next();
    } catch (error) {
        console.log("Error From SOCKET IO", error);
        return next(new ErrorHandler("Access token is not valid", 400));
    }
};
