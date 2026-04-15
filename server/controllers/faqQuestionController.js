// controllers/faqQuestionController.js
const FaqQuestion = require('../models/faqQuestionModel');

// Create a new FAQ question
const createFaqQuestion = async (req, res) => {
  try {
    const newQuestion = await FaqQuestion.create({
      ...req.body,
      askedBy: req.user?._id, // Optional: if user is logged in
    });
    res.status(201).json({ success: true, message: "Questions Created Successfully", data: newQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all FAQ questions (optional filter by topic, role, published)
const getAllFaqQuestions = async (req, res) => {
  try {
    const { topicId, role, isPublished } = req.query;
    const filter = {};
    if (topicId) filter.topicId = topicId;
    if (role) filter.role = role;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';

    const questions = await FaqQuestion.find(filter)
      .populate('topicId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: "Fetched Questions Successfully", data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single FAQ question by ID
const getFaqQuestionById = async (req, res) => {
  try {
    const question = await FaqQuestion.findById(req.params.id).populate('topicId', 'title');
    if (!question) {
      return res.status(404).json({ success: false, message: 'FAQ question not found' });
    }
    res.status(200).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a FAQ question
const updateFaqQuestion = async (req, res) => {
  try {
    const updated = await FaqQuestion.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        answeredBy: req.body.answer ? req.user?._id : undefined,
        answeredAt: req.body.answer ? new Date() : undefined,
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: 'FAQ question not found' });
    }
    res.status(200).json({ success: true, message: "Questions Updated Successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a FAQ question
const deleteFaqQuestion = async (req, res) => {
  try {
    const deleted = await FaqQuestion.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'FAQ question not found' });
    }
    res.status(200).json({ success: true, message: 'FAQ question deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ BUYER FAQs - Grouped by topic
const getBuyerFaqs = async (req, res) => {
  try {
    const questions = await FaqQuestion.find({
      role: 'buyer',
      answer: { $ne: "" },
      isPublished: true
    })
      .populate("topicId", "title")
      .sort({ createdAt: -1 });

    const groupedFaqs = groupByTopic(questions);
    res.status(200).json({ success: true, message: "Buyer FAQs fetched", data: groupedFaqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ SELLER FAQs - Grouped by topic
const getSellerFaqs = async (req, res) => {
  try {
    const questions = await FaqQuestion.find({
      role: 'seller',
      answer: { $ne: "" },
      isPublished: true
    })
      .populate("topicId", "title")
      .sort({ createdAt: -1 });

    const groupedFaqs = groupByTopic(questions);
    res.status(200).json({ success: true, message: "Seller FAQs fetched", data: groupedFaqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GENERAL FAQs - Grouped by topic
const getGeneralFaqs = async (req, res) => {
  try {
    const questions = await FaqQuestion.find({
      role: 'general',
      answer: { $ne: "" },
      isPublished: true
    })
      .populate("topicId", "title")
      .sort({ createdAt: -1 });

    const groupedFaqs = groupByTopic(questions);
    res.status(200).json({ success: true, message: "General FAQs fetched", data: groupedFaqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ STUDENT FAQs - Grouped by topic
const getStudentFaqs = async (req, res) => {
  try {
    const questions = await FaqQuestion.find({
      role: 'student',
      answer: { $ne: "" },
      isPublished: true
    })
      .populate("topicId", "title")
      .sort({ createdAt: -1 });

    const groupedFaqs = groupByTopic(questions);
    res.status(200).json({ success: true, message: "Student FAQs fetched", data: groupedFaqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ BASEMEMBER FAQs - Grouped by topic
const getBaseMemberFaqs = async (req, res) => {
  try {
    const questions = await FaqQuestion.find({
      role: 'baseMember',
      answer: { $ne: "" },
      isPublished: true
    })
      .populate("topicId", "title")
      .sort({ createdAt: -1 });

    const groupedFaqs = groupByTopic(questions);
    res.status(200).json({ success: true, message: "Base Member FAQs fetched", data: groupedFaqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🟢 Helper function - Groups FAQs by topic title
function groupByTopic(questions) {
  const faqMap = {};
  questions.forEach((faq) => {
    const topicTitle = faq.topicId?.title || 'Uncategorized';
    if (!faqMap[topicTitle]) {
      faqMap[topicTitle] = [];
    }
    faqMap[topicTitle].push({
      _id: faq._id,
      question: faq.question,
      answer: faq.answer,
    });
  });
  return faqMap;
}

module.exports = {
  createFaqQuestion,
  getAllFaqQuestions,
  getFaqQuestionById,
  updateFaqQuestion,
  deleteFaqQuestion,
  getBuyerFaqs,
  getSellerFaqs,
  getGeneralFaqs,
  getStudentFaqs,
  getBaseMemberFaqs,
};
