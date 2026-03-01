import express from 'express';
import { authController } from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Details on Authentication
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Info about Supabase auth
 */
router.post('/login', authController.login);

export default router;
