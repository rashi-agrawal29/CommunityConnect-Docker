const Task = require('../models/taskModel');
const User = require('../models/userModel');  // Import the User model



exports.listTasks = async (req, res) => {
  try {
    let filter = {};
    if (req.query.assignedTo) {
      filter.assignedTo = req.query.assignedTo;
    }
    const tasks = await Task.find(filter)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks.' });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email');
    if (!task)
       return res.status(404).json({ error: 'Task not found.' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task.' });
  }
};

exports.createTask = async (req, res) => {
  try {
    // 1) Build the base payload, including who created it:
    const taskData = { ...req.body, createdBy: req.user.id };

    // 3) Normalize “assignedTo”:
    if (!taskData.assignedTo || taskData.assignedTo.trim() === '') {
      // completely unassigned: drop the field
      delete taskData.assignedTo;
    } else if (!/^[0-9a-fA-F]{24}$/.test(taskData.assignedTo)) {
      // not an ObjectId → look up by email or username
      const assignedUser = taskData.assignedTo.includes('@')
        ? await User.findOne({ email: taskData.assignedTo })
        : await User.findOne({ username: taskData.assignedTo });
      taskData.assignedTo = assignedUser ? assignedUser._id : undefined;
    }

    // 4) Actually create the task in Mongo:
    const newTask = await Task.create(taskData);

    // 5) Broadcast event so your client’s socket listeners will fire
    const io = req.app.get('io');
    io.emit('task:created', newTask);

    // 6) Return the new task
    return res.status(201).json(newTask);

  } catch (err) {
    console.error('Error creating task:', err);
    return res
      .status(500)
      .json({ error: 'Failed to create task.', details: err.message });
  }
};


