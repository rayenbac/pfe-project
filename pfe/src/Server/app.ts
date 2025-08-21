import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors'; 
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import { db } from '../Config/db.config';
import { router as postRouter } from '../Routes/posts.routes';
import { router as userRouter } from '../Routes/users.routes';
import { router as categoryRouter } from '../Routes/category.routes';
import { router as favoriteRouter } from '../Routes/favorites.routes';
import { router as propertyRouter } from '../Routes/property.routes';
import { router as transactionRouter } from '../Routes/transaction.routes';
import { router as reviewRouter } from '../Routes/review.routes';
import { router as paymentRouter } from '../Routes/payment.routes';
import { router as notificationRouter } from '../Routes/notification.routes';
import { router as chatRouter } from '../Routes/chat.routes';
import { router as authRouter } from '../Routes/auth.routes';
import { router as stripeRouter } from '../Routes/stripe.routes';
import agencyRouter from '../Routes/agency.routes';
import bookingRouter from '../Routes/booking.routes';
import signatureRouter from '../Routes/signature.routes';
import contractRouter from '../Routes/contract.routes';
import reportRouter from '../Routes/report.routes';
import { dashboardRoutes } from '../Routes/dashboard.routes';
import invoiceRoutes from '../Routes/invoice.routes';
import logger from '../Config/logger.config';
import { setupSocketIO } from './socket';
import konnectRoutes from '../Routes/konnect.routes';
import '../Config/passport.config';
import passport from 'passport';
import session, { SessionOptions } from 'express-session';

import { pageNotFound } from '../Controllers/error.controller';
import "reflect-metadata";
import recommenderRouter from '../Routes/recommender.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:4200', 'http://217.160.173.131:8081'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Setup Socket.IO event handlers
const { io: socketServer, realtimeNotificationService } = setupSocketIO(io);

// Make the notification service available globally
export { realtimeNotificationService };

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:4200', 'http://217.160.173.131:8081'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS middleware globally
app.use(cors(corsOptions));  

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false
}) as unknown as express.RequestHandler);
app.use(passport.initialize() as unknown as express.RequestHandler);
app.use(passport.session() as unknown as express.RequestHandler);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/posts', postRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/properties', propertyRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/chats', chatRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/agencies', agencyRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/signatures', signatureRouter);
app.use('/api/contracts', contractRouter);
app.use('/api/reports', reportRouter);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/konnect', konnectRoutes);
app.use('/api/recommender', recommenderRouter);


// Handle 404 errors
app.use('/', pageNotFound);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Database connection and server startup
db.then(() => {
    server.listen(port, () => {
        logger.info(`Server is running on http://localhost:${port}/api`);
    });
}).catch((error) => {
    logger.error('Database connection error:', error);
    process.exit(1);
});