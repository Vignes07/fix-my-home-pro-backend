import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Endpoint to fetch all data from all primary tables
router.get('/all', async (req, res) => {
    try {
        const [
            { data: users, error: err1 },
            { data: technicians, error: err2 },
            { data: categories, error: err3 },
            { data: services, error: err4 },
            { data: bookings, error: err5 }
        ] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('technicians').select('*'),
            supabase.from('service_categories').select('*'),
            supabase.from('services').select('*'),
            supabase.from('bookings').select('*')
        ]);

        if (err1 || err2 || err3 || err4 || err5) {
            console.error('Supabase fetch error', { err1, err2, err3, err4, err5 });
            return res.status(500).json({ success: false, message: 'Failed to fetch some tables' });
        }

        res.json({
            success: true,
            data: {
                users,
                technicians,
                categories,
                services,
                bookings
            }
        });
    } catch (error) {
        console.error('Data route error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
