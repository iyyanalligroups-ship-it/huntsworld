// routes/faqTopicRoutes.js
const express = require('express');
const router = express.Router();
const {
  createFaqTopic,
  getAllFaqTopics,
  getFaqTopicById,
  updateFaqTopic,
  deleteFaqTopic,
  getAllFaqTopicsForQuestions
} = require('../controllers/faqTopicController');

// Public or protected depending on your auth middleware
router.get('/fetch-all-faq-topics', getAllFaqTopics);
router.get('/fetch-all-faq-topics-for-questions', getAllFaqTopicsForQuestions);
router.get('/fetch-faq-topic-by-id/:id', getFaqTopicById);
router.post('/create-faq-topic', createFaqTopic);
router.put('/update-faq-topic/:id', updateFaqTopic);
router.delete('/delete-faq-topic/:id', deleteFaqTopic);

module.exports = router;
