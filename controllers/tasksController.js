const Task = require('../models/taskModel');
const User = require('../models/userModel');  
const { isFutureDate } = require('../public/js/dateUtils');
const { sendNotification } = require('../config/notificationHelper');
const Notification = require('../models/notificationModel');


exports.listTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    const tasks = await Task.find(filter)
      .populate('createdBy', 'name displayName email')
      .populate('assignedTo', 'name displayName email');

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'name displayName email')
      .populate('assignedTo', 'name displayName email');
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
    // Enforce future due dates:
    if (req.body.dueDate && !isFutureDate(req.body.dueDate)) {
      return res.status(400).json({ error: 'Due date must be in the future.' });
    }
    // 2) Normalize “assignedTo”:
    if (!taskData.assignedTo || taskData.assignedTo.trim() === '') {
      delete taskData.assignedTo;
    } else if (!/^[0-9a-fA-F]{24}$/.test(taskData.assignedTo)) {
      let assignedUser;
      if (taskData.assignedTo.includes('@')) {
        assignedUser = await User.findOne({ email: taskData.assignedTo });
      } else {
        // try both name and displayName
        assignedUser = await User.findOne({ name: taskData.assignedTo })
                    || await User.findOne({ displayName: taskData.assignedTo });
      }
      taskData.assignedTo = assignedUser ? assignedUser._id : undefined;
    }
    // 3) Create the task in MongoDB:
    const newTask = await Task.create(taskData);
    return res.status(201).json(newTask);

  } catch (err) {
    console.error('Error creating task:', err);
    return res
      .status(500)
      .json({ error: 'Failed to create task.', details: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const updateData = req.body;

    if (updateData.assignedTo && !/^[0-9a-fA-F]{24}$/.test(updateData.assignedTo)) {
      let assignedUser;
      if (updateData.assignedTo.includes('@')) {
        assignedUser = await User.findOne({ email: updateData.assignedTo });
      } else {
        assignedUser = await User.findOne({ name: updateData.assignedTo }) ||
                       await User.findOne({ displayName: updateData.assignedTo });
      }
      updateData.assignedTo = assignedUser ? assignedUser._id : undefined;
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true })
      .populate('createdBy', 'name displayName email')
      .populate('assignedTo', 'name displayName email');

    if (!updatedTask)
      return res.status(404).json({ error: 'Task not found.' });
      // 🔔 New “assignment” notification
    if (updateData.assignedTo) {
      // grab the assignee’s record so you can show their name/email if needed
      const assignee = await User.findById(updatedTask.assignedTo);

      const msg = `${req.user.name} (${req.user.email}) has assigned you the task '${updatedTask.title}'`;

      await sendNotification({
        recipient: assignee._id,
        sender:    req.user.id,
        task:      updatedTask._id,
        type:      'assignment',
        message:   msg,
        io: req.app.get('io')
      });
    }
    
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task.', details: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const deletedTask = await Task.findByIdAndDelete(taskId);
    if (!deletedTask)
      return res.status(404).json({ error: 'Task not found.' });

    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task.', details: err.message });
  }
};

