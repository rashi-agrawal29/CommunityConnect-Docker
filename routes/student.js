const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    name: "Rashi Agrawal",
    studentId: "S2247112271"
  });
});

module.exports = router;
