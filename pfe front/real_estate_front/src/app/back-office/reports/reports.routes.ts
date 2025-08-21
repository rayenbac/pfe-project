import { Routes } from '@angular/router';
import { AdminReportsComponent } from './admin-reports/admin-reports.component';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    component: AdminReportsComponent
  },
  {
    path: 'admin-reports',
    component: AdminReportsComponent
  }
];
