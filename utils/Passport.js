import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userModel from "../models/user.model.js";
import mongoose from "mongoose";

import { config } from "dotenv";

config({
    path: "./config/config.env",
});

const PassportStragy = passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
            scope: ["profile", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
            console.log("Profile ID:", profile.id);

            const email = profile.emails[0].value;

            try {
                const isUserExist = await userModel.findOne({
                    email,
                });

                if (!isUserExist) {
                    console.log("User does not exist");
                    return done(null, false, { message: "User not found" });
                }

                return done(null, isUserExist);
            } catch (error) {
                console.error("MongoDB Error:", error);
                return done(error, false);
            }

            // if (profile.id && mongoose.Types.ObjectId.isValid(profile.id)) {
            //     // Ensure that profile.id is a valid ObjectId
            //     const userId = new mongoose.Types.ObjectId(profile.id);

            //     try {
            //         const user = await userModel.findOne({ _id: userId });

            //         if (!user) {
            //             return done(null, false, { message: "User not found" });
            //         }
            //     } catch (error) {
            //         console.error("MongoDB Error:", error);
            //         return done(error, false);
            //     }
            // } else {
            //     console.error("Invalid profile.id:", profile.id);
            //     return done(null, false, { message: "Invalid user ID" });
            // }

            // if (user) {
            //     return done(null, user);
            // } else {
            //     const newUser = await userModel.create({
            //         name: profile.displayName,
            //         email: profile.emails[0].value,
            //         avatar: profile.photos[0].value,
            //         _id: profile.id,
            //     });
            //     return done(null, newUser);
            // }

            // ===
            // ===
            // ===
            // ===
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await userModel.findById(id);

    done(null, user);
});

export default PassportStragy;
