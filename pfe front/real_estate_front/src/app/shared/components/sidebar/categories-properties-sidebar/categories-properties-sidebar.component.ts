import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PropertyService } from '../../../../core/services/property.service';

interface CategoryCount {
  name: string;
  count: number;
}

@Component({
  selector: 'app-categories-properties-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './categories-properties-sidebar.component.html',
  styleUrls: ['./categories-properties-sidebar.component.css']
})
export class CategoriesPropertiesSidebarComponent implements OnInit {
  categories: CategoryCount[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private propertyService: PropertyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPropertyCategories();
  }

  loadPropertyCategories(): void {
    this.loading = true;
    this.error = null;

    this.propertyService.getProperties().subscribe({
      next: (response) => {
        // Handle different response formats
        const properties = Array.isArray(response) ? response : (response as any).data || (response as any).properties || [];
        console.log('Loaded properties for categories:', properties);
        this.extractCategories(properties);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading properties for categories:', error);
        this.error = 'Failed to load categories';
        this.loading = false;
      }
    });
  }

  private extractCategories(properties: any[]): void {
    const categoryMap = new Map<string, number>();

    properties.forEach(property => {
      // Try different possible property type field names
      const type = property.propertyType || property.type || property.category;
      if (type) {
        categoryMap.set(type, (categoryMap.get(type) || 0) + 1);
      }
    });

    this.categories = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
      
    console.log('Extracted categories:', this.categories);
  }

  filterByCategory(categoryName: string): void {
    // Navigate to properties page with category filter
    this.router.navigate(['/properties'], {
      queryParams: { propertyType: categoryName }
    });
  }
}
