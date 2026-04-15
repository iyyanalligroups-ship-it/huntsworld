const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  time: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  markAsRead: {
    type: Boolean,
    default: false
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  comments: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },

  // ────────────────────────────────────────────────────────────────
  // New fields added below — everything above remains unchanged
  // ────────────────────────────────────────────────────────────────

  // Helps faster unread count queries (used for sidebar badge)
  isReadIndex: {   // ← optional helper index field (you can also just index markAsRead)
    type: Boolean,
    default: false,
    index: true,
    select: false   // not returned in normal queries unless needed
  },

  // Current workflow status — very useful for admins
  status: {
    type: String,
    enum: ['new', 'in-progress', 'responded', 'resolved', 'spam'],
    default: 'new',
    index: true
  },

  // If you later want to assign enquiry to specific admin / sub-admin
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },

  // Optional: where the enquiry came from (future-proof)
  source: {
    type: String,
    enum: ['website', 'app', 'admin', 'other'],
    default: 'website'
  }
}, {
  // Automatically add/update updatedAt field on every save
  timestamps: true
});

// If you want faster unread count queries, you can add this compound index
// (optional but recommended if you have thousands of contacts)
contactSchema.index({ markAsRead: 1, createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
