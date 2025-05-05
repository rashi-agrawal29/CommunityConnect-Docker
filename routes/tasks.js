const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasksController');
const authenticate = require('../middlewares/authMiddleware');

router.get('/', authenticate, tasksController.listTasks);
router.get('/:id', authenticate, tasksController.getTask);
router.post('/', authenticate, tasksController.createTask);
router.put('/:id', authenticate, tasksController.updateTask);
router.delete('/:id', authenticate, tasksController.deleteTask);

module.exports = router;