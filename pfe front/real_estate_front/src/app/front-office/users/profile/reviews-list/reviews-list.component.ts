import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Review, CreateReviewRequest } from '../../../../core/models/review.model';
import { ReviewService } from '../../../../core/services/review.service';

@Component({
  selector: 'app-reviews-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reviews-list.component.html',
  styleUrls: ['./reviews-list.component.css']
})
export class ReviewsListComponent implements OnInit {
  reviews: Review[] = [];
  loading = false;
  showWriteReview = false;
  reviewForm: FormGroup;
  submitting = false;
  
  message = '';
  messageType: 'success' | 'error' | '' = '';

  constructor(
    private reviewService: ReviewService,
    private fb: FormBuilder
  ) {
    this.reviewForm = this.fb.group({
      propertyId: ['', [Validators.required]],
      rating: ['', [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading = true;
    this.reviewService.getUserReviews().subscribe({
      next: (reviews: Review[]) => {
        this.reviews = reviews.sort((a, b) => 
          new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime()
        );
        this.loading = false;
      },
      error: (error: any) => {
        this.showMessage('Failed to load reviews', 'error');
        this.loading = false;
      }
    });
  }

  openWriteReview(): void {
    this.showWriteReview = true;
  }

  closeWriteReview(): void {
    this.showWriteReview = false;
    this.reviewForm.reset();
  }

  submitReview(): void {
    if (this.reviewForm.invalid) return;
    
    this.submitting = true;
    const reviewData: CreateReviewRequest = this.reviewForm.value;
    
    this.reviewService.createReview(reviewData).subscribe({
      next: (review: Review) => {
        this.reviews.unshift(review);
        this.showMessage('Review submitted successfully', 'success');
        this.closeWriteReview();
        this.submitting = false;
      },
      error: (error: any) => {
        this.showMessage('Failed to submit review', 'error');
        this.submitting = false;
      }
    });
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  setRating(rating: number): void {
    this.reviewForm.patchValue({ rating });
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => this.clearMessage(), 5000);
  }

  clearMessage(): void {
    this.message = '';
    this.messageType = '';
  }

  getFieldError(fieldName: string): string {
    const field = this.reviewForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['min']) return `Rating must be at least 1 star`;
      if (field.errors['max']) return `Rating cannot exceed 5 stars`;
    }
    return '';
  }
}