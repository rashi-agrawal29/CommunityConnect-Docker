// routes/comments.js
const express = require('express');
const router  = express.Router();
const authenticate = require('../middlewares/authMiddleware');
const commentController = require('../controllers/commentController');

// get all comments for a task
router.get('/task/:taskId', authenticate, commentController.getComments);

// post a new comment
router.post('/task/:taskId', authenticate, commentController.createComment);

// delete a comment by its id
router.delete('/:commentId', authenticate, commentController.deleteComment);

module.exports = router;
