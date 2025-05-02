const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_jwt_secret_key';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    SECRET_KEY,
    { expiresIn: '2h' } //Set token validity
  );
};

module.exports = { generateToken, SECRET_KEY };
