import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SignatureData {
  signatureImage?: string;
  signatureFont?: string;
  signatureText?: string;
  signatureType: 'drawn' | 'typed' | 'uploaded';
}

export interface ContractSigningInfo {
  contract: any;
  isAgent: boolean;
  isClient: boolean;
  requiresSignature: boolean;
  agentSigned: boolean;
  clientSigned: boolean;
  canProceedToPayment: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SignatureService {
  private apiUrl = `${environment.apiBaseUrl}/signatures`;

  constructor(private http: HttpClient) {}

  // Agent signature management
  saveAgentSignature(signatureData: SignatureData): Observable<any> {
    return this.http.post(`${this.apiUrl}/agent/signature`, signatureData);
  }

  getAgentSignature(agentId?: string): Observable<any> {
    const url = agentId ? `${this.apiUrl}/agent/signature/${agentId}` : `${this.apiUrl}/agent/signature`;
    return this.http.get(url);
  }

  // Contract creation
  createContract(contractData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/contract/create`, contractData);
  }

  // Create contract from reservation with tenant signature
  createContractFromReservation(reservationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/contract/create-from-reservation`, reservationData);
  }

  // Contract signing info
  getContractSigningInfo(contractId: string): Observable<ContractSigningInfo> {
    return this.http.get<ContractSigningInfo>(`${this.apiUrl}/contract/${contractId}/info`);
  }

  // Contract signing
  getContractForSigning(contractId: string): Observable<ContractSigningInfo> {
    return this.http.get<ContractSigningInfo>(`${this.apiUrl}/contract/${contractId}/signing`);
  }

  signContractAsAgent(contractId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/contract/${contractId}/sign/agent`, {});
  }

  signContractAsClient(contractId: string, signatureData: SignatureData): Observable<any> {
    return this.http.post(`${this.apiUrl}/contract/${contractId}/sign/client`, signatureData);
  }

  // Contract verification and status
  verifyContractSignatures(contractId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/contract/${contractId}/verify`);
  }

  checkContractPaymentReadiness(contractId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/contract/${contractId}/payment-ready`);
  }

  downloadSignedContract(contractId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/contract/${contractId}/download`, { responseType: 'blob' });
  }
}
