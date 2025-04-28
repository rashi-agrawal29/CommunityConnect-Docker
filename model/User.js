const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: String,
  displayName: String, // Used for Gmail users
  email: { type: String, required: true, unique: true },
  password: String, // store hashed password for normal registration
  name: { type: String, required: true }, // name
  isVerified: { type: Boolean, default: false }, // Verify if the email is confirmed
  verificationToken: { type: String }, // Store the verification token
});

module.exports = mongoose.model('User', userSchema);
