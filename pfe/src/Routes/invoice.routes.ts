import { Router } from 'express';
import { diContainer } from '../DI/iversify.config';
import { InvoiceController } from '../Controllers/invoice.controller';
import { authenticateToken } from '../Middlewares/auth.middleware';
import { roleMiddleware } from '../Middlewares/role.middleware';

const router = Router();
const invoiceController = diContainer.get<InvoiceController>('InvoiceController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create invoice from booking (admin/agent)
router.post('/booking/:bookingId', 
    roleMiddleware(['admin', 'agent']),
    invoiceController.createInvoiceFromBooking
);

// Get user invoices (user can view their own invoices)
router.get('/user/:userId', 
    invoiceController.getUserInvoices
);

// Get agent invoices (agent can view their own invoices)
router.get('/agent/:agentId',
    roleMiddleware(['admin', 'agent']),
    invoiceController.getAgentInvoices
);

// Get all invoices with filters (admin only)
router.get('/',
    roleMiddleware(['admin']),
    invoiceController.getAllInvoices
);

// Get invoice by ID
router.get('/:invoiceId',
    invoiceController.getInvoiceById
);

// Update invoice status (admin/agent)
router.put('/:invoiceId/status',
    roleMiddleware(['admin', 'agent']),
    invoiceController.updateInvoiceStatus
);

// Upload invoice PDF
router.post('/:invoiceId/upload-pdf',
    invoiceController.uploadInvoicePDF
);

// Generate invoice PDF
router.post('/:invoiceId/generate-pdf',
    invoiceController.generateInvoicePDF
);

// Download invoice PDF
router.get('/:invoiceId/download',
    invoiceController.downloadInvoicePDF
);

// Mark overdue invoices (admin only)
router.post('/mark-overdue',
    roleMiddleware(['admin']),
    invoiceController.markOverdueInvoices
);

// Get invoice statistics (admin only)
router.get('/stats/overview',
    roleMiddleware(['admin']),
    invoiceController.getInvoiceStatistics
);

export default router;
