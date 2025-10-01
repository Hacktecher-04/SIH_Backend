const { generateContentFromAI, generateData } = require('../services/aiRoadmap.service');
const Roadmap = require('../models/roadmap.model');
const User = require('../models/user.model');

const createRoadmap = async (goal, level, pace, userId) => {
  const roadmapDataFromAI = await generateContentFromAI(goal, level, pace);
  const completeRoadmapData = {
    ...roadmapDataFromAI,
    userId,
    inputGoal: goal,
    inputLevel: level,
    inputPace: pace,
  };
  const newRoadmap = await Roadmap.create(completeRoadmapData);
  await User.findByIdAndUpdate(userId, { activeRoadmapId: newRoadmap._id });
  return newRoadmap;
};

const getUserRoadmaps = async (userId) => {
  return await Roadmap.find({ userId }).select('title description createdAt');
};

const getRoadmapById = async (roadmapId, userId) => {
  const roadmap = await Roadmap.findById(roadmapId);
  if (!roadmap) {
    throw new Error("Roadmap not found.");
  }
  if (roadmap.userId.toString() !== userId.toString()) {
    throw new Error("You are not authorized to view this roadmap.");
  }
  return roadmap;
};

const getData = async (roadmapId, topicTitle) => {
  try {
    // Generate data from AI
    const generateContentFromAI = await generateData(topicTitle);
    if (!generateContentFromAI) {
      throw new Error("Failed to generate content from AI");
    }

    // Find roadmap
    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) throw new Error("Roadmap not found");

    // Loop through sections & topics
    roadmap.sections.forEach((section) => {
      section.topics = section.topics.map((t) => {
        if (t.topicTitle === topicTitle) {
          t.googleSearchQueries = generateContentFromAI.google.map(item => ({
            title: item.title,
            url: item.url,
            type: item.type
          }));

          t.videoResources = generateContentFromAI.youtube.map(item => ({
            title: item.title,
            url: item.url,
            type: item.type
          }));
        }
        return t;
      });
    });

    if (!roadmap.sections.some(section =>
      section.topics.some(topic => topic.topicTitle === topicTitle)
    )) {
      throw new Error(`Topic "${topicTitle}" not found in roadmap`);
    }

    // Save updated roadmap
    const updatedRoadmap = await roadmap.save();
    return {
      success: true,
      message: `Data successfully updated for topic "${topicTitle}"`,
      data: updatedRoadmap,
    };
  } catch (error) {
    throw new Error("Failed to save generated data: " + error.message);
  }
};


const deleteRoadmap = async (roadmapId, userId) => {
  const roadmap = await Roadmap.findById(roadmapId);
  if (!roadmap) {
    throw new Error("Roadmap not found.");
  }
  if (roadmap.userId.toString() !== userId.toString()) {
    throw new Error("You are not authorized to delete this roadmap.");
  }
  await Roadmap.findByIdAndDelete(roadmapId);
  return { message: "Roadmap deleted successfully." };
}

module.exports = {
  createRoadmap,
  getUserRoadmaps,
  getRoadmapById,
  getData,
  deleteRoadmap,
};