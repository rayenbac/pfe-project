// app.routes.ts

import { Routes } from '@angular/router';
import { LayoutComponent } from './front-office/layout/layout.component';
import { HomeComponent } from './front-office/home/home.component';
import { ADMIN_ROUTES } from './back-office/admin.routes'; // Importing admin routes
import { ResetPasswordComponent } from './front-office/reset-password/reset-password.component';
import { PropertyDetailsComponent } from './front-office/properties/property-details/property-details.component';
import { PropertyListComponent } from './front-office/properties/property-list/property-list.component';
import { ChatComponent } from './front-office/chat/chat.component';
import { AuthGuard } from './core/guards/auth.guard';
import { ProfileComponent } from './front-office/users/profile/profile.component';
import { PropertyFormComponent } from './back-office/properties/property-form/property-form.component';
import { AgentDetailsComponent } from './front-office/users/agent/agent-details/agent-details.component';
import { ReservationComponent } from './front-office/payment/reservation/reservation.component';
import { CheckoutComponent } from './front-office/payment/checkout/checkout.component';
import { ConfirmationComponent } from './front-office/payment/confirmation/confirmation.component';
import { SuccessComponent } from './front-office/payment/success/success.component';
import { FailureComponent } from './front-office/payment/failure/failure.component';
import { ContractCheckoutComponent } from './front-office/payment/contract-checkout/contract-checkout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'reset-password/:token', component: ResetPasswordComponent },
      { path: 'properties', component: PropertyListComponent },
      { path: 'property/:slug', component: PropertyDetailsComponent }, // New slug-based route
      { path: 'properties/:id', component: PropertyDetailsComponent }, // Keep old ID-based route for backward compatibility
      { path: 'properties/city/:city', loadComponent: () => import('./front-office/properties/properties-by-city/property-by-city.component').then(m => m.PropertyByCityComponent) },
      { 
        path: 'chat', 
        component: ChatComponent,
        // canActivate: [AuthGuard]
      },
      { 
        path: 'chat/:propertyId/:agentId', 
        component: ChatComponent,
        // canActivate: [AuthGuard]
      },
      { 
        path: 'add-property', 
        component: PropertyFormComponent,
        // canActivate: [AuthGuard]
      },
      { path: 'profile', component: ProfileComponent,
        // canActivate: [AuthGuard]
       },
       {
        path: 'notifications',
        loadComponent: () => import('./shared/components/notifications-page/notifications-page.component').then(m => m.NotificationsPageComponent),
        // canActivate: [AuthGuard]
       },
       {
        path: 'agents', 
        loadComponent: () => import('./front-office/users/agent/agent-list/agent-list.component').then(m => m.AgentListComponent)
      },
       {
        path: 'agents/:slug',
        component: AgentDetailsComponent
      },
       {
        path: 'agents/id/:id', // Keep old ID-based route for backward compatibility
        component: AgentDetailsComponent
      },
      { 
        path: 'posts',
        loadComponent: () => import('./front-office/posts/post-list/post-list.component').then(m => m.PostListComponent)
      },
      {
        path: 'posts/create',
        loadComponent: () => import('./front-office/posts/post-create/post-create.component').then(m => m.PostCreateComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'posts/:slug',
        loadComponent: () => import('./front-office/posts/post-details/post-details.component').then(m => m.PostDetailsComponent)
      },
      {
        path: 'posts/:id/edit',
        loadComponent: () => import('./front-office/posts/post-edit/post-edit.component').then(m => m.PostEditComponent),
        canActivate: [AuthGuard]
      },
      {
        path: 'payment/reservation/:id', 
        component: ReservationComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'checkout/contract', 
        component: ContractCheckoutComponent,
        canActivate: [AuthGuard]
      },
      { 
        path: 'payment/checkout', 
        component: CheckoutComponent,
        canActivate: [AuthGuard]
      },
      { 
        path: 'payment/confirmation', 
        component: ConfirmationComponent,
        canActivate: [AuthGuard]
      },
      { 
        path: 'payment/success', 
        component: SuccessComponent
        // Removed canActivate: [AuthGuard] to allow Konnect callbacks
      },
      {
        path: 'payment/failure',
        component: FailureComponent
        // No auth guard needed for failure page
      },
      {
        path: 'agencies',
        loadComponent: () => import('./front-office/pages/agencies/agencies.component').then(m => m.AgenciesComponent)
      },
      {
        path: 'agencies/:slug',
        loadComponent: () => import('./front-office/agencies/agency-details/agency-details.component').then(m => m.AgencyDetailsComponent)
      },
      {
        path: 'agencies/id/:id', // Keep old ID-based route for backward compatibility
        loadComponent: () => import('./front-office/agencies/agency-details/agency-details.component').then(m => m.AgencyDetailsComponent)
      },
      {
        path: 'about',
        loadComponent: () => import('./front-office/pages/about/about.component').then(m => m.AboutComponent)
      },
      {
        path: 'contact',
        loadComponent: () => import('./front-office/pages/contact/contact.component').then(m => m.ContactComponent)
      },
      {
        path: 'faq',
        loadComponent: () => import('./front-office/pages/faq/faq.component').then(m => m.FaqComponent)
      },
      {
        path: 'terms',
        loadComponent: () => import('./front-office/pages/terms/terms.component').then(m => m.TermsComponent)
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  {
    path: 'admin',
    children: ADMIN_ROUTES 
  },
  { 
    path: '**', 
    loadComponent: () => import('./front-office/pages/error/error.component').then(m => m.ErrorComponent) 
  }
];