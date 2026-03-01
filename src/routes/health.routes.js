import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Advanced Supabase Health Check Route
router.get('/', async (req, res) => {
    try {
        const start = Date.now();
        // check if supabase env vars are valid strings
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_PUBLISHABLE_KEY && !process.env.SUPABASE_SECRET_KEY) {
            return res.status(500).json({ error: "Missing Supabase Environment Variables" });
        }

        // ping supabase
        const { data, error } = await supabase.from('service_categories').select('id').limit(1);
        const duration = Date.now() - start;

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Supabase ping failed',
                details: error,
                latency_ms: duration
            });
        }

        return res.json({
            status: 'ok',
            message: 'Backend and Supabase are healthy',
            latency_ms: duration,
            env: {
                supabase_url_configured: !!process.env.SUPABASE_URL,
                jwt_configured: !!process.env.JWT_SECRET
            }
        });
    } catch (err) {
        return res.status(500).json({
            status: 'error',
            message: 'Critical failure connecting to Supabase',
            error_name: err.name,
            error_message: err.message,
            stack: err.stack
        });
    }
});

export default router;
