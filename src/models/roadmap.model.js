const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true }
}, { _id: false });

const topicSchema = new mongoose.Schema({
    topicTitle: { type: String, required: true },
    description: { type: String, required: true },
    durationEstimateHours: { type: Number, required: true },
    resources: [resourceSchema],
    prerequisites: [{ type: String }]
}, { _id: false });

const sectionSchema = new mongoose.Schema({
    sectionTitle: { type: String, required: true },
    order: { type: Number, required: true },
    topics: [topicSchema]
}, { _id: false });

const roadmapSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    sections: [sectionSchema],
    inputGoal: { type: String, required: true },
    inputLevel: { type: String, required: true },
    inputPace: { type: String, required: true },
}, {
    timestamps: true
});

module.exports = mongoose.model('Roadmap', roadmapSchema);