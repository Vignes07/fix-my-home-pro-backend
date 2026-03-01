import express from 'express';
import { bookingController } from '../controllers/booking.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - service_id
 *               - booking_date
 *               - booking_time
 *               - customer_address
 *             properties:
 *               customer_id:
 *                 type: string
 *               service_id:
 *                 type: string
 *               booking_date:
 *                 type: string
 *                 format: date
 *               booking_time:
 *                 type: string
 *               booking_type:
 *                 type: string
 *               customer_address:
 *                 type: string
 *     responses:
 *       201:
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAuth, bookingController.createBooking);

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Retrieve list of bookings
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: technician_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get('/', bookingController.getBookings);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Retrieve specific booking details
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking Details
 */
router.get('/:id', bookingController.getBookingDetails);

/**
 * @swagger
 * /bookings/{id}/status:
 *   patch:
 *     summary: Update a booking's status
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id/status', requireAuth, bookingController.updateBookingStatus);

export default router;
