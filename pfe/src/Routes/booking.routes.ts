import { Router } from 'express';
import { BookingController } from '../Controllers/booking.controller';

const router = Router();

// Get property availability calendar
router.get('/properties/:propertyId/availability', BookingController.getPropertyAvailability);

// Check date availability
router.post('/properties/:propertyId/check-availability', BookingController.checkDateAvailability);

// Create a new booking
router.post('/', BookingController.createBooking);

// Get all bookings
router.get('/', BookingController.getAllBookings);

// Get booking by ID
router.get('/:id', BookingController.getBookingById);

// Get bookings by user
router.get('/user/:userId', BookingController.getBookingsByUser);

// Get user reservations (as tenant only)
router.get('/user/:userId/reservations', BookingController.getUserReservations);

// Get agent's property bookings
router.get('/agent/:agentId', BookingController.getAgentBookings);

// Update booking status
router.patch('/:id/status', BookingController.updateBookingStatus);

// Cancel booking
router.patch('/:id/cancel', BookingController.cancelBooking);

export default router;
