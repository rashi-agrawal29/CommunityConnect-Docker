const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasksController');
const authenticate = require('../middlewares/authMiddleware');

router.get('/', authenticate, tasksController.listTasks);
router.get('/:id', authenticate, tasksController.getTask);
router.post('/', authenticate, tasksController.createTask);

module.exports = router;