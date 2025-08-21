import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Post, Author } from '../../../core/models/post.model';
import { PostService } from '../../../core/services/post.service';
import { User } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit {
  posts: Post[] = [];
  allPosts: Post[] = [];
  paginatedPosts: Post[] = [];
  selectedCategory: string = '';
  selectedTags: string[] = [];
  categories: any[] = [];
  allTags: string[] = [];
  featuredPosts: Post[] = [];
  searchTerm: string = '';
  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 3;
  loading = false;
  error: string | null = null;
  isAuthenticated = false;
  baseUrl: string;
  totalPagesArray: number[] = [];

  constructor(
    private postService: PostService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {
    this.baseUrl = environment.apiBaseUrl;
    if (this.baseUrl.endsWith('/api')) {
      this.baseUrl = this.baseUrl.slice(0, -4);
    }
  }

  ngOnInit(): void {
    this.checkAuthStatus();
    this.loadPosts();
  }

  checkAuthStatus(): void {
    this.isAuthenticated = this.authService.isTokenValid();
  }

  loadPosts(): void {
    this.loading = true;
    this.error = null;

    this.postService.getPosts().subscribe({
      next: (response) => {
        this.allPosts = response;
        this.posts = [...this.allPosts];
        this.extractCategoriesAndTags();
        this.loadFeaturedPosts(); // Load featured posts after getting all posts
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.error = 'Failed to load posts. Please try again.';
        this.loading = false;
      }
    });
  }

  extractCategoriesAndTags(): void {
    const categoryMap = new Map<string, number>();
    const tagSet = new Set<string>();

    this.allPosts.forEach(post => {
      if (post.category) {
        categoryMap.set(post.category, (categoryMap.get(post.category) || 0) + 1);
      }
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => tagSet.add(tag));
      }
    });

    this.categories = Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count
    }));
    this.allTags = Array.from(tagSet);
  }

  applyFilters(): void {
    let filtered = [...this.allPosts];

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        post.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(post => post.category === this.selectedCategory);
    }

    // Apply tags filter
    if (this.selectedTags.length > 0) {
      filtered = filtered.filter(post => 
        post.tags && post.tags.some(tag => this.selectedTags.includes(tag))
      );
    }

    this.posts = filtered;
    this.totalPages = Math.ceil(this.posts.length / this.itemsPerPage);
    this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedPosts = this.posts.slice(startIndex, endIndex);
  }

  onSearch(): void {
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  toggleTag(tag: string): void {
    if (this.selectedTags.includes(tag)) {
      this.selectedTags = this.selectedTags.filter(t => t !== tag);
    } else {
      this.selectedTags.push(tag);
    }
    this.applyFilters();
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.includes(tag);
  }

  clearAllFilters(): void {
    this.selectedCategory = '';
    this.selectedTags = [];
    this.searchTerm = '';
    this.applyFilters();
  }

  goToCreate(): void {
    this.router.navigate(['/posts/create']);
  }

  goToDetails(post: Post): void {
    this.router.navigate(['/posts', post.slug]);
  }

  getPostImageUrl(post: Post): string {
    if (post.image) {
      let baseUrl = environment.apiBaseUrl;
      if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
      }
      
      if (post.image.startsWith('/uploads/')) {
        return baseUrl + post.image;
      }
      if (post.image.startsWith('http')) {
        return post.image;
      }
      // If it's just a filename, construct the full path
      return `${baseUrl}/uploads/posts/${post.image}`;
    }
    return 'assets/images/default-post.jpg';
  }

  getAuthorName(post: Post): string {
    if (typeof post.author === 'object' && post.author) {
      const author = post.author as Author;
      return `${author.firstName} ${author.lastName}`;
    }
    return 'Unknown Author';
  }

  getAuthorAvatar(post: Post): string {
    if (typeof post.author === 'object' && post.author) {
      const author = post.author as Author;
      if (author.profileImage) {
        // If it's a full URL, return as is
        if (author.profileImage.startsWith('http')) {
          return author.profileImage;
        }
        // If it starts with /uploads/, construct full URL
        if (author.profileImage.startsWith('/uploads/')) {
          const fullUrl = `${this.baseUrl}${author.profileImage}`;
          return fullUrl;
        }
        // If it's just a filename, construct the full path
        const constructedUrl = `${this.baseUrl}/uploads/users/${author.profileImage}`;
        return constructedUrl;
      }
    }
    return 'assets/images/team/upload_photo.jpg';
  }

  stripHtmlTags(html: string): string {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  loadFeaturedPosts(): void {
    if (this.allPosts.length > 0) {
      // Get the most recent posts as featured posts (excluding current post if any)
      this.featuredPosts = this.allPosts
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 4); // Take first 4 posts
    }
  }

  // Navigate to featured post details
  goToFeaturedPost(post: Post): void {
    this.router.navigate(['/posts', post.slug]);
  }

  // Filter posts by category
  filterByCategory(categoryName: string): void {
    this.selectedCategory = categoryName;
    this.currentPage = 1; // Reset to first page
    this.applyFilters();
  }

  // Clear category filter
  clearCategoryFilter(): void {
    this.selectedCategory = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  // Handle image loading errors
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/team/upload_photo.jpg';
    }
  }
}
