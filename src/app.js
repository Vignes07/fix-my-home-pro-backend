import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

const app = express();

// Trust proxy for rate limiting behind Vercel/Render load balancers
app.set('trust proxy', 1);

// Security Middlewares
app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : '*';

app.use(cors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    credentials: true
}));

// Rate Limiting Config
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // limit each IP to 150 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Payload compression
app.use(compression());

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// Basic health check route removed in favor of the advanced Supabase check
import testRoutes from './routes/test.routes.js';
app.use('/api/test', testRoutes);

import dataRoutes from './routes/data.routes.js';
app.use('/api/data', dataRoutes);

// Swagger Documentation
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Import basic routes here in the future
import authRoutes from './routes/auth.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import serviceRoutes from './routes/service.routes.js';
import technicianRoutes from './routes/technician.routes.js';
import healthRoute from './routes/health.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);


app.use('/api/health', healthRoute);
app.use('/api/services', serviceRoutes);
app.use('/api/technicians', technicianRoutes);



// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ success: false, error: message });
});

export default app;
