import express from 'express';
import { technicianController } from '../controllers/technician.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /technicians:
 *   post:
 *     summary: Submit KYC for a technician
 *     tags: [Technicians]
 *     responses:
 *       201:
 *         description: KYC submitted
 */
router.post('/', requireAuth, technicianController.submitKyc);

/**
 * @swagger
 * /technicians/me:
 *   get:
 *     summary: Get current technician profile
 *     tags: [Technicians]
 *     responses:
 *       200:
 *         description: Technician profile
 */
router.get('/me', requireAuth, technicianController.getMyProfile);

/**
 * @swagger
 * /technicians/admin/applications:
 *   get:
 *     summary: Get all applications (Admin)
 *     tags: [Technicians]
 *     responses:
 *       200:
 *         description: List of all applications
 */
router.get('/admin/applications', requireAuth, technicianController.getAllApplications);

/**
 * @swagger
 * /technicians/admin/stats:
 *   get:
 *     summary: Get dashboard stats (Admin)
 *     tags: [Technicians]
 *     responses:
 *       200:
 *         description: Stats returned
 */
router.get('/admin/stats', requireAuth, technicianController.getAdminStats);

/**
 * @swagger
 * /technicians/{id}/status:
 *   patch:
 *     summary: Update technician verification status
 *     tags: [Technicians]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', requireAuth, technicianController.updateApprovalStatus);

export default router;
