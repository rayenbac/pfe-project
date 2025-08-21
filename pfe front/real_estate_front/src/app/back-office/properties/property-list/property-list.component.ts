import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router'; // Import RouterModule
import { PropertyService } from '../../../core/services/property.service'; // Import the PropertyService
import { Property } from '../../../core/models/property.model'; // Import the Property model
import Swal from 'sweetalert2'; // For confirmation dialogs

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet], // Add RouterModule here
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.css']
})
export class PropertyListComponent implements OnInit {
  properties: Property[] = []; // Array to hold properties

  constructor(private propertyService: PropertyService) {}


  // In your component.ts file


getImageUrl(media: any[]): string {
  if (media && media.length > 0) {
    return 'http://localhost:3000' + media[0].url;
  }
  return 'assets/images/default-property.jpg';
}
  ngOnInit(): void {
    this.loadProperties(); // Load properties when the component initializes
  }

  // Fetch properties from the backend
  loadProperties(): void {
    this.propertyService.getProperties().subscribe({
      next: (data) => {
        this.properties = data; // Assign fetched properties to the array
        console.log('Properties loaded:', data);
      },
      error: (error) => {
        console.error('Error loading properties:', error);
        this.showErrorAlert('Failed to load properties');
      }
    });
  }

  // Delete a property
  deleteProperty(id: string): void {
    if (!id) {
      console.error('Invalid property ID');
      return;
    }

    // Confirmation dialog
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
        this.propertyService.deleteProperty(id).subscribe({
          next: () => {
            this.properties = this.properties.filter(property => property._id !== id); // Remove deleted property from the list
            Swal.fire(
              'Deleted!',
              'Property has been deleted successfully.',
              'success'
            );
          },
          error: (error) => {
            console.error('Error deleting property:', error);
            this.showErrorAlert('Failed to delete property');
          }
        });
      }
    });
  }

  // Show error alert
  private showErrorAlert(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message
    });
  }
}