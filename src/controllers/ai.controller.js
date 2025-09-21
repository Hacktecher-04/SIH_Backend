const aiModel = require('../models/ai.model');
const aiService = require('../services/ai.service');

exports.create = async (req, res) => {
    try {
        const { prompt } = req.body;
        const userId = req.user._id;
        const previosData = await aiModel.find({prompt});
        if (previosData.length > 0) {
            return res.status(200).json(previosData[0].response);
        }
        const response = await aiService(prompt);
        await aiModel.create({userId, prompt, response});
        res.status(200).json(response);
    } catch (error) {
        res.status(500).send({message: error.message});
    }
}

exports.getAndCleanMessages = async (req, res) => {
  try {
    const last20 = await aiModel.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const latest20Ids = last20.map(msg => msg._id);

    await aiModel.deleteMany({
      _id: { $nin: latest20Ids } 
    });

    res.status(200).json(last20.reverse());
  } catch (err) {
    console.error("Error fetching/deleting messages:", err);
    res.status(500).send({ message: err.message });
  }
};