const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Task = require('../models/taskModel');
const authenticate = require('../middlewares/authMiddleware');

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const requestingUser = req.user;

    // Only admins can access this
    if (!requestingUser.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const users = await User.find().select('name email isVerified isAdmin displayName');
    const tasks = await Task.find().populate('assignedTo', 'name displayName').select('title assignedTo status dueDate');

    res.json({ users, tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
