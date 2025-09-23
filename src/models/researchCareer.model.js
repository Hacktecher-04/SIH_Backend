const mongoose = require('mongoose');

const researchCareerSchema = new mongoose.Schema({
    userId: {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    career_title: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    key_responsibilities: [
        {
            type: String,
            required: true
        }
    ],
    core_skills : [
        {
            type : String,
            required : true
        }
    ],
    deep_dive_url : {
        type : String,
        required : true
    }
})

const researchCareerModel = mongoose.model('ResearchCareer', researchCareerSchema);

module.exports = researchCareerModel;