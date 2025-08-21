import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';
  sortBy = 'name';
  sortOrder = 'asc';

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.categoryService.getCategories().subscribe({
      next: (categories: Category[]) => {
        this.categories = categories;
        this.loading = false;
      },
      error: (error: any) => {
        this.error = 'Error loading categories';
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    // Implement search functionality if needed
  }

  // onSort(): void {
  //   this.categories.sort((a, b) => {
  //     const aValue = a[this.sortBy as keyof Category];
  //     const bValue = b[this.sortBy as keyof Category];
  //     return this.sortOrder === 'asc' 
  //       ? (aValue > bValue ? 1 : -1)
  //       : (aValue < bValue ? 1 : -1);
  //   });
  // }

  onView(categoryId: string): void {
    this.router.navigate(['/back-office/categories', categoryId]);
  }

  onEdit(categoryId: string): void {
    this.router.navigate(['/back-office/categories/edit', categoryId]);
  }

  onDelete(categoryId: string): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.loading = true;
      this.categoryService.deleteCategory(categoryId).subscribe({
        next: () => {
          this.loadCategories();
        },
        error: (error: any) => {
          this.error = 'Error deleting category';
          this.loading = false;
        }
      });
    }
  }

  onCreate(): void {
    this.router.navigate(['/back-office/categories/create']);
  }
}
