import { supabase } from '../config/supabase.js';

export const bookingController = {
    // Create a new booking
    createBooking: async (req, res, next) => {
        try {
            const { customer_id, service_id, booking_date, booking_time, booking_type, customer_address } = req.body;

            // Validate basic inputs
            if (!customer_id || !service_id || !booking_date || !booking_time || !customer_address) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            // Fetch the service details for pricing estimation
            const { data: serviceData } = await supabase
                .from('services')
                .select('base_price')
                .eq('id', service_id)
                .single();

            const estimated_price = serviceData ? serviceData.base_price : 0;

            const { data, error } = await supabase
                .from('bookings')
                .insert([{
                    customer_id,
                    service_id,
                    booking_date,
                    booking_time,
                    booking_type: booking_type || 'scheduled',
                    status: 'pending',
                    customer_address,
                    estimated_price
                }])
                .select()
                .single();

            if (error) throw error;
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Get all bookings (can be filtered by user, tech, status in query)
    getBookings: async (req, res, next) => {
        try {
            const { customer_id, technician_id, status } = req.query;
            let query = supabase.from('bookings').select(`
                *,
                services (name, base_price),
                users!customer_id (full_name, phone)
            `);

            if (customer_id) query = query.eq('customer_id', customer_id);
            if (technician_id) query = query.eq('technician_id', technician_id);
            if (status) query = query.eq('status', status);

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Get specific booking details
    getBookingDetails: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    services (*),
                    technicians (*),
                    users!customer_id (full_name, phone)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ success: false, message: 'Booking not found' });

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Update booking status
    updateBookingStatus: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = ['pending', 'accepted', 'technician_assigned', 'in_progress', 'completed', 'cancelled', 'payment_pending'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ success: false, message: 'Invalid status' });
            }

            const { data, error } = await supabase
                .from('bookings')
                .update({ status, updated_at: new Date() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
};
