import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatbotService } from '../../../core/services/chatbot.service';

@Component({
  selector: 'app-chatbot-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="demo-container">
      <h2>Chatbot Integration Demo</h2>
      <p>The chatbot is now available on all pages. Look for the chat button in the bottom-left corner!</p>
      
      <div class="demo-features">
        <h3>Features Available:</h3>
        <ul>
          <li>✅ Check notifications</li>
          <li>✅ View pending payments</li>
          <li>✅ Leave reviews</li>
          <li>✅ Contact support</li>
          <li>✅ Property information</li>
          <li>✅ Payment methods info</li>
          <li>✅ Booking assistance</li>
        </ul>
      </div>

      <div class="demo-actions">
        <h3>Try These Commands:</h3>
        <button (click)="showChatbot()" class="demo-btn">Open Chatbot</button>
        <div class="sample-commands">
          <p><strong>Sample questions to try:</strong></p>
          <ul>
            <li>"Show my notifications"</li>
            <li>"Check pending payments"</li>
            <li>"I want to leave a review"</li>
            <li>"I need help with my booking"</li>
            <li>"What payment methods do you accept?"</li>
            <li>"How do I search for properties?"</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .demo-features, .demo-actions {
      margin: 2rem 0;
    }

    .demo-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 25px;
      cursor: pointer;
      font-size: 16px;
      transition: transform 0.2s ease;
    }

    .demo-btn:hover {
      transform: translateY(-2px);
    }

    .sample-commands {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    ul {
      margin: 1rem 0;
    }

    li {
      margin: 0.5rem 0;
    }

    h2 {
      color: #333;
      margin-bottom: 1rem;
    }

    h3 {
      color: #667eea;
      margin: 1.5rem 0 1rem 0;
    }
  `]
})
export class ChatbotDemoComponent {
  constructor(private chatbotService: ChatbotService) {}

  showChatbot() {
    this.chatbotService.showChatbot();
  }
}
