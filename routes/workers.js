const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Task = require('../models/taskModel');

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

module.exports = router;