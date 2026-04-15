const express = require("express");
const router = express.Router();
const grocerySellerController = require("../controllers/grocerySellerController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.get("/fetch-all-grocery-seller", grocerySellerController.getAllGrocerySellers);
router.get("/fetch-by-id-grocery-seller/:id", grocerySellerController.getGrocerySellerById);
router.get("/fetch-by-userid-grocery-seller/:id", grocerySellerController.getGrocerySellerByUserId);
router.post("/create-grocery-seller", grocerySellerController.createGrocerySeller);
router.post("/create-minimal-grocery", grocerySellerController.createMinimalGrocerySeller);
router.put("/update-grocery-seller/:id", grocerySellerController.updateGrocerySeller);
router.delete("/delete-grocery-seller/:id", grocerySellerController.deleteGrocerySeller);
router.post("/create-grocery-seller-with-role", grocerySellerController.createGrocerySellerWithRoleUpdate);
router.get("/fetch-all-base-member-details", grocerySellerController.getGrocerySellersForHomePage);
router.get("/fetch-member-type", authMiddleware, grocerySellerController.fetchMemberType);
router.delete('/deactivate-account/:user_id', grocerySellerController.deactivateGrocerySellerAccount);
router.patch('/mark-read/:id', grocerySellerController.markGroceryAsRead);
module.exports = router;
