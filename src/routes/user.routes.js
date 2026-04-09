import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { userController } from '../controllers/user.controller.js';

const router = express.Router();

// ========== AUTHENTICATED USER ROUTES ==========
router.get('/profile', requireAuth, userController.getProfile);
router.patch('/profile', requireAuth, userController.updateProfile);


/**
 * @swagger
 * /users/admin:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/admin', requireAuth, requireAdmin, userController.getAllUsersAdmin);

/**
 * @swagger
 * /users/admin/{id}/role:
 *   patch:
 *     summary: Update a user role (Admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated
 */
router.patch('/admin/:id/role', requireAuth, requireAdmin, userController.updateUserRoleAdmin);

export default router;
