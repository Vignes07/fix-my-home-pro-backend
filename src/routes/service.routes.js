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

router.post('/admin/categories', requireAuth, serviceController.createCategory);
router.patch('/admin/categories/:id', requireAuth, serviceController.updateCategory);
router.delete('/admin/categories/:id', requireAuth, serviceController.deleteCategory);

// Service options (types) CRUD
router.get('/admin/:serviceId/options', requireAuth, serviceController.getServiceOptions);
router.post('/admin/:serviceId/options', requireAuth, serviceController.createServiceOption);
router.patch('/admin/options/:optionId', requireAuth, serviceController.updateServiceOption);
router.delete('/admin/options/:optionId', requireAuth, serviceController.deleteServiceOption);

// ========== PUBLIC ROUTES ==========
/**
 * @swagger
 * /services/grouped:
 *   get:
 *     summary: Get all services grouped by category
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of categories with services
 */
router.get('/grouped', cacheMiddleware, serviceController.getGroupedServices);
/**
 * @swagger
 * /services/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', cacheMiddleware, serviceController.getCategories);

/**
 * @swagger
 * /services/category/{categoryId}:
 *   get:
 *     summary: Get services by category ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of services
 */
router.get('/category/:categoryId', cacheMiddleware, serviceController.getServicesByCategory);

/**
 * @swagger
 * /services/{id}:
 *   get:
 *     summary: Get specific service details
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service details
 */
router.get('/:id', cacheMiddleware, serviceController.getServiceDetails);

export default router;
