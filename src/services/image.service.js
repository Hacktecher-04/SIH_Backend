const imageKit = require('../utils/image')

exports.uploadImage = async (userId, file) => {
    return new Promise((resolve, reject) => {
        imageKit.upload(
            {
                file: file.buffer,
                fileName: `${userId}-${Date.now()}`,
                folder: 'SIH/user_profile_pictures',
                useUniqueFileName: true,
            },
            (error, result) => {
                if (error) {
                    console.log(error);
                    return reject(error);
                }
                resolve(result);
            }
        );
    });
};