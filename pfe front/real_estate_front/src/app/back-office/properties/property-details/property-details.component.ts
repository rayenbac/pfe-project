import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { Property, PropertyMedia, PropertyAmenity } from '../../../core/models/property.model';
import Swal from 'sweetalert2';
import * as L from 'leaflet';

@Component({
  selector: 'app-property-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './property-details.component.html',
  styleUrls: ['./property-details.component.css']
})
export class PropertyDetailsComponent implements OnInit, AfterViewInit {
  property: Property | null = null;
  loading = false;
  error: string | null = null;
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  constructor(
    private route: ActivatedRoute,
    private propertyService: PropertyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const propertyId = this.route.snapshot.paramMap.get('id');
    if (propertyId) {
      this.loadPropertyDetails(propertyId);
    }
  }

  ngAfterViewInit(): void {
    // Initialize map after view is initialized
    this.initMap();
  }

  private initMap(): void {
    // Create map instance
    this.map = L.map('propertyMap', {
      center: [0, 0], // Default center, will be updated when property loads
      zoom: 15
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private updateMapLocation(): void {
    if (!this.map || !this.property?.address?.latitude || !this.property?.address?.longitude) {
      return;
    }

    const lat = this.property.address.latitude;
    const lng = this.property.address.longitude;

    // Update map center
    this.map.setView([lat, lng], 15);

    // Update or create marker
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng]).addTo(this.map);
    }

    // Add popup with property info
    this.marker.bindPopup(`
      <b>${this.property.title}</b><br>
      ${this.property.address.street},<br>
      ${this.property.address.city}, ${this.property.address.state} ${this.property.address.postalCode}
    `).openPopup();
  }

  private loadPropertyDetails(propertyId: string): void {
    this.loading = true;
    this.propertyService.getProperty(propertyId).subscribe({
      next: (property) => {
        this.property = property;
        this.loading = false;
        // Update map after property data is loaded
        setTimeout(() => this.updateMapLocation(), 100);
      },
      error: (error) => {
        this.error = 'Error loading property details';
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load property details'
        });
      }
    });
  }

  getMainImage(): PropertyMedia | undefined {
    const img = this.property?.media.find(m => m.isPrimary);
    if (img && img.url && !img.url.startsWith('http')) {
      img.url = 'http://localhost:3000' + img.url;
    }
    return img;
  }

  getAdditionalImages(): PropertyMedia[] {
    return (this.property?.media.filter(m => !m.isPrimary && m.type === 'image') || []).map(media => {
      if (media.url && !media.url.startsWith('http')) {
        media.url = 'http://localhost:3000' + media.url;
      }
      return media;
    });
  }

  getAttachmentUrl(attachment: any): string {
    if (attachment.url && !attachment.url.startsWith('http')) {
      return 'http://localhost:3000' + attachment.url;
    }
    return attachment.url;
  }

  groupAmenities(): PropertyAmenity[][] {
    if (!this.property?.amenities) return [];
    const amenities = [...this.property.amenities];
    const groups: PropertyAmenity[][] = [];
    const itemsPerGroup = Math.ceil(amenities.length / 3);
    
    for (let i = 0; i < amenities.length; i += itemsPerGroup) {
      groups.push(amenities.slice(i, i + itemsPerGroup));
    }
    
    return groups;
  }

  onEdit(): void {
    if (this.property?._id) {
      this.router.navigate(['/admin/properties/edit', this.property._id]);
    }
  }

  onDelete(): void {
    if (!this.property?._id) return;

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.propertyService.deleteProperty(this.property!._id).subscribe({
          next: () => {
            Swal.fire(
              'Deleted!',
              'Property has been deleted successfully.',
              'success'
            );
            this.router.navigate(['/back-office/properties']);
          },
          error: (error) => {
            this.error = 'Error deleting property';
            this.loading = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete property'
            });
          }
        });
      }
    });
  }
}
