const ErrorMiddleware = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;

    err.message = err.message || "Internal Server Error (ErrorMiddleware file)";

    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyPattern).join(
            ","
        )} Entered`;
        err = new Error(message);
        err.statusCode = 400;
    }

    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new Error(message);
        err.statusCode = 400;
    }

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
    });
};

export default ErrorMiddleware;
