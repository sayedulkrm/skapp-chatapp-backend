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
    expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 1000,
    httpOnly: true,
    // Don't add secure while in Localhost mode. It wont save the cookie in browser if secure is true.
    // secure: false,

    sameSite: "none",
};

export const refreshTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    // Don't add secure while in Localhost mode. It wont save the cookie in browser if secure is true.
    // secure: true,

    sameSite: "none",
};

export const sendToken = (user, statusCode, message, res) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    // upload session to redis

    // only set secure in production

    if (process.env.NODE_ENV === "production") {
        accessTokenOptions.secure = true;
    }

    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    res.status(statusCode).json({
        success: true,
        user,
        message,
        accessToken,
    });
};
