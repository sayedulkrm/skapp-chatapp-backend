import userModel from "../models/user.model.js";

// get user by id

export const getUserById = async (userId, res) => {
    const user = await userModel.findById(userId);

    res.status(200).json({
        success: true,
        user,
    });
};
