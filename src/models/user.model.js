const mongoose = require('mongoose');
const bcrypt = require('bcrypt')

const userSchema = mongoose.Schema({
    fullName: {
        firstName: {
            type: String,
            required : true
        },
        lastName: {
            type : String,
        }
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    profilePicture: {
        type : String,
        default: ""
    },
    role: {
        type: String,
        required: true,
        enum : ['user','mentor','admin', 'gov'],
        default : 'user'
    },
    email : {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function() { return !this.googleId && !this.githubId && !this.linkedinId; }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    githubId: {
        type: String,
        unique: true,
        sparse: true
    },
},{timestamps : true})

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10)
    } 
    next();
})

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;