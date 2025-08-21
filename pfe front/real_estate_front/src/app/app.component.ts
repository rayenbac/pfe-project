import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ChatService } from './core/services/chat.service';
import { CookieConsentComponent } from './shared/components/cookie-consent/cookie-consent.component';
import { ChatbotComponent } from './shared/components/chatbot/index';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CookieConsentComponent, ChatbotComponent],
  template: `
    <router-outlet></router-outlet>
    <app-cookie-consent></app-cookie-consent>
    <app-chatbot></app-chatbot>
  `, 
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit() {
    // Handle Google OAuth token in URL
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (token) {
      localStorage.setItem('auth_token', token);
      this.authService.updateCurrentUserFromToken(token);
      // Remove token from URL
      url.searchParams.delete('token');
      window.history.replaceState({}, document.title, url.pathname + url.search);
      // Optionally, redirect to home or dashboard
      this.router.navigate(['/']);
    }

    // Initialize socket connection if user is logged in
    if (this.authService.getCurrentUser()) {
      this.chatService.initSocket();
    }

    // Listen for login/logout events to connect/disconnect socket
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.chatService.initSocket();
      } else {
        this.chatService.disconnectSocket();
      }
    });
  }
}