import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PostService } from '../../../core/services/post.service';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';

@Component({
  selector: 'app-post-create',
  standalone: true,
  imports: [FormsModule, NgIf, NgxEditorModule, DatePipe],
  templateUrl: './post-create.component.html',
  styleUrl: './post-create.component.css'
})
export class PostCreateComponent implements OnInit, OnDestroy {
  post: any = {
    title: '',
    description: '',
    category: '',
    tags: '',
    image: null
  };
  selectedFile: File | null = null;
  loading = false;
  error = '';
  success = false;
  currentUser: any = null;
  currentDate = new Date();

  // NGX Editor Configuration
  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];

  html = '';

  constructor(private postService: PostService, private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.editor = new Editor();
    this.currentUser = this.authService.getCurrentUser();
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }

  goBack() {
    this.router.navigate(['/posts']);
  }

  onFileChange(event: any) {
    console.log('File change event:', event);
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      console.log('Selected file:', this.selectedFile);
    }
  }

  addTag(tag: string) {
    if (this.post.tags) {
      const existingTags = this.post.tags.split(/[\s,]+/).map((t: string) => t.trim()).filter((t: string) => t);
      if (!existingTags.includes(tag)) {
        this.post.tags += this.post.tags ? ` ${tag}` : tag;
      }
    } else {
      this.post.tags = tag;
    }
  }

  onTagInput(event: any) {
    const input = event.target.value;
    const lastChar = input[input.length - 1];
    
    if (lastChar === ' ' || lastChar === ',') {
      // Process tags when space or comma is pressed
      const tags = input.split(/[\s,]+/).map((t: string) => t.trim()).filter((t: string) => t);
      this.post.tags = tags.join(' ');
    }
  }

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.success = false;
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.error = 'You must be logged in to create a post.';
      this.loading = false;
      return;
    }
    
    // Convert tags to array format
    const tagsArray = this.post.tags ? 
      this.post.tags.split(/[\s,]+/).map((t: string) => t.trim()).filter((t: string) => t) : [];
    
    const formData = new FormData();
    formData.append('title', this.post.title);
    formData.append('description', this.html || this.post.description);
    formData.append('category', this.post.category || 'General');
    formData.append('tags', JSON.stringify(tagsArray));
    formData.append('likes', '0');
    formData.append('published', 'true');
    formData.append('author', currentUser._id);
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }
    this.postService.addPost(formData).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/posts']);
        }, 1200);
      },
      error: (err) => {
        this.error = 'Failed to create post.';
        this.loading = false;
      }
    });
  }
}
