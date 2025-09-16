const generateContentFromAI = require('../services/aiRoadmap.service');
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
  console.log(roadmap.userId.toString());
  console.log(userId);
  if (roadmap.userId.toString() !== userId.toString()) {
    throw new Error("You are not authorized to view this roadmap.");
  }

  return roadmap;
};

module.exports = {
  createRoadmap,
  getUserRoadmaps,
  getRoadmapById,
};