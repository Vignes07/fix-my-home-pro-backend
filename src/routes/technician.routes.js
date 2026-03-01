import express from 'express';
import { technicianController } from '../controllers/technician.controller.js';

const router = express.Router();

/**
 * @swagger
 * /technicians:
 *   get:
 *     summary: Retrieve list of approved technicians
 *     tags: [Technicians]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of technicians
 */
router.get('/', technicianController.getTechnicians);

/**
 * @swagger
 * /technicians/{id}:
 *   get:
 *     summary: Retrieve specific technician profile details
 *     tags: [Technicians]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Technician profile
 */
router.get('/:id', technicianController.getTechnicianProfile);

export default router;
