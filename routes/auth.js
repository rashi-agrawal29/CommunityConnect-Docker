const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('../model/User');
const router = express.Router();


// Google login route (triggers Google OAuth)
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Route for the registration page
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      displayName: name,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully', redirectTo: '/pages/landing.html' });

  } catch (err) {
    console.error('Error during registration:', err); 
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Route for the login page
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Set the session
    req.session.userId = user._id; // Store user ID in the session

    // Login successful, you can set a session or JWT here if needed
    res.status(200).json({ message: 'Login successful', redirectTo: '/pages/landing.html' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



// Google OAuth callback route (after user authentication)
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/pages/login.html',
  }),
  async function (req, res) {
    try {
      const googleProfile = req.user; // User's Google profile data
      const { email, displayName, googleId } = googleProfile;

      // Check if the user already exists in the database by email
      let existingUser = await User.findOne({ email });

      // If the user doesn't exist, create a new user
      if (!existingUser) {
        existingUser = new User({
          googleId,
          email,
          displayName,
          name: displayName, // Store the display name from Google
        });
        await existingUser.save();
      }

      // Successful login or registration, redirect to the landing page
      res.redirect('/pages/landing.html');
    } catch (err) {
      console.log(err);
      res.redirect('/pages/login.html'); // Redirect to login page if an error occurs
    }
  }
);



module.exports = router;
