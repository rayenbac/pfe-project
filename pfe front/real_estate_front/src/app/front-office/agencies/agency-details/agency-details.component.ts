import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AgencyService } from '../../../core/services/agency.service';
import { PropertyService } from '../../../core/services/property.service';
import { AuthService } from '../../../core/services/auth.service';
import { Agency } from '../../../core/models/agency.model';
import { Property } from '../../../core/models/property.model';
import { User } from '../../../core/models/user.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-agency-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './agency-details.component.html',
  styleUrls: ['./agency-details.component.css']
})
export class AgencyDetailsComponent implements OnInit {
  agency: Agency | null = null;
  agencyProperties: Property[] = [];
  agencyAgents: User[] = [];
  loading = true;
  error: string | null = null;
  activeTab = 'overview';
  
  // Contact form
  contactForm = {
    name: '',
    email: '',
    phone: '',
    message: '',
    subject: 'General Inquiry'
  };
  
  contactFormSubmitting = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private agencyService: AgencyService,
    private propertyService: PropertyService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      const id = params['id'];
      
      if (slug) {
        this.loadAgencyBySlug(slug);
      } else if (id) {
        this.loadAgencyById(id);
      }
    });
  }
  
  loadAgencyBySlug(slug: string): void {
    this.loading = true;
    this.error = null;
    
    // For now, we'll load all agencies and find by slug
    // In a real application, you'd have a backend endpoint for this
    this.agencyService.getAgencies().subscribe({
      next: (agencies) => {
        const agency = agencies.find(a => this.getAgencySlug(a) === slug);
        if (agency) {
          this.agency = agency;
          this.loadAgencyData();
        } else {
          this.error = 'Agency not found';
          this.loading = false;
        }
      },
      error: (error) => {
        this.error = 'Failed to load agency';
        this.loading = false;
        console.error('Error loading agency:', error);
      }
    });
  }
  
  loadAgencyById(id: string): void {
    this.loading = true;
    this.error = null;
    
    this.agencyService.getAgency(id).subscribe({
      next: (agency) => {
        this.agency = agency;
        this.loadAgencyData();
      },
      error: (error) => {
        this.error = 'Failed to load agency';
        this.loading = false;
        console.error('Error loading agency:', error);
      }
    });
  }
  
  loadAgencyData(): void {
    if (!this.agency) return;
    
    Promise.all([
      this.loadAgencyProperties(),
      this.loadAgencyAgents()
    ]).then(() => {
      this.loading = false;
    }).catch(() => {
      this.loading = false;
    });
  }
  
  loadAgencyProperties(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.agency) {
        reject();
        return;
      }
      
      this.propertyService.getProperties().subscribe({
        next: (properties) => {
          // Filter properties by agency (assuming properties have an agencyId field)
          this.agencyProperties = properties.filter(p => 
            (p as any).agencyId === this.agency?._id
          );
          resolve();
        },
        error: (error) => {
          console.error('Error loading agency properties:', error);
          resolve(); // Don't fail the whole component
        }
      });
    });
  }
  
  loadAgencyAgents(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.agency) {
        reject();
        return;
      }
      
      this.agencyService.getAgencyAgents(this.agency._id).subscribe({
        next: (agents) => {
          this.agencyAgents = agents;
          resolve();
        },
        error: (error) => {
          console.error('Error loading agency agents:', error);
          resolve(); // Don't fail the whole component
        }
      });
    });
  }
  
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
  
  getAgencyImage(): string {
    if (this.agency?.logo) {
      return `http://localhost:3000${this.agency.logo}`;
    }
    return 'assets/images/default-agency.jpg';
  }
  
  getPropertyImage(property: Property): string {
    if (property.media && property.media.length > 0) {
      return `http://localhost:3000${property.media[0].url}`;
    }
    return 'assets/images/default-property.jpg';
  }
  
  getAgentImage(agent: User): string {
    if (agent.profileImage) {
      return `http://localhost:3000${agent.profileImage}`;
    }
    return 'assets/images/default-avatar.jpg';
  }
  
  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }
  
  getEmptyStarArray(rating: number): number[] {
    return Array(5 - Math.floor(rating)).fill(0);
  }
  
  getAgencySlug(agency: Agency): string {
    return agency.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  getPropertySlug(property: Property): string {
    return property.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }
  
  onSubmitContactForm(): void {
    if (!this.validateContactForm()) {
      return;
    }
    
    this.contactFormSubmitting = true;
    
    // Simulate form submission
    setTimeout(() => {
      this.contactFormSubmitting = false;
      Swal.fire({
        title: 'Message Sent!',
        text: 'Thank you for your message. The agency will get back to you soon.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      this.resetContactForm();
    }, 2000);
  }
  
  validateContactForm(): boolean {
    if (!this.contactForm.name.trim()) {
      this.showValidationError('Please enter your name');
      return false;
    }
    
    if (!this.contactForm.email.trim()) {
      this.showValidationError('Please enter your email');
      return false;
    }
    
    if (!this.isValidEmail(this.contactForm.email)) {
      this.showValidationError('Please enter a valid email address');
      return false;
    }
    
    if (!this.contactForm.message.trim()) {
      this.showValidationError('Please enter your message');
      return false;
    }
    
    return true;
  }
  
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  showValidationError(message: string): void {
    Swal.fire({
      title: 'Validation Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'OK'
    });
  }
  
  resetContactForm(): void {
    this.contactForm = {
      name: '',
      email: '',
      phone: '',
      message: '',
      subject: 'General Inquiry'
    };
  }
  
  openWebsite(): void {
    if (this.agency?.website) {
      window.open(this.agency.website, '_blank');
    }
  }
  
  callAgency(): void {
    if (this.agency?.phone) {
      window.location.href = `tel:${this.agency.phone}`;
    }
  }
  
  emailAgency(): void {
    if (this.agency?.email) {
      window.location.href = `mailto:${this.agency.email}`;
    }
  }
  
  openSocialMedia(platform: string): void {
    if (this.agency?.socialMedia && this.agency.socialMedia[platform as keyof typeof this.agency.socialMedia]) {
      window.open(this.agency.socialMedia[platform as keyof typeof this.agency.socialMedia], '_blank');
    }
  }
  
  navigateToProperty(property: Property): void {
    this.router.navigate(['/property', this.getPropertySlug(property)]);
  }
  
  navigateToAgent(agent: User): void {
    const agentSlug = `${agent.firstName}-${agent.lastName}`.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    this.router.navigate(['/agents', agentSlug]);
  }
  
  shareAgency(): void {
    if (navigator.share) {
      navigator.share({
        title: this.agency?.name,
        text: this.agency?.description,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        Swal.fire({
          title: 'Link Copied!',
          text: 'Agency link has been copied to your clipboard',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      });
    }
  }
}
