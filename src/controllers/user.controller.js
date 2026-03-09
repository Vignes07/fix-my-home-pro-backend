import { supabase } from '../config/supabase.js';

export const userController = {
    // Get all users for admin dashboard
    getAllUsersAdmin: async (req, res, next) => {
        try {
            const { search, role } = req.query;
            let query = supabase.from('users').select('*').order('created_at', { ascending: false });

            if (role && role !== 'all') {
                query = query.eq('user_type', role);
            }

            const { data, error } = await query;
            if (error) throw error;

            let filtered = data || [];
            if (search) {
                const s = search.toLowerCase();
                filtered = filtered.filter(u =>
                    (u.full_name && u.full_name.toLowerCase().includes(s)) ||
                    (u.email && u.email.toLowerCase().includes(s))
                );
            }

            res.json({ success: true, data: filtered });
        } catch (error) {
            next(error);
        }
    },

    // Update user role
    updateUserRoleAdmin: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { user_type } = req.body;

            if (!['admin', 'customer', 'technician'].includes(user_type)) {
                return res.status(400).json({ success: false, message: 'Invalid role specified' });
            }

            // Prevent removing oneself from admin (optional safety net)
            if (req.user.id === id && user_type !== 'admin') {
                return res.status(403).json({ success: false, message: 'Cannot remove your own admin privileges.' });
            }

            const { data, error } = await supabase
                .from('users')
                .update({ user_type, updated_at: new Date() })
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
