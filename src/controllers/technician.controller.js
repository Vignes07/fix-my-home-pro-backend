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
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ success: false, message: 'Technician not found' });

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
};
