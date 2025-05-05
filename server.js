require('dotenv').config();
const express = require('express');
const path = require('path');
const passport = require('passport');
require('./config/passport');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Session middleware for Passport
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Import routes
const authRoutes = require('./routes/auth');

// Mount routes
app.use('/api/auth', authRoutes);



// TASKS
const tasksRouter = require('./routes/tasks');
app.use('/api/tasks', tasksRouter);

// workers
const workersRouter = require('./routes/workers');
app.use('/api/workers', workersRouter);


// Route to serve the login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'login.html'));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/CTB')
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.log(err));

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
