const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");

// Create a new contact
router.post("/create-contact", contactController.createContact);

// Get all contacts
router.get("/fetch-all-contact", contactController.getContacts);

// Get a contact by ID
router.get("/fetch-contact-by-id/:id", contactController.getContactById);

// Update a contact
router.put("/update-contact-by-id/:id", contactController.updateContact);

// Delete a contact
router.delete("/delete-contact-by-id/:id", contactController.deleteContact);

router.get("/fetch-all-contacts-for-admin", contactController.getContactsForAdmin);

router.patch("/mark-as-read/:id", contactController.markAsRead);

router.patch("/send-email/:id", contactController.sendEmail);

module.exports = router;
