// parse env variables to intregarete with fall back value

const accessTokenExpire = parseInt(
    process.env.ACCESS_TOKEN_EXPIRES || "300",
    10
);

const refreshTokenExpire = parseInt(
    process.env.REFRESH_TOKEN_EXPIRES || "1200",
    10
);

export const accessTokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 1000), // Convert minutes to milliseconds
    maxAge: accessTokenExpire * 60 * 1000, // Convert minutes to milliseconds
    httpOnly: true,
    sameSite: "none",
    secure: true, // Secure flag is set to true in production
};

export const refreshTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 60 * 60 * 24 * 1000), // Convert days to milliseconds
    maxAge: refreshTokenExpire * 60 * 60 * 24 * 1000, // Convert days to milliseconds
    httpOnly: true,
    sameSite: "none",
    secure: true, // Secure flag is set to true in production
};

export const sendToken = (user, statusCode, message, res) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    // upload session to redis

    // only set secure in production

    // if (process.env.NODE_ENV === "production") {
    //     accessTokenOptions.secure = true;
    // }

    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    res.status(statusCode).json({
        success: true,
        user,
        message,
        accessToken,
    });
};
