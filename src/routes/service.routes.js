import express from 'express';
import { serviceController } from '../controllers/service.controller.js';
import { cacheMiddleware } from '../middlewares/cache.middleware.js';
const router = express.Router();

/**
 * @swagger
 * /services/grouped:
 *   get:
 *     summary: Retrieve a list of all active categories along with their services array
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: A grouped list of categories and services.
 */
router.get('/grouped', cacheMiddleware, serviceController.getGroupedServices);

/**
 * @swagger
 * /services/categories:
 *   get:
 *     summary: Retrieve a list of all active service categories
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: A list of categories.
 */
router.get('/categories', cacheMiddleware, serviceController.getCategories);

/**
 * @swagger
 * /services/category/{categoryId}:
 *   get:
 *     summary: Retrieve services belonging to a specific category
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of services.
 */
router.get('/category/:categoryId', cacheMiddleware, serviceController.getServicesByCategory);

/**
 * @swagger
 * /services/{id}:
 *   get:
 *     summary: Retrieve details of a specific service
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service details payload.
 */
router.get('/:id', cacheMiddleware, serviceController.getServiceDetails);

export default router;
