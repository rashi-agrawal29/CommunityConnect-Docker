const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Task = require('../models/taskModel');
const Notification = require('../models/notificationModel');
const { sendNotification } = require('../config/notificationHelper');
const authenticate = require('../middlewares/authMiddleware');

// GET /api/workers
// Returns a list of workers with their current active task (if any)
// A task is considered active if its status is NOT "Completed".
// GET /api/workers
router.get('/', async (req, res) => {
  try {
    // Find all workers
    const workers = await User.find()
      .select('name displayName email')
      .lean();

       // For each worker, count active tasks (status !== 'Completed')
    const workersWithStatus = await Promise.all(
      workers.map(async (worker) => {
        const activeTasks = await Task.find({
          assignedTo: worker._id,
          status: { $ne: 'Completed' }
        }).lean();

        return {
          ...worker,
          currentTaskCount: activeTasks.length
        };
      })
    );

    // console.log('Workers with status:', workersWithStatus); // Debug log
    res.json(workersWithStatus);
  } catch (err) {
    console.error('Error retrieving workers:', err);
    res.status(500).json({ error: 'Failed to get workers.', details: err.message });
  }
});

// PUT /api/workers/apply/:taskId
// Assigns the task to current user and notifies the creator
router.put('/apply/:taskId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.taskId;

    const task = await Task.findById(taskId).populate('createdBy');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    await task.save();

    const senderName = req.user.name || req.user.displayName || req.user.email || 'Someone';

    await sendNotification({
      recipient: task.createdBy._id,
      sender: userId,
      task: task._id,
      type: 'application',
      message: `${senderName} (${req.user.email}) has applied for your task '${task.title}'`,
      io: req.app.get('io')
    });    

    res.json({ message: 'Task applied successfully', task });
  } catch (err) {
    console.error('Apply task error:', err);
    res.status(500).json({ error: 'Failed to apply for task.', details: err.message });
  }
});

// POST /api/workers/notify
router.post('/notify', authenticate, async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    const notification = await Notification.create({
      recipient: recipientId,
      sender: req.user.id,
      message,
      type: 'application'
    });
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send notification', details: err.message });
  }
});

// GET /api/workers/notifications
// Fetches notifications for the current user
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notes = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message });
  }
});

// DELETE /api/workers/notifications
// Clears all notifications for the current user
router.delete('/notifications', authenticate, async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.id });
    res.json({ message: 'All notifications cleared successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear notifications', details: err.message });
  }
});

module.exports = router;