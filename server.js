require('dotenv').config();
require('./config/passport');
const express = require('express');
const path = require('path');
const passport = require('passport');
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
const authReset = require('./routes/authReset');
const commentRoutes = require('./routes/comments');

// Mount routes

app.use('/api/auth', authRoutes);
app.use('/api/auth', authReset);
app.use('/api/comments', commentRoutes);

const authController = require('./controllers/authController');

// TASKS
const tasksRouter = require('./routes/tasks');
app.use('/api/tasks', tasksRouter);

// workers
const workersRouter = require('./routes/workers');
app.use('/api/workers', workersRouter);

// expose GET /logout at top level
app.use('/', require('./routes/auth'));


// Route to serve the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'home.html'));
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
