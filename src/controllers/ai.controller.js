const aiModel = require('../models/ai.model');

exports.create = async (prompt) => {
    try {
        const previosData = await aiModel.find({prompt});
        if (previosData.length > 0) {
            return previosData[0].response;
        }
        const response = await aiService(prompt);
        res.status(200).json(response);
        await aiModel.create({userId, prompt, response});
    } catch (error) {
        res.status(500).send({message: error.message});
    }
}

exports.getAndCleanMessages = async (req, res) => {
  try {
    const last20 = await Message.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const latest20Ids = last20.map(msg => msg._id);

    await Message.deleteMany({
      _id: { $nin: latest20Ids } 
    });

    res.status(200).json(last20.reverse());
  } catch (err) {
    console.error("Error fetching/deleting messages:", err);
    res.status(500).send({ message: err.message });
  }
};