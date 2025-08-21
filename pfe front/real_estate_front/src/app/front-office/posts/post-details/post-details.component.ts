import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../../core/services/post.service';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReportService } from '../../../core/services/report.service';
import { HttpClient } from '@angular/common/http';
import { DatePipe, NgFor, NgIf, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-post-details',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule, SlicePipe],
  templateUrl: './post-details.component.html',
  styleUrl: './post-details.component.css'
})
export class PostDetailsComponent implements OnInit {
  post: any = null;
  reviews: any[] = [];
  displayedReviews: any[] = [];
  reviewsToShow = 3;
  showAllReviews = false;
  averageRating = 0;
  newReview: any = { title: '', comment: '', rating: 0 };
  relatedPosts: any[] = [];
  categoryRelatedPosts: any[] = [];
  previousPost: any = null;
  nextPost: any = null;
  categories = [
    { name: 'Apartment', count: 6 },
    { name: 'Condo', count: 12 },
    { name: 'Family House', count: 8 },
    { name: 'Modern Villa', count: 26 },
    { name: 'Town House', count: 89 }
  ];
  featuredListings: any[] = [];
  tags: string[] = [];
  searchTerm = '';
  postId = '';
  authorInfo: any = {
    name: 'Unknown',
    role: 'Author',
    bio: '',
    joinDate: new Date()
  };
  authorMap: { [key: string]: any } = {};
  allPosts: any[] = [];
  loading = false;

  constructor(
    private postService: PostService,
    private reviewService: ReviewService,
    private authService: AuthService,
    private reportService: ReportService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private userService: UserService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loading = true;
    
    // Subscribe to route parameter changes to handle navigation
    this.route.paramMap.subscribe(params => {
      this.postId = params.get('slug') || '';
      
      if (this.postId) {
        this.loadPost();
      }
    });
    
    // Handle fragment navigation for scrolling to sections
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        setTimeout(() => {
          const element = document.getElementById(fragment);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500); // Small delay to ensure content is loaded
      }
    });
  }

  loadPost(): void {
    this.loading = true;
    
    this.postService.getPosts().subscribe({
      next: (posts) => {
        this.allPosts = posts;
        const found = posts.find((p: any) => p.slug === this.postId);
        if (found) {
          this.post = found;
          this.tags = this.post.tags || [];
          this.loadAuthor();
          this.loadRelatedPosts();
          this.loadFeaturedListings();
          this.loadReviews();
          this.loading = false;
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading post:', err);
        this.loading = false;
      }
    });
  }

  loadAuthor() {
    if (this.post && this.post.author) {
      this.userService.getUser(this.post.author).subscribe({
        next: (user) => {
          this.authorMap[this.post.author] = user;
          
          // Store author info
          this.authorInfo = {
            id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            avatar: this.getAuthorAvatar(this.post),
            role: user.role || 'Author',
            email: user.email,
            bio: user.description || 'No bio available',
            joinDate: user.createdAt
          };
        },
        error: (err) => {
          console.error('Error loading author:', err);
          this.authorInfo = {
            name: 'Unknown Author',
            avatar: 'assets/images/team/default-avatar.jpg',
            role: 'Author',
            bio: 'No bio available',
            joinDate: new Date()
          };
        }
      });
    }
  }

  loadRelatedPosts() {
    if (this.allPosts.length > 0 && this.post) {
      // Sort posts by creation date to get proper chronological order
      const sortedPosts = this.allPosts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      // Find current post index in sorted array
      const currentIndex = sortedPosts.findIndex(p => p._id === this.post._id);
      
      // Set previous and next posts
      this.previousPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
      this.nextPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;
      
      // Keep the old relatedPosts array for backward compatibility
      this.relatedPosts = [];
      if (this.previousPost) this.relatedPosts.push(this.previousPost);
      if (this.nextPost) this.relatedPosts.push(this.nextPost);
      
      // Also get related posts by category or tags for the bottom section
      this.categoryRelatedPosts = this.allPosts
        .filter(p => 
          p._id !== this.post._id && (
            p.category === this.post.category || 
            (this.post.tags && this.post.tags.some((tag: string) => p.tags?.includes(tag)))
          )
        )
        .slice(0, 4);
    }
  }

  loadFeaturedListings() {
    if (this.allPosts.length > 0) {
      // Get the most recent posts as featured listings
      this.featuredListings = this.allPosts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .map(post => ({
          image: this.getPostImageUrl(post),
          title: post.title,
          price: post.category || 'Blog Post',
          beds: Math.floor(Math.random() * 5) + 1,
          baths: Math.floor(Math.random() * 3) + 1,
          sqft: Math.floor(Math.random() * 3000) + 1000,
          slug: post.slug
        }));
    }
  }

  getAuthorAvatar(post: any): string {
    const user = this.authorMap[post.author];
    if (user && user.profileImage) {
      let baseUrl = environment.apiBaseUrl;
      if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
      }
      if (user.profileImage.startsWith('/uploads/')) {
        return baseUrl + user.profileImage;
      }
      if (user.profileImage.startsWith('http')) {
        return user.profileImage;
      }
    }
    return 'assets/images/team/s1.jpg';
  }

  getPostImageUrl(post: any): string {
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
    return 'assets/images/blog/1.jpg';
  }

  stripHtmlTags(html: string): string {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  sanitizeHtml(html: string): SafeHtml {
    if (!html) return '';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  goToPost(post: any) {
    this.router.navigate(['/posts', post.slug]);
  }

  slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }

  getUserAvatar(userOrReview: string | any): string {
    let userId = userOrReview;
    
    // If it's a review object, extract the userId
    if (userOrReview && typeof userOrReview === 'object' && userOrReview.userId) {
      userId = userOrReview.userId;
    }
    
    if (!userId) {
      return 'assets/images/team/default-avatar.jpg';
    }
    
    // If userId is a populated object from backend
    if (typeof userId === 'object' && userId.profileImage) {
      const baseUrl = environment.apiBaseUrl.replace('/api', '');
      return `${baseUrl}/${userId.profileImage}`;
    }
    
    // If userId is a string, check our local cache
    if (typeof userId === 'string') {
      const user = this.authorMap[userId];
      if (user && user.profileImage) {
        const baseUrl = environment.apiBaseUrl.replace('/api', '');
        return `${baseUrl}/${user.profileImage}`;
      }
    }
    
    return 'assets/images/team/default-avatar.jpg';
  }

  getReviewUserAvatar(review: any): string {
    // If the review has populated user data from backend (with populated userId)
    if (review.userId && typeof review.userId === 'object' && review.userId.profileImage) {
      let baseUrl = environment.apiBaseUrl;
      if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
      }
      
      if (review.userId.profileImage.startsWith('/uploads/')) {
        return baseUrl + review.userId.profileImage;
      }
      if (review.userId.profileImage.startsWith('http')) {
        return review.userId.profileImage;
      }
      // If it's just a filename, construct the full path
      return `${baseUrl}/uploads/users/${review.userId.profileImage}`;
    }
    
    // If userId is just a string, check our local cache
    if (review.userId && typeof review.userId === 'string' && this.authorMap[review.userId]) {
      const user = this.authorMap[review.userId];
      if (user.profileImage) {
        let baseUrl = environment.apiBaseUrl;
        if (baseUrl.endsWith('/api')) {
          baseUrl = baseUrl.slice(0, -4);
        }
        
        if (user.profileImage.startsWith('/uploads/')) {
          return baseUrl + user.profileImage;
        }
        if (user.profileImage.startsWith('http')) {
          return user.profileImage;
        }
        return `${baseUrl}/uploads/users/${user.profileImage}`;
      }
    }
    
    // Default avatar if no profile image found
    return 'assets/images/testimonial/default-avatar.png';
  }

  loadReviews() {
    if (this.post) {
      this.reviewService.getPostReviews(this.post._id).subscribe({
        next: (reviews) => {
          this.reviews = reviews;
          this.displayedReviews = this.reviews.slice(0, this.reviewsToShow);
          this.calculateAverageRating();
          this.loadReviewUsers();
        },
        error: (err) => {
          console.error('Error loading reviews:', err);
          this.reviews = [];
          this.displayedReviews = [];
        }
      });
    }
  }

  loadReviewUsers() {
    // Only load users that are not already populated
    const userIds = this.reviews
      .filter(review => review.userId && typeof review.userId === 'string' && !this.authorMap[review.userId])
      .map(review => review.userId);
    
    userIds.forEach(userId => {
      this.userService.getUser(userId).subscribe({
        next: (user) => {
          this.authorMap[userId] = user;
        },
        error: (err) => {
          console.error('Error loading user:', err);
        }
      });
    });
  }

  calculateAverageRating() {
    if (this.reviews.length === 0) {
      this.averageRating = 0;
      return;
    }
    
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = sum / this.reviews.length;
  }

  submitReview() {
    if (!this.newReview.rating || !this.newReview.comment) {
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.error('User must be logged in to submit a review');
      return;
    }

    const review = {
      rating: this.newReview.rating,
      comment: this.newReview.comment,
      targetType: 'post' as const,
      targetId: this.post._id,
      userId: currentUser._id
    };

    this.reviewService.addReview(review).subscribe({
      next: (newReview) => {
        console.log('Review submitted successfully');
        this.newReview = { title: '', comment: '', rating: 0 };
        this.loadReviews(); // Reload reviews
      },
      error: (err) => {
        console.error('Error submitting review:', err);
      }
    });
  }

  likeReview(review: any) {
    // Implement like functionality if needed
    console.log('Like review:', review);
  }

  viewMoreReviews() {
    this.reviewsToShow = Math.min(this.reviewsToShow + 3, this.reviews.length);
    this.displayedReviews = this.reviews.slice(0, this.reviewsToShow);
  }

  getStarArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }

  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
      stars += '★';
    }
    
    if (hasHalfStar) {
      stars += '☆';
    }
    
    return stars;
  }

  onSearch() {
    if (!this.searchTerm) return;
    // Navigate to posts list with search term
    this.router.navigate(['/posts'], { queryParams: { search: this.searchTerm } });
  }

  getFormattedDescription(description: string): string {
    // For display in post details, we want to preserve HTML formatting
    return description;
  }

  getPlainTextDescription(description: string): string {
    // For excerpts and summaries, we want plain text
    return this.stripHtmlTags(description);
  }

  filterByCategory(categoryName: string) {
    this.router.navigate(['/posts'], { queryParams: { category: categoryName } });
  }

  filterByTag(tagName: string) {
    this.router.navigate(['/posts'], { queryParams: { tag: tagName } });
  }

  // Social Share Methods
  shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.post.title);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  }

  shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.post.title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
  }

  shareOnLinkedIn() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.post.title);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  }

  shareOnGoogle() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://plus.google.com/share?url=${url}`, '_blank');
  }

  shareOnPinterest() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.post.title);
    const imageUrl = encodeURIComponent(this.getPostImageUrl(this.post));
    window.open(`https://pinterest.com/pin/create/button/?url=${url}&media=${imageUrl}&description=${title}`, '_blank');
  }

  copyToClipboard() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      console.log('Link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }

  getReviewerName(review: any): string {
    if (review.reviewerName) {
      return review.reviewerName;
    }
    
    // If the review has populated user data from backend
    if (review.userId && typeof review.userId === 'object' && review.userId.firstName) {
      return `${review.userId.firstName} ${review.userId.lastName}`;
    }
    
    // If userId is just a string, check our local cache
    if (review.userId && typeof review.userId === 'string' && this.authorMap[review.userId]) {
      const user = this.authorMap[review.userId];
      return `${user.firstName} ${user.lastName}`;
    }
    
    return 'Anonymous';
  }

  setRating(rating: number) {
    this.newReview.rating = rating;
  }

  navigateToFeaturedPost(listing: any) {
    // Navigate to the featured post
    if (listing.slug) {
      this.router.navigate(['/posts', listing.slug]);
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  isUserLoggedIn(): boolean {
    const user = this.authService.getCurrentUser();
    return user !== null;
  }

  getCurrentUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'Anonymous';
  }

  reportPost(): void {
    if (!this.isUserLoggedIn()) {
      Swal.fire({
        title: 'Login Required',
        text: 'You need to login to report this post',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Login',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/auth/login']);
        }
      });
      return;
    }

    if (!this.post) return;

    // Show report categories
    Swal.fire({
      title: 'Report Post',
      text: 'Why are you reporting this post?',
      input: 'select',
      inputOptions: {
        'spam': 'Spam',
        'inappropriate_content': 'Inappropriate content',
        'offensive_language': 'Offensive language',
        'harassment': 'Harassment',
        'fraud': 'Fraud or misleading information',
        'copyright_violation': 'Copyright violation',
        'other': 'Other'
      },
      inputPlaceholder: 'Select a reason',
      showCancelButton: true,
      confirmButtonText: 'Continue',
      inputValidator: (value) => {
        if (!value) {
          return 'Please select a reason';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.showPostReportDetailsModal(result.value);
      }
    });
  }

  private showPostReportDetailsModal(category: string): void {
    Swal.fire({
      title: 'Report Details',
      html: `
        <p class="mb-3">Category: <strong>${this.reportService.getReportCategoryDisplayName(category)}</strong></p>
        <textarea 
          id="reportReason" 
          class="form-control" 
          placeholder="Please provide more details about why you're reporting this post..."
          rows="4"
          maxlength="500"></textarea>
        <small class="text-muted mt-2 d-block">Maximum 500 characters</small>
      `,
      showCancelButton: true,
      confirmButtonText: 'Submit Report',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const reason = (document.getElementById('reportReason') as HTMLTextAreaElement).value;
        if (!reason.trim()) {
          Swal.showValidationMessage('Please provide a reason for reporting');
          return false;
        }
        if (reason.length > 500) {
          Swal.showValidationMessage('Reason must be less than 500 characters');
          return false;
        }
        return reason;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.submitPostReport(category, result.value);
      }
    });
  }

  private submitPostReport(category: string, reason: string): void {
    if (!this.post) return;

    const reportData = {
      targetType: 'post' as const,
      targetId: this.post._id,
      category: category,
      reason: reason.trim()
    };

    this.reportService.createReport(reportData).subscribe({
      next: (response) => {
        if (response.success) {
          Swal.fire({
            title: 'Report Submitted',
            text: 'Thank you for your report. Our team will review it shortly.',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
          });
        }
      },
      error: (error) => {
        console.error('Error submitting report:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to submit report. Please try again.',
          icon: 'error'
        });
      }
    });
  }
}
