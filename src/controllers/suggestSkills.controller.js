const researchCareerService = require('../services/researchCareer.service');
const suggestSkillsModel = require('../models/suggestSkills.model')

const createSuggestSkills = async (req, res) => {
    try {
        const { industry } = req.body;
        const userId = req.user._id;
        if (!industry) {
            return res.status(400).json({ success: false, message: "Industry is required." });
        }
        const suggestSkills = await researchCareerService.generateSuggestSkills(industry);
        if (!suggestSkills) {
            res.status(400).json({ success: false, message: "Something went wrong" })
        }
        suggestSkills.userId = userId;
        const existingSuggestSkills = await suggestSkillsModel.create(suggestSkills)
        res.status(200).json({
            success: true,
            data: existingSuggestSkills
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
}

const getSuggestSkills = async (req, res) => {
    try {
        const userId = req.user._id;
        const suggestSkills = await suggestSkillsModel.find({ userId });
        res.status(200).json({
            success: true,
            message: "Research Career retrieved successfully!",
            data: suggestSkills
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

const getSuggestSkillsId = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ success: false, message: "Id is required." });
        }
        const suggestSkills = await suggestSkillsModel.findOne({ userId, _id: id });
        if (!suggestSkills) {
            throw new Error("research career not found");
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

const deleteSuggestSkills = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ success: false, message: "Id is required." });
        }
        await suggestSkillsModel.findOneAndDelete({ userId, _id: id });
        res.status(200).json({
            success: true,
            message: "Research Career deleted successfully!",
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = {
    createSuggestSkills,
    getSuggestSkills,
    getSuggestSkillsId,
    deleteSuggestSkills
}