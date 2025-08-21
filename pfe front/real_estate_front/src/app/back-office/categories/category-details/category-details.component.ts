import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Category } from '../../../core/models/category.model';
import { CategoryService } from '../../../core/services/category.service';

@Component({
  selector: 'app-category-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './category-details.component.html',
  styleUrl: './category-details.component.css'
})
export class CategoryDetailsComponent implements OnInit {
  category: Category | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const categoryId = this.route.snapshot.paramMap.get('id');
    if (categoryId) {
      this.loadCategory(categoryId);
    }
  }

  loadCategory(id: string): void {
    this.loading = true;
    this.categoryService.getCategory(id).subscribe({
      next: (category) => {
        this.category = category;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error loading category details';
        this.loading = false;
      }
    });
  }

  onEdit(): void {
    if (this.category?._id) {
      this.router.navigate(['/back-office/categories/edit', this.category._id]);
    }
  }

  onDelete(): void {
    if (this.category?._id && confirm('Are you sure you want to delete this category?')) {
      this.loading = true;
      this.categoryService.deleteCategory(this.category._id).subscribe({
        next: () => {
          this.router.navigate(['/back-office/categories']);
        },
        error: (error) => {
          this.error = 'Error deleting category';
          this.loading = false;
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/back-office/categories']);
  }
}
