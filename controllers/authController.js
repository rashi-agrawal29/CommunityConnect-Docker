const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'No account with that email address exists.' });
    }
    // Generate a reset token (for example, a 20-byte random string in hex)
    const resetToken = crypto.randomBytes(20).toString('hex');
    // Set token and expiry (e.g., 1 hour from now)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Construct the reset URL (adjust the hostname as needed)
    const resetUrl = `http://${req.headers.host}/pages/reset-password.html?token=${resetToken}`;

    
    // Configure nodemailer (this is an example using Gmail; adjust settings as needed)
    let transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'thames3128@gmail.com',  // Replace with your email
        pass: 'hipj pguq dzwm woit'           // Replace with your email password or app-specific password
      }
    });

    const mailOptions = {
      to: user.email,
      from: 'passwordreset@communitytaskboard.com',
      subject: 'Community Task Board Password Reset',
      text: `You are receiving this because you (or someone else) requested a password reset for your account.\n\n` +
            `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
            `${resetUrl}\n\n` +
            `If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    // Send the email
    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error('Error sending mail:', err);
        return res.status(500).json({ error: 'Error sending reset email.' });
      }
      res.json({ message: 'An e-mail has been sent with further instructions.' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process forgot password request.', details: err.message });
  }
};;

exports.resetPassword = async (req, res) => {
  try {
    // Find user by token and check if token is still valid (not expired)
    const user = await User.findOne({ 
      resetPasswordToken: req.params.token, 
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }
    
    // Set the new password from req.body.password (you may also want to verify confirmation)
    user.password = req.body.password; // The pre-save hook will hash the password
    // Clear the reset token and expiry
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    // Optionally, you can automatically log the user in or send a confirmation email
    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password.', details: err.message });
  }
};
