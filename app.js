import express from "express";
import { config } from "dotenv";

config({
    path: "./config/config.env",
});

import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import passport from "passport";

import cors from "cors";
import ErrorMiddleware from "./middlewares/ErrorMiddleware.js";
import ErrorHandler from "./utils/ErrorHandler.js";

import PassportStragy from "./utils/Passport.js";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(
    express.urlencoded({
        extended: true,
    })
);

// Cookie parser
app.use(cookieParser());

// Cookie session
app.use(
    cookieSession({
        name: "skapp_google_session",
        keys: ["skapp"],
        // maxAge: 24 * 60 * 60 * 1000,
        // proxy: false,
        // resave: false,
        // saveUninitialized: true,
        // cookie: { secure: false },
    })
);

app.use(function (request, response, next) {
    if (request.session && !request.session.regenerate) {
        request.session.regenerate = (cb) => {
            cb();
        };
    }
    if (request.session && !request.session.save) {
        request.session.save = (cb) => {
            cb();
        };
    }
    next();
});

app.use(passport.initialize());
app.use(passport.session());

//
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
        methods: ["GET", "PUT", "POST", "DELETE"],
    })
);

import userRoute from "./routers/user.route.js";
import googleAuthRoute from "./routers/google-auth.js";

app.use("/api/v1", userRoute);
app.use("/api/v1", googleAuthRoute);

app.get("/", (req, res) => {
    res.send(
        `<h1>Server is Running. Click <a href="${process.env.FRONTEND_URL}">here</a> to go to Frontend </h1>`
    );
});

app.all("*", (req, res, next) => {
    const err = new ErrorHandler(`Routes ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
});

app.use(ErrorMiddleware);

export default app;
