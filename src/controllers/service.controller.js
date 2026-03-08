import { supabase } from '../config/supabase.js';

export const serviceController = {
    // Get all categories with their active services
    getGroupedServices: async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .from('service_categories')
                .select(`
                    *,
                    services (*)
                `)
                .eq('is_active', true)
                .order('display_order');

            if (error) throw error;

            // Filter out any inactive services that might have been included
            const filteredData = data.map(category => ({
                ...category,
                services: category.services.filter(s => s.is_active)
            }));

            res.json({ success: true, data: filteredData });
        } catch (error) {
            next(error);
        }
    },

    // Get all categories
    getCategories: async (req, res, next) => {
        try {
            const { data, error } = await supabase
                .from('service_categories')
                .select('*')
                .eq('is_active', true)
                .order('display_order');

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Get services by category ID
    getServicesByCategory: async (req, res, next) => {
        try {
            const { categoryId } = req.params;
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('category_id', categoryId)
                .eq('is_active', true);

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Get a specific service details
    getServiceDetails: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { data, error } = await supabase
                .from('services')
                .select(`
                    *,
                    service_categories (name),
                    service_options (*)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    }
};
