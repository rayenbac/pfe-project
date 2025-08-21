import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  Report, 
  CreateReportRequest, 
  UpdateReportRequest, 
  ReportStatistics, 
  BulkUpdateRequest 
} from '../models/report.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = `${environment.apiBaseUrl}/reports`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // User methods
  createReport(reportData: CreateReportRequest): Observable<{ success: boolean; message: string; data: Report }> {
    return this.http.post<{ success: boolean; message: string; data: Report }>(
      this.apiUrl, 
      reportData, 
      this.getHttpOptions()
    );
  }

  getMyReports(): Observable<{ success: boolean; data: Report[] }> {
    return this.http.get<{ success: boolean; data: Report[] }>(
      `${this.apiUrl}/my-reports`, 
      this.getHttpOptions()
    );
  }

  // Admin methods
  getReports(filters?: {
    status?: string;
    targetType?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }): Observable<{ 
    success: boolean; 
    data: Report[]; 
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    }
  }> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.targetType) params = params.set('targetType', filters.targetType);
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
    }

    return this.http.get<{
      success: boolean; 
      data: Report[]; 
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
      }
    }>(`${this.apiUrl}`, { params, ...this.getHttpOptions() });
  }

  getReport(id: string): Observable<{ success: boolean; data: Report }> {
    return this.http.get<{ success: boolean; data: Report }>(
      `${this.apiUrl}/${id}`, 
      this.getHttpOptions()
    );
  }

  updateReport(id: string, updateData: UpdateReportRequest): Observable<{ success: boolean; message: string; data: Report }> {
    return this.http.put<{ success: boolean; message: string; data: Report }>(
      `${this.apiUrl}/${id}`, 
      updateData, 
      this.getHttpOptions()
    );
  }

  deleteReport(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${id}`, 
      this.getHttpOptions()
    );
  }

  getTargetReports(targetType: string, targetId: string): Observable<{ success: boolean; data: Report[] }> {
    return this.http.get<{ success: boolean; data: Report[] }>(
      `${this.apiUrl}/target/${targetType}/${targetId}`, 
      this.getHttpOptions()
    );
  }

  searchReports(query: string): Observable<{ success: boolean; data: Report[] }> {
    const params = new HttpParams().set('q', query);
    return this.http.get<{ success: boolean; data: Report[] }>(
      `${this.apiUrl}/search`, 
      { params, ...this.getHttpOptions() }
    );
  }

  getReportStatistics(): Observable<{ success: boolean; data: ReportStatistics }> {
    return this.http.get<{ success: boolean; data: ReportStatistics }>(
      `${this.apiUrl}/statistics`, 
      this.getHttpOptions()
    );
  }

  bulkUpdateReports(bulkRequest: BulkUpdateRequest): Observable<{ 
    success: boolean; 
    message: string; 
    data: { matchedCount: number; modifiedCount: number } 
  }> {
    return this.http.put<{ 
      success: boolean; 
      message: string; 
      data: { matchedCount: number; modifiedCount: number } 
    }>(`${this.apiUrl}/bulk/update`, bulkRequest, this.getHttpOptions());
  }

  // User blocking methods
  blockUser(userId: string, reason: string): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.put<{ success: boolean; message: string; data: any }>(
      `${environment.apiBaseUrl}/users/${userId}/block`, 
      { reason }, 
      this.getHttpOptions()
    );
  }

  unblockUser(userId: string): Observable<{ success: boolean; message: string; data: any }> {
    return this.http.put<{ success: boolean; message: string; data: any }>(
      `${environment.apiBaseUrl}/users/${userId}/unblock`, 
      {}, 
      this.getHttpOptions()
    );
  }

  getBlockedUsers(): Observable<{ success: boolean; data: any[] }> {
    return this.http.get<{ success: boolean; data: any[] }>(
      `${environment.apiBaseUrl}/users/blocked`, 
      this.getHttpOptions()
    );
  }

  // Utility methods
  getReportCategoryDisplayName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'spam': 'Spam',
      'inappropriate_content': 'Inappropriate Content',
      'harassment': 'Harassment',
      'fake_listing': 'Fake Listing',
      'fraud': 'Fraud',
      'offensive_language': 'Offensive Language',
      'copyright_violation': 'Copyright Violation',
      'other': 'Other'
    };
    return categoryMap[category] || category;
  }

  getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pending Review',
      'reviewed': 'Under Review',
      'resolved': 'Resolved',
      'dismissed': 'Dismissed'
    };
    return statusMap[status] || status;
  }

  getPriorityColor(priority: string): string {
    const priorityColors: { [key: string]: string } = {
      'low': 'success',
      'medium': 'warning', 
      'high': 'danger'
    };
    return priorityColors[priority] || 'secondary';
  }

  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'pending': 'warning',
      'reviewed': 'info',
      'resolved': 'success',
      'dismissed': 'secondary'
    };
    return statusColors[status] || 'secondary';
  }

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
  }
}
