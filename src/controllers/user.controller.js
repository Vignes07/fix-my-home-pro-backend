import { supabase } from '../config/supabase.js';

export const userController = {
    // Get current user's profile
    getProfile: async (req, res, next) => {
        try {
            const userId = req.user.id;
            let { data, error } = await supabase
                .from('users')
                .select('id, full_name, email, phone, profile_photo_url, user_type, created_at')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;

            // Auto-create user row if it doesn't exist yet
            if (!data) {
                const authUser = req.user;
                const { data: newUser, error: insertErr } = await supabase
                    .from('users')
                    .upsert([{
                        id: userId,
                        email: authUser?.email || '',
                        full_name: authUser?.user_metadata?.full_name || 'User',
                        phone: authUser?.user_metadata?.phone || authUser?.phone || '0000000000',
                        user_type: 'customer',
                        is_active: true,
                    }], { onConflict: 'id' })
                    .select('id, full_name, email, phone, profile_photo_url, user_type, created_at')
                    .single();

                if (insertErr) throw insertErr;
                data = newUser;
            }

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Update current user's profile
    updateProfile: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const updates = {};
            const allowed = ['full_name', 'phone', 'email', 'profile_photo_url'];
            for (const key of allowed) {
                if (req.body[key] !== undefined) updates[key] = req.body[key];
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ success: false, message: 'No valid fields to update' });
            }

            let { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select('id, full_name, email, phone, profile_photo_url, user_type')
                .maybeSingle();

            if (error) throw error;
            
            // If row wasn't found to update, upsert it instead using auth data as fallback for required fields
            if (!data) {
                const authUser = req.user;
                const upsertData = {
                    id: userId,
                    email: authUser?.email || '',
                    full_name: authUser?.user_metadata?.full_name || 'User',
                    phone: authUser?.user_metadata?.phone || authUser?.phone || '0000000000',
                    user_type: 'customer',
                    is_active: true,
                    ...updates
                };
                
                const { data: newData, error: insertErr } = await supabase
                    .from('users')
                    .upsert([upsertData], { onConflict: 'id' })
                    .select('id, full_name, email, phone, profile_photo_url, user_type')
                    .single();
                    
                if (insertErr) throw insertErr;
                data = newData;
            }

            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

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
