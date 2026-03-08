import express from 'express';
import { technicianController } from '../controllers/technician.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public: get approved technicians
router.get('/', technicianController.getTechnicians);

// Public: get technician profile
router.get('/:id', technicianController.getTechnicianProfile);

// Technician: submit KYC
router.post('/kyc/submit', requireAuth, technicianController.submitKyc);

// Admin: get all technician applications
router.get('/admin/applications', requireAuth, technicianController.getAllApplications);

// Admin: update approval status
router.patch('/admin/:id/status', requireAuth, technicianController.updateApprovalStatus);

// Admin: get dashboard stats
router.get('/admin/stats', requireAuth, technicianController.getAdminStats);

export default router;
