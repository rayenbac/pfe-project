import { Request, Response } from 'express';
import { Booking, BookingSchemaValidate } from '../Models/booking';
import { Property } from '../Models/property';
import { IBooking } from '../Interfaces/booking/IBooking';
import { realtimeNotificationService } from '../Server/app';
import { ContractService } from '../Services/contract.service';

export class BookingController {
    private static contractService = new ContractService();
    
    // Get property availability calendar
    static async getPropertyAvailability(req: Request, res: Response): Promise<void> {
        try {
            const { propertyId } = req.params;
            const { month, year } = req.query;

            if (!propertyId || !month || !year) {
                res.status(400).json({ message: 'Property ID, month, and year are required' });
                return;
            }

            // Get property to check if it exists
            const property = await Property.findById(propertyId);
            if (!property) {
                res.status(404).json({ message: 'Property not found' });
                return;
            }

            // Create date range for the month
            const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
            const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
            
            console.log(`Getting availability for property ${propertyId}, month ${month}/${year}`);
            console.log('Date range:', {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });
            
            // Get all bookings for this property in the date range
            const bookings = await Booking.find({
                property: propertyId,
                status: { $in: ['confirmed', 'pending'] },
                $or: [
                    { startDate: { $gte: startDate, $lte: endDate } },
                    { endDate: { $gte: startDate, $lte: endDate } },
                    { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
                ]
            });

            console.log(`Found ${bookings.length} bookings for this period:`, 
                bookings.map(b => ({
                    id: b._id,
                    start: b.startDate,
                    end: b.endDate,
                    status: b.status,
                    paymentStatus: b.paymentStatus
                }))
            );
            
            // Also check all bookings for this property regardless of date
            const allBookings = await Booking.find({ property: propertyId });
            console.log(`Total bookings for property ${propertyId}:`, allBookings.length);
            if (allBookings.length > 0) {
                console.log('All bookings for this property:', allBookings.map(b => ({
                    id: b._id,
                    start: b.startDate.toISOString(),
                    end: b.endDate.toISOString(),
                    status: b.status,
                    paymentStatus: b.paymentStatus,
                    createdAt: b.createdAt
                })));
            }

            // Generate calendar data
            const calendar = [];
            const currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                const dateString = currentDate.toISOString().split('T')[0];
                
                // Check if this date is booked (inclusive of start and end dates)
                const isBooked = bookings.some(booking => {
                    const bookingStart = new Date(booking.startDate);
                    const bookingEnd = new Date(booking.endDate);
                    // Include both start and end dates in the booking
                    return currentDate >= bookingStart && currentDate <= bookingEnd;
                });

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isPastDate = currentDate < today;

                calendar.push({
                    date: dateString,
                    available: !isBooked && !isPastDate,
                    price: property.pricing.price,
                    booked: isBooked,
                    blocked: isPastDate // Mark past dates as blocked
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }

            console.log(`Generated calendar with ${calendar.filter(d => d.booked).length} booked days`);
            
            res.status(200).json(calendar);
        } catch (error) {
            console.error('Error getting property availability:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Check date availability
    static async checkDateAvailability(req: Request, res: Response): Promise<void> {
        try {
            const { propertyId } = req.params;
            const { startDate, endDate } = req.body;

            if (!propertyId || !startDate || !endDate) {
                res.status(400).json({ message: 'Property ID, start date, and end date are required' });
                return;
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            // Find conflicting bookings
            const conflictingBookings = await Booking.find({
                property: propertyId,
                status: { $in: ['confirmed', 'pending'] },
                $or: [
                    { startDate: { $gte: start, $lt: end } },
                    { endDate: { $gt: start, $lte: end } },
                    { startDate: { $lte: start }, endDate: { $gte: end } }
                ]
            });

            const blockedDates = conflictingBookings.map(booking => {
                const dates = [];
                const current = new Date(booking.startDate);
                const bookingEnd = new Date(booking.endDate);
                
                while (current <= bookingEnd) {
                    dates.push(current.toISOString().split('T')[0]);
                    current.setDate(current.getDate() + 1);
                }
                return dates;
            }).flat();

            res.status(200).json({
                available: conflictingBookings.length === 0,
                blockedDates: Array.from(new Set(blockedDates))
            });
        } catch (error) {
            console.error('Error checking date availability:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Create a new booking
    static async createBooking(req: Request, res: Response): Promise<void> {
        try {
            console.log('=== BOOKING CREATION REQUEST ===');
            console.log('Request body:', JSON.stringify(req.body, null, 2));
            
            const { error } = BookingSchemaValidate.validate(req.body);
            if (error) {
                console.error('Validation error:', error.details[0].message);
                res.status(400).json({ message: error.details[0].message });
                return;
            }

            const bookingData = req.body as IBooking;

            // Check if property exists
            const property = await Property.findById(bookingData.property);
            if (!property) {
                console.error('Property not found:', bookingData.property);
                res.status(404).json({ message: 'Property not found' });
                return;
            }

            console.log('Property found:', {
                id: property._id,
                title: property.title,
                price: property.pricing?.price
            });

            // Check date availability again
            const conflictingBookings = await Booking.find({
                property: bookingData.property,
                status: { $in: ['confirmed', 'pending'] },
                $or: [
                    { startDate: { $gte: bookingData.startDate, $lt: bookingData.endDate } },
                    { endDate: { $gt: bookingData.startDate, $lte: bookingData.endDate } },
                    { startDate: { $lte: bookingData.startDate }, endDate: { $gte: bookingData.endDate } }
                ]
            });

            console.log('Conflict check for dates:', {
                startDate: bookingData.startDate,
                endDate: bookingData.endDate,
                conflictingBookings: conflictingBookings.length
            });

            if (conflictingBookings.length > 0) {
                console.error('Date conflict found:', conflictingBookings.map(b => ({
                    id: b._id,
                    start: b.startDate,
                    end: b.endDate,
                    status: b.status
                })));
                res.status(409).json({ message: 'Selected dates are not available' });
                return;
            }

            // Set payment deadline for offline reservations (3 days from now)
            if (bookingData.reservationType === 'offline') {
                const paymentDeadline = new Date();
                paymentDeadline.setDate(paymentDeadline.getDate() + 3);
                bookingData.paymentDeadline = paymentDeadline;
            }

            console.log('Creating booking with data:', {
                property: bookingData.property,
                tenant: bookingData.tenant,
                startDate: bookingData.startDate,
                endDate: bookingData.endDate,
                totalAmount: bookingData.totalAmount,
                currency: bookingData.currency,
                status: bookingData.status,
                paymentStatus: bookingData.paymentStatus,
                reservationType: bookingData.reservationType,
                paymentDeadline: bookingData.paymentDeadline
            });

            const booking = new Booking(bookingData);
            const savedBooking = await booking.save();
            
            console.log('Booking saved successfully:', {
                id: savedBooking._id,
                property: savedBooking.property,
                startDate: savedBooking.startDate,
                endDate: savedBooking.endDate,
                totalAmount: savedBooking.totalAmount,
                status: savedBooking.status,
                paymentStatus: savedBooking.paymentStatus,
                reservationType: savedBooking.reservationType
            });
            
            await savedBooking.populate('property tenant owner');
            
            // Generate rental contract for all bookings (online and offline)
            try {
                console.log('Generating rental contract for booking:', savedBooking._id);
                const contract = await BookingController.contractService.createContractFromBooking(savedBooking);
                console.log('Contract generated successfully:', contract._id);
                
                // Update booking with contract reference
                savedBooking.metadata = {
                    ...savedBooking.metadata,
                    contractId: contract._id.toString(),
                    contractGenerated: true
                };
                await savedBooking.save();
                
            } catch (contractError) {
                console.error('Error generating contract:', contractError);
                // Don't fail the booking creation if contract generation fails
                // Log the error and continue
            }
            
            // Send notification to property owner
            if (property.owner && realtimeNotificationService) {
                await realtimeNotificationService.notifyNewBooking(
                    property.owner.toString(),
                    {
                        propertyId: bookingData.property.toString(),
                        bookingId: savedBooking._id.toString(),
                        tenantId: bookingData.tenant.toString()
                    }
                );
            }
            
            console.log('Booking populated and ready to return');
            
            res.status(201).json({
                booking: savedBooking,
                message: 'Booking created successfully. A rental contract has been generated and sent to your email.',
                contractGenerated: savedBooking.metadata?.contractGenerated || false
            });
        } catch (error) {
            console.error('=== BOOKING CREATION ERROR ===');
            console.error('Error details:', error);
            if (error instanceof Error) {
                console.error('Stack trace:', error.stack);
                res.status(500).json({ message: 'Internal server error', error: error.message });
            } else {
                console.error('Unknown error type:', typeof error);
                res.status(500).json({ message: 'Internal server error', error: String(error) });
            }
        }
    }

    // Get all bookings
    static async getAllBookings(req: Request, res: Response): Promise<void> {
        try {
            const bookings = await Booking.find()
                .populate('property tenant owner')
                .sort({ createdAt: -1 });
            
            res.status(200).json(bookings);
        } catch (error) {
            console.error('Error getting bookings:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Get booking by ID
    static async getBookingById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            
            const booking = await Booking.findById(id)
                .populate('property tenant owner');
            
            if (!booking) {
                res.status(404).json({ message: 'Booking not found' });
                return;
            }
            
            res.status(200).json(booking);
        } catch (error) {
            console.error('Error getting booking:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Get bookings by user
    static async getBookingsByUser(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            
            const bookings = await Booking.find({
                $or: [{ tenant: userId }, { owner: userId }]
            })
                .populate('property tenant owner')
                .sort({ createdAt: -1 });
            
            res.status(200).json(bookings);
        } catch (error) {
            console.error('Error getting user bookings:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Get user reservations (as tenant only) with populated property details
    static async getUserReservations(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { populate } = req.query;
            
            let query = Booking.find({ tenant: userId });
            
            if (populate === 'property') {
                query = query.populate({
                    path: 'property',
                    select: 'title address images media pricing owner'
                }) as any; // Type assertion to fix the TypeScript error
            }
            
            const bookings = await query
                .populate('owner', 'firstName lastName email phone')
                .sort({ createdAt: -1 });
            
            res.status(200).json(bookings);
        } catch (error) {
            console.error('Error getting user reservations:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Get agent's property bookings
    static async getAgentBookings(req: Request, res: Response): Promise<void> {
        try {
            const { agentId } = req.params;
            
            // First find all properties owned by this agent
            const agentProperties = await Property.find({ owner: agentId });
            const propertyIds = agentProperties.map(prop => prop._id);
            
            // Then find all bookings for these properties
            const bookings = await Booking.find({
                property: { $in: propertyIds }
            })
                .populate('property', 'title address images media pricing')
                .populate('tenant', 'firstName lastName email phone')
                .sort({ createdAt: -1 });
            
            res.status(200).json(bookings);
        } catch (error) {
            console.error('Error getting agent bookings:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Get user booking calendar data
    static async getUserBookingCalendar(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { year } = req.query;
            
            const currentYear = year ? parseInt(year as string) : new Date().getFullYear();
            const startDate = new Date(currentYear, 0, 1);
            const endDate = new Date(currentYear, 11, 31);
            
            const bookings = await Booking.find({
                tenant: userId,
                startDate: { $gte: startDate, $lte: endDate }
            })
                .populate({
                    path: 'property',
                    select: 'title address images media'
                })
                .sort({ startDate: 1 });
            
            // Format for calendar view
            const calendarData = bookings.map(booking => ({
                id: booking._id,
                title: (booking.property as any)?.title || 'Reservation',
                start: booking.startDate,
                end: booking.endDate,
                status: booking.status,
                paymentStatus: booking.paymentStatus,
                totalAmount: booking.totalAmount,
                currency: booking.currency,
                property: booking.property
            }));
            
            res.status(200).json(calendarData);
        } catch (error) {
            console.error('Error getting user booking calendar:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Update booking status
    static async updateBookingStatus(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { status, paymentStatus } = req.body;
            
            const booking = await Booking.findByIdAndUpdate(
                id,
                { 
                    ...(status && { status }),
                    ...(paymentStatus && { paymentStatus })
                },
                { new: true }
            ).populate('property tenant owner');
            
            if (!booking) {
                res.status(404).json({ message: 'Booking not found' });
                return;
            }

            // Send notification if booking is confirmed
            if (status === 'confirmed' && booking.tenant && realtimeNotificationService) {
                const tenantId = typeof booking.tenant === 'string' 
                    ? booking.tenant 
                    : booking.tenant._id?.toString() || booking.tenant.toString();
                
                await realtimeNotificationService.notifyBookingConfirmed(
                    tenantId,
                    {
                        bookingId: booking._id.toString(),
                        status: status
                    }
                );
            }
            
            res.status(200).json(booking);
        } catch (error) {
            console.error('Error updating booking:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    // Cancel booking
    static async cancelBooking(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            
            const booking = await Booking.findByIdAndUpdate(
                id,
                { status: 'cancelled' },
                { new: true }
            ).populate('property tenant owner');
            
            if (!booking) {
                res.status(404).json({ message: 'Booking not found' });
                return;
            }
            
            res.status(200).json(booking);
        } catch (error) {
            console.error('Error cancelling booking:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
