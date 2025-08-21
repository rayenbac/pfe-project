import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  constructor(private http: HttpClient) {}

  uploadFile(file: File, type: string): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    // Use the correct endpoint based on the type
    let endpoint = '';
    switch (type) {
      case 'profile':
        endpoint = '/api/users/upload-profile';
        break;
      case 'agency':
        endpoint = '/api/agencies/upload-logo';
        break;
      case 'property':
        endpoint = '/api/properties/upload-image';
        break;
      default:
        endpoint = '/api/upload';
    }
    
    return this.http.post<UploadResponse>(`${environment.apiBaseUrl}${endpoint}`, formData);
  }
} 