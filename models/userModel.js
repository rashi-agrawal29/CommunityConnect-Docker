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
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

// Hash password if modified and not already hashed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    // Prevent double hashing (bcrypt hashes typically start with $2a$ or $2b$)
    if (!this.password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      console.log('Password was hashed successfully.');
    } else {
      console.log('Password is already hashed. Skipping hashing.');
    }
    next();
  } catch (err) {
    console.error('Error hashing password:', err);
    next(err);
  }
});

// Compare hashed password
userSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
