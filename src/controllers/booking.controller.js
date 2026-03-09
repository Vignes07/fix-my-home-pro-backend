import { supabase } from '../config/supabase.js';
import { sendBookingNotificationToTechnician } from '../utils/mailer.js';

export const bookingController = {
    // Create a new booking
    createBooking: async (req, res, next) => {
        try {
            const { customer_id, service_id, booking_date, booking_time, booking_type, customer_address } = req.body;

            // Validate basic inputs
            if (!customer_id || !service_id || !booking_date || !booking_time || !customer_address) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            // Ensure user exists in the users table (handles users who registered before the DB insert fix)
            const { data: existingUser } = await supabase.from('users').select('id').eq('id', customer_id).single();
            if (!existingUser) {
                const authUser = req.user; // from requireAuth middleware
                await supabase.from('users').upsert([{
                    id: customer_id,
                    email: authUser?.email || '',
                    full_name: authUser?.user_metadata?.full_name || '',
                    phone: authUser?.user_metadata?.phone || authUser?.phone || '',
                    user_type: 'customer',
                    is_active: true,
                }], { onConflict: 'id' });
            }

            // Fetch the service details for pricing estimation and email
            const { data: serviceData } = await supabase
                .from('services')
                .select('name, base_price')
                .eq('id', service_id)
                .single();

            const estimated_price = serviceData ? serviceData.base_price : 0;

            const { data, error } = await supabase
                .from('bookings')
                .insert([{
                    customer_id,
                    service_id,
                    technician_id: null,
                    booking_date,
                    booking_time,
                    booking_type: booking_type || 'scheduled',
                    status: 'searching',
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
                users!customer_id (full_name, phone),
                technicians (users (full_name, phone, profile_photo_url))
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
    },

    // Technician responds to a job (accept/reject) with optimistic locking
    respondToBooking: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { technician_id, action } = req.body; // action: 'accept' or 'reject'

            if (!technician_id || !['accept', 'reject'].includes(action)) {
                return res.status(400).json({ success: false, message: 'technician_id and action (accept/reject) required' });
            }

            if (action === 'reject') {
                // For now, just acknowledge the rejection
                return res.json({ success: true, message: 'Job rejected' });
            }

            // ACCEPT flow with optimistic locking:
            // Only assign if technician_id is still NULL (no one else accepted yet)
            const { data, error } = await supabase
                .from('bookings')
                .update({
                    technician_id,
                    status: 'technician_assigned',
                    updated_at: new Date(),
                })
                .eq('id', id)
                .is('technician_id', null) // Optimistic lock: only if not yet assigned
                .select()
                .single();

            if (error || !data) {
                return res.status(409).json({
                    success: false,
                    message: 'This job has already been accepted by another technician',
                });
            }

            res.json({ success: true, data, message: 'Job accepted successfully' });
        } catch (error) {
            next(error);
        }
    },

    // Get available jobs for technicians (searching bookings without technician assigned)
    getAvailableJobs: async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    services (name, base_price)
                `)
                .eq('status', 'searching')
                .is('technician_id', null)
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // ========== ADMIN ENDPOINTS ==========

    // Get ALL bookings for admin with joined names
    getAllBookingsAdmin: async (req, res, next) => {
        try {
            const { status, search } = req.query;
            let query = supabase
                .from('bookings')
                .select(`
                    *,
                    services (name, base_price),
                    users!bookings_customer_id_fkey (full_name, email, phone)
                `)
                .order('created_at', { ascending: false });

            if (status && status !== 'all') {
                query = query.eq('status', status);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Enrich with technician name if assigned
            const techIds = [...new Set((data || []).filter(b => b.technician_id).map(b => b.technician_id))];
            let techMap = {};
            if (techIds.length > 0) {
                const { data: techs } = await supabase
                    .from('technicians')
                    .select('id, users(full_name)')
                    .in('id', techIds);
                (techs || []).forEach(t => {
                    techMap[t.id] = t.users?.full_name || 'Unknown';
                });
            }

            let enriched = (data || []).map(b => ({
                ...b,
                service_name: b.services?.name || 'Unknown',
                customer_name: b.users?.full_name || 'Unknown',
                customer_email: b.users?.email || '',
                customer_phone: b.users?.phone || '',
                technician_name: b.technician_id ? (techMap[b.technician_id] || 'Assigned') : 'Unassigned',
                amount: b.estimated_price || b.services?.base_price || 0,
            }));

            // Client-side search filter
            if (search) {
                const s = search.toLowerCase();
                enriched = enriched.filter(b =>
                    b.service_name.toLowerCase().includes(s) ||
                    b.customer_name.toLowerCase().includes(s) ||
                    b.customer_email.toLowerCase().includes(s)
                );
            }

            res.json({ success: true, data: enriched });
        } catch (error) {
            next(error);
        }
    },

    // Admin update booking (status, cancel, etc.)
    updateBookingAdmin: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { status, cancellation_reason, technician_id } = req.body;

            const updates = { updated_at: new Date() };
            if (status) updates.status = status;
            if (cancellation_reason) updates.cancellation_reason = cancellation_reason;
            if (technician_id !== undefined) updates.technician_id = technician_id;

            const { data, error } = await supabase
                .from('bookings')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },
};
