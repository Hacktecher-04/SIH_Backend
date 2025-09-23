const mongoose = require('mongoose');

const suggestSkillsSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    title : {
        type : String, 
        required : true
    },
    foundational_skills : {
        description : {
            type : String,
            required : true
        },
        tags : [
            {
                type : String,
                required : true
            }
        ]
    },
    rising_stars : {
        description : {
            type : String,
            required : true
        },
        tags : [
            {
                type : String,
                required : true
            }
        ]
    }
})

const suggestSkillsModel = mongoose.model('SuggestSkills', suggestSkillsSchema);

module.exports = suggestSkillsModel;