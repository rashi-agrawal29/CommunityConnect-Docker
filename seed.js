const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/userModel');
const Task = require('./models/taskModel');
const Notification = require('./models/notificationModel');
const Comment = require('./models/commentModel');

mongoose.connect('mongodb://localhost:27017/CTB')
  .then(async () => {
    // Clear previous data
    await User.deleteMany({});
    await Task.deleteMany({});
    await Notification.deleteMany({});
    await Comment.deleteMany({});

    // Hash password
    const password = await bcrypt.hash('password123', 10);

    // Create users
    const user1 = await User.create({
      name: 'User1',
      email: 'user1@example.com',
      password: password,
      isVerified: true
    });

    const user2 = await User.create({
      name: 'User2',
      email: 'user2@example.com',
      password: password,
      isVerified: true
    });

    // Create tasks
    const tasks = await Task.insertMany([
      {
        title: "Task 1: Fix Bug",
        description: "Fix the login bug on the platform.",
        dueDate: new Date(Date.now() + 86400000),
        createdBy: user1._id,
        assignedTo: user2._id
      },
      {
        title: "Task 2: Develop Feature",
        description: "Build the new dashboard feature.",
        dueDate: new Date(Date.now() + 2 * 86400000),
        createdBy: user1._id,
        assignedTo: user2._id
      }
    ]);

    // Create notifications
    await Notification.insertMany([
      {
        recipient: user2._id,
        sender: user1._id,
        task: tasks[0]._id,
        message: 'You have been assigned to Task 1.',
        type: 'assignment'
      }
    ]);

    // Create comments
    await Comment.insertMany([
      {
        description: "Can you extend the due date by 3 days?",
        createdBy: user2._id,
        taskId: tasks[0]._id
      }
    ]);

    console.log("Seed data inserted!");
    mongoose.connection.close();
  })
  .catch(err => console.error(err));
