import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../../services/invoice.service';
import { Invoice } from '../../../interfaces/invoice.interface';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.css']
})
export class InvoiceDetailComponent implements OnInit {
  invoice: Invoice | null = null;
  loading = false;
  error: string | null = null;
  uploadingPdf = false;
  selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit(): void {
    const invoiceId = this.route.snapshot.paramMap.get('id');
    if (invoiceId) {
      this.loadInvoice(invoiceId);
    }
  }

  loadInvoice(invoiceId: string): void {
    this.loading = true;
    this.error = null;
    
    this.invoiceService.getInvoiceById(invoiceId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.invoice = response.data;
          }
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Failed to load invoice';
          this.loading = false;
          console.error('Error loading invoice:', error);
        }
      });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    } else {
      this.error = 'Please select a valid PDF file';
    }
  }

  uploadPdf(): void {
    if (!this.selectedFile || !this.invoice) return;

    this.uploadingPdf = true;
    this.error = null;

    this.invoiceService.uploadInvoicePDF(this.invoice._id, this.selectedFile)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.invoice!.pdfUrl = response.data.pdfUrl;
            this.selectedFile = null;
            // Reset file input
            const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          }
          this.uploadingPdf = false;
        },
        error: (error) => {
          this.error = 'Failed to upload PDF';
          this.uploadingPdf = false;
          console.error('Error uploading PDF:', error);
        }
      });
  }

  generatePdf(): void {
    if (!this.invoice) return;

    this.invoiceService.generateInvoicePDF(this.invoice._id)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.invoice!.pdfUrl = response.data.pdfUrl;
          }
        },
        error: (error) => {
          this.error = 'Failed to generate PDF';
          console.error('Error generating PDF:', error);
        }
      });
  }

  downloadPdf(): void {
    if (!this.invoice) return;

    this.invoiceService.downloadInvoicePDF(this.invoice._id)
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${this.invoice!.invoiceNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        },
        error: (error) => {
          this.error = 'Failed to download PDF';
          console.error('Error downloading PDF:', error);
        }
      });
  }

  updateStatus(status: string): void {
    if (!this.invoice) return;

    const paymentDate = status === 'paid' ? new Date() : undefined;
    
    this.invoiceService.updateInvoiceStatus(this.invoice._id, status, paymentDate)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.invoice!.status = status as any;
            if (paymentDate) {
              this.invoice!.paymentDate = paymentDate;
            }
          }
        },
        error: (error) => {
          this.error = 'Failed to update status';
          console.error('Error updating status:', error);
        }
      });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'sent': return 'badge-warning';
      case 'overdue': return 'badge-danger';
      case 'cancelled': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }
}
