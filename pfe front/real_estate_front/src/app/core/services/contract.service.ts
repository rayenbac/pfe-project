import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Contract {
  _id?: string;
  agentId: string;
  clientId: string;
  propertyId: string;
  type: 'sale' | 'rental' | 'management';
  title: string;
  description: string;
  terms: string;
  amount: number;
  monthlyRent: number;
  deposit: number;
  currency: string;
  commissionRate: number;
  commission: number;
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled' | 'expired';
  signedByAgent: boolean;
  signedByClient: boolean;
  signedAt?: Date;
  agentSignatureDate?: Date;
  clientSignatureDate?: Date;
  documents?: string[];
  metadata?: any;
  createdAt?: Date;
  updatedAt?: Date;
  agent?: any;
  client?: any;
  tenant?: { name: string; email: string; phone?: string };
  landlord?: { name: string; email: string; phone?: string };
  property?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private apiUrl = `${environment.apiBaseUrl}/contracts`;

  constructor(private http: HttpClient) {}

  // Get agent's contracts
  getAgentContracts(agentId: string): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/agent/${agentId}`);
  }

  // Get contract by ID
  getContractById(contractId: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/${contractId}`);
  }

  // Create contract
  createContract(contract: Partial<Contract>): Observable<Contract> {
    return this.http.post<Contract>(this.apiUrl, contract);
  }

  // Update contract
  updateContract(contractId: string, contract: Partial<Contract>): Observable<Contract> {
    return this.http.put<Contract>(`${this.apiUrl}/${contractId}`, contract);
  }

  // Sign contract
  signContract(contractId: string, signatureType: 'agent' | 'client', signature: string): Observable<Contract> {
    return this.http.patch<Contract>(`${this.apiUrl}/${contractId}/sign`, {
      signatureType,
      signature
    });
  }

  // Update contract status
  updateContractStatus(contractId: string, status: string): Observable<Contract> {
    return this.http.patch<Contract>(`${this.apiUrl}/${contractId}/status`, { status });
  }

  // Upload contract document
  uploadContractDocument(contractId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('document', file);
    return this.http.post<any>(`${this.apiUrl}/${contractId}/documents`, formData);
  }

  // Generate contract PDF
  generateContractPDF(contractId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${contractId}/pdf`, { responseType: 'blob' });
  }

  // Get contract statistics for agent
  getAgentContractStats(agentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/agent/${agentId}/stats`);
  }

  // Send contract for signature
  sendContractForSignature(contractId: string, email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${contractId}/send`, { email });
  }
}
