import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { InvoiceService } from '../Services/invoice.service';
import { logger } from '../Config/logger.config';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Configure multer for PDF uploads
const storage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
        const dir = path.join(process.cwd(), 'uploads', 'invoices');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `invoice-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req: any, file: any, cb: any) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

@injectable()
export class InvoiceController {
    constructor(
        @inject('InvoiceService') private invoiceService: InvoiceService
    ) {}

    // Create invoice from booking
    createInvoiceFromBooking = async (req: Request, res: Response): Promise<void> => {
        try {
            const { bookingId } = req.params;
            
            if (!bookingId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Booking ID is required' 
                });
                return;
            }

            const invoice = await this.invoiceService.createInvoiceFromBooking(bookingId);
            
            res.status(201).json({
                success: true,
                message: 'Invoice created successfully',
                data: invoice
            });
        } catch (error) {
            logger.error('Error creating invoice from booking:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    };

    // Get user invoices
    getUserInvoices = async (req: Request, res: Response): Promise<void> => {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            if (!userId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'User ID is required' 
                });
                return;
            }

            const result = await this.invoiceService.getUserInvoices(userId, page, limit);
            
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error getting user invoices:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    // Get agent invoices
    getAgentInvoices = async (req: Request, res: Response): Promise<void> => {
        try {
            const { agentId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            if (!agentId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Agent ID is required' 
                });
                return;
            }

            const result = await this.invoiceService.getAgentInvoices(agentId, page, limit);
            
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error getting agent invoices:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    // Get all invoices (admin)
    getAllInvoices = async (req: Request, res: Response): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            
            const filters: any = {};
            if (req.query.status) filters.status = req.query.status;
            if (req.query.userId) filters.userId = req.query.userId;
            if (req.query.agentId) filters.agentId = req.query.agentId;
            if (req.query.startDate) filters.startDate = req.query.startDate;
            if (req.query.endDate) filters.endDate = req.query.endDate;

            const result = await this.invoiceService.getAllInvoices(page, limit, filters);
            
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('Error getting all invoices:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    // Get invoice by ID
    getInvoiceById = async (req: Request, res: Response): Promise<void> => {
        try {
            const { invoiceId } = req.params;

            if (!invoiceId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Invoice ID is required' 
                });
                return;
            }

            const invoice = await this.invoiceService.getInvoiceById(invoiceId);
            
            if (!invoice) {
                res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: invoice
            });
        } catch (error) {
            logger.error('Error getting invoice by ID:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    // Update invoice status
    updateInvoiceStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const { invoiceId } = req.params;
            const { status, paymentDate } = req.body;

            if (!invoiceId || !status) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Invoice ID and status are required' 
                });
                return;
            }

            const validStatuses = ['sent', 'paid', 'overdue', 'cancelled'];
            if (!validStatuses.includes(status)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
                });
                return;
            }

            const invoice = await this.invoiceService.updateInvoiceStatus(
                invoiceId, 
                status, 
                paymentDate ? new Date(paymentDate) : undefined
            );

            if (!invoice) {
                res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Invoice status updated successfully',
                data: invoice
            });
        } catch (error) {
            logger.error('Error updating invoice status:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    // Upload invoice PDF
    uploadInvoicePDF = async (req: Request, res: Response): Promise<void> => {
        try {
            upload.single('pdf')(req, res, async (err: any) => {
                if (err) {
                    if (err instanceof multer.MulterError) {
                        if (err.code === 'LIMIT_FILE_SIZE') {
                            res.status(400).json({
                                success: false,
                                message: 'File too large. Maximum size is 10MB.'
                            });
                            return;
                        }
                    }
                    res.status(400).json({
                        success: false,
                        message: err.message
                    });
                    return;
                }

                const { invoiceId } = req.params;
                const file = req.file;

                if (!invoiceId) {
                    res.status(400).json({ 
                        success: false, 
                        message: 'Invoice ID is required' 
                    });
                    return;
                }

                if (!file) {
                    res.status(400).json({
                        success: false,
                        message: 'PDF file is required'
                    });
                    return;
                }

                const pdfUrl = `/uploads/invoices/${file.filename}`;
                const invoice = await this.invoiceService.uploadInvoicePDF(invoiceId, pdfUrl);

                if (!invoice) {
                    res.status(404).json({
                        success: false,
                        message: 'Invoice not found'
                    });
                    return;
                }

                res.status(200).json({
                    success: true,
                    message: 'PDF uploaded successfully',
                    data: {
                        pdfUrl,
                        invoice
                    }
                });
            });
        } catch (error) {
            logger.error('Error uploading invoice PDF:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    // Generate invoice PDF
    generateInvoicePDF = async (req: Request, res: Response): Promise<void> => {
        try {
            const { invoiceId } = req.params;

            if (!invoiceId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Invoice ID is required' 
                });
                return;
            }

            const pdfUrl = await this.invoiceService.generateInvoicePDF(invoiceId);
            
            res.status(200).json({
                success: true,
                message: 'PDF generated successfully',
                data: { pdfUrl }
            });
        } catch (error) {
            logger.error('Error generating invoice PDF:', error);
            res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Internal server error'
            });
        }
    };

    // Download invoice PDF
    downloadInvoicePDF = async (req: Request, res: Response): Promise<void> => {
        try {
            const { invoiceId } = req.params;

            if (!invoiceId) {
                res.status(400).json({ 
                    success: false, 
                    message: 'Invoice ID is required' 
                });
                return;
            }

            const invoice = await this.invoiceService.getInvoiceById(invoiceId);
            
            if (!invoice) {
                res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
                return;
            }

            let pdfUrl = invoice.pdfUrl;
            
            // Generate PDF if not exists
            if (!pdfUrl) {
                pdfUrl = await this.invoiceService.generateInvoicePDF(invoiceId);
            }

            const filePath = path.join(process.cwd(), pdfUrl);
            
            if (!fs.existsSync(filePath)) {
                res.status(404).json({
                    success: false,
                    message: 'PDF file not found'
                });
                return;
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
            
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        } catch (error) {
            logger.error('Error downloading invoice PDF:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    // Mark overdue invoices
    markOverdueInvoices = async (req: Request, res: Response): Promise<void> => {
        try {
            const count = await this.invoiceService.markOverdueInvoices();
            
            res.status(200).json({
                success: true,
                message: `Marked ${count} invoices as overdue`,
                data: { overdueCount: count }
            });
        } catch (error) {
            logger.error('Error marking overdue invoices:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };

    // Get invoice statistics
    getInvoiceStatistics = async (req: Request, res: Response): Promise<void> => {
        try {
            const stats = await this.invoiceService.getInvoiceStatistics();
            
            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Error getting invoice statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    };
}
