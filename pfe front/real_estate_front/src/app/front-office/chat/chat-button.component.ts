import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-chat-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <button class="btn btn-thm" (click)="startChat()">
      <i class="flaticon-chat mr-2"></i> Chat with Agent
    </button>
  `,
  styles: [`
    .btn-thm {
      background-color: #ff5a5f;
      border-color: #ff5a5f;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    
    .btn-thm:hover {
      background-color: #e04046;
      border-color: #e04046;
    }
  `]
})
export class ChatButtonComponent {
  @Input() propertyId: string = '';
  @Input() agentId: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  startChat(): void {
    const currentUser = localStorage.getItem('current_user');
    
    if (!currentUser) {
      Swal.fire({
        title: 'Login Required',
        text: 'You need to be logged in to chat with the agent',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Login',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login'], { 
            queryParams: { 
              returnUrl: `/chat/${this.propertyId}/${this.agentId}` 
            } 
          });
        }
      });
      return;
    }

    this.router.navigate(['/chat', this.propertyId, this.agentId]);
  }
}