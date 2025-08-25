import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar">
      <div class="sidebar-header">
        <h3>🏠 RealEstate Pro</h3>
        <div class="user-info">
          <div class="avatar">{{ currentUser.name.charAt(0) }}</div>
          <div class="user-details">
            <span class="name">{{ currentUser.name }}</span>
            <span class="role">{{ currentUser.role }}</span>
          </div>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <ul>
          <li>
            <a href="#" 
               [class.active]="activeSection === 'dashboard'"
               (click)="selectSection('dashboard')">
              <i class="icon">📊</i>
              <span>Dashboard</span>
            </a>
          </li>
          <li>
            <a href="#" 
               [class.active]="activeSection === 'properties'"
               (click)="selectSection('properties')">
              <i class="icon">🏡</i>
              <span>My Properties</span>
            </a>
          </li>
          <li>
            <a href="#" 
               [class.active]="activeSection === 'calendar'"
               (click)="selectSection('calendar')">
              <i class="icon">📅</i>
              <span>Booking Calendar</span>
            </a>
          </li>
          <li>
            <a href="#" 
               [class.active]="activeSection === 'contracts'"
               (click)="selectSection('contracts')">
              <i class="icon">📄</i>
              <span>My Contracts</span>
            </a>
          </li>
          <li>
            <a href="#" 
               [class.active]="activeSection === 'posts'"
               (click)="selectSection('posts')">
              <i class="icon">📝</i>
              <span>My Posts</span>
            </a>
          </li>
          <li>
            <a href="#" 
               [class.active]="activeSection === 'favorites'"
               (click)="selectSection('favorites')">
              <i class="icon">❤️</i>
              <span>Favorites</span>
            </a>
          </li>
          <li>
            <a href="#" 
               [class.active]="activeSection === 'reservations'"
               (click)="selectSection('reservations')">
              <i class="icon">🎫</i>
              <span>Reservations</span>
            </a>
          </li>
          <li>
            <a href="#" 
               [class.active]="activeSection === 'agency'"
               (click)="selectSection('agency')">
              <i class="icon">🏢</i>
              <span>Agency Management</span>
            </a>
          </li>
          <li>
            <a href="#" 
               [class.active]="activeSection === 'profile'"
               (click)="selectSection('profile')">
              <i class="icon">⚙️</i>
              <span>Profile Settings</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  `,
  styles: [`
    .sidebar {
      width: 280px;
      height: 100vh;
      background: linear-gradient(180deg, #3e4c66 0%, #2d3748 100%);
      color: white;
      position: fixed;
      left: 0;
      top: 0;
      overflow-y: auto;
      box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }

    .sidebar-header {
      padding: 2rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sidebar-header h3 {
      color: white;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
      text-align: center;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar {
      width: 50px;
      height: 50px;
      background: #ff5a5f;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.2rem;
    }

    .user-details {
      flex: 1;
    }

    .name {
      display: block;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .role {
      display: block;
      font-size: 0.875rem;
      opacity: 0.8;
      background: #ff5a5f;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      text-align: center;
    }

    .sidebar-nav {
      padding: 1rem 0;
    }

    .sidebar-nav ul {
      list-style: none;
    }

    .sidebar-nav li {
      margin-bottom: 0.5rem;
    }

    .sidebar-nav a {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      transition: all 0.3s ease;
      border-right: 3px solid transparent;
    }

    .sidebar-nav a:hover,
    .sidebar-nav a.active {
      color: white;
      background: rgba(255, 90, 95, 0.1);
      border-right-color: #ff5a5f;
    }

    .icon {
      font-size: 1.2rem;
      width: 24px;
      text-align: center;
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }

      .sidebar.open {
        transform: translateX(0);
      }
    }
  `]
})
export class SidebarComponent {
  @Output() sectionChange = new EventEmitter<string>();
  
  activeSection = 'dashboard';
  currentUser = {
    name: 'John Smith',
    role: 'Real Estate Agent'
  };

  selectSection(section: string) {
    this.activeSection = section;
    this.sectionChange.emit(section);
  }
}