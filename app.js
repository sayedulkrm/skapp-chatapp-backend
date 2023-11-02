import express from "express";
import { config } from "dotenv";

config({
    path: "./config/config.env",
});

import cookieParser from "cookie-parser";
import cors from "cors";
import ErrorMiddleware from "./middlewares/ErrorMiddleware.js";
import ErrorHandler from "./utils/ErrorHandler.js";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(
    express.urlencoded({
        extended: true,
    })
);

// Cookie parser
app.use(cookieParser());

//
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
        methods: ["GET", "PUT", "POST", "DELETE"],
    })
);

import userRoute from "./routers/user.route.js";

app.use("/api/v1", userRoute);

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

export default app;

app.use(ErrorMiddleware);
