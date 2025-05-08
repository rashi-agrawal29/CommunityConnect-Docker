const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  task:      { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  message:   { type: String, required: true },
  type:      { type: String, enum: ['application', 'assignment', 'general'], default: 'general' },
  isRead:    { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
