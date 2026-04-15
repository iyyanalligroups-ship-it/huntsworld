// routes/faqQuestionRoutes.js
const express = require('express');
const router = express.Router();
const {
  createFaqQuestion,
  getAllFaqQuestions,
  getFaqQuestionById,
  updateFaqQuestion,
  deleteFaqQuestion,
  getSellerFaqs,
  getBuyerFaqs,
  getGeneralFaqs,     // ✅ Added
  getStudentFaqs,     // ✅ Added
  getBaseMemberFaqs,  // ✅ Added
} = require('../controllers/faqQuestionController');

// 📖 Get all questions (filtered)
router.get('/fetch-all-faq-questions', getAllFaqQuestions);

// 🎯 Role-specific FAQ endpoints (grouped by topic)
router.get('/fetch-all-faq-questions-for-buyer', getBuyerFaqs);
router.get('/fetch-all-faq-questions-for-seller', getSellerFaqs);
router.get('/fetch-all-faq-questions-for-general', getGeneralFaqs);    // ✅ Added
router.get('/fetch-all-faq-questions-for-student', getStudentFaqs);    // ✅ Added
router.get('/fetch-all-faq-questions-for-baseMember', getBaseMemberFaqs); // ✅ Added

// ✏️ CRUD operations
router.get('/fetch-all-faq-questions-by-id/:id', getFaqQuestionById);
router.post('/create-faq-question', createFaqQuestion);
router.put('/update-faq-questions/:id', updateFaqQuestion);
router.delete('/delete-faq-questions/:id', deleteFaqQuestion);

module.exports = router;
