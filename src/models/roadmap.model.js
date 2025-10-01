const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, default: "article" }
}, { _id: false });

const videoResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, default: "video" }
}, { _id: false });

const topicSchema = new mongoose.Schema({
  topicTitle: { type: String, required: true },
  durationEstimateHours: { type: Number, default: 0 },
  googleSearchQueries: { type: [resourceSchema], default: [] }, // ✅ now stores objects
  videoResources: { type: [videoResourceSchema], default: [] }, // ✅ now stores objects
  prerequisites: { type: [String], default: [] },
  resources: { type: [String], default: [] }
}, { _id: false });


const sectionSchema = new mongoose.Schema({
    sectionTitle: { type: String, required: true },
    order: { type: Number, required: true },
    topics: [topicSchema],
    isMiniProject: { type: Boolean, default: false }
}, { _id: false });

const roadmapSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    sections: [sectionSchema],
    inputGoal: { type: String, required: true },
    inputLevel: { type: String, required: true },
    inputPace: { type: String, required: true },
}, {
    timestamps: true
});

module.exports = mongoose.model('Roadmap', roadmapSchema);