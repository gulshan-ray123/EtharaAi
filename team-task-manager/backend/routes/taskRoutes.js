const express = require('express');
const router = express.Router();
const {
  createTask, getTasks, getTaskById,
  updateTask, deleteTask, getTasksByProject
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/auth');
const { validateTask, validateTaskUpdate } = require('../middleware/validation');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(adminOnly, validateTask, createTask);

router.get('/project/:projectId', getTasksByProject);

router.route('/:id')
  .get(getTaskById)
  .put(validateTaskUpdate, updateTask)
  .delete(adminOnly, deleteTask);

module.exports = router;
