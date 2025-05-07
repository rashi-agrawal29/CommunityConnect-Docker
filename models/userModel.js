const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  googleId: String,
  displayName: String, // Used for Gmail users
  email: { type: String, required: true, unique: true },
  password: String, // store hashed password for normal registration
  name: { type: String, required: true }, // name
  isVerified: { type: Boolean, default: false }, // Verify if the email is confirmed
  verificationToken: { type: String }, // Store the verification token
   resetPasswordToken:   String,
   resetPasswordExpires: Date,
});
// Hash password if provided and modified
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};
module.exports = mongoose.model('User', userSchema);
