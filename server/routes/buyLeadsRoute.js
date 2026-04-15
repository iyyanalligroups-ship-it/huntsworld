const express = require('express');
const router = express.Router();
const { createBuyLead, getBuyLeads } = require('../controllers/buyLeadController');
const { authMiddleware } = require('../middleware/authMiddleware');
// POST: Create a BuyLead
router.post('/create-buylead', createBuyLead);

// GET: Retrieve BuyLeads for a user
router.get('/get-buyleads', authMiddleware, getBuyLeads);

module.exports = router;
