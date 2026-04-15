const router = require("express").Router();
const helpController = require("../controllers/helpRequestController");


router.post("/create", helpController.createHelpRequest);
router.get("/all", helpController.getHelpRequests);
router.get("/my-requests", helpController.getMyHelpRequests);
router.put("/pick/:id", helpController.pickHelpRequest);
router.put("/update/:id", helpController.updateHelpRequest);
router.delete("/delete/:id", helpController.deleteHelpRequest);
router.put("/close/:id", helpController.closeHelpRequest);
// routes/help.routes.js
router.put("/exchange/:id", helpController.exchangeHelpRequest);

module.exports = router;
