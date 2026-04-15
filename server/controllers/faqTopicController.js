// controllers/faqTopicController.js
const FaqTopic = require('../models/faqTopicModel');

// Create a new FAQ Topic
exports.createFaqTopic = async (req, res) => {
  try {
    const newTopic = await FaqTopic.create({
      ...req.body,
      createdBy: req.user?._id, // optional, if user is authenticated
    });
    res.status(201).json({ success: true,message:"FAQ Created Topic Successfully", data: newTopic });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all FAQ Topics (optionally filter by role or visibility)
exports.getAllFaqTopics = async (req, res) => {
  try {
    const { role, visible } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (visible) filter.isVisible = visible === 'true';

    const topics = await FaqTopic.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true,message:"Fetched FAQ Topic Successfully", data: topics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getAllFaqTopicsForQuestions = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { role: type } : {};

    const topics = await FaqTopic.find(filter);
    res.status(200).json({ success: true, message: "Fetched FAQ Topic Successfully", data: topics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get a single topic by ID
exports.getFaqTopicById = async (req, res) => {
  try {
    const topic = await FaqTopic.findById(req.params.id);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });
    res.status(200).json({ success: true, data: topic });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update topic
exports.updateFaqTopic = async (req, res) => {
  try {
    const updated = await FaqTopic.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Topic not found' });
    res.status(200).json({ success: true,message:"FAQ Topic Updated Successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete topic
exports.deleteFaqTopic = async (req, res) => {
  try {
    const deleted = await FaqTopic.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Topic not found' });
    res.status(200).json({ success: true, message: 'Topic deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
