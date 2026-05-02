const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Create task
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = async (req, res, next) => {
  try {
    const { title, description, projectId, assignedTo, status, priority, dueDate } = req.body;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Verify assigned user is a project member
    if (!project.members.includes(assignedTo)) {
      return res.status(400).json({ success: false, message: 'Assigned user is not a member of this project' });
    }

    const task = await Task.create({
      title, description, projectId, assignedTo, createdBy: req.user._id,
      status: status || 'todo', priority: priority || 'medium', dueDate
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('projectId', 'title');

    res.status(201).json({ success: true, message: 'Task created successfully', task });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks with filters
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { status, assignedTo, projectId, dueDate, priority, page = 1, limit = 20 } = req.query;

    const filter = {};

    // Members can only see their own tasks or tasks in their projects
    if (req.user.role !== 'admin') {
      filter.assignedTo = req.user._id;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo && req.user.role === 'admin') filter.assignedTo = assignedTo;
    if (projectId) filter.projectId = projectId;
    if (dueDate) {
      const date = new Date(dueDate);
      filter.dueDate = { $lte: new Date(date.setHours(23, 59, 59, 999)) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Task.countDocuments(filter);

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('projectId', 'title')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: tasks.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('projectId', 'title members');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check access for members
    if (req.user.role !== 'admin') {
      const project = await Project.findById(task.projectId._id);
      if (!project.members.includes(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Members can only update status of tasks assigned to them
    if (req.user.role === 'member') {
      if (task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only update your own tasks.' });
      }
      // Members can only update status
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'Members can only update task status' });
      }
      task.status = status;
    } else {
      // Admin can update all fields
      const { title, description, assignedTo, status, priority, dueDate } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignedTo) task.assignedTo = assignedTo;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (dueDate) task.dueDate = dueDate;
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('projectId', 'title');

    res.json({ success: true, message: 'Task updated successfully', task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tasks by project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getTasksByProject = async (req, res, next) => {
  try {
    const { status, assignedTo } = req.query;
    const filter = { projectId: req.params.projectId };

    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    next(error);
  }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask, getTasksByProject };
