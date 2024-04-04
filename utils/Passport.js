import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import { config } from "dotenv";

config({
    path: "./config/config.env",
});

const PassportStragy = passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/api/v1/auth/google/callback",
            scope: ["profile", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
            // console.log("Profile ID:", profile.id);

            try {
                // console.log("Profile ID:", profile);
                // const email = profile.emails[0].value; // Email from Google response
                // const usernameBase = `${profile?.name?.familyName.toLowerCase()}_${profile?.name?.givenName.toLowerCase()}`;

                // // Generate a 4-digit random number
                // const randomNumber = Math.floor(1000 + Math.random() * 9000);

                // const finalUsername = `${usernameBase}${randomNumber}`;
                // // const first_name = profile.name.givenName; // First name from Google response
                // // const last_name = profile.name.familyName; // Last name from Google response
                // const image_url = profile.photos[0].value; // Profile image URL from Google response profile.picture

                // Check if user exists
                // const user = await getUserByEmail(email);
                // if (user) {
                //     // If user exists, return the user details
                //     // console.log("Heyyyy user exists", user);
                //     // sendToken(expressRes, `Welcome ${user.name}`, user, 200);
                //     return done(null, user);
                // } else {
                //     // If user doesn't exist, create a new user
                //     await createUser({
                //         email,
                //         // first_name,
                //         // last_name,
                //         username: finalUsername,
                //         image_url,
                //     });
                // }

                // sendToken(expressRes, `Welcome ${newUser.name}`, newUser, 200);

                done(null, profile);
            } catch (error) {
                // console.log("error comes");
                done(error, false);
            }

            // const id = profile.id;

            // const email = profile.emails[0].value;

            // const name = profile.displayName;

            // const avatar = profile.photos[0].value;

            // const user = {
            //     id,
            //     email,
            //     name,
            //     avatar,
            // };

            // try {
            //     const isUserExist = await userModel.findOne({
            //         email,
            //     });

            //     if (!isUserExist) {
            //         console.log("User does not exist");
            //         return done(null, false, { message: "User not found" });
            //     }

            //     return done(null, isUserExist);
            // } catch (error) {
            //     console.error("MongoDB Error:", error);
            //     return done(error, false);
            // }

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
    console.log("Am getting serridge...");

    // console.log(user);

    done(null, user);
});

passport.deserializeUser(async (user, done) => {
    // const user = await getUserById(user);
    console.log("deserialized user");
    done(null, user);
});

export default PassportStragy;
