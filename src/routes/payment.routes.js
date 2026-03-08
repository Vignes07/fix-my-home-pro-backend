import express from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /payments/create-order:
 *   post:
 *     summary: Create a Razorpay order for a booking
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - booking_id
 *             properties:
 *               booking_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Razorpay order created
 *       401:
 *         description: Unauthorized
 */
router.post('/create-order', requireAuth, paymentController.createOrder);

/**
 * @swagger
 * /payments/verify:
 *   post:
 *     summary: Verify Razorpay payment and confirm booking
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *               - booking_id
 *     responses:
 *       200:
 *         description: Payment verified and booking confirmed
 */
router.post('/verify', requireAuth, paymentController.verifyPayment);

export default router;
