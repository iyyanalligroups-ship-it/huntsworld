// Backend: controllers/newsController.js
const News = require('../models/newsModel');

exports.getAllNews = async (req, res) => {
  try {
    const news = await News.find().sort({ startDate: -1 });
    res.status(200).json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInProgressNews = async (req, res) => {
  try {
    const now = new Date();
    const news = await News.find({
      status: 'in-progress',
      endDate: { $gt: now },
    }).sort({ startDate: -1 });
    res.status(200).json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createNews = async (req, res) => {
  const news = new News(req.body);
  try {
    const savedNews = await news.save();
    res.status(201).json(savedNews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const updatedNews = await News.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedNews) {
      return res.status(404).json({ message: 'News not found' });
    }
    res.status(200).json(updatedNews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const deletedNews = await News.findByIdAndDelete(req.params.id);
    if (!deletedNews) {
      return res.status(404).json({ message: 'News not found' });
    }
    res.status(200).json({ message: 'News deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};