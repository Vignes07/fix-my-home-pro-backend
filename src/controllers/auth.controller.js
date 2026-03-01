export const authController = {
    // Placeholder login since Supabase handles Auth directly on the frontend
    // This could be used for custom token exchange or admin login
    login: async (req, res, next) => {
        try {
            res.json({
                success: true,
                message: 'In FixMyHome Pro, Authentication is handled primarily via Supabase Auth on the client side. This frontend sends the Bearer JWT token directly to this backend API.'
            });
        } catch (error) {
            next(error);
        }
    }
};
