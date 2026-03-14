import express from 'express';
import { contentController } from '../controllers/content.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { cacheMiddleware } from '../middlewares/cache.middleware.js';

const router = express.Router();

// ========== ADMIN ROUTES (must be before public) ==========
router.get('/admin/all', requireAuth, contentController.getAllAdmin);
router.post('/admin/sections', requireAuth, contentController.upsertSection);
router.delete('/admin/sections/:key', requireAuth, contentController.deleteSection);
router.post('/admin/items', requireAuth, contentController.createItem);
router.patch('/admin/items/:id', requireAuth, contentController.updateItem);
router.delete('/admin/items/:id', requireAuth, contentController.deleteItem);

// ========== PUBLIC ROUTES ==========

/**
 * @swagger
 * /content:
 *   get:
 *     summary: Get all site content sections with items
 *     tags: [Content]
 *     responses:
 *       200:
 *         description: All sections grouped by key
 */
router.get('/', cacheMiddleware, contentController.getAll);

/**
 * @swagger
 * /content/{key}:
 *   get:
 *     summary: Get a specific content section by key
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Section with items
 */
router.get('/:key', cacheMiddleware, contentController.getByKey);

export default router;
