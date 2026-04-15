const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/create-address", addressController.createAddress);
router.get("/fetch-all-address", addressController.getAddresses);

router.get("/fetch-address-by-id/:id", addressController.getAddressById);
router.put("/update-address/:userId/:selectedAddressId", addressController.updateAddress);
// router.put("/update-user-address/:userId", addressController.updateAddress);
router.delete("/delete-address-addressId-userId/:user_id/:selectedAddressId", addressController.deleteAddress);


// router.delete("/delete-address/:userId", addressController.deleteAddress);

router.get("/fetch-all-address-for-post-by-requirement", addressController.getAddressesForPostByRequirement);
router.get("/fetch-all-cities", addressController.getUniqueCities);
router.get("/fetch-seller-location-competitor", authMiddleware,addressController.getCompetitorProducts);
router.get("/fetch-address-by-id/:id", addressController.getAddressById);
//get all the country
router.get("/fetch-all-country", addressController.getCountriesGrouped);
router.get("/fetch-all-city", addressController.getCitiesGrouped);
router.get("/fetch-country-data/:country", addressController.getCountryData);
router.get("/grocery-seller-cities", addressController.getGrocerySellerCities);
router.get('/find-suppliers-by-region/:city', addressController.getSuppliersByCity);
router.post("/check-address-for-payment", addressController.checkUserAddressesForPayment);
module.exports = router;
