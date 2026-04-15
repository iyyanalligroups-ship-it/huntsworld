// Updated Merchant Routes: routes/merchantRoute.js
// Added new route for create-minimal-merchant

const express = require("express");
const router = express.Router();
const merchantController = require("../controllers/merchantController");

router.post("/create-merchant", merchantController.createMerchant);
router.post("/create-minimal-merchant", merchantController.createMinimalMerchant); // New route added
router.post('/check-banner-status', merchantController.checkUserBannerStatus);
router.post("/get-business-name", merchantController.getBusinessName); // New route added
router.post("/create-minimal-merchant-by-userid", merchantController.createMinimalMerchantByUserId);
router.post("/check-aadhar", merchantController.checkAadhar);
router.get("/fetch-all-merchants", merchantController.getAllMerchants);
router.get("/fetch-all-merchant-products", merchantController.getMerchantByEmailOrPhone);
router.get("/fetch-merchant-by-id/:id", merchantController.getMerchantById);
router.put("/update-merchant/:id", merchantController.updateMerchant);
router.delete("/delete-merchant/:id", merchantController.deleteMerchant);
router.get("/fetch-merchant-by-user-id", merchantController.getMerchantByUserId); // New route
router.get("/fetch-address-by-company-name", merchantController.getAddressByCompanyName);
router.get("/lookup-merchant-creation", merchantController.lookupUserForMerchantCreation);
router.get("/low-progress", merchantController.getLowProgressMerchants);

router.patch("/mark-read/:merchant_id", merchantController.markMerchantAsRead);
router.delete("/deactivate-account/:user_id", merchantController.deleteMerchant);

module.exports = router;
