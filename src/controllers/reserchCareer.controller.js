const researchCareerService = require('../services/researchCareer.service');
const researchCareerModel = require('../models/researchCareer.model');

const generateResearchCareer = async (req, res) => {
  try {
    const { careerName } = req.body;
    if (!careerName) {
      return res.status(400).json({ success: false, message: "Career name is required." });
    }
    const researchCareer = await researchCareerService.generateContentFromAI(careerName);
    const userId = req.user._id;
    researchCareer.userId = userId;
    const existingResearchCareer = await researchCareerModel.create(researchCareer)
    res.status(200).json({
      success: true,
      message: "Research Career created successfully!",
      data: existingResearchCareer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

const getResearhCareer = async (req, res) => {
  try {
    const userId = req.user._id;
    const researchCareer = await researchCareerModel.find({ userId });
    res.status(200).json({
      success: true,
      message: "Research Career retrieved successfully!",
      data: researchCareer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getResearhCareerId = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: "Id is required." });
    }
    const researchCareer = await researchCareerModel.findOne({ userId, _id: id });
    if (!researchCareer) {
      throw new Error("research career not found");
    }
    res.status(200).json({
      success : true, 
      data : researchCareer
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const deleteResearchCareer = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: "Id is required." });
    }
    await researchCareerModel.findOneAndDelete({ userId, _id: id });
    res.status(200).json({
      success: true,
      message: "Research Career deleted successfully!",
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  generateResearchCareer,
  getResearhCareer,
  getResearhCareerId,
  deleteResearchCareer
}