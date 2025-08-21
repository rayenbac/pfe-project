import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-our-agents',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './our-agents.component.html',
  styleUrl: './our-agents.component.css'
})
export class OurAgentsComponent implements OnInit {
  topAgents: User[] = [];
  loading = true;
  error: string | null = null;
  // Cache ratings to avoid ExpressionChangedAfterItHasBeenCheckedError
  private agentRatings: { [agentId: string]: number } = {};

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTopAgents();
  }

  loadTopAgents(): void {
    this.loading = true;
    this.userService.getAgents().subscribe({
      next: (agents) => {
        // Generate ratings for all agents first
        agents.forEach(agent => {
          this.agentRatings[agent._id] = this.generateAgentRating();
        });
        
        // Sort agents by rating (descending) and take the top 6
        const sortedAgents = agents.sort((a, b) => this.getAgentRating(b) - this.getAgentRating(a));
        this.topAgents = sortedAgents.slice(0, 6);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading agents:', error);
        this.error = 'Failed to load agents';
        this.loading = false;
      }
    });
  }

  trackByAgentId(index: number, agent: User): string {
    return agent._id;
  }

  getAgentImageUrl(agent: User): string {
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
    // Default profile image
    return 'assets/images/property/owner.webp';
  }

  getAgentRating(agent: User): number {
    // Return cached rating to avoid ExpressionChangedAfterItHasBeenCheckedError
    return this.agentRatings[agent._id] || 4.0;
  }

  private generateAgentRating(): number {
    // This will be implemented later when you have a rating system for agents
    // For now, return a random rating between 3.5 and 5
    return Math.round((Math.random() * 1.5 + 3.5) * 10) / 10;
  }

  goToAgentDetails(agentId: string): void {
    const agent = this.topAgents.find(a => a._id === agentId);
    if (agent) {
      const slug = this.createAgentSlug(agent.firstName, agent.lastName);
      this.router.navigate(['/agents', slug]);
    }
  }

  private createAgentSlug(firstName: string, lastName: string): string {
    return `${firstName}-${lastName}`
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  goToAllAgents(): void {
    // Navigate to all agents page
    this.router.navigate(['/agents']);
  }
}
