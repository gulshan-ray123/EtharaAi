const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUserRole, deleteUser, updateProfile } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', adminOnly, getAllUsers);
router.put('/profile', updateProfile);
router.get('/:id', adminOnly, getUserById);
router.put('/:id/role', adminOnly, updateUserRole);
router.delete('/:id', adminOnly, deleteUser);

module.exports = router;
