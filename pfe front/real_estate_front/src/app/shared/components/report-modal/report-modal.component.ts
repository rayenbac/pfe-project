import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { CreateReportRequest } from '../../../core/models/report.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './report-modal.component.html',
  styleUrls: ['./report-modal.component.css']
})
export class ReportModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() targetType: 'post' | 'property' | 'agent' | 'agency' = 'post';
  @Input() targetId = '';
  @Input() targetTitle = '';
  @Output() close = new EventEmitter<void>();
  @Output() reportSubmitted = new EventEmitter<void>();

  reportForm: FormGroup;
  isSubmitting = false;
  
  categories = [
    { value: 'spam', label: 'Spam' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'fake_listing', label: 'Fake Listing' },
    { value: 'fraud', label: 'Fraud' },
    { value: 'offensive_language', label: 'Offensive Language' },
    { value: 'copyright_violation', label: 'Copyright Violation' },
    { value: 'other', label: 'Other' }
  ];

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService
  ) {
    this.reportForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      category: ['', Validators.required],
      priority: ['low']
    });
  }

  ngOnInit(): void {
    // Reset form when modal opens
    if (this.isOpen) {
      this.reportForm.reset({
        reason: '',
        category: '',
        priority: 'low'
      });
    }
  }

  closeModal(): void {
    this.reportForm.reset();
    this.close.emit();
  }

  onSubmit(): void {
    if (this.reportForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const reportData: CreateReportRequest = {
        targetType: this.targetType,
        targetId: this.targetId,
        reason: this.reportForm.value.reason,
        category: this.reportForm.value.category,
        priority: this.reportForm.value.priority
      };

      this.reportService.createReport(reportData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            Swal.fire({
              title: 'Report Submitted',
              text: 'Thank you for your report. We will review it and take appropriate action.',
              icon: 'success',
              confirmButtonText: 'OK'
            });
            this.reportSubmitted.emit();
            this.closeModal();
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error submitting report:', error);
          Swal.fire({
            title: 'Error',
            text: error.error?.message || 'Failed to submit report. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      });
    }
  }

  // Handle backdrop click
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  // Getters for form validation
  get reason() {
    return this.reportForm.get('reason');
  }

  get category() {
    return this.reportForm.get('category');
  }

  get remainingChars(): number {
    const reason = this.reportForm.get('reason')?.value || '';
    return 1000 - reason.length;
  }
}
