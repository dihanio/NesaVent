const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  // Notification Preferences
  notifications: {
    email: {
      eventApproved: { type: Boolean, default: true },
      eventRejected: { type: Boolean, default: true },
      newOrder: { type: Boolean, default: true },
      withdrawalProcessed: { type: Boolean, default: true },
      withdrawalRejected: { type: Boolean, default: true },
      eventReminder: { type: Boolean, default: true }
    },
    push: {
      eventApproved: { type: Boolean, default: true },
      eventRejected: { type: Boolean, default: true },
      newOrder: { type: Boolean, default: true },
      withdrawalProcessed: { type: Boolean, default: true },
      withdrawalRejected: { type: Boolean, default: true },
      eventReminder: { type: Boolean, default: true }
    }
  },

  // Bank Accounts (multiple accounts support)
  bankAccounts: [{
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],

  // Email Templates (for mitra)
  emailTemplates: {
    orderConfirmation: {
      enabled: { type: Boolean, default: true },
      subject: { type: String, default: 'Konfirmasi Pemesanan Tiket - {{eventName}}' },
      body: { 
        type: String, 
        default: 'Terima kasih telah memesan tiket untuk event {{eventName}}. Tiket Anda: {{ticketCode}}'
      }
    },
    eventReminder: {
      enabled: { type: Boolean, default: true },
      subject: { type: String, default: 'Pengingat Event - {{eventName}}' },
      body: { 
        type: String, 
        default: 'Event {{eventName}} akan dimulai pada {{eventDate}}. Jangan lupa hadir!'
      },
      daysBefore: { type: Number, default: 1 }
    }
  },

  // Event Defaults (for quick event creation)
  eventDefaults: {
    kategori: { 
      type: String, 
      enum: ['musik', 'olahraga', 'teknologi', 'seni', 'pendidikan', 'bisnis', 'lainnya'],
      default: null
    },
    lokasi: { type: String, default: '' },
    durasi: { type: Number, default: 120 }, // in minutes
    reminderDays: { type: Number, default: 1 }
  }
}, {
  timestamps: true
});

// Index untuk performa
settingsSchema.index({ user: 1 });

module.exports = mongoose.model('Settings', settingsSchema);
