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
    },

    // ========== ADMIN ENDPOINTS ==========

    // Get ALL services (including inactive) with category name for admin
    getAllServicesAdmin: async (req, res, next) => {
        try {
            const { data: services, error } = await supabase
                .from('services')
                .select('*, service_categories(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Get booking counts per service
            const { data: bookingCounts } = await supabase
                .from('bookings')
                .select('service_id');

            const countMap = {};
            (bookingCounts || []).forEach(b => {
                countMap[b.service_id] = (countMap[b.service_id] || 0) + 1;
            });

            const enriched = (services || []).map(s => ({
                ...s,
                category_name: s.service_categories?.name || 'Uncategorized',
                booking_count: countMap[s.id] || 0,
            }));

            // Also get categories for the "Add Service" dropdown
            const { data: categories } = await supabase
                .from('service_categories')
                .select('id, name, is_active')
                .order('display_order');

            res.json({ success: true, data: { services: enriched, categories: categories || [] } });
        } catch (error) {
            next(error);
        }
    },

    // Create a new service
    createService: async (req, res, next) => {
        try {
            const { name, category_id, description, base_price, estimated_duration, is_active, image_url, thumbnail_url, detail_image_url } = req.body;

            if (!name || !category_id || !base_price) {
                return res.status(400).json({ success: false, message: 'name, category_id, and base_price are required' });
            }

            const { data, error } = await supabase
                .from('services')
                .insert([{
                    name,
                    category_id,
                    description: description || '',
                    base_price,
                    estimated_duration: estimated_duration || 60,
                    is_active: is_active !== false,
                    image_url: thumbnail_url || image_url || null,
                    thumbnail_url: thumbnail_url || null,
                    detail_image_url: detail_image_url || null,
                }])
                .select('*, service_categories(name)')
                .single();

            if (error) throw error;
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Update a service
    updateService: async (req, res, next) => {
        try {
            const { id } = req.params;
            const updates = {};
            const allowed = ['name', 'category_id', 'description', 'base_price', 'estimated_duration', 'is_active', 'image_url', 'thumbnail_url', 'detail_image_url'];
            for (const key of allowed) {
                if (req.body[key] !== undefined) updates[key] = req.body[key];
            }

            const { data, error } = await supabase
                .from('services')
                .update(updates)
                .eq('id', id)
                .select('*, service_categories(name)')
                .single();

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Delete a service
    deleteService: async (req, res, next) => {
        try {
            const { id } = req.params;

            // Check if service has bookings — soft delete if so
            const { data: bookings } = await supabase
                .from('bookings')
                .select('id')
                .eq('service_id', id)
                .limit(1);

            if (bookings && bookings.length > 0) {
                // Soft delete — set inactive
                const { error } = await supabase
                    .from('services')
                    .update({ is_active: false })
                    .eq('id', id);
                if (error) throw error;
                return res.json({ success: true, message: 'Service deactivated (has existing bookings)' });
            }

            // Hard delete
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', id);

            if (error) throw error;
            res.json({ success: true, message: 'Service deleted' });
        } catch (error) {
            next(error);
        }
    },

    // ========== ADMIN CATEGORY ENDPOINTS ==========

    createCategory: async (req, res, next) => {
        try {
            const { name, description, icon_name, is_active, display_order } = req.body;

            if (!name) {
                return res.status(400).json({ success: false, message: 'Name is required' });
            }

            const { data, error } = await supabase
                .from('service_categories')
                .insert([{
                    name,
                    description: description || '',
                    icon_name: icon_name || 'Tool',
                    is_active: is_active !== false,
                    display_order: display_order || 0
                }])
                .select()
                .single();

            if (error) throw error;
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    updateCategory: async (req, res, next) => {
        try {
            const { id } = req.params;
            const allowed = ['name', 'description', 'icon_name', 'is_active', 'display_order'];
            const updates = {};
            for (const key of allowed) {
                if (req.body[key] !== undefined) updates[key] = req.body[key];
            }

            const { data, error } = await supabase
                .from('service_categories')
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

    deleteCategory: async (req, res, next) => {
        try {
            const { id } = req.params;

            // Check if category has services
            const { data: services } = await supabase
                .from('services')
                .select('id')
                .eq('category_id', id)
                .limit(1);

            if (services && services.length > 0) {
                // Soft delete — set inactive
                const { error } = await supabase
                    .from('service_categories')
                    .update({ is_active: false })
                    .eq('id', id);
                if (error) throw error;
                return res.json({ success: true, message: 'Category deactivated (contains existing services)' });
            }

            // Hard delete
            const { error } = await supabase
                .from('service_categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
            res.json({ success: true, message: 'Category deleted' });
        } catch (error) {
            next(error);
        }
    },

    // ========== ADMIN SERVICE OPTIONS ENDPOINTS ==========

    // Get options for a service
    getServiceOptions: async (req, res, next) => {
        try {
            const { serviceId } = req.params;
            const { data, error } = await supabase
                .from('service_options')
                .select('*')
                .eq('service_id', serviceId)
                .order('created_at');

            if (error) throw error;
            res.json({ success: true, data: data || [] });
        } catch (error) {
            next(error);
        }
    },

    // Create a service option
    createServiceOption: async (req, res, next) => {
        try {
            const { serviceId } = req.params;
            const { name, description, price, estimated_duration, includes } = req.body;

            if (!name || !price) {
                return res.status(400).json({ success: false, message: 'name and price are required' });
            }

            const { data, error } = await supabase
                .from('service_options')
                .insert([{
                    service_id: serviceId,
                    name,
                    description: description || '',
                    price,
                    estimated_duration: estimated_duration || 60,
                    includes: includes || [],
                }])
                .select()
                .single();

            if (error) throw error;
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Update a service option
    updateServiceOption: async (req, res, next) => {
        try {
            const { optionId } = req.params;
            const updates = {};
            const allowed = ['name', 'description', 'price', 'estimated_duration', 'includes'];
            for (const key of allowed) {
                if (req.body[key] !== undefined) updates[key] = req.body[key];
            }

            const { data, error } = await supabase
                .from('service_options')
                .update(updates)
                .eq('id', optionId)
                .select()
                .single();

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Delete a service option
    deleteServiceOption: async (req, res, next) => {
        try {
            const { optionId } = req.params;
            const { error } = await supabase
                .from('service_options')
                .delete()
                .eq('id', optionId);

            if (error) throw error;
            res.json({ success: true, message: 'Option deleted' });
        } catch (error) {
            next(error);
        }
    }
};
