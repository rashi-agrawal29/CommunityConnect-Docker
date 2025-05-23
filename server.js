require('dotenv').config();
require('./config/passport');
const express = require('express');
const path = require('path');
const passport = require('passport');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = socketIO(server); // bind Socket.IO to HTTP server

app.set('io', io); // make io available in req.app.get('io')

// Socket connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (userId) => {
    socket.join(userId); // join room by user ID
    console.log(`User ${userId} joined room ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

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
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const authReset = require('./routes/authReset');
const commentRoutes = require('./routes/comments');

// Mount routes

app.use('/api/admin', adminRoutes);
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

// Admin Panel
app.get('/admin_panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/pages/admin-login.html'));
});


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/CTB')
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.log(err));

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
