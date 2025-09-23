const researchCareerService = require('../services/researchCareer.service');

const generateRoadmap = async (req, res) => {
  try {
    const { careerName } = req.body;
    if (!careerName) {
      return res.status(400).json({ success: false, message: "Career name is required." });
    }
    const researchCareer = await researchCareerService.generateContentFromAI(careerName);
    res.status(200).json({
      success: true,
      message: "Research Career created successfully!",
      data: researchCareer
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

const getSuggestSkills = async (req, res) => {
  try {
    const { industry } = req.body;
    if (!industry) {
      return res.status(400).json({ success: false, message: "Industry is required." });
    }
    const suggestSkills = await researchCareerService.generateSuggestSkills(industry);
    res.status(200).json({
      success: true,
      message: "Suggest Skills created successfully!",
      data: suggestSkills
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  generateRoadmap,
  getSuggestSkills
}