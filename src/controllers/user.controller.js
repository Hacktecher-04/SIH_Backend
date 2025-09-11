const userService = require('../services/user.service');
const uploadImageService = require('../services/image.service');

exports.register = async (req, res) => {
    try {
        const user = await userService.register(req.body);
        res.status(201).json(user);
    }catch(err) {
        res.status(500).send({message: err.message});
    }
}

exports.login = async (req, res) => {
    try {
        const user = await userService.login(req.body);
        res.status(200).json(user);
    }catch(err) {
        res.status(500).send({message: err.message});
    }
}

exports.getUser = async (req, res) =>  {
    try {
        const userId = req.user._id
        const user = await userService.getUser(userId);
        res.status(200).json(user);
    }catch(err) {
        res.status(500).send({message: err.message});
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
    }catch(err) {
        res.status(500).send({message: err.message});
    }
}

exports.refresh_Token = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await userService.refresh_Token(userId);
        res.status(200).json(user);
    }catch(err) {
        res.status(500).send({message: err.message});
    }
}

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await userService.deleteUser(userId);
        res.status(200).json(user);
    }catch(err) {
        res.status(500).send({message: err.message});
    }
}