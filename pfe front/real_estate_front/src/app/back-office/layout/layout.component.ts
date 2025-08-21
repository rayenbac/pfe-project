import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { RouterOutlet, Router } from '@angular/router'; // Import RouterOutlet and Router


@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, RouterOutlet],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class DashboardLayoutComponent implements OnInit, AfterViewInit {

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('Dashboard layout initialized');
    console.log('Current URL:', this.router.url);
  }

  ngAfterViewInit(): void {
    // Hide preloader after view is initialized
    setTimeout(() => {
      const preloader = document.querySelector('.preloader');
      if (preloader) {
        (preloader as HTMLElement).style.display = 'none';
        console.log('Preloader hidden');
      }
    }, 500);
  }
}
