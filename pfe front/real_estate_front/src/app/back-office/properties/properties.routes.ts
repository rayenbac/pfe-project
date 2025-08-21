import { Routes } from '@angular/router';
import { PropertyListComponent } from './property-list/property-list.component';
import { PropertyFormComponent } from './property-form/property-form.component';
import { PropertyDetailsComponent } from './property-details/property-details.component';

export const PROPERTIES_ROUTES: Routes = [
  { path: '', component: PropertyListComponent },
  { path: 'add', component: PropertyFormComponent },
  { path: 'edit/:id', component: PropertyFormComponent },
  { path: 'details/:id', component: PropertyDetailsComponent }
];
