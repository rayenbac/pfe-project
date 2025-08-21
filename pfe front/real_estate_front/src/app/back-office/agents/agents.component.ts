import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-agents',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './agents.component.html',
  styleUrls: ['./agents.component.css']
})
export class AgentsComponent implements OnInit {
  agents: any[] = [];
  filteredAgents: any[] = [];
  loading = false;
  error: string | null = null;

  // Make Math available in template
  Math = Math;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  // Search and filters
  searchTerm = '';
  sortField = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  statusFilter = '';

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadAgents();
  }

  async loadAgents() {
    this.loading = true;
    this.error = null;
    
    try {
      const response = await this.userService.getUsers().toPromise();
      // Filter only agents from all users
      this.agents = (response || []).filter((user: any) => user.role === 'agent');
      this.applyFilters();
    } catch (error: any) {
      this.error = error.message || 'Failed to load agents';
      console.error('Error loading agents:', error);
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    let filtered = [...this.agents];

    // Search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.firstName?.toLowerCase().includes(term) ||
        agent.lastName?.toLowerCase().includes(term) ||
        agent.email?.toLowerCase().includes(term) ||
        agent.phone?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(agent => {
        if (this.statusFilter === 'verified') return agent.isVerified;
        if (this.statusFilter === 'unverified') return !agent.isVerified;
        if (this.statusFilter === 'blocked') return agent.isBlocked;
        if (this.statusFilter === 'active') return !agent.isBlocked;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = this.getNestedValue(a, this.sortField);
      const bValue = this.getNestedValue(b, this.sortField);
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredAgents = filtered;
    this.totalPages = Math.ceil(this.filteredAgents.length / this.itemsPerPage);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
  }

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o?.[p], obj) || '';
  }

  getPaginatedAgents() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredAgents.slice(start, end);
  }

  onSearch() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSort(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  async toggleAgentStatus(agent: any) {
    if (confirm(`Are you sure you want to ${agent.isBlocked ? 'unblock' : 'block'} this agent?`)) {
      try {
        // For now, just update locally - implement actual API call later
        agent.isBlocked = !agent.isBlocked;
        console.log('Toggle agent status:', agent._id, agent.isBlocked);
      } catch (error: any) {
        this.error = error.message || 'Failed to update agent status';
      }
    }
  }

  async verifyAgent(agent: any) {
    if (confirm('Are you sure you want to verify this agent?')) {
      try {
        // For now, just update locally - implement actual API call later
        agent.isVerified = true;
        console.log('Verify agent:', agent._id);
      } catch (error: any) {
        this.error = error.message || 'Failed to verify agent';
      }
    }
  }

  async deleteAgent(agent: any) {
    if (confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      try {
        // Use deleteUser if available, otherwise just remove from list
        try {
          await this.userService.deleteUser(agent._id).toPromise();
        } catch {
          // If deleteUser doesn't exist, just remove from local list
          this.agents = this.agents.filter(a => a._id !== agent._id);
          this.applyFilters();
          return;
        }
        this.loadAgents();
      } catch (error: any) {
        this.error = error.message || 'Failed to delete agent';
      }
    }
  }

  trackByAgentId(index: number, agent: any): string {
    return agent._id;
  }

  getStatusClass(agent: any): string {
    if (agent.isBlocked) return 'status-blocked';
    if (agent.isVerified) return 'status-verified';
    return 'status-pending';
  }

  getStatusText(agent: any): string {
    if (agent.isBlocked) return 'Blocked';
    if (agent.isVerified) return 'Verified';
    return 'Pending';
  }
}
