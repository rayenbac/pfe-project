import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Post } from '../../../core/models/post.model';
import { PostService } from '../../../core/services/post.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit {
  posts: Post[] = [];

  constructor(private postService: PostService) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.postService.getPosts().subscribe({
      next: (data) => {
        console.log('Posts loaded:', data);
        this.posts = data;
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.showErrorAlert('Failed to load posts');
      }
    });
  }

  deletePost(id: string): void {
    if (!id) {
      console.error('Invalid post ID');
      return;
    }

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
        this.postService.deletePost(id).subscribe({
          next: () => {
            this.posts = this.posts.filter(post => post._id !== id);
            Swal.fire(
              'Deleted!',
              'Post has been deleted successfully.',
              'success'
            );
          },
          error: (error) => {
            console.error('Error deleting post:', error);
            this.showErrorAlert('Failed to delete post');
          }
        });
      }
    });
  }

  private showErrorAlert(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message
    });
  }
}
