import express from 'express';
import { serviceController } from '../controllers/service.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middlewares/cache.middleware.js';
const router = express.Router();

// ========== ADMIN ROUTES (must be before /:id) ==========
router.get('/admin/all', requireAuth, serviceController.getAllServicesAdmin);
router.post('/admin', requireAuth, serviceController.createService);
router.patch('/admin/:id', requireAuth, serviceController.updateService);
router.delete('/admin/:id', requireAuth, serviceController.deleteService);

// ========== PUBLIC ROUTES ==========
router.get('/grouped', cacheMiddleware, serviceController.getGroupedServices);
router.get('/categories', cacheMiddleware, serviceController.getCategories);
router.get('/category/:categoryId', cacheMiddleware, serviceController.getServicesByCategory);
router.get('/:id', cacheMiddleware, serviceController.getServiceDetails);

export default router;
