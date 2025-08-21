import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Agency } from '../models/agency.model';

@Injectable({
  providedIn: 'root'
})
export class AgencyService {
  private apiUrl = `${environment.apiBaseUrl}/agencies`;

  constructor(private http: HttpClient) {}

  getAgencies(): Observable<Agency[]> {
    return this.http.get<Agency[]>(this.apiUrl);
  }

  getAgency(id: string): Observable<Agency> {
    return this.http.get<Agency>(`${this.apiUrl}/${id}`);
  }

  createAgency(agency: FormData): Observable<Agency> {
    return this.http.post<Agency>(this.apiUrl, agency);
  }

  updateAgency(id: string, agency: FormData): Observable<Agency> {
    return this.http.put<Agency>(`${this.apiUrl}/${id}`, agency);
  }

  deleteAgency(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getAgencyAgents(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/agents`);
  }

  searchAgencies(query: string): Observable<Agency[]> {
    return this.http.get<Agency[]>(`${this.apiUrl}/search?q=${query}`);
  }
} 