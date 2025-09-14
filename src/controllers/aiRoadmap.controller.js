const roadmapService = require('../services//aiRoadmap.service');

const generateRoadmap = async (req, res) => {
    try {
        const { goal, level, pace } = req.body;
        if (!goal || !level || !pace) {
            return res.status(400).json({ success: false, message: "Goal, level, and pace are required." });
        }

        const newRoadmap = await roadmapService.createRoadmap(goal, level, pace, req.user._id);

        res.status(201).json({
            success: true,
            message: "Roadmap created successfully!",
            data: { activeRoadmapId: newRoadmap._id }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllUserRoadmaps = async (req, res) => {
    try {
        const roadmaps = await roadmapService.getUserRoadmaps(req.user._id);
        res.status(200).json({
            success: true,
            message: "Roadmaps retrieved successfully.",
            data: { roadmaps }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const getSingleRoadmap = async (req, res) => {
    try {
        const { id } = req.params;
        const roadmap = await roadmapService.getRoadmapById(id, req.user._id);
        res.status(200).json({
            success: true,
            message: "Roadmap retrieved successfully.",
            data: roadmap
        });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

module.exports = {
    generateRoadmap,
    getAllUserRoadmaps,
    getSingleRoadmap,
};