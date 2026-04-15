const express = require('express');
const router = express.Router();
const { getBrands, createBrand, updateBrand, deleteBrand,getBrandsForLanding } = require('../controllers/brandController');


router.get('/fetch-all-brands', getBrands);
router.post('/add-brands', createBrand);
router.put('/update-brands/:id', updateBrand);
router.delete('/delete-brands/:id', deleteBrand);
router.get('/fetch-brands-for-landing', getBrandsForLanding);
module.exports = router;