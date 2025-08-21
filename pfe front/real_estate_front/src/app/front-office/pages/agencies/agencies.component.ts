import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgencyListComponent } from '../../agencies/agency-list/agency-list.component';

@Component({
  selector: 'app-agencies',
  standalone: true,
  imports: [CommonModule, AgencyListComponent],
  template: `<app-agency-list></app-agency-list>`
})
export class AgenciesComponent {}
