import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { sendBookingConfirmationToCustomer, sendBookingNotificationToTechnician } from '../utils/mailer.js';

const rzpKeyId = process.env.RAZORPAY_KEY_ID;
const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;

console.log('[Payment] Razorpay key_id at module load:', rzpKeyId ? `SET (${rzpKeyId.substring(0, 10)}...)` : '❌ MISSING');
console.log('[Payment] Razorpay key_secret at module load:', rzpKeySecret ? 'SET' : '❌ MISSING');

if (!rzpKeyId || !rzpKeySecret) {
    console.error('[Payment] ⚠️  RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing from process.env!');
    console.error('[Payment] Make sure these are set in backend/.env file');
}

const razorpay = new Razorpay({
    key_id: rzpKeyId,
    key_secret: rzpKeySecret,
});

export const paymentController = {
    // Create a Razorpay order
    createOrder: async (req, res, next) => {
        try {
            const { booking_id } = req.body;
            console.log('[Payment] createOrder called with booking_id:', booking_id);

            if (!booking_id) {
                return res.status(400).json({ success: false, message: 'booking_id is required' });
            }

            // Get booking details for amount
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .select('*, services(name, base_price)')
                .eq('id', booking_id)
                .single();

            if (bookingError) {
                console.error('[Payment] Supabase booking fetch error:', bookingError);
                return res.status(404).json({ success: false, message: 'Booking not found', detail: bookingError.message });
            }
            if (!booking) {
                console.error('[Payment] Booking not found for id:', booking_id);
                return res.status(404).json({ success: false, message: 'Booking not found' });
            }

            const amount = (booking.estimated_price || booking.services?.base_price || 399) * 100; // amount in paise
            console.log('[Payment] Creating Razorpay order with amount (paise):', amount);
            console.log('[Payment] Razorpay key_id:', process.env.RAZORPAY_KEY_ID ? 'SET' : 'MISSING');
            console.log('[Payment] Razorpay key_secret:', process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'MISSING');

            const order = await razorpay.orders.create({
                amount,
                currency: 'INR',
                receipt: `bk_${booking_id}`.substring(0, 40),
                notes: {
                    booking_id,
                },
            });

            console.log('[Payment] Razorpay order created:', order.id);

            // Save order_id to booking (non-blocking, ignore if column missing)
            try {
                await supabase
                    .from('bookings')
                    .update({ razorpay_order_id: order.id })
                    .eq('id', booking_id);
            } catch (updateErr) {
                console.warn('[Payment] Could not save razorpay_order_id to booking (column may not exist):', updateErr.message);
            }

            res.json({
                success: true,
                data: {
                    order_id: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    booking,
                },
            });
        } catch (error) {
            console.error('[Payment] createOrder CRASH:', error.message || error);
            console.error('[Payment] Full error:', JSON.stringify(error, null, 2));
            next(error);
        }
    },

    // Verify Razorpay payment signature and confirm booking
    verifyPayment: async (req, res, next) => {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;

            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
                return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
            }

            // Verify signature
            const body = razorpay_order_id + '|' + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(body)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({ success: false, message: 'Payment verification failed' });
            }

            // Update booking status to accepted & store payment info
            const { data: booking, error } = await supabase
                .from('bookings')
                .update({
                    status: 'accepted',
                    razorpay_payment_id,
                    payment_status: 'completed',
                    updated_at: new Date(),
                })
                .eq('id', booking_id)
                .select('*, services(name, base_price)')
                .single();

            if (error) throw error;

            // Send confirmation email to customer
            const { data: customer } = await supabase
                .from('users')
                .select('full_name, email')
                .eq('id', booking.customer_id)
                .single();

            if (customer?.email) {
                await sendBookingConfirmationToCustomer(customer, booking, booking.services?.name || 'Home Service');
            }

            // Find and notify a technician
            const { data: technicians } = await supabase
                .from('users')
                .select('id, full_name, email')
                .eq('user_type', 'technician')
                .limit(5);

            if (technicians?.length > 0) {
                // Send notification to all eligible technicians
                for (const tech of technicians) {
                    await sendBookingNotificationToTechnician(tech, booking, booking.services?.name || 'Home Service');
                }
            }

            res.json({ success: true, data: booking });
        } catch (error) {
            next(error);
        }
    },
};
