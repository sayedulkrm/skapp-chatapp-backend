import ejs from "ejs";
import jwt from "jsonwebtoken";
import path from "path";
import { CatchAsyncError } from "../middlewares/CatchAsyncError.js";
import userModel from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import SendMail from "../utils/SendMail.js";

// import fs from "fs";
import { fileURLToPath } from "url";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/Events.js";
import { getOtherMembers } from "../lib/helper.js";
import chatModel from "../models/chat.model.js";
import requestModel from "../models/request.model.js";
import { getUserById } from "../services/user.service.js";
import {
    emitEvent,
    RegisterProfilePictureUploadFilesToCloudinary,
} from "../utils/Features.js";
import {
    accessTokenOptions,
    refreshTokenOptions,
    sendToken,
} from "../utils/Jwt.js";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const filePath = path.join(__dirname, "../mails/activation-mail.ejs");

// Check if the file exists

export const userRegister = CatchAsyncError(async (req, res, next) => {
    //
    console.log("HEYYY REGISTER GETTING CALLED");

    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return next(new ErrorHandler("Please enter all fields", 400));
        }

        const isEmailExist = await userModel.findOne({ email });

        if (isEmailExist) {
            return next(new ErrorHandler("Email already exist", 400));
        }

        const file = req.file;

        if (!file) {
            return next(new ErrorHandler("Please upload a Avatar", 400));
        }

        const userData = {
            name,
            email,
            password,
            file,
        };

        console.log(
            "HEYYYY AM USER DATAAAAA ===================\n\n",
            userData,
            "\n",
            "END OF USER DATAAAAA ==================== \n\n"
        );

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
            expiresIn: "35m",
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

        console.log(
            "HEYYYY AM NEW USER ===================\n\n",
            newUser,
            "\n",
            "==================== \n\n"
        );

        const { name, email, password, file } = newUser.user;

        const existUser = await userModel.findOne({ email });

        if (existUser) {
            return next(new ErrorHandler("User already exist", 400));
        }

        const result = await RegisterProfilePictureUploadFilesToCloudinary([
            file,
        ]);

        const avatar = {
            public_id: result[0].public_id,
            url: result[0].url,
        };

        const randomNumber = Math.floor(1000 + Math.random() * 9000);

        const finalUsername = `${name}${randomNumber}`;

        await userModel.create({
            name,
            email,
            password,
            avatar,
            username: finalUsername,
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

        if (!email) {
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
        res.cookie("access_token", "", {
            maxAge: 0,
            expires: new Date(Date.now()),
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        res.cookie("refresh_token", "", {
            maxAge: 0,
            expires: new Date(Date.now()),
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        res.cookie("connect.sid", "", {
            maxAge: 0,
            expires: new Date(Date.now()),
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        res.cookie("skapp_google_session", "", {
            maxAge: 0,
            expires: new Date(Date.now()),
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        res.cookie("skapp_google_session.sig", "", {
            maxAge: 0,
            expires: new Date(Date.now()),
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        req.logout(req.user, (err) => {
            if (err) return next(err);
            // res.redirect("/");
        });

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
    console.log("heyyy am get access token");

    try {
        const { refresh_token } = req.cookies;

        if (!refresh_token) {
            return next(new ErrorHandler("Please login", 400));
        }

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
        console.log("Ohh no Error came");
        return next(new ErrorHandler(error.message, 500));
    }
});

// Get Single User
export const getUserInfo = CatchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?._id;

        // console.log(req.user);

        getUserById(userId, res);
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// social auth
export const socialAuth = CatchAsyncError(async (req, res, next) => {
    // console.log("Heyy am social auth", req.user);

    try {
        // const { email, name, avatar } = req.user;

        if (!req.user) {
            return next(new ErrorHandler("No User Comes", 404));
        }

        const email = req.user.emails[0].value; // Email from Google response
        const name = `${req.user?.name?.givenName.toLowerCase()}_${req.user?.name?.familyName.toLowerCase()}`;

        // Generate a 4-digit random number
        const randomNumber = Math.floor(1000 + Math.random() * 9000);

        const finalUsername = `${name}${randomNumber}`;
        // const first_name = profile.name.givenName; // First name from Google response
        // const last_name = profile.name.familyName; // Last name from Google response
        const avatar = req.user.photos[0].value;

        const user = await userModel.findOne({ email });

        if (!user) {
            const newUser = await userModel.create({
                email,
                name,
                avatar: {
                    public_id: avatar,
                    url: avatar,
                },
                username: finalUsername,
            });
            console.log("heyyyy i created a new user");
            sendToken(newUser, 200, `Welcome ${newUser.name}`, res);
        } else {
            console.log("heyyyy i am not created any user");

            sendToken(user, 200, `Welcome Back ${user.name}`, res);
        }
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
});

// Search Users

export const searchUsers = CatchAsyncError(async (req, res, next) => {
    const { name = "" } = req.query;

    // const users = await

    // finding all my chats
    const myChats = await chatModel.find({
        groupChat: false,
        members: req.user._id,
    });

    // console.log("Heres MY CHAAT ==========>", myChats);
    // 4h 42 min

    // extracting: ALl users from my chats means Friends and people i have chatted with them
    // Extract all users from my chats (excluding myself)
    // const allUsersFromMyChats = myChats.flatMap(chat => chat.members.filter(memberId => memberId.toString() !== req.user._id.toString()));

    //  extracting All Users from my chats means friends or people I have chatted with
    const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);

    //

    // regex will find patterns expect me and my friends
    const allUsersExceptMeAndFriends = await userModel.find({
        _id: { $nin: allUsersFromMyChats },
        name: { $regex: name, $options: "i" },
    });

    // // Find users whose IDs are not in my chats and exclude myself from the search
    // const users = await userModel.find({
    //     _id: { $nin: [...allUsersFromMyChats, req.user._id] }, // Exclude myself
    //     name: { $regex: name, $options: "i" }, // Search by name
    // });

    const users = allUsersExceptMeAndFriends.map(({ _id, name, avatar }) => ({
        _id,
        name,
        avatar: avatar.url,
    }));

    res.status(200).json({
        success: true,
        users,
    });
});

// send request to friend
export const sendRequest = CatchAsyncError(async (req, res, next) => {
    const { userId } = req.body;

    if (!userId) {
        return next(new ErrorHandler("UserId is required", 400));
    }

    // Check if the user is already friends with the target user
    const currentUser = await userModel
        .findById(req.user._id)
        .select("friends");
    if (currentUser.friends.includes(userId)) {
        return next(
            new ErrorHandler("You are already friends with this user", 400)
        );
    }
    // Check if a friend request has already been sent
    const existingRequest = await requestModel.findOne({
        $or: [
            { sender: req.user._id, receiver: userId },
            { sender: userId, receiver: req.user._id },
        ],
    });

    if (existingRequest) {
        return next(new ErrorHandler("You have already sent a request", 400));
    }

    await requestModel.create({
        sender: req.user._id,
        receiver: userId,
    });

    emitEvent(req, NEW_REQUEST, [userId]);

    res.status(200).json({
        success: true,
        message: "Friend Request sent successfully",
    });
});

// accept friend request

export const acceptRequest = CatchAsyncError(async (req, res, next) => {
    const { requestId, accept } = req.body;

    console.warn("HEYYY ITS ACCEPT REQ \n", requestId, accept);

    if (!requestId) {
        return next(new ErrorHandler("User Id is required", 400));
    }

    const request = await requestModel
        .findById(requestId)
        .populate("sender", "name")
        .populate("receiver", "name");

    if (!request) {
        return next(new ErrorHandler("Request not found", 404));
    }

    console.log("Heyyyyy its req receiver", request.receiver);

    if (request.receiver._id.toString() !== req.user._id.toString()) {
        return next(
            new ErrorHandler(
                "You are not authorized to accept this request",
                401
            )
        );
    }

    if (!accept) {
        await request.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Request rejected successfully",
        });
    }
    const senderId = request.sender._id;
    const receiverId = request.receiver._id;

    // Add sender's ID to receiver's friends array
    await userModel.findByIdAndUpdate(receiverId, {
        $addToSet: { friends: senderId },
    });

    // Add receiver's ID to sender's friends array
    await userModel.findByIdAndUpdate(senderId, {
        $addToSet: { friends: receiverId },
    });

    const members = [senderId, receiverId];

    await Promise.all([
        chatModel.create({
            members,
            name: `${request.sender.name}-${request.receiver.name}`,
        }),
        request.deleteOne(),
    ]);

    emitEvent(req, REFETCH_CHATS, members);

    res.status(200).json({
        success: true,
        message: "Friend request accepted successfully",
        senderId: senderId,
    });
});

// See notification

export const getMyNotification = CatchAsyncError(async (req, res, next) => {
    const requests = await requestModel
        .find({ receiver: req.user._id })
        .populate("sender", "name avatar");

    const allRequest = requests.map(({ sender, _id }) => ({
        _id,
        sender: {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar.url,
        },
    }));

    res.status(200).json({
        success: true,
        allRequest,
    });
});

// My friends

export const getMyFriends = CatchAsyncError(async (req, res, next) => {
    // we can check by user.friends in DB

    const chatId = req.query.chatId;

    const chats = await chatModel
        .find({ members: req.user._id, groupChat: false })
        .populate("members", "name avatar");

    const friends = chats.map(({ members }) => {
        const otherUser = getOtherMembers(members, req.user._id);

        return {
            _id: otherUser._id,
            name: otherUser.name,
            avatar: otherUser.avatar.url,
        };
    });

    if (chatId) {
        const chat = await chatModel.findById(chatId);

        const availableFriends = friends.filter(
            (friend) => !chat.members.includes(friend._id)
        );

        res.status(200).json({
            success: true,
            friends: availableFriends,
        });
    } else {
        res.status(200).json({
            success: true,
            friends,
        });
    }
});
