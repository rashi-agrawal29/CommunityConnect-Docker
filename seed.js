const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/userModel');
const Task = require('./models/taskModel');

mongoose.connect('mongodb://localhost:27017/CTB', )
  .then(async () => {
    // Clear previous data
    await User.deleteMany({});
    await Task.deleteMany({});

    // Hash password
    const password = await bcrypt.hash('password123', 10);

    // Create admin user1
    const user1 = await User.create({
      name: 'User1',
      email: 'user1@example.com',
      password: password,
      isVerified: true
    });

    // Create worker user2
    const user2 = await User.create({
      name: 'User2',
      email: 'user2@example.com',
      password: password,
      isVerified: true
    });

    // Sample tasks assigned to the worker
    const tasks = [
      {
        title: "Task 1: Fix Bug",
        description: "Fix the login bug on the platform.",
        image: "images/task1.jpg",
        link: "http://example.com/task1",
        dueDate: new Date(Date.now() + 86400000),
        status: "",
        createdBy: user1._id,
        assignedTo: user2._id
      },
      {
        title: "Task 2: Develop Feature",
        description: "Build the new dashboard feature.",
        image: "images/task2.jpg",
        link: "http://example.com/task2",
        dueDate: new Date(Date.now() + 2 * 86400000),
        status: "",
        createdBy: user1._id,
        assignedTo: user2._id
      }
    ];

    await Task.insertMany(tasks);
    console.log("Seed data inserted!");
    mongoose.connection.close();
  })
  .catch(err => console.log(err));
