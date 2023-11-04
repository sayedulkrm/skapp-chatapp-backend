import { Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Please enter a name"],
        },

        email: {
            type: String,
            required: [true, "Please enter a email"],
            unique: true,
            validate: validator.isEmail,
        },

        password: {
            type: String,
            required: [false, "Please enter your email"],
            minLength: [6, "Password must be at least 6 charecter"],
            select: false,
        },

        avatar: {
            public_id: {
                type: String,
                // required: true,
            },
            url: {
                type: String,
                // required: true,
            },
        },

        role: {
            type: String,
            default: "user",
        },

        isVarified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Hash password before saving

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);

    next();
});

// compare password
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// sign access token
userSchema.methods.SignAccessToken = function () {
    return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN || "", {
        expiresIn: "5m",
    });
};

userSchema.methods.SignRefreshToken = function () {
    return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN || "", {
        expiresIn: "7d",
    });
};

const userModel = mongoose.model("User", userSchema);

export default userModel;
