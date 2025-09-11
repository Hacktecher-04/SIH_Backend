const mongoose = require('mongoose');
const bcrypt = require('bcrypt')

const otpSchema = mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    }
},{timestamps: true})

otpSchema.pre('save', async function (next) {
    if (this.isModified('otp')) {
        this.otp = await bcrypt.hash(this.otp, 10)
    } 
    next();
})

otpSchema.methods.compareOtp = async function(candidateOtp) {
    return await bcrypt.compare(candidateOtp, this.otp);
}

const otpModel = mongoose.model('Otp', otpSchema);

module.exports = otpModel;