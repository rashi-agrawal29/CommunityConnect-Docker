// controllers/commentController.js
const Comment = require('../models/commentModel');
const mongoose = require('mongoose');

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

    res.status(201).json(comment)
  } catch (err) {
    next(err)
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