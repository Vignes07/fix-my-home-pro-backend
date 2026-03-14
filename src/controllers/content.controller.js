import { supabase } from '../config/supabase.js';

export const contentController = {
    // ========== PUBLIC ==========

    // Get all sections with their items
    getAll: async (req, res, next) => {
        try {
            const { data: sections, error } = await supabase
                .from('site_content')
                .select('*')
                .eq('is_active', true)
                .order('display_order');
            if (error) throw error;

            const { data: items, error: itemsErr } = await supabase
                .from('site_content_items')
                .select('*')
                .eq('is_active', true)
                .order('display_order');
            if (itemsErr) throw itemsErr;

            // Group items by section_key
            const grouped = {};
            (sections || []).forEach(s => {
                grouped[s.section_key] = {
                    ...s,
                    items: (items || []).filter(i => i.section_key === s.section_key)
                };
            });

            // Also include item-only sections (offers, testimonials) that may not have a parent row
            const sectionKeys = new Set((sections || []).map(s => s.section_key));
            (items || []).forEach(i => {
                if (!sectionKeys.has(i.section_key)) {
                    if (!grouped[i.section_key]) {
                        grouped[i.section_key] = { section_key: i.section_key, items: [] };
                    }
                    grouped[i.section_key].items.push(i);
                }
            });

            res.json({ success: true, data: grouped });
        } catch (error) {
            next(error);
        }
    },

    // Get a single section by key
    getByKey: async (req, res, next) => {
        try {
            const { key } = req.params;
            const { data: section, error } = await supabase
                .from('site_content')
                .select('*')
                .eq('section_key', key)
                .single();

            const { data: items } = await supabase
                .from('site_content_items')
                .select('*')
                .eq('section_key', key)
                .eq('is_active', true)
                .order('display_order');

            res.json({
                success: true,
                data: { ...(section || { section_key: key }), items: items || [] }
            });
        } catch (error) {
            next(error);
        }
    },

    // ========== ADMIN ==========

    // Get ALL content for admin (including inactive)
    getAllAdmin: async (req, res, next) => {
        try {
            const { data: sections } = await supabase
                .from('site_content')
                .select('*')
                .order('display_order');

            const { data: items } = await supabase
                .from('site_content_items')
                .select('*')
                .order('section_key, display_order');

            res.json({ success: true, data: { sections: sections || [], items: items || [] } });
        } catch (error) {
            next(error);
        }
    },

    // Upsert a section (create or update by section_key)
    upsertSection: async (req, res, next) => {
        try {
            const { section_key, title, subtitle, description, image_url, button_text, button_link, bg_color, metadata, is_active, display_order } = req.body;

            if (!section_key) {
                return res.status(400).json({ success: false, message: 'section_key is required' });
            }

            const { data, error } = await supabase
                .from('site_content')
                .upsert({
                    section_key,
                    title: title || null,
                    subtitle: subtitle || null,
                    description: description || null,
                    image_url: image_url || null,
                    button_text: button_text || null,
                    button_link: button_link || null,
                    bg_color: bg_color || null,
                    metadata: metadata || {},
                    is_active: is_active !== false,
                    display_order: display_order || 0,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'section_key' })
                .select()
                .single();

            if (error) throw error;
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Delete a section
    deleteSection: async (req, res, next) => {
        try {
            const { key } = req.params;
            // Delete child items first
            await supabase.from('site_content_items').delete().eq('section_key', key);
            const { error } = await supabase.from('site_content').delete().eq('section_key', key);
            if (error) throw error;
            res.json({ success: true, message: 'Section deleted' });
        } catch (error) {
            next(error);
        }
    },

    // Create a content item
    createItem: async (req, res, next) => {
        try {
            const { section_key, title, subtitle, description, image_url, button_text, button_link, bg_color, price, rating, metadata, display_order } = req.body;

            if (!section_key || !title) {
                return res.status(400).json({ success: false, message: 'section_key and title are required' });
            }

            const { data, error } = await supabase
                .from('site_content_items')
                .insert([{
                    section_key,
                    title,
                    subtitle: subtitle || null,
                    description: description || null,
                    image_url: image_url || null,
                    button_text: button_text || null,
                    button_link: button_link || null,
                    bg_color: bg_color || null,
                    price: price || null,
                    rating: rating || null,
                    metadata: metadata || {},
                    display_order: display_order || 0,
                }])
                .select()
                .single();

            if (error) throw error;
            res.status(201).json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

    // Update a content item
    updateItem: async (req, res, next) => {
        try {
            const { id } = req.params;
            const allowed = ['title', 'subtitle', 'description', 'image_url', 'button_text', 'button_link', 'bg_color', 'price', 'rating', 'metadata', 'display_order', 'is_active'];
            const updates = {};
            for (const key of allowed) {
                if (req.body[key] !== undefined) updates[key] = req.body[key];
            }
            updates.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('site_content_items')
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

    // Delete a content item
    deleteItem: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { error } = await supabase
                .from('site_content_items')
                .delete()
                .eq('id', id);

            if (error) throw error;
            res.json({ success: true, message: 'Item deleted' });
        } catch (error) {
            next(error);
        }
    },
};
