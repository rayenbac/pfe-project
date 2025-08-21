import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review } from '../models/review.model';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiBaseUrl}/reviews`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get all reviews
  getReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(this.apiUrl);
  }

  // Get user's reviews
  getUserReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/user`);
  }

  // Create review
  createReview(reviewData: any): Observable<Review> {
    return this.http.post<Review>(this.apiUrl, reviewData);
  }

  // Get reviews by entity (agent, property, agency, post)
  getReviewsByEntity(entityType: string, entityId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}?targetType=${entityType}&targetId=${entityId}`);
  }

  // Get reviews for a specific agent
  getAgentReviews(agentId: string): Observable<Review[]> {
    return this.getReviewsByEntity('agent', agentId);
  }

  // Get reviews for a specific property
  getPropertyReviews(propertyId: string): Observable<Review[]> {
    return this.getReviewsByEntity('property', propertyId);
  }

  // Get reviews for a specific agency
  getAgencyReviews(agencyId: string): Observable<Review[]> {
    return this.getReviewsByEntity('agency', agencyId);
  }

  // Get reviews for a specific post
  getPostReviews(postId: string): Observable<Review[]> {
    return this.getReviewsByEntity('post', postId);
  }

  // Add a new review
  addReview(review: Review): Observable<Review> {
    // Transform frontend model to backend model
    const backendReview = {
      rating: review.rating,
      comment: review.comment,
      userId: review.userId,
      targetType: review.entityType || review.targetType,
      targetId: review.entityId || review.targetId
    };
    
    return this.http.post<Review>(this.apiUrl, backendReview, this.getHttpOptions());
  }

  // Update a review
  updateReview(id: string, review: Partial<Review>): Observable<Review> {
    return this.http.put<Review>(`${this.apiUrl}/${id}`, review, this.getHttpOptions());
  }

  // Delete a review
  deleteReview(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Mark review as helpful
  markReviewHelpful(reviewId: string): Observable<Review> {
    return this.http.patch<Review>(`${this.apiUrl}/${reviewId}/helpful`, {}, this.getHttpOptions());
  }

  // Get review statistics for an entity
  getReviewStats(entityType: string, entityId: string): Observable<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
  }> {
    return this.http.get<any>(`${this.apiUrl}/${entityType}/${entityId}/stats`);
  }

  // Get reviews by reviewer (user who wrote the reviews)
  getReviewsByReviewer(reviewerId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/reviewer/${reviewerId}`);
  }

  // Calculate average rating from reviews array
  calculateAverageRating(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / reviews.length) * 10) / 10;
  }

  // Get rating distribution
  getRatingDistribution(reviews: Review[]): { [key: string]: number } {
    const distribution: { [key: string]: number } = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    reviews.forEach(review => {
      const ratingKey = review.rating.toString();
      distribution[ratingKey] = (distribution[ratingKey] || 0) + 1;
    });
    return distribution;
  }

  // Helper method to get HTTP options
  private getHttpOptions() {
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    const token = this.authService.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }
}
