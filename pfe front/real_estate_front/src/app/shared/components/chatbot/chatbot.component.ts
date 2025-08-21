import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatMessage, ChatAction } from '../../../core/services/chatbot.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating Chat Button -->
    <div class="chat-button" 
         [class.hidden]="isVisible" 
         (click)="toggleChat()"
         title="Chat with our assistant">
      <i class="fas fa-comments"></i>
      <div class="chat-badge" *ngIf="unreadMessages > 0">{{ unreadMessages }}</div>
    </div>

    <!-- Chat Window -->
    <div class="chat-window" [class.visible]="isVisible">
      <!-- Chat Header -->
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="avatar">
            <i class="fas fa-robot"></i>
          </div>
          <div class="info">
            <h4>Real Estate Assistant</h4>
            <span class="status" [class.typing]="isTyping">
              {{ isTyping ? 'Typing...' : 'Online' }}
            </span>
          </div>
        </div>
        <div class="chat-controls">
          <button class="control-btn" (click)="clearChat()" title="Clear conversation">
            <i class="fas fa-trash-alt"></i>
          </button>
          <button class="control-btn" (click)="toggleChat()" title="Close chat">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Chat Messages -->
      <div class="chat-messages" #messagesContainer>
        <div *ngFor="let message of messages" 
             class="message" 
             [class.user-message]="message.sender === 'user'"
             [class.bot-message]="message.sender === 'bot'">
          
          <div class="message-avatar" *ngIf="message.sender === 'bot'">
            <i class="fas fa-robot"></i>
          </div>
          
          <div class="message-content">
            <div class="message-bubble">
              <div class="message-text" [innerHTML]="formatMessage(message.content)"></div>
              
              <!-- Quick Reply Buttons -->
              <div class="quick-replies" *ngIf="message.quickReplies && message.quickReplies.length > 0">
                <button *ngFor="let reply of message.quickReplies" 
                        class="quick-reply-btn"
                        (click)="sendQuickReply(reply)">
                  {{ reply }}
                </button>
              </div>
              
              <!-- Action Buttons -->
              <div class="action-buttons" *ngIf="message.actions && message.actions.length > 0">
                <button *ngFor="let action of message.actions" 
                        class="action-btn"
                        [class.primary]="action.action === 'navigate'"
                        (click)="executeAction(action)">
                  {{ action.label }}
                </button>
              </div>
            </div>
            
            <div class="message-time">
              {{ message.timestamp | date:'HH:mm' }}
            </div>
          </div>
          
          <div class="message-avatar" *ngIf="message.sender === 'user'">
            <i class="fas fa-user"></i>
          </div>
        </div>
        
        <!-- Typing Indicator -->
        <div class="message bot-message" *ngIf="isTyping">
          <div class="message-avatar">
            <i class="fas fa-robot"></i>
          </div>
          <div class="message-content">
            <div class="message-bubble typing-indicator">
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Input -->
      <div class="chat-input">
        <div class="input-container">
          <input #messageInput
                 type="text" 
                 [(ngModel)]="currentMessage"
                 (keypress)="onKeyPress($event)"
                 placeholder="Type your message..."
                 [disabled]="isTyping"
                 class="message-input">
          <button class="send-btn" 
                  (click)="sendMessage()"
                  [disabled]="!currentMessage.trim() || isTyping">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
        
        <!-- Suggested Responses -->
        <div class="suggested-responses" *ngIf="suggestedResponses.length > 0">
          <button *ngFor="let response of suggestedResponses"
                  class="suggested-response"
                  (click)="sendQuickReply(response)">
            {{ response }}
          </button>
        </div>
      </div>
    </div>

    <!-- Chat Overlay (for mobile) -->
    <div class="chat-overlay" 
         [class.visible]="isVisible && isMobile" 
         (click)="toggleChat()"></div>
  `,
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  isVisible = false;
  isTyping = false;
  messages: ChatMessage[] = [];
  currentMessage = '';
  unreadMessages = 0;
  isMobile = false;
  
  suggestedResponses: string[] = [
    "Show my notifications",
    "Check pending payments",
    "Leave a review",
    "I need help"
  ];

  private subscriptions: Subscription[] = [];

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    // Check if mobile
    this.isMobile = window.innerWidth <= 768;
    
    // Subscribe to chat state
    this.subscriptions.push(
      this.chatbotService.isVisible$.subscribe(visible => {
        this.isVisible = visible;
        if (visible && this.messageInput) {
          setTimeout(() => this.messageInput.nativeElement.focus(), 100);
        }
      }),
      
      this.chatbotService.isTyping$.subscribe(typing => {
        this.isTyping = typing;
      }),
      
      this.chatbotService.currentSession$.subscribe(session => {
        if (session) {
          this.messages = session.messages;
          // Count unread messages (messages received while chat was closed)
          if (!this.isVisible) {
            this.unreadMessages = session.messages.filter(m => 
              m.sender === 'bot' && 
              m.timestamp.getTime() > Date.now() - 60000 // Last minute
            ).length;
          } else {
            this.unreadMessages = 0;
          }
        }
      })
    );

    // Listen for window resize
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleChat(): void {
    this.chatbotService.toggleChatbot();
    if (this.isVisible) {
      this.unreadMessages = 0;
    }
  }

  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isTyping) return;
    
    this.chatbotService.sendMessage(this.currentMessage);
    this.currentMessage = '';
    this.unreadMessages = 0;
  }

  sendQuickReply(reply: string): void {
    this.chatbotService.sendMessage(reply);
    this.unreadMessages = 0;
  }

  executeAction(action: ChatAction): void {
    this.chatbotService.executeAction(action);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat(): void {
    this.chatbotService.clearConversation();
  }

  formatMessage(content: string): string {
    // Format message content with basic HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/```(.*?)```/gs, '<code>$1</code>') // Code blocks
      .replace(/`(.*?)`/g, '<code>$1</code>'); // Inline code
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      try {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      } catch (err) {
        console.error('Could not scroll to bottom:', err);
      }
    }
  }
}
