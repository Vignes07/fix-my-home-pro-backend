import express from 'express';
import { addressController } from '../controllers/address.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.get('/', requireAuth, addressController.getAddresses);
router.post('/', requireAuth, addressController.createAddress);
router.delete('/:id', requireAuth, addressController.deleteAddress);
router.patch('/:id/default', requireAuth, addressController.setDefault);

export default router;
