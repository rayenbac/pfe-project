import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { AgencyService } from '../../../../core/services/agency.service';
import { User } from '../../../../core/models/user.model';
import { Agency } from '../../../../core/models/agency.model';
import { environment } from '../../../../../environments/environment';
import { 
  FeaturedPropertiesSidebarComponent,
  CategoriesPropertiesSidebarComponent,
  RecentlyViewedSidebarComponent
} from '../../../../shared/components/sidebar';

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule,
    FeaturedPropertiesSidebarComponent,
    CategoriesPropertiesSidebarComponent,
    RecentlyViewedSidebarComponent
  ],
  templateUrl: './agent-list.component.html',
  styleUrls: ['./agent-list.component.css']
})
export class AgentListComponent implements OnInit {
  agents: User[] = [];
  filteredAgents: User[] = [];
  agencies: Agency[] = [];
  loading = true;
  error: string | null = null;
  
  // Cache ratings to avoid ExpressionChangedAfterItHasBeenCheckedError
  private agentRatings: { [agentId: string]: number } = {};
  
  // Filters
  searchQuery = '';
  selectedAgentType = '';
  selectedAgency = '';
  sortBy = 'name';
  sortOrder = 'asc';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;

  // View type
  viewType: 'grid' | 'list' = 'grid';

  constructor(
    private userService: UserService,
    private agencyService: AgencyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    Promise.all([
      this.userService.getAgents().toPromise(),
      this.agencyService.getAgencies().toPromise()
    ]).then(([agents, agencies]) => {
      this.agents = agents || [];
      this.agencies = agencies || [];
      
      // Generate ratings for all agents
      this.agents.forEach(agent => {
        this.agentRatings[agent._id] = this.generateAgentRating();
      });
      
      this.applyFilters();
      this.loading = false;
    }).catch(error => {
      console.error('Error loading data:', error);
      this.error = 'Failed to load agents';
      this.loading = false;
    });
  }

  applyFilters(): void {
    let filtered = [...this.agents];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(agent => 
        `${agent.firstName} ${agent.lastName}`.toLowerCase().includes(query) ||
        agent.email.toLowerCase().includes(query) ||
        (agent.address && agent.address.toLowerCase().includes(query))
      );
    }

    // Agent type filter
    if (this.selectedAgentType) {
      filtered = filtered.filter(agent => agent.agentType === this.selectedAgentType);
    }

    // Agency filter
    if (this.selectedAgency) {
      filtered = filtered.filter(agent => agent.agencyId === this.selectedAgency);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.sortBy) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`;
          bValue = `${b.firstName} ${b.lastName}`;
          break;
        case 'rating':
          aValue = this.getAgentRating(a);
          bValue = this.getAgentRating(b);
          break;
        case 'joined':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a.firstName;
          bValue = b.firstName;
      }

      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.filteredAgents = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredAgents.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedAgents(): User[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredAgents.slice(start, end);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedAgentType = '';
    this.selectedAgency = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  getProfileImage(agent: User): string {
    if (agent.profileImage) {
      let baseUrl = environment.apiBaseUrl;
      if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
      }
      if (agent.profileImage.startsWith('/uploads/')) {
        return baseUrl + agent.profileImage;
      }
      if (agent.profileImage.startsWith('http')) {
        return agent.profileImage;
      }
    }
    return 'assets/images/property/owner.webp';
  }

  getAgentRating(agent: User): number {
    // Return cached rating to avoid ExpressionChangedAfterItHasBeenCheckedError
    return this.agentRatings[agent._id] || 4.0;
  }

  private generateAgentRating(): number {
    // This will be implemented later when you have a rating system for agents
    return Math.round((Math.random() * 1.5 + 3.5) * 10) / 10;
  }

  getAgencyName(agentId: string): string {
    const agent = this.agents.find(a => a._id === agentId);
    if (agent && agent.agencyId) {
      const agency = this.agencies.find(a => a._id === agent.agencyId);
      return agency ? agency.name : 'Independent';
    }
    return 'Independent';
  }

  trackByAgentId(index: number, agent: User): string {
    return agent._id;
  }

  getDisplayedCount(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredAgents.length);
  }

  goToAgentDetails(agent: User): void {
    const slug = this.createAgentSlug(agent.firstName, agent.lastName);
    this.router.navigate(['/agents', slug]);
  }

  private createAgentSlug(firstName: string, lastName: string): string {
    return `${firstName}-${lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}
