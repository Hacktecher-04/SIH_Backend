exports.otp = () => {
    try {
        const genrateOTP = Math.floor(100000 + Math.random() * 900000);
        return genrateOTP
    } catch (error) {
        throw new Error("OTP not generated");
    }
}