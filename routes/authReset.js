const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const path = require('path');


// Route to initiate a forgot password request
router.post('/forgot', authController.forgotPassword);

// Routes to show reset form and process new password:
// Depending on your app, you might have a GET to verify the token and then POST to submit.
router.post('/reset/:token', authController.resetPassword);

// GET route to render the reset password form
router.get('/reset/:token', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'pages', 'reset-password.html'));
  });
  
  // POST route to handle form submission with new password
  // router.post('/reset/:token', async (req, res) => {
  //   const token = req.params.token;
  //   const { newPassword } = req.body;
  
  //   // Validate token and update password logic here
  
  //   res.send('Password has been reset successfully.');
  // });
module.exports = router;
