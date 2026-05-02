const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    let taskFilter = {};
    let projectFilter = {};

    if (req.user.role === 'member') {
      taskFilter.assignedTo = req.user._id;
      projectFilter.members = req.user._id;
    }

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      totalProjects,
      recentTasks,
      myTasks
    ] = await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: 'completed' }),
      Task.countDocuments({ ...taskFilter, status: 'in-progress' }),
      Task.countDocuments({ ...taskFilter, status: 'todo' }),
      Task.countDocuments({ ...taskFilter, status: { $ne: 'completed' }, dueDate: { $lt: now } }),
      Project.countDocuments(projectFilter),
      Task.find({ ...taskFilter })
        .populate('assignedTo', 'name email')
        .populate('projectId', 'title')
        .sort({ createdAt: -1 })
        .limit(5),
      Task.find({ assignedTo: req.user._id, status: { $ne: 'completed' } })
        .populate('projectId', 'title')
        .sort({ dueDate: 1 })
        .limit(10)
    ]);

    // Admin gets extra stats
    let adminStats = {};
    if (req.user.role === 'admin') {
      const totalUsers = await User.countDocuments();
      const tasksByStatus = await Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const tasksByPriority = await Task.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]);

      // Tasks per project (top 5)
      const tasksByProject = await Task.aggregate([
        { $group: { _id: '$projectId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'projects', localField: '_id', foreignField: '_id', as: 'project' } },
        { $unwind: '$project' },
        { $project: { count: 1, 'project.title': 1 } }
      ]);

      adminStats = { totalUsers, tasksByStatus, tasksByPriority, tasksByProject };
    }

    res.json({
      success: true,
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        overdueTasks,
        pendingTasks: totalTasks - completedTasks,
        totalProjects,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      recentTasks,
      myTasks,
      ...adminStats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
