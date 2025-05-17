const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/userModel');
const { generateToken } = require('../config/jwt');
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
      isVerified: false, // Initial state as not verified
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    newUser.verificationToken = verificationToken;

    // Save the user to the database
    await newUser.save();

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const verificationUrl = `http://localhost:3000/api/auth/verify/${verificationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification',
      html: `<p>Hi ${name},</p>
             <p>Thank you for registering! Please click the link below to verify your email address:</p>
             <a href="${verificationUrl}">Verify Email</a>`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'User registered successfully. Please check your email for a verification link.' });

  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Route for email verification
router.get('/verify/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // Find the user by the verification token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    // Set the user's account as verified and remove the verification token
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Redirect to login page (or send a response)
    res.redirect('/pages/login.html');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
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
      return res.status(400).json({ message: 'User with this email not found.' });
    }

    // Check if the user's email is verified
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before logging in.' });
    }

    // Compare the password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    // Send a successful login response
    res.status(200).json({ 
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.name || user.displayName || 'User',
        email: user.email
      },
      redirectTo: '/pages/landing.html'
    });

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
      const { email, googleId, displayName, name, given_name, family_name } = googleProfile;

      // Determine the user's name, fallback to first and last name if displayName is empty
      let userName = displayName || `${given_name} ${family_name}`;
      if (!userName) {
        userName = 'User'; // Default name in case of missing name fields
      }

      let existingUser = await User.findOne({ email });

      // If the user doesn't exist, create a new user
      if (!existingUser) {
        existingUser = new User({
          googleId,
          email,
          displayName: userName,
          name: userName,
          isVerified: true
        });
        await existingUser.save();
      }

      // Successful login or registration, redirect to the landing page
      const token = generateToken(existingUser);

      res.redirect(`/pages/landing.html?token=${token}`);
    } catch (err) {
      console.log(err);
      res.redirect('/pages/login.html'); // Redirect to login page if an error occurs
    }
  }
);

router.get('/logout', (req, res, next) => {
  // Passport 0.6+ requires callback
  req.logout(err => {
    if (err) return next(err);
    // destroy server session
    req.session.destroy(err => {
      // clear the cookie generated by express-session
      res.clearCookie('connect.sid', { path: '/' });
      // if you want to return JSON (for an AJAX client):
      // return res.json({ ok: true });
      // otherwise redirect back to login page:
      return res.redirect('/pages/login.html');
    });
  });
});

module.exports = router;
