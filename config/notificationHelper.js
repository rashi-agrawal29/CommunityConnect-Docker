const Notification = require('../models/notificationModel');

async function sendNotification({ recipient, sender, task, message, type = 'general', io }) {
  const notification = await Notification.create({
    recipient,
    sender,
    task,
    message,
    type
  });

  if (io) {
    io.to(recipient.toString()).emit('newNotification', notification);
  }

  return notification;
}

module.exports = { sendNotification };
