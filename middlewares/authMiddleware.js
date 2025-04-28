const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided.' });

  jwt.verify(token, 'YOUR_JWT_SECRET', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Failed to authenticate token.' });
    req.user = decoded;
    next();
  });
};
