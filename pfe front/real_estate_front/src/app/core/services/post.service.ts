import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../models/post.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = `${environment.apiBaseUrl}/posts`; // Replace with your API base URL

  constructor(private http: HttpClient) {}

  // Get all posts
  getPosts(sort?: string): Observable<Post[]> {
    console.log('Fetching posts from API...');
    const params = sort ? { sort } : {};
    return this.http.get<Post[]>(this.apiUrl); 
  }

  // Get a single post by ID
  getAPost(id: string): Observable<Post> {
    console.log(`Fetching post with ID: ${id}`);
    return this.http.get<Post>(`${this.apiUrl}/${id}`, { responseType: 'json' }); // Specify responseType as 'json'
  }

  // Get a single post by slug
  getPostBySlug(slug: string): Observable<Post> {
    console.log(`Fetching post with slug: ${slug}`);
    return this.http.get<Post>(`${this.apiUrl}/slug/${slug}`, { responseType: 'json' });
  }

  // Add a new post
  addPost(post: any): Observable<Post> {
    // If post is FormData, do not set Content-Type
    if (post instanceof FormData) {
      return this.http.post<Post>(this.apiUrl, post);
    }
    return this.http.post<Post>(this.apiUrl, post, this.getHttpOptions());
  }

  // Update a post
  updatePost(id: string, post: any): Observable<Post> {
    if (post instanceof FormData) {
      return this.http.put<Post>(`${this.apiUrl}/${id}`, post);
    }
    return this.http.put<Post>(`${this.apiUrl}/${id}`, post, this.getHttpOptions());
  }

  // Delete a post
  deletePost(id: string): Observable<void> {
    console.log(`Deleting post with ID: ${id}`);
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get paginated posts (chunked)
  getChunk(queryParams: { sortType: string; pageIndex: number; orderBy: string; filter?: string }, limit: number): Observable<any> {
    const params = {
      ...queryParams,
      limit: limit.toString(),
    };
    return this.http.get<any>(`${this.apiUrl}/chunk`, { params, responseType: 'json' }); // Specify responseType as 'json'
  }

  // Update a post with PATCH
  patchPost(id: string, post: Partial<Post>): Observable<Post> {
    console.log(`Patching post with ID: ${id}`);
    return this.http.patch<Post>(`${this.apiUrl}/${id}`, post, this.getHttpOptions());
  }

  // Search posts based on a query
  search(query: string, queryParams: { sortType: string; pageIndex: number; orderBy: string }): Observable<any> {
    console.log(`Searching posts with query: ${query}`);
    const params = {
      ...queryParams,
      q: query,
    };
    return this.http.get<any>(`${this.apiUrl}/search`, { params, responseType: 'json' }); // Specify responseType as 'json'
  }

  // Helper method to get common HTTP options, such as authorization headers
  private getHttpOptions() {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // Add authorization header if needed
    // headers.set('Authorization', `Bearer ${yourToken}`);
    return { headers };
  }
}
