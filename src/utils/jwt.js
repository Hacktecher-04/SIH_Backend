const jwt = require('jsonwebtoken');

exports.accessToken = (userId) => {
    try {
        const access_Secret = process.env.JWT_SECRET;
        const access_Expiry = process.env.JWT_EXPIRY;
        const access_Token = jwt.sign(
            { id: userId }, 
            access_Secret, 
            { expiresIn: access_Expiry }
        );
        return access_Token;
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.refreshToken = (userId) => {
    try {
        const refresh_Secret = process.env.REFRESH_JWT_SECRET;
        const refresh_Expiry = process.env.REFRESH_JWT_EXPIRY;
        const refresh_Token = jwt.sign(
            { id: userId }, 
            refresh_Secret, 
            { expiresIn: refresh_Expiry }
        );
        return refresh_Token;
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.verify_Token = (token, secret) => {
    try {
        const access_Secret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, access_Secret);
        return decoded;
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.verify_Refresh_Token = (token) => {
    try {
        const refresh_Secret = process.env.REFRESH_JWT_SECRET;
        const decoded = jwt.verify(token, refresh_Secret);
        return decoded;
    } catch (error) {
        throw new Error(error.message);
    }
}