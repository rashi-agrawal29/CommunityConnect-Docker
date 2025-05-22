// controllers/commentController.js
const Comment = require('../models/commentModel');
const mongoose = require('mongoose');
const { sendNotification } = require('../config/notificationHelper');
const Task = require('../models/taskModel');
const Notification = require('../models/notificationModel');

// GET all comments for a given task
exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment
      .find({ taskId: req.params.taskId })
      .sort({ createdAt: 1 })
      .populate('createdBy', 'name displayName')

    res.json(comments)
  } catch (err) {
    next(err)
  }
}

exports.createComment = async (req, res, next) => {
  try {
    const comment = await Comment.create({
      description: req.body.description,
      taskId:      req.params.taskId,
      createdBy:   req.user.id
    })

    // await the promise returned by populate()
    await comment.populate('createdBy', 'name displayName')

   // Fetch task to notify the creator
    const task = await Task.findById(req.params.taskId).populate('createdBy', '_id name');

    // Avoid notifying yourself
    if (task && task.createdBy._id.toString() !== req.user.id) {
      await sendNotification({
        recipient: task.createdBy._id,
        sender: req.user.id,
        task: task._id,
        message: `A new comment has been added to your task '${task.name}'`,
        type: 'general',
        io: req.app.get('io')
      });
    }

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
    if (!comment) return res.status(404).json({ error: 'Not found' })

    // ensure only the author can delete
    if (comment.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // use deleteOne() on the document
    await comment.deleteOne()

    res.json({ message: 'Comment deleted' })
  } catch (err) {
    next(err)
  }
}