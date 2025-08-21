import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractService, Contract } from '../../../../core/services/contract.service';

@Component({
  selector: 'app-contracts-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contracts-table.component.html',
  styleUrls: ['./contracts-table.component.css']
})
export class ContractsTableComponent implements OnInit {
  contracts: Contract[] = [];
  loading = false;
  selectedContract: Contract | null = null;
  showModal = false;
  
  message = '';
  messageType: 'success' | 'error' | '' = '';

  statusTypes = [
    { value: 'DRAFT', label: 'Draft', class: 'secondary' },
    { value: 'ACTIVE', label: 'Active', class: 'success' },
    { value: 'EXPIRED', label: 'Expired', class: 'warning' },
    { value: 'TERMINATED', label: 'Terminated', class: 'danger' }
  ];

  constructor(private contractService: ContractService) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.loading = true;
    // For now use a mock agent ID - this should be replaced with actual user service
    this.contractService.getAgentContracts('current').subscribe({
      next: (contracts: Contract[]) => {
        this.contracts = contracts.sort((a: Contract, b: Contract) => 
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
        this.loading = false;
      },
      error: (error: any) => {
        this.showMessage('Failed to load contracts', 'error');
        this.loading = false;
      }
    });
  }

  openContractDetails(contract: Contract): void {
    this.selectedContract = contract;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedContract = null;
  }

  getStatusClass(status: string): string {
    const statusType = this.statusTypes.find(s => s.value === status);
    return statusType ? `badge-${statusType.class}` : 'badge-secondary';
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getDuration(startDate: Date | undefined, endDate: Date | undefined): string {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    return months > 0 ? `${months} months` : `${diffDays} days`;
  }

  downloadContract(contract: Contract): void {
    // Implement contract download functionality
    this.showMessage('Contract download feature coming soon', 'success');
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
}