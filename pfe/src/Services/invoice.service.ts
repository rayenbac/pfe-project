import { injectable } from 'inversify';
import { Invoice, IInvoice } from '../Models/invoice';
import { Booking } from '../Models/booking';
import { User } from '../Models/user';
import { Property } from '../Models/property';
import { logger } from '../Config/logger.config';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@injectable()
export class InvoiceService {

    async createInvoiceFromBooking(bookingId: string): Promise<IInvoice> {
        try {
            // Get booking details with populated references
            const booking = await Booking.findById(bookingId)
                .populate('tenant', 'firstName lastName email')
                .populate('property', 'title address pricing')
                .populate('owner', 'firstName lastName email');

            if (!booking) {
                throw new Error('Booking not found');
            }

            // Check if invoice already exists for this booking
            const existingInvoice = await Invoice.findOne({ bookingId });
            if (existingInvoice) {
                return existingInvoice;
            }

            const user = booking.tenant as any;
            const property = booking.property as any;
            const agent = booking.owner as any;

            // Calculate nights
            const checkIn = new Date(booking.startDate);
            const checkOut = new Date(booking.endDate);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

            // Create invoice items
            const pricePerNight = booking.metadata?.pricePerDay || (booking.totalAmount / nights);
            const items = [
                {
                    description: `${property.title} - ${nights} night(s)`,
                    quantity: nights,
                    unitPrice: pricePerNight,
                    total: nights * pricePerNight
                }
            ];

            // Add extra guest surcharge if any
            if (booking.extraGuestSurcharge && booking.extraGuestSurcharge > 0) {
                items.push({
                    description: 'Extra Guest Surcharge',
                    quantity: 1,
                    unitPrice: booking.extraGuestSurcharge,
                    total: booking.extraGuestSurcharge
                });
            }

            // Calculate amounts
            const subtotal = items.reduce((sum, item) => sum + item.total, 0);
            const tax = 0; // No tax info in current booking model
            const fees = booking.extraGuestSurcharge || 0;
            const total = booking.totalAmount;

            // Create invoice
            const invoice = new Invoice({
                bookingId: booking._id,
                userId: booking.tenant,
                propertyId: booking.property,
                agentId: booking.owner,
                status: booking.paymentStatus === 'paid' ? 'paid' : 'sent',
                amount: {
                    subtotal: subtotal - fees,
                    tax,
                    fees,
                    total
                },
                items,
                billingAddress: {
                    name: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                    phone: booking.contactInfo?.phone || '',
                    address: booking.contactInfo?.address || '',
                    city: '', // Not available in current booking model
                    state: '', // Not available in current booking model
                    zipCode: '', // Not available in current booking model
                    country: 'USA' // Default country
                },
                paymentMethod: 'Credit Card', // Default payment method
                paymentDate: booking.paymentStatus === 'paid' ? booking.updatedAt : undefined,
                metadata: {
                    checkInDate: booking.startDate,
                    checkOutDate: booking.endDate,
                    nights,
                    guests: booking.guestCount
                }
            });

            await invoice.save();
            logger.info(`Invoice created for booking ${bookingId}: ${invoice.invoiceNumber}`);
            
            return invoice;
        } catch (error) {
            logger.error('Error creating invoice from booking:', error);
            throw error;
        }
    }

    async getUserInvoices(userId: string, page: number = 1, limit: number = 10): Promise<{ invoices: IInvoice[], total: number, pages: number }> {
        try {
            const skip = (page - 1) * limit;
            
            const [invoices, total] = await Promise.all([
                Invoice.find({ userId })
                    .populate('booking')
                    .populate('user', 'firstName lastName email')
                    .populate('property', 'title address images')
                    .populate('agent', 'firstName lastName email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Invoice.countDocuments({ userId })
            ]);

            return {
                invoices,
                total,
                pages: Math.ceil(total / limit)
            };
        } catch (error) {
            logger.error('Error getting user invoices:', error);
            throw error;
        }
    }

    async getAgentInvoices(agentId: string, page: number = 1, limit: number = 10): Promise<{ invoices: IInvoice[], total: number, pages: number }> {
        try {
            const skip = (page - 1) * limit;
            
            const [invoices, total] = await Promise.all([
                Invoice.find({ agentId })
                    .populate('booking')
                    .populate('user', 'firstName lastName email')
                    .populate('property', 'title address images')
                    .populate('agent', 'firstName lastName email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Invoice.countDocuments({ agentId })
            ]);

            return {
                invoices,
                total,
                pages: Math.ceil(total / limit)
            };
        } catch (error) {
            logger.error('Error getting agent invoices:', error);
            throw error;
        }
    }

    async getAllInvoices(page: number = 1, limit: number = 10, filters?: any): Promise<{ invoices: IInvoice[], total: number, pages: number }> {
        try {
            const skip = (page - 1) * limit;
            let query: any = {};

            // Apply filters
            if (filters) {
                if (filters.status) query.status = filters.status;
                if (filters.userId) query.userId = filters.userId;
                if (filters.agentId) query.agentId = filters.agentId;
                if (filters.startDate || filters.endDate) {
                    query.invoiceDate = {};
                    if (filters.startDate) query.invoiceDate.$gte = new Date(filters.startDate);
                    if (filters.endDate) query.invoiceDate.$lte = new Date(filters.endDate);
                }
            }

            const [invoices, total] = await Promise.all([
                Invoice.find(query)
                    .populate('booking')
                    .populate('user', 'firstName lastName email')
                    .populate('property', 'title address images')
                    .populate('agent', 'firstName lastName email')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),
                Invoice.countDocuments(query)
            ]);

            return {
                invoices,
                total,
                pages: Math.ceil(total / limit)
            };
        } catch (error) {
            logger.error('Error getting all invoices:', error);
            throw error;
        }
    }

    async getInvoiceById(invoiceId: string): Promise<IInvoice | null> {
        try {
            return await Invoice.findById(invoiceId)
                .populate('booking')
                .populate('user', 'firstName lastName email phone')
                .populate('property', 'title address images pricing')
                .populate('agent', 'firstName lastName email');
        } catch (error) {
            logger.error('Error getting invoice by ID:', error);
            throw error;
        }
    }

    async updateInvoiceStatus(invoiceId: string, status: string, paymentDate?: Date): Promise<IInvoice | null> {
        try {
            const updateData: any = { status };
            if (status === 'paid' && paymentDate) {
                updateData.paymentDate = paymentDate;
            }

            const invoice = await Invoice.findByIdAndUpdate(
                invoiceId,
                updateData,
                { new: true }
            );

            if (invoice) {
                logger.info(`Invoice ${invoice.invoiceNumber} status updated to ${status}`);
            }

            return invoice;
        } catch (error) {
            logger.error('Error updating invoice status:', error);
            throw error;
        }
    }

    async uploadInvoicePDF(invoiceId: string, pdfUrl: string): Promise<IInvoice | null> {
        try {
            const invoice = await Invoice.findByIdAndUpdate(
                invoiceId,
                { pdfUrl },
                { new: true }
            );

            if (invoice) {
                logger.info(`PDF uploaded for invoice ${invoice.invoiceNumber}`);
            }

            return invoice;
        } catch (error) {
            logger.error('Error uploading invoice PDF:', error);
            throw error;
        }
    }

    async generateInvoicePDF(invoiceId: string): Promise<string> {
        try {
            const invoice = await this.getInvoiceById(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            const property = (invoice as any).property || {};
            const user = (invoice as any).user || {};
            const agent = (invoice as any).agent || {};

            // Create PDF
            const doc = new PDFDocument({ margin: 50 });
            const fileName = `invoice-${invoice.invoiceNumber}.pdf`;
            const filePath = path.join(process.cwd(), 'uploads', 'invoices', fileName);

            // Ensure directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            doc.pipe(fs.createWriteStream(filePath));

            // Header
            doc.fontSize(20).text('INVOICE', 50, 50);
            doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`, 400, 50);
            doc.text(`Date: ${invoice.invoiceDate.toLocaleDateString()}`, 400, 70);
            doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, 400, 90);

            // Billing Information
            doc.fontSize(14).text('Bill To:', 50, 130);
            doc.fontSize(12)
                .text(invoice.billingAddress.name, 50, 150)
                .text(invoice.billingAddress.email, 50, 170)
                .text(invoice.billingAddress.address, 50, 190)
                .text(`${invoice.billingAddress.city}, ${invoice.billingAddress.state} ${invoice.billingAddress.zipCode}`, 50, 210);

            // Property Information
            doc.fontSize(14).text('Property:', 300, 130);
            doc.fontSize(12)
                .text(property.title, 300, 150)
                .text(`Check-in: ${invoice.metadata.checkInDate.toLocaleDateString()}`, 300, 170)
                .text(`Check-out: ${invoice.metadata.checkOutDate.toLocaleDateString()}`, 300, 190)
                .text(`Guests: ${invoice.metadata.guests}`, 300, 210);

            // Items Table
            const tableTop = 280;
            doc.fontSize(12);
            
            // Table headers
            doc.text('Description', 50, tableTop);
            doc.text('Qty', 300, tableTop);
            doc.text('Unit Price', 350, tableTop);
            doc.text('Total', 450, tableTop);
            
            // Draw line under headers
            doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

            // Items
            let yPosition = tableTop + 40;
            invoice.items.forEach((item) => {
                doc.text(item.description, 50, yPosition);
                doc.text(item.quantity.toString(), 300, yPosition);
                doc.text(`$${item.unitPrice.toFixed(2)}`, 350, yPosition);
                doc.text(`$${item.total.toFixed(2)}`, 450, yPosition);
                yPosition += 25;
            });

            // Totals
            yPosition += 20;
            doc.text(`Subtotal: $${invoice.amount.subtotal.toFixed(2)}`, 350, yPosition);
            yPosition += 20;
            if (invoice.amount.tax > 0) {
                doc.text(`Tax: $${invoice.amount.tax.toFixed(2)}`, 350, yPosition);
                yPosition += 20;
            }
            if (invoice.amount.fees > 0) {
                doc.text(`Fees: $${invoice.amount.fees.toFixed(2)}`, 350, yPosition);
                yPosition += 20;
            }
            doc.fontSize(14).text(`Total: $${invoice.amount.total.toFixed(2)}`, 350, yPosition);

            // Footer
            doc.fontSize(10).text('Thank you for your business!', 50, yPosition + 60);
            doc.text(`Agent: ${agent.firstName} ${agent.lastName} (${agent.email})`, 50, yPosition + 80);

            doc.end();

            // Update invoice with PDF URL
            const pdfUrl = `/uploads/invoices/${fileName}`;
            await this.uploadInvoicePDF(invoiceId, pdfUrl);

            return pdfUrl;
        } catch (error) {
            logger.error('Error generating invoice PDF:', error);
            throw error;
        }
    }

    async markOverdueInvoices(): Promise<number> {
        try {
            const result = await Invoice.updateMany(
                {
                    status: 'sent',
                    dueDate: { $lt: new Date() }
                },
                { status: 'overdue' }
            );

            logger.info(`Marked ${result.modifiedCount} invoices as overdue`);
            return result.modifiedCount;
        } catch (error) {
            logger.error('Error marking overdue invoices:', error);
            throw error;
        }
    }

    async getInvoiceStatistics(): Promise<any> {
        try {
            const stats = await Invoice.aggregate([
                {
                    $group: {
                        _id: null,
                        totalInvoices: { $sum: 1 },
                        totalAmount: { $sum: '$amount.total' },
                        paidAmount: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'paid'] }, '$amount.total', 0]
                            }
                        },
                        pendingAmount: {
                            $sum: {
                                $cond: [{ $ne: ['$status', 'paid'] }, '$amount.total', 0]
                            }
                        },
                        overdueCount: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0]
                            }
                        }
                    }
                }
            ]);

            const statusBreakdown = await Invoice.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        amount: { $sum: '$amount.total' }
                    }
                }
            ]);

            return {
                overview: stats[0] || {
                    totalInvoices: 0,
                    totalAmount: 0,
                    paidAmount: 0,
                    pendingAmount: 0,
                    overdueCount: 0
                },
                statusBreakdown
            };
        } catch (error) {
            logger.error('Error getting invoice statistics:', error);
            throw error;
        }
    }
}
