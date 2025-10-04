const verifyToken = require('../utils/jwt');
const userModel = require('../models/user.model');

exports.protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = await verifyToken.verify_Token(token);
        const user = await userModel.findById(decoded.id);
        if (!user) {
            throw new Error("User not found");   
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

exports.refresh_Token = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized token not found' });
    }
    try {
        const decoded = await verifyToken.verify_Refresh_Token(token);
        const user = await userModel.findById(decoded.id);
        if (!user) {
            throw new Error("User not found");   
        }
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
    }
}