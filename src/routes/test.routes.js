import express from 'express';

const router = express.Router();

// A simple mock endpoint to test frontend-to-backend connectivity
router.get('/ping', (req, res) => {
    res.json({
        success: true,
        message: 'Backend is fully connected and operational!',
        timestamp: new Date().toISOString()
    });
});

export default router;
