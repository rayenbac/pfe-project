import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { PropertyService } from '../../core/services/property.service';
import { UserService } from '../../core/services/user.service';
import { Chat, Message } from '../../core/models/chat.model';
import { Property } from '../../core/models/property.model';
import { User, UserRole } from '../../core/models/user.model';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') messageContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  chats: Chat[] = [];
  currentChat: Chat | null = null;
  messages: Message[] = [];
  newMessage: string = '';
  loading: boolean = false;
  error: string | null = null;
  currentUser: any;
  selectedFiles: File[] = [];
  property: Property | null = null;
  otherUser: User | null = null;
  typingUsers: Map<string, string> = new Map(); // chatId -> userId
  searchQuery: string = '';
  filteredChats: Chat[] = [];
  allAgents: User[] = [];
  loadingAgents: boolean = false;
  filteredAgents: User[] = [];
  recentAgents: User[] = [];
  
  // Subscriptions
  private newMessageSubscription: Subscription | null = null;
  private typingSubscription: Subscription | null = null;
  private stopTypingSubscription: Subscription | null = null;
  private messagesReadSubscription: Subscription | null = null;
  private userStatusSubscription: Subscription | null = null;
  private typingTimeout: any = null;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private propertyService: PropertyService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  private isProperty(value: string | Property): value is Property {
    return typeof value === 'object' && value !== null && '_id' in value;
  }

  public isUser(value: string | User): value is User {
    return typeof value === 'object' && value !== null && '_id' in value;
  }

  ngOnInit(): void {
    // Remove any existing pricing slider scripts
    const pricingSliderScript = document.querySelector('script[src*="pricing-slider.js"]');
    if (pricingSliderScript) {
      pricingSliderScript.remove();
    }
    
    const storedUser = localStorage.getItem('current_user');
    this.currentUser = storedUser ? JSON.parse(storedUser) : null;
    
    if (!this.currentUser) {
      Swal.fire({
        title: 'Authentication Required',
        text: 'Please log in to access the chat feature',
        icon: 'warning',
        confirmButtonText: 'Login'
      }).then(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      });
      return;
    }

    // Initialize socket connection
    this.chatService.initSocket();
    this.setupSocketListeners();

    this.route.params.subscribe(params => {
      const propertyId = params['propertyId'];
      const agentId = params['agentId'];
      
      if (propertyId && agentId) {
        this.initializeChat(propertyId, agentId);
      } else {
        this.loadUserChats();
      }
    });

    this.loadAllAgents();
    this.filterChats(); // Initial filter
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.newMessageSubscription) {
      this.newMessageSubscription.unsubscribe();
    }
    if (this.typingSubscription) {
      this.typingSubscription.unsubscribe();
    }
    if (this.stopTypingSubscription) {
      this.stopTypingSubscription.unsubscribe();
    }
    if (this.messagesReadSubscription) {
      this.messagesReadSubscription.unsubscribe();
    }
    if (this.userStatusSubscription) {
      this.userStatusSubscription.unsubscribe();
    }
    
    // Clear typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Disconnect socket
    this.chatService.disconnectSocket();
  }

  setupSocketListeners(): void {
    if (!this.chatService.getSocket()) {
      console.error('Socket not initialized');
      return;
    }

    // Listen for new messages
    this.newMessageSubscription = this.chatService.newMessage$.subscribe(data => {
      if (data && this.currentChat && data.chatId === this.currentChat._id) {
        // Only add if not already present (avoid duplicates)
        if (!this.messages.some(m => m._id === data.message._id)) {
          this.messages.push(data.message);
          this.scrollToBottom();
        }
        this.chatService.markMessagesAsRead(data.chatId, this.currentUser._id).subscribe();
      } else if (data) {
        // If it's a message for another chat, refresh the chat list
        this.loadUserChats();
        
        // If the chat is in the list, update its last message instantly
        const chatToUpdate = this.chats.find(c => c._id === data.chatId);
        if (chatToUpdate) {
          chatToUpdate.lastMessage = data.message;
        }
        
        // Show notification
        Swal.fire({
          title: 'New Message',
          text: 'You have received a new message',
          icon: 'info',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
    });
    
    // Listen for typing indicators
    this.typingSubscription = this.chatService.typing$.subscribe(data => {
      if (data && this.currentChat && data.chatId === this.currentChat._id) {
        this.typingUsers.set(data.chatId, data.userId);
      }
    });
    
    // Listen for stop typing indicators
    this.stopTypingSubscription = this.chatService.stopTyping$.subscribe(data => {
      if (data && this.typingUsers.has(data.chatId)) {
        this.typingUsers.delete(data.chatId);
      }
    });
    
    // Listen for messages read
    this.messagesReadSubscription = this.chatService.messagesRead$.subscribe(data => {
      if (data && this.currentChat && data.chatId === this.currentChat._id) {
        // Update read status of messages
        this.messages = this.messages.map(message => {
          if (message.sender === this.currentUser._id && !message.isRead) {
            return { ...message, isRead: true };
          }
          return message;
        });
      }
    });
    
    // Listen for user status changes
    this.userStatusSubscription = this.chatService.userStatus$.subscribe(data => {
      if (data) {
        // Update status in allAgents
        const idx = this.allAgents.findIndex(a => a._id === data.userId);
        if (idx !== -1) {
          this.allAgents[idx].status = data.status as 'online' | 'offline';
        }
        // Also update otherUser if needed
        if (this.otherUser && data.userId === this.otherUser._id) {
          this.otherUser = {
            ...this.otherUser,
            status: data.status as 'online' | 'offline'
          };
        }
        this.updateRecentAndFilteredAgents();
      }
    });
  }

  initializeChat(propertyId: string, agentId: string): void {
    this.loading = true;
    console.log('Initializing chat with:', { propertyId, agentId, currentUser: this.currentUser });
    
    const token = this.authService.getToken();
    if (!token || !this.currentUser?._id) {
      this.loading = false;
      Swal.fire({
        title: 'Authentication Error',
        text: 'Please login again to continue',
        icon: 'error'
      }).then(() => {
        this.authService.logout();
        this.router.navigate(['/login']);
      });
      return;
    }

    this.chatService.createChat(this.currentUser._id, agentId, propertyId)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (chat) => {
          if (!chat) {
            throw new Error('No chat data received');
          }
          this.currentChat = chat;
          this.loadMessages(chat._id!);
          this.loadPropertyDetails(chat);
          this.loadOtherUserDetails(chat);
        },
        error: (error) => {
          console.error('Error creating chat:', error);
          const errorMessage = error.status === 401 ? 
            'Session expired. Please login again.' : 
            'Failed to initialize chat. Please try again.';
          
          Swal.fire({
            title: 'Error',
            text: errorMessage,
            icon: 'error'
          }).then(() => {
            if (error.status === 401) {
              this.authService.logout();
              this.router.navigate(['/login']);
            }
          });
        }
      });
  }

  loadUserChats(): void {
    this.loading = true;
    this.chatService.getUserChats(this.currentUser._id).subscribe({
      next: (chats: Chat[]) => {
        this.chats = chats;
        this.loading = false;
        // If there are chats, select the first one
        if (chats.length > 0 && !this.currentChat) {
          this.selectChat(chats[0]);
        }
      },
      error: (error) => {
        this.error = 'Failed to load chats';
        this.loading = false;
        console.error('Error loading chats:', error);
      }
    });
  }

  selectChat(chat: Chat): void {
    this.currentChat = chat;
    this.loadMessages(chat._id!);
    this.loadPropertyDetails(chat);
    this.loadOtherUserDetails(chat);
  }

  loadPropertyDetails(chat: Chat) {
    const propertyId = this.isProperty(chat.propertyId) ? chat.propertyId._id : chat.propertyId;
    
    this.propertyService.getProperty(propertyId).subscribe({
      next: (property) => {
        this.property = property;
      },
      error: (error) => {
        console.error('Error loading property:', error);
      }
    });
  }

  loadOtherUserDetails(chat: Chat) {
    const otherParticipant = chat.participants.find(p => {
      if (this.isUser(p)) {
        return p._id !== this.currentUser._id;
      }
      return p !== this.currentUser._id;
    });

    if (!otherParticipant) return;

    const otherUserId = this.isUser(otherParticipant) ? otherParticipant._id : otherParticipant;
    
    this.userService.getUser(otherUserId).subscribe({
      next: (user) => {
        this.otherUser = user;
      },
      error: (error) => {
        console.error('Error loading user:', error);
      }
    });
  }

  loadMessages(chatId: string): void {
    this.loading = true;
    
    this.chatService.loadMessages(chatId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (messages) => {
          this.messages = messages;
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (error) => {
          console.error('Error loading messages:', error);
          if (error.status === 401) {
            Swal.fire({
              title: 'Session Expired',
              text: 'Please login again to continue.',
              icon: 'error'
            }).then(() => {
              this.authService.logout();
              this.router.navigate(['/login']);
            });
          } else {
            Swal.fire({
              title: 'Error',
              text: 'Failed to load messages. Please try again.',
              icon: 'error'
            });
          }
        }
      });
  }

  sendMessage(): void {
    if (!this.currentChat?._id || !this.currentUser?._id) {
      console.error('Missing chat ID or user ID', { chat: this.currentChat, user: this.currentUser });
      Swal.fire({
        title: 'Error',
        text: 'Chat session not properly initialized. Please try again.',
        icon: 'error'
      });
      return;
    }
    if (!this.newMessage.trim() && this.selectedFiles.length === 0) {
      return;
    }
    this.loading = true;
    const tempMessage: Message = {
      sender: this.currentUser._id,
      content: this.newMessage,
      timestamp: new Date(),
      isRead: false,
      attachments: [],
      _id: 'temp-' + Date.now()
    };
    // Optimistically add the message to the UI
    this.messages.push(tempMessage);
    this.scrollToBottom();
    const handleError = (error: any) => {
      console.error('Error sending message:', error);
      this.loading = false;
      // Remove the temp message if error
      this.messages = this.messages.filter(m => m._id !== tempMessage._id);
      if (error.status === 401) {
        Swal.fire({
          title: 'Session Expired',
          text: 'Please login again to continue.',
          icon: 'error'
        }).then(() => {
          this.authService.logout();
          this.router.navigate(['/login']);
        });
      } else {
        Swal.fire({
          title: 'Error',
          text: 'Failed to send message. Please try again.',
          icon: 'error'
        });
      }
    };
    if (this.selectedFiles.length > 0) {
      const formData = new FormData();
      formData.append('sender', this.currentUser._id);
      formData.append('content', this.newMessage);
      this.selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });
      this.chatService.sendMessageWithAttachments(this.currentChat._id, formData)
        .subscribe({
          next: (chat) => {
            // Replace the temp message with the real one if returned
            if (chat && chat.lastMessage && chat._id === this.currentChat?._id) {
              this.messages = this.messages.filter(m => m._id !== tempMessage._id);
              this.messages.push(chat.lastMessage);
            }
            this.newMessage = '';
            this.selectedFiles = [];
            this.loading = false;
          },
          error: handleError
        });
    } else {
      this.chatService.sendMessage(this.currentChat._id, this.currentUser._id, this.newMessage)
        .subscribe({
          next: (chat) => {
            // Replace the temp message with the real one if returned
            if (chat && chat.lastMessage && chat._id === this.currentChat?._id) {
              this.messages = this.messages.filter(m => m._id !== tempMessage._id);
              this.messages.push(chat.lastMessage);
            }
            this.newMessage = '';
            this.loading = false;
          },
          error: handleError
        });
    }
    this.sendStopTyping();
  }

  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
    
    // Validate file sizes
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = this.selectedFiles.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      Swal.fire({
        title: 'Files too large',
        text: `Some files exceed the 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`,
        icon: 'warning'
      });
      
      // Remove oversized files
      this.selectedFiles = this.selectedFiles.filter(file => file.size <= maxSize);
    }
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  scrollToBottom(): void {
    if (this.messageContainer) {
      const element = this.messageContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  isOwnMessage(message: Message): boolean {
    return message.sender === this.currentUser._id;
  }

  getAttachmentUrl(url: string): string {
    return url.startsWith('http') ? url : `http://localhost:3000${url}`;
  }

  isImage(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  }

  formatTimestamp(timestamp: Date): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  getOtherParticipantName(): string {
    return this.otherUser ? `${this.otherUser.firstName} ${this.otherUser.lastName}` : 'Agent';
  }

  getPropertyTitle(): string {
    if (this.property) {
      return this.property.title || 'Untitled Property';
    }
    return 'Property';
  }

  getPropertyImage(): string {
    if (this.property && this.property.media && this.property.media.length > 0) {
      const primaryImage = this.property.media.find(m => m.isPrimary);
      if (primaryImage) {
        return this.getAttachmentUrl(primaryImage.url);
      }
      return this.getAttachmentUrl(this.property.media[0].url);
    }
    return 'assets/images/property/fp1.jpg';
  }

  getUserImage(chat: Chat): string {
    const otherParticipant = this.getOtherParticipant(chat);
    if (otherParticipant && this.isUser(otherParticipant) && otherParticipant.profileImage) {
      return this.getAttachmentUrl(otherParticipant.profileImage);
    }
    return 'assets/images/team/s1.jpg';
  }

  getOtherParticipant(chat: Chat): string | User | null {
    return chat.participants.find(p => {
      if (this.isUser(p)) {
        return p._id !== this.currentUser._id;
      }
      return p !== this.currentUser._id;
    }) || null;
  }

  onMessageInput(): void {
    if (this.currentChat && this.currentChat._id) {
      // Send typing indicator
      this.chatService.sendTyping(this.currentChat._id, this.currentUser._id);
      
      // Clear previous timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }
      
      // Set new timeout to stop typing indicator after 3 seconds
      this.typingTimeout = setTimeout(() => {
        this.sendStopTyping();
      }, 3000);
    }
  }

  sendStopTyping(): void {
    if (this.currentChat && this.currentChat._id) {
      this.chatService.sendStopTyping(this.currentChat._id, this.currentUser._id);
    }
  }

  isUserTyping(): boolean {
    return this.currentChat ? this.typingUsers.has(this.currentChat._id!) : false;
  }

  getTypingUserName(): string {
    if (!this.currentChat || !this.isUserTyping()) return '';
    
    const typingUserId = this.typingUsers.get(this.currentChat._id!);
    if (typingUserId === this.otherUser?._id) {
      return this.getOtherParticipantName();
    }
    return 'Someone';
  }

  getChatName(chat: Chat): string {
    const otherParticipant = this.getOtherParticipant(chat);
    
    if (otherParticipant && this.isUser(otherParticipant)) {
      return `${otherParticipant.firstName} ${otherParticipant.lastName}`;
    }
    
    return 'Chat';
  }

  getChatPreview(chat: Chat): string {
    if (chat.lastMessage) {
      return chat.lastMessage.content || 'Attachment';
    }
    return 'No messages yet';
  }

  getChatTime(chat: Chat): string {
    if (chat.lastMessage && chat.lastMessage.timestamp) {
      return this.formatTimestamp(chat.lastMessage.timestamp);
    }
    return '';
  }

  getMessageAvatar(message: Message): string {
    if (this.isOwnMessage(message)) {
      return 'assets/images/team/s1.jpg';
    }
    return this.otherUser?.profileImage 
      ? this.getAttachmentUrl(this.otherUser.profileImage) 
      : 'assets/images/team/s2.jpg';
  }

  loadAllAgents() {
    if (this.isAgent) {
      // Agents do not need to load all agents
      this.allAgents = [];
      this.filteredAgents = [];
      this.recentAgents = [];
      return;
    }
    this.loadingAgents = true;
    this.userService.getAgents().subscribe({
      next: (agents: User[]) => {
        this.allAgents = agents;
        this.updateRecentAndFilteredAgents();
        this.loadingAgents = false;
      },
      error: (error: any) => {
        console.error('Error loading agents:', error);
        this.loadingAgents = false;
      }
    });
  }

  filterChats() {
    this.updateRecentAndFilteredAgents();
  }

  updateRecentAndFilteredAgents() {
    if (this.isAgent) {
      // For agents, show all unique users from all chats
      const userMap = new Map<string, User>();
      for (const chat of this.chats) {
        for (const participant of chat.participants) {
          if (this.isUser(participant) && participant.role === UserRole.USER && participant._id !== this.currentUser._id) {
            userMap.set(participant._id, participant);
          }
        }
      }
      // Filter by search query
      const query = this.searchQuery.trim().toLowerCase();
      this.recentAgents = Array.from(userMap.values()).filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return fullName.includes(query);
      });
      this.filteredAgents = [];
      return;
    }
    // For users, keep current logic
    const recentAgentIds = new Set(
      this.chats.map(chat => {
        const other = this.getOtherParticipant(chat);
        return (other && this.isUser(other)) ? other._id : null;
      }).filter(id => id)
    );
    this.recentAgents = this.allAgents.filter(agent => recentAgentIds.has(agent._id));
    const query = this.searchQuery.trim().toLowerCase();
    this.filteredAgents = this.allAgents.filter(agent => {
      const fullName = `${agent.firstName} ${agent.lastName}`.toLowerCase();
      return fullName.includes(query);
    });
  }

  getAgentStatus(agent: User): 'online' | 'offline' {
    return agent.status || 'offline';
  }

  startOrOpenChat(agent: User) {
    if (this.isAgent) {
      // For agents, find the chat with this user and select it
      const chatWithUser = this.chats.find(chat => {
        const other = this.getOtherParticipant(chat);
        return other && this.isUser(other) && other._id === agent._id;
      });
      if (chatWithUser) {
        this.selectChat(chatWithUser);
      }
      return;
    }
    // For users, allow starting new chats
    const existingChat = this.chats.find(chat => {
      const other = this.getOtherParticipant(chat);
      return other && this.isUser(other) && other._id === agent._id;
    });
    if (existingChat) {
      this.selectChat(existingChat);
    } else {
      this.startNewChat(agent);
    }
  }

  startNewChat(agent: User) {
    if (!this.currentUser) return;

    // Create a temporary property ID for direct agent chat
    const tempPropertyId = 'direct-chat';
    
    this.chatService.createChat(this.currentUser._id, agent._id, tempPropertyId).subscribe({
      next: (chat) => {
        this.chats.unshift(chat);
        this.filteredChats = this.chats;
        this.selectChat(chat);
      },
      error: (error) => {
        console.error('Error creating chat:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to start conversation'
        });
      }
    });
  }

  public getLastMessageContent(agent: User): string {
    const chat = this.chats.find(chat => {
      const other = this.getOtherParticipant(chat);
      return other && this.isUser(other) && other._id === agent._id;
    });
    if (chat && chat.lastMessage && chat.lastMessage.content) {
      return chat.lastMessage.content;
    }
    return 'No messages yet';
  }

  public isCurrentChatWithAgent(agent: User): boolean {
    if (!this.currentChat) return false;
    const other = this.getOtherParticipant(this.currentChat);
    return !!(other && this.isUser(other) && other._id === agent._id);
  }

  public isUserParticipantInChat(chat: Chat, agent: User): boolean {
    const other = this.getOtherParticipant(chat);
    return !!(other && this.isUser(other) && other._id === agent._id);
  }

  // Add a getter to check if the current user is an agent
  public get isAgent(): boolean {
    return this.currentUser && this.currentUser.role === 'agent';
  }

  // Add a getter to check if the current user is a regular user
  public get isRegularUser(): boolean {
    return this.currentUser && this.currentUser.role === 'user';
  }
}