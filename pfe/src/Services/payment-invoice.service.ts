import { PaymentInvoice, IPaymentInvoice } from '../Models/payment-invoice.model';
import { Types } from 'mongoose';
import PDFDocument from 'pdfkit';

export class PaymentInvoiceService {
  
  // Get agent's invoices
  async getAgentInvoices(agentId: string, status?: string): Promise<IPaymentInvoice[]> {
    try {
      const query: any = { agentId: new Types.ObjectId(agentId) };
      
      if (status && status !== 'all') {
        query.status = status;
      }

      const invoices = await PaymentInvoice.find(query)
        .populate('bookingId', 'property startDate endDate totalAmount')
        .populate('contractId', 'title type amount')
        .sort({ createdAt: -1 })
        .exec();
      
      return invoices;
    } catch (error) {
      throw new Error(`Failed to fetch agent invoices: ${error}`);
    }
  }

  // Create new invoice
  async createInvoice(invoiceData: Partial<IPaymentInvoice>): Promise<IPaymentInvoice> {
    try {
      const invoice = new PaymentInvoice(invoiceData);
      await invoice.save();
      
      // Populate the created invoice
      const populatedInvoice = await PaymentInvoice.findById(invoice._id)
        .populate('bookingId', 'property startDate endDate totalAmount')
        .populate('contractId', 'title type amount')
        .exec();
      
      return populatedInvoice!;
    } catch (error) {
      throw new Error(`Failed to create invoice: ${error}`);
    }
  }

  // Update invoice
  async updateInvoice(invoiceId: string, updateData: Partial<IPaymentInvoice>): Promise<IPaymentInvoice | null> {
    try {
      const invoice = await PaymentInvoice.findByIdAndUpdate(
        invoiceId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('bookingId', 'property startDate endDate totalAmount')
        .populate('contractId', 'title type amount')
        .exec();
      
      return invoice;
    } catch (error) {
      throw new Error(`Failed to update invoice: ${error}`);
    }
  }

  // Mark invoice as paid
  async markAsPaid(invoiceId: string, paymentData: { paymentMethod: string; paymentReference: string }): Promise<IPaymentInvoice | null> {
    try {
      const updateData = {
        status: 'paid' as const,
        paidDate: new Date(),
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference
      };

      return await this.updateInvoice(invoiceId, updateData);
    } catch (error) {
      throw new Error(`Failed to mark invoice as paid: ${error}`);
    }
  }

  // Generate invoice PDF
  async generateInvoicePDF(invoiceId: string): Promise<Buffer | null> {
    try {
      const invoice = await PaymentInvoice.findById(invoiceId)
        .populate('agentId', 'firstName lastName email phone address')
        .populate('bookingId', 'property startDate endDate totalAmount')
        .populate('contractId', 'title type amount')
        .exec();

      if (!invoice) {
        return null;
      }

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // PDF content
        doc.fontSize(20).text('INVOICE', 100, 100);
        doc.fontSize(12);
        
        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 100, 140);
        doc.text(`Date: ${invoice.createdAt.toDateString()}`, 100, 160);
        doc.text(`Due Date: ${invoice.dueDate.toDateString()}`, 100, 180);
        doc.text(`Status: ${invoice.status.toUpperCase()}`, 100, 200);
        
        doc.text('FROM (AGENT):', 100, 240);
        doc.text(`${(invoice.agentId as any).firstName} ${(invoice.agentId as any).lastName}`, 100, 260);
        doc.text(`${(invoice.agentId as any).email}`, 100, 280);
        doc.text(`${(invoice.agentId as any).phone || ''}`, 100, 300);
        
        doc.text('TO (CLIENT):', 100, 340);
        doc.text(`${invoice.clientInfo.name}`, 100, 360);
        doc.text(`${invoice.clientInfo.email}`, 100, 380);
        doc.text(`${invoice.clientInfo.phone || ''}`, 100, 400);
        if (invoice.clientInfo.address) {
          doc.text(`${invoice.clientInfo.address}`, 100, 420);
        }
        
        doc.text('INVOICE DETAILS:', 100, 460);
        doc.text(`Title: ${invoice.title}`, 100, 480);
        doc.text(`Description: ${invoice.description}`, 100, 500, { width: 400 });
        
        // Items breakdown
        if (invoice.itemsBreakdown && invoice.itemsBreakdown.length > 0) {
          doc.text('ITEMS:', 100, 540);
          let y = 560;
          invoice.itemsBreakdown.forEach((item, index) => {
            doc.text(`${index + 1}. ${item.description}`, 100, y);
            doc.text(`Qty: ${item.quantity} x ${invoice.currency} ${item.unitPrice} = ${invoice.currency} ${item.total}`, 120, y + 15);
            y += 35;
          });
        }
        
        // Totals
        const totalsY = invoice.itemsBreakdown ? 640 : 540;
        doc.text('TOTALS:', 100, totalsY);
        doc.text(`Subtotal: ${invoice.currency} ${invoice.amount}`, 100, totalsY + 20);
        doc.text(`Commission (${invoice.commissionRate}%): ${invoice.currency} ${invoice.commission}`, 100, totalsY + 40);
        doc.text(`Tax (${invoice.taxRate}%): ${invoice.currency} ${invoice.taxAmount}`, 100, totalsY + 60);
        doc.text(`TOTAL: ${invoice.currency} ${invoice.totalAmount}`, 100, totalsY + 80);
        
        if (invoice.notes) {
          doc.text('NOTES:', 100, totalsY + 120);
          doc.text(invoice.notes, 100, totalsY + 140, { width: 400 });
        }
        
        if (invoice.paidDate) {
          doc.text(`PAID ON: ${invoice.paidDate.toDateString()}`, 100, totalsY + 180);
          if (invoice.paymentMethod) {
            doc.text(`Payment Method: ${invoice.paymentMethod}`, 100, totalsY + 200);
          }
          if (invoice.paymentReference) {
            doc.text(`Reference: ${invoice.paymentReference}`, 100, totalsY + 220);
          }
        }

        doc.end();
      });
    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error}`);
    }
  }

  // Get invoice by ID
  async getInvoiceById(invoiceId: string): Promise<IPaymentInvoice | null> {
    try {
      const invoice = await PaymentInvoice.findById(invoiceId)
        .populate('agentId', 'firstName lastName email phone')
        .populate('bookingId', 'property startDate endDate totalAmount')
        .populate('contractId', 'title type amount')
        .exec();
      
      return invoice;
    } catch (error) {
      throw new Error(`Failed to fetch invoice: ${error}`);
    }
  }

  // Delete invoice
  async deleteInvoice(invoiceId: string): Promise<boolean> {
    try {
      const result = await PaymentInvoice.findByIdAndDelete(invoiceId).exec();
      return !!result;
    } catch (error) {
      throw new Error(`Failed to delete invoice: ${error}`);
    }
  }

  // Get invoice statistics for agent
  async getInvoiceStats(agentId: string): Promise<any> {
    try {
      const pipeline = [
        { $match: { agentId: new Types.ObjectId(agentId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
            totalCommission: { $sum: '$commission' }
          }
        }
      ];

      const stats = await PaymentInvoice.aggregate(pipeline).exec();
      
      // Calculate totals
      const totalInvoices = await PaymentInvoice.countDocuments({ agentId: new Types.ObjectId(agentId) });
      const totalAmount = await PaymentInvoice.aggregate([
        { $match: { agentId: new Types.ObjectId(agentId) } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      const totalCommission = await PaymentInvoice.aggregate([
        { $match: { agentId: new Types.ObjectId(agentId) } },
        { $group: { _id: null, total: { $sum: '$commission' } } }
      ]);
      const pendingAmount = await PaymentInvoice.aggregate([
        { $match: { agentId: new Types.ObjectId(agentId), status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);

      return {
        byStatus: stats,
        totalInvoices,
        totalAmount: totalAmount[0]?.total || 0,
        totalCommission: totalCommission[0]?.total || 0,
        pendingAmount: pendingAmount[0]?.total || 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch invoice stats: ${error}`);
    }
  }

  // Send invoice reminder
  async sendInvoiceReminder(invoiceId: string): Promise<boolean> {
    try {
      const invoice = await this.getInvoiceById(invoiceId);
      if (!invoice || invoice.status !== 'pending') {
        return false;
      }

      // Here you would implement email sending logic
      // For now, just update the last reminder date in metadata
      await this.updateInvoice(invoiceId, {
        metadata: {
          ...invoice.metadata,
          lastReminderSent: new Date()
        }
      });

      return true;
    } catch (error) {
      throw new Error(`Failed to send invoice reminder: ${error}`);
    }
  }

  // Auto-update overdue invoices
  async updateOverdueInvoices(): Promise<number> {
    try {
      const result = await PaymentInvoice.updateMany(
        {
          status: 'pending',
          dueDate: { $lt: new Date() }
        },
        {
          $set: { status: 'overdue' }
        }
      );

      return result.modifiedCount;
    } catch (error) {
      throw new Error(`Failed to update overdue invoices: ${error}`);
    }
  }
}
