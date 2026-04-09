import { supabase } from '../config/supabase.js';

/**
 * Middleware to verify Supabase JWT tokens.
 * Extracts the Bearer token and uses the Supabase client to get the user.
 */
export const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Missing or invalid Authorization header.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify the token using Supabase Auth
        // getUser() automatically decodes and validates the JWT against the Supabase project
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('Auth Error:', error?.message);
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token.'
            });
        }

        // Sync to public.users to prevent Foreign Key constraint errors 
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

        if (!existingUser) {
            let tempPhone = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 digit random fallback
            const meta = user.user_metadata || {};
            
            let insertData = {
                id: user.id,
                email: user.email,
                full_name: meta.full_name || user.email?.split('@')[0] || 'User',
                phone: meta.phone || tempPhone,
                user_type: (meta.user_type === 'customer' || meta.user_type === 'technician' || meta.user_type === 'admin') ? meta.user_type : 'customer'
            };

            const { error: insertErr } = await supabase.from('users').insert(insertData);
            
            // If phone conflict (e.g user deleted in auth but not in public table), force a fake phone so they can use the app
            if (insertErr && insertErr.message?.includes('violates unique constraint')) {
                insertData.phone = tempPhone;
                await supabase.from('users').insert(insertData);
            }
        }

        // Attach the authenticated user to the request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth Middleware Exception:', error);
        res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
    }
};

/**
 * Middleware to ensure the authenticated user is an admin.
 * Assumes requireAuth has already been called and req.user is set.
 */
export const requireAdmin = async (req, res, next) => {
    try {
        // We need to fetch the user role from our public.users table 
        // because Supabase Auth doesn't automatically include custom roles in the token 
        // unless you set up custom JWT claims.
        const { data: userData, error } = await supabase
            .from('users')
            .select('user_type')
            .eq('id', req.user.id)
            .single();

        if (error || !userData) {
            return res.status(403).json({ success: false, message: 'Could not verify user role.' });
        }

        if (userData.user_type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Administrator privileges required.'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error verifying admin status.' });
    }
};
