// Backend: routes/news.js (Assuming Express router)
const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// GET all news (for admin)
router.get('/fetch-all-news', newsController.getAllNews);

// GET in progress news filtered by endDate > now (for home page)
router.get('/inprogress', newsController.getInProgressNews);

// POST create news (for admin)
router.post('/add-news', newsController.createNews);

// PUT update news by ID (for admin)
router.put('/update-news/:id', newsController.updateNews);

// DELETE news by ID (for admin)
router.delete('/delete-news/:id', newsController.deleteNews);

module.exports = router;