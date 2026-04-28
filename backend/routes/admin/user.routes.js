const express = require('express');
const userController = require('../../controllers/admin/user.controller');
const router = express.Router();

router.get('/', userController.getAllUsers);
router.get('/:userId', userController.getUserById);
router.patch('/:userId/block', userController.blockUser);
router.patch('/:userId/unblock', userController.unblockUser);
router.delete('/:userId', userController.deleteUser);
router.post('/:userId/impersonate', userController.impersonateUser);

module.exports = router;
