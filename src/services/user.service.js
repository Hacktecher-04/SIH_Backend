const userModel = require('../models/user.model');
const {accessToken, refreshToken}= require('../utils/jwt')

exports.register = async(userData) => {
    try {
        if(!userData){
            throw new Error("User data not found");
        }
        const user = await userModel.create(userData)
        if (!user) {
            throw new Error("User not registered")
        }
        const access_Token = accessToken(user._id)
        const refresh_Token = refreshToken(user._id)
        return {
            access_Token, refresh_Token
        }
    } catch (error) {
        throw new Error(error.message);   
    }
}

exports.login = async (userData) => {
    try {
        if(!userData) {
            throw new Error("User data not found");    
        }
        const user = await userModel.findOne({email: userData.email})
        if (!user) {
            throw new Error('Email doesnt exist')
        }
        const isMatch = await user.comparePassword(userData.password)
        if (!isMatch) {
            throw new Error('Password doesnt match')
        }
        const access_Token = accessToken(user._id)
        const refresh_Token = refreshToken(user._id)
        return {
            access_Token, refresh_Token
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

exports.getUser = async (userId) => {
    try {
        if (!userId) {
            throw new Error("User not found");
        }
        const user = await userModel.findOne({_id: userId})
        return user
    } catch (error) {
        throw new Error(error.message);
    }
}

exports.updateUser = async (userId, userData) => {
    try {
        if (!userId) {
            throw new Error("User not found");
        }
        const user = await userModel.findOneAndUpdate({_id: userId}, userData, {new: true});
        return user
    } catch (error) {
        throw new Error(error.message);
    }
}

exports.refresh_Token = async (userId) => {
    try {
        if (!userId) {
            throw new Error("User not found");
        }
        const user = await userModel.findOne({_id: userId});
        if (!user) {
            throw new Error("User not found");
        }
        const access_Token = accessToken(user._id);
        const refresh_Token = refreshToken(user._id);
        return {
            access_Token, refresh_Token
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

exports.deleteUser = async (userId) => {
    try {
        if (!userId) {
            throw new Error("User not found");
        }
        await userModel.findOneAndDelete({_id: userId});
        return {
            message: "User deleted successfully"
        }
    } catch (error) {
        throw new Error(error.message);
    }
}