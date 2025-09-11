const tranporter = require('../utils/email');
const { otp } = require('../utils/otp');
const otpModel = require('../models/otp.model');
const userModel = require('../models/user.model');
const jwt = require('../utils/jwt')

exports.sendEmail = async (email) => {
    try {
        if (!email) {
            throw new Error("Email not found");
        }
        const verifyEmail = await userModel.findOne({ email: email })
        if (verifyEmail) {
            throw new Error("Email not exist");
        }
        const otpCode = otp;
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'OTP Verification',
            text: `Your OTP is ${otpCode}`
        }
        tranporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        })
        await otpModel.create({
            email: email,
            otp: otpCode
        })
        return {
            message: "OTP sent successfully"
        }
    } catch (error) {
        throw new Error(error.message);
    }
}

exports.verifyOtp = async (email, otpCode) => {
    try {
        if (!email || !otpCode) {
            throw new Error("Email or OTP not found");
        }
        const user = await userModel.findOne({ email: email })
        if (!user) {
            throw new Error("Email not exist");
        }
        const otp = await otpModel.findOne({ email: email, otp: otpCode })
        if (!otp) {
            throw new Error("OTP not found");
        }
        const isVerified = otp.compareOtp(otpCode)
        if (isVerified) {
            throw new Error("Email already exist");
        }
        const accessToken = jwt.access_Token(user)
        await otpModel.deleteOne({ email: email, otp: otpCode })
        return true
    } catch (error) {
        throw new Error(error.message);
    }
}

exports.resendOtp = async (email) => {
    try {
        if (!email) {
            throw new Error("Email not found");
        }
        const otpCode = otpModel.otp();
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'OTP Verification',
            text: `Your OTP is ${otpCode}`
        }
        tranporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        })
        await otpModel.findOneAndUpdate({ email: email })({
            otp: otpCode
        })
        return {
            message: "OTP sent successfully"
        }
    } catch (error) {
        throw new Error(error.message);
    }
}