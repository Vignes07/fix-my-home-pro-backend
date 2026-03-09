import { supabase } from '../config/supabase.js';

export const technicianController = {
    // Get all approved technicians
    getTechnicians: async (req, res, next) => {
        try {
            const { city, service_id } = req.query;
            let query = supabase.from('technicians').select(`
                *,
                users (full_name, profile_photo_url, phone)
            `).eq('approval_status', 'approved');

            if (city) query = query.eq('city', city);

            const { data, error } = await query;
            if (error) throw error;

            // Note: service filtering via many-to-many needs to be done via join or post-processing
            // This is a simplified fetch for now.
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Get current technician profile
    getMyProfile: async (req, res, next) => {
        try {
            const user_id = req.user.id;
            const { data, error } = await supabase
                .from('technicians')
                .select(`
                    *,
                    users (full_name, email, phone, profile_photo_url)
                `)
                .eq('user_id', user_id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
                throw error;
            }

            if (!data) {
                return res.json({ success: true, data: null, message: 'No technician profile found' });
            }

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Get technician profile
    getTechnicianProfile: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { data, error } = await supabase
                .from('technicians')
                .select(`
                    *,
                    users (*),
                    technician_services (
                        experience_years,
                        services (name, base_price, category_id)
                    ),
                    bookings (id, status, scheduled_date, estimated_price, service_id, users(full_name))
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ success: false, message: 'Technician not found' });

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Submit KYC data for a technician
    submitKyc: async (req, res, next) => {
        try {
            const {
                user_id, aadhar_number, pan_number, address, city, state, pincode,
                bank_account_number, bank_ifsc_code, bank_account_holder_name, skills
            } = req.body;

            if (!user_id || !aadhar_number || !pan_number) {
                return res.status(400).json({ success: false, message: 'user_id, aadhar_number, and pan_number are required' });
            }

            // Check if technician record already exists
            const { data: existing } = await supabase
                .from('technicians')
                .select('id')
                .eq('user_id', user_id)
                .single();

            if (existing) {
                // Update existing record
                const { data, error } = await supabase
                    .from('technicians')
                    .update({
                        aadhar_number, pan_number, address, city, state, pincode,
                        bank_account_number, bank_ifsc_code, bank_account_holder_name,
                        approval_status: 'pending',
                    })
                    .eq('user_id', user_id)
                    .select()
                    .single();

                if (error) throw error;
                return res.json({ success: true, data, message: 'KYC updated' });
            }

            // Create new record
            const { data, error } = await supabase
                .from('technicians')
                .insert([{
                    user_id, aadhar_number, pan_number, address, city, state, pincode,
                    bank_account_number, bank_ifsc_code, bank_account_holder_name,
                    approval_status: 'pending',
                    kyc_verified: false,
                    commission_rate: 20,
                    rating: 0,
                    total_jobs_completed: 0,
                    wallet_balance: 0,
                }])
                .select()
                .single();

            if (error) throw error;
            res.status(201).json({ success: true, data, message: 'KYC submitted successfully' });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Get all technician applications (including pending)
    getAllApplications: async (req, res, next) => {
        try {
            const { status } = req.query;
            let query = supabase.from('technicians').select(`
                *,
                users (full_name, email, phone, profile_photo_url)
            `);

            if (status) query = query.eq('approval_status', status);
            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Update technician approval status
    updateApprovalStatus: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { approval_status, interview_date, notes } = req.body;

            const validStatuses = ['pending', 'approved', 'rejected', 'interview_scheduled'];
            if (!validStatuses.includes(approval_status)) {
                return res.status(400).json({ success: false, message: 'Invalid approval status' });
            }

            const updateData = {
                approval_status,
                ...(approval_status === 'approved' && { kyc_verified: true }),
                ...(interview_date && { interview_date }),
                ...(notes && { admin_notes: notes }),
            };

            const { data, error } = await supabase
                .from('technicians')
                .update(updateData)
                .eq('id', id)
                .select(`*, users (full_name, email)`)
                .single();

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Admin: Get dashboard stats
    getAdminStats: async (req, res, next) => {
        try {
            const [usersRes, bookingsRes, techRes] = await Promise.all([
                supabase.from('users').select('id', { count: 'exact', head: true }),
                supabase.from('bookings').select('id, estimated_price, status', { count: 'exact' }),
                supabase.from('technicians').select('id, approval_status', { count: 'exact' }),
            ]);

            const totalUsers = usersRes.count || 0;
            const totalBookings = bookingsRes.count || 0;
            const activeBookings = bookingsRes.data?.filter(b => !['completed', 'cancelled'].includes(b.status)).length || 0;
            const revenue = bookingsRes.data?.reduce((sum, b) => sum + (b.estimated_price || 0), 0) || 0;
            const totalTechnicians = techRes.count || 0;
            const pendingKyc = techRes.data?.filter(t => t.approval_status === 'pending').length || 0;

            res.json({
                success: true,
                data: {
                    totalUsers,
                    totalBookings,
                    activeBookings,
                    revenue,
                    totalTechnicians,
                    pendingKyc,
                },
            });
        } catch (error) {
            next(error);
        }
    },
};
