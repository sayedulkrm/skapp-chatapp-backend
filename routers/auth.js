import express from "express";
import passport from "passport";

const authRoute = express.Router();

const passRedirect = `${process.env.FRONTEND_URL}/profile`;
const failRedirect = `${process.env.FRONTEND_URL}/login`;

authRoute
    .route("/google")
    .get(passport.authenticate("google", ["profile", "email"]));

authRoute.route("/auth/google/callback").get(
    // Continue to the next middleware},
    passport.authenticate("google", {
        successRedirect: passRedirect,
        failureRedirect: failRedirect,
    })
);

authRoute.route("/login/success").get((req, res) => {
    if (req.user) {
        res.status(200).json({
            success: true,
            message: "successfull",
            user: req.user,
        });
    } else {
        res.status(404).json({
            success: false,
            message: "user not found",
        });
    }
});

authRoute.route("/login/failed").get((req, res) => {
    res.status(401).json({
        success: false,
        message: "OAuth Login failure",
    });
});

authRoute.route("/logout").get((req, res) => {
    req.logout({}, (err) => {
        if (err) {
            return res.status(500).json({
                message: "Error Logging Out",
            });
        }

        res.redirect(`${process.env.FRONTEND_URL}/login`);
    });
});

// authRoute.get(
//     "/auth/google/callback", // add **/auth**
//     (req, res, next) => {
//         passport.authenticate(
//             "google",
//             { failureRedirect: "/auth/google/error" },
//             async (error, user, info) => {
//                 if (error) {
//                     return res.send({ message: error.message });
//                 }
//                 if (user) {
//                     try {
//                         // your success code
//                         return res.send({
//                             data: result.data,
//                             message: "Login Successful",
//                         });
//                     } catch (error) {
//                         // error msg
//                         return res.send({ message: error.message });
//                     }
//                 }
//             }
//         )(req, res, next);
//     }
// );

export default authRoute;
