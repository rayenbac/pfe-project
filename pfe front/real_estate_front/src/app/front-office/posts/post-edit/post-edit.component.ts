import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../../core/services/post.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-post-edit',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './post-edit.component.html',
  styleUrl: './post-edit.component.css'
})
export class PostEditComponent implements OnInit {
  post: any = {
    title: '',
    description: '',
    category: '',
    image: ''
  };
  categories = [
    { name: 'Apartment', count: 6 },
    { name: 'Condo', count: 12 },
    { name: 'Family House', count: 8 },
    { name: 'Modern Villa', count: 26 },
    { name: 'Town House', count: 89 }
  ];
  selectedFile: File | null = null;
  loading = false;
  error = '';
  postId = '';

  constructor(private postService: PostService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.postId = this.route.snapshot.paramMap.get('id') || '';
    if (this.postId) {
      this.postService.getAPost(this.postId).subscribe({
        next: (data) => {
          this.post = data;
        },
        error: () => {
          this.error = 'Failed to load post.';
        }
      });
    }
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      // Preview
      if (this.selectedFile) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.post.image = e.target.result;
        };
        reader.readAsDataURL(this.selectedFile);
      }
    }
  }

  onSubmit() {
    this.loading = true;
    const formData = new FormData();
    formData.append('title', this.post.title);
    formData.append('description', this.post.description);
    formData.append('category', this.post.category);
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    this.postService.updatePost(this.postId, formData).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/posts']);
      },
      error: (err) => {
        this.error = 'Failed to update post.';
        this.loading = false;
      }
    });
  }
}
