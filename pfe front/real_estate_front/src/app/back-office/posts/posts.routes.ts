import { Routes } from '@angular/router';
import { PostListComponent } from './post-list/post-list.component';
import { PostFormComponent } from './post-form/post-form.component';
import { PostDetailsComponent } from './post-details/post-details.component';

export const POSTS_ROUTES: Routes = [
  { path: '', component: PostListComponent },
  { path: 'add', component: PostFormComponent },
  { path: 'edit/:id', component: PostFormComponent },
  { path: 'details/:id', component: PostDetailsComponent }
];
