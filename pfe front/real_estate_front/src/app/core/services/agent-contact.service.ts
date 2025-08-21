import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AgentContactMessage {
  agentId: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  message: string;
  subject?: string;
  propertyId?: string; // Optional: if contacting about specific property
}

export interface AgentContactResponse {
  success: boolean;
  message: string;
  messageId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgentContactService {
  private apiUrl = `${environment.apiBaseUrl}/agent-contact`;

  constructor(private http: HttpClient) {}

  /**
   * Send a contact message to an agent
   * This creates an internal message and notifies the agent
   */
  sendContactMessage(contactData: AgentContactMessage): Observable<AgentContactResponse> {
    return this.http.post<AgentContactResponse>(`${this.apiUrl}/send`, contactData, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get contact messages for an agent (for agents to view their messages)
   */
  getAgentMessages(agentId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/agent/${agentId}/messages`, {
      headers: this.getHeaders()
    });
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }
}
