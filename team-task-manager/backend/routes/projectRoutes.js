const express = require('express');
const router = express.Router();
const {
  createProject, getProjects, getProjectById,
  updateProject, deleteProject, addMember, removeMember
} = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/auth');
const { validateProject } = require('../middleware/validation');

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(adminOnly, validateProject, createProject);

router.route('/:id')
  .get(getProjectById)
  .put(adminOnly, validateProject, updateProject)
  .delete(adminOnly, deleteProject);

router.put('/:id/members', adminOnly, addMember);
router.delete('/:id/members/:userId', adminOnly, removeMember);

module.exports = router;
