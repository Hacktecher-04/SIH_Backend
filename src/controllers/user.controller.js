const userService = require('../services/user.service');
const uploadImageService = require('../services/image.service');

exports.register = async (req, res) => {
    try {
        const tokens = await userService.register(req.body);
        res.status(201).json(tokens);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).send({ message: 'User with this email already exists' });
        }
        res.status(500).send({ message: err.message });
    }
}

exports.login = async (req, res) => {
    try {
        const user = await userService.login(req.body);
        res.status(200).json(user);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
}

exports.getUser = async (req, res) => {
    try {
        const userId = req.user._id
        const user = await userService.getUser(userId);
        res.status(200).json(user);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
}

exports.updateUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const userData = req.body;
        if (req.file) {
            const profilePicture = await uploadImageService.uploadImage(userId, req.file);
            userData.profilePicture = profilePicture.url;
        }
        const user = await userService.updateUser(userId, req.body);
        res.status(200).json(user);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
}

exports.refresh_Token = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await userService.refresh_Token(userId);
        res.status(200).json(user);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await userService.deleteUser(userId);
        res.status(200).json(user);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
}

exports.googleAuthCallback = async (req, res) => {
    try {
        const tokens = await userService.generateTokens(req.user._id);
        if (tokens) {
            res.redirect(`${process.env.FRONTEND_URL}/callback?access_token=${tokens.access_Token}&refresh_token=${tokens.refresh_Token}`);
        }
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

exports.githubAuthCallback = async (req, res) => {
    try {
        const tokens = await userService.generateTokens(req.user._id);
        if (tokens) {
            res.redirect(`${process.env.FRONTEND_URL}/callback?access_token=${tokens.access_Token}&refresh_token=${tokens.refresh_Token}`)
        }
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};