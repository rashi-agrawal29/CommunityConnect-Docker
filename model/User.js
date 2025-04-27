const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: String,
  displayName: String, // Used for Gmail users
  email: { type: String, required: true, unique: true },
  password: String, // store hashed password for normal registration
  name: { type: String, required: true } // name
});

module.exports = mongoose.model('User', userSchema);
