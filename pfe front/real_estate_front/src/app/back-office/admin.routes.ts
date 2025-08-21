import { Routes } from '@angular/router';
import { DashboardLayoutComponent } from './layout/layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from '../core/guards/auth.guard';

// Import components for new sections
import { AgentsComponent } from './agents/agents.component';
import { AgenciesComponent } from './agencies/agencies.component';
import { PaymentsComponent } from './payments/payments.component';
import { BookingsComponent } from './bookings/bookings.component';
import { AnalyticsComponent } from './analytics/analytics.component';
import { SettingsComponent } from './settings/settings.component';
import { CrmComponent } from './crm/crm.component';
import { InvoicesComponent } from '../admin/components/invoices/invoices.component';
import { InvoiceDetailComponent } from '../admin/components/invoice-detail/invoice-detail.component';

// Import the routes for each feature
import { USERS_ROUTES } from './users/users.routes';
import { PROPERTIES_ROUTES } from './properties/properties.routes';
import { POSTS_ROUTES } from './posts/posts.routes';
import { CATEGORIES_ROUTES } from './categories/categories.routes';
import { REPORTS_ROUTES } from './reports/reports.routes';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: DashboardLayoutComponent,
    // canActivate: [AuthGuard], // Uncomment when auth is ready
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'properties',
        children: PROPERTIES_ROUTES  // Include the routes from properties.routes.ts
      },
      {
        path: 'users',
        children: USERS_ROUTES  // Include the routes from users.routes.ts
      },
      {
        path: 'agents',
        component: AgentsComponent
      },
      {
        path: 'agencies',
        component: AgenciesComponent
      },
      {
        path: 'bookings',
        component: BookingsComponent
      },
      {
        path: 'payments',
        component: PaymentsComponent
      },
      {
        path: 'analytics',
        component: AnalyticsComponent
      },
      {
        path: 'settings',
        component: SettingsComponent
      },
      {
        path: 'crm',
        component: CrmComponent
      },
      {
        path: 'invoices',
        component: InvoicesComponent
      },
      {
        path: 'invoices/:id',
        component: InvoiceDetailComponent
      },
      {
        path: 'posts',
        children: POSTS_ROUTES  // Include the routes from posts.routes.ts
      },
      {
        path: 'categories',
        children: CATEGORIES_ROUTES  // Include the routes from categories.routes.ts
      },
      {
        path: 'reports',
        children: REPORTS_ROUTES  // Include the routes from reports.routes.ts
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
