import { supabase } from '../config/supabase.js';

export const addressController = {
    // Get all addresses for the current user
    getAddresses: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { data, error } = await supabase
                .from('customer_addresses')
                .select('*')
                .eq('user_id', userId)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.json({ success: true, data: data || [] });
        } catch (error) {
            next(error);
        }
    },

    // Create a new address
    createAddress: async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { label, full_address, building_name, street, city, pincode, phone, latitude, longitude, is_default } = req.body;

            if (!full_address) {
                return res.status(400).json({ success: false, message: 'full_address is required' });
            }

            // If is_default, unset all others first
            if (is_default) {
                await supabase
                    .from('customer_addresses')
                    .update({ is_default: false })
                    .eq('user_id', userId);
            }

            const { data, error } = await supabase
                .from('customer_addresses')
                .insert([{
                    user_id: userId,
                    label: label || 'Home',
                    full_address,
                    building_name,
                    street,
                    city,
                    pincode,
                    phone,
                    latitude,
                    longitude,
                    is_default: is_default || false,
                }])
                .select()
                .single();

            if (error) throw error;
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Delete an address
    deleteAddress: async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const { error } = await supabase
                .from('customer_addresses')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);

            if (error) throw error;
            res.json({ success: true, message: 'Address deleted' });
        } catch (error) {
            next(error);
        }
    },

    // Set default address
    setDefault: async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Unset all
            await supabase
                .from('customer_addresses')
                .update({ is_default: false })
                .eq('user_id', userId);

            // Set this one
            const { data, error } = await supabase
                .from('customer_addresses')
                .update({ is_default: true })
                .eq('id', id)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },
};
