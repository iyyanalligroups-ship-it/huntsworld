const Contact = require('../models/contactModel');
const subscriptionPlanSendEmail = require('../utils/subscriptionPlanSendEmail');
const mongoose = require('mongoose');

// IMPORTANT: Fix the import — use default require + call the function
const contactSocket = require('../socket/contactNotificationSocket');

exports.createContact = async (req, res) => {
  try {
    const { name, email, phone, time, date } = req.body;

    if (!name || !email || !phone || !time || !date) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const contact = new Contact({
      name,
      email,
      phone,
      time,
      date
    });

    await contact.save();

    // ── Real-time notification ────────────────────────────────
    // Get the helpers by passing the namespace (assuming global.io is set)
    const { notifyNewContact } = contactSocket(global.io.of('/contacts'));
    await notifyNewContact(contact);

    res.status(201).json({
      message: 'Contact form submitted successfully',
      data: contact
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all contacts (no change needed)
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({ message: 'Contacts retrieved successfully', data: contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a contact by ID (no change needed)
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.status(200).json({ message: 'Contact retrieved successfully', data: contact });
  } catch (error) {
    console.error('Error fetching contact by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a contact (no change needed)
exports.updateContact = async (req, res) => {
  try {
    const { name, email, phone, time, date } = req.body;
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    contact.name = name || contact.name;
    contact.email = email || contact.email;
    contact.phone = phone || contact.phone;
    contact.time = time || contact.time;
    contact.date = date || contact.date;

    await contact.save();
    res.status(200).json({ message: 'Contact updated successfully', data: contact });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a contact (no change needed)
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.status(200).json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getContactsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, filter = 'all' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let dateFilter = {};
    const now = new Date();

    switch (filter) {
      case 'today':
        dateFilter = {
          createdAt: {
            $gte: new Date(now.setHours(0, 0, 0, 0)),
            $lte: new Date(now.setHours(23, 59, 59, 999)),
          },
        };
        break;
      case 'yesterday':
        const yesterday = new Date(now.setDate(now.getDate() - 1));
        dateFilter = {
          createdAt: {
            $gte: new Date(yesterday.setHours(0, 0, 0, 0)),
            $lte: new Date(yesterday.setHours(23, 59, 59, 999)),
          },
        };
        break;
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        dateFilter = {
          createdAt: { $gte: new Date(weekStart.setHours(0, 0, 0, 0)) },
        };
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { $gte: monthStart } };
        break;
      default:
        dateFilter = {};
    }

    const contacts = await Contact.find(dateFilter)
      .sort({ markAsRead: 1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Contact.countDocuments(dateFilter);
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      contacts,
      totalPages,
      currentPage: pageNum,
      totalContacts: total,
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark contact as read/unread + real-time update
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { markAsRead } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid contact ID' });
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { markAsRead },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // ── Real-time: Update unread count for all admins ──────────────
    const { updateUnreadCount } = contactSocket(global.io.of('/contacts'));
    await updateUnreadCount();

    res.status(200).json({
      message: markAsRead ? 'Marked as read' : 'Marked as unread',
      data: contact
    });
  } catch (error) {
    console.error('Error updating read status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send email and update contact (no real-time needed here unless you want)
exports.sendEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid contact ID' });
    }

    const contact = await Contact.findById(id);
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    // Prepare email content with inline styles (unchanged)
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 20px auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <div style="background: #007bff; color: #fff; padding: 10px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Contact Form Response</h1>
          </div>
          <div style="padding: 20px;">
            <p style="margin: 10px 0;">Dear ${contact.name},</p>
            <p style="margin: 10px 0;">Thank you for reaching out to us. Below are the details we received from you:</p>
            <p style="margin: 10px 0;"><strong style="color: #007bff;">Name:</strong> ${contact.name}</p>
            <p style="margin: 10px 0;"><strong style="color: #007bff;">Email:</strong> ${contact.email}</p>
            <p style="margin: 10px 0;"><strong style="color: #007bff;">Phone:</strong> ${contact.phone}</p>
            <p style="margin: 10px 0;"><strong style="color: #007bff;">Submission Date:</strong> ${new Date(contact.date).toLocaleDateString()}</p>
            <p style="margin: 10px 0;"><strong style="color: #007bff;">Submission Time:</strong> ${contact.time}</p>
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin-top: 20px; border-radius: 4px;">
              <p style="margin: 10px 0;"><strong style="color: #007bff;">Our Response:</strong></p>
              <p style="margin: 10px 0;">${comments || 'No additional comments provided.'}</p>
            </div>
          </div>
          <div style="text-align: center; padding: 10px; font-size: 12px; color: #777; border-top: 1px solid #eee; margin-top: 20px;">
            <p style="margin: 5px 0;">Best regards,</p>
            <p style="margin: 5px 0;">Your Company Name</p>
            <p style="margin: 5px 0;">
              <a href="mailto:${process.env.USER_EMAIL}" style="color: #007bff; text-decoration: none;">Contact Us</a> |
              <a href="https://yourcompany.com" style="color: #007bff; text-decoration: none;">Visit Our Website</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await subscriptionPlanSendEmail(contact.email, 'Contact Form Response', htmlContent);

    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { emailSent: true, comments },
      { new: true }
    );

    res.status(200).json(updatedContact);
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
};
