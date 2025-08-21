import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Chat, Message } from '../models/chat.model';
import { environment } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiBaseUrl}/chats`;
  private socket: Socket | null = null;
  private connected: boolean = false;
  
  // Observable sources
  private newMessageSubject = new BehaviorSubject<{chatId: string, message: Message} | null>(null);
  private userStatusSubject = new BehaviorSubject<{userId: string, status: string} | null>(null);
  private typingSubject = new BehaviorSubject<{chatId: string, userId: string} | null>(null);
  private stopTypingSubject = new BehaviorSubject<{chatId: string, userId: string} | null>(null);
  private messagesReadSubject = new BehaviorSubject<{chatId: string, readBy: string} | null>(null);
  
  // Observable streams
  newMessage$ = this.newMessageSubject.asObservable();
  userStatus$ = this.userStatusSubject.asObservable();
  typing$ = this.typingSubject.asObservable();
  stopTyping$ = this.stopTypingSubject.asObservable();
  messagesRead$ = this.messagesReadSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getSocket() {
    return this.socket;
  }

  // Initialize socket connection
  initSocket() {
    if (this.connected && this.socket) return;

    const token = this.authService.getToken();
    if (!token) {
      console.error('No authentication token available');
      return;
    }

    try {
      this.socket = io(`${environment.apiBaseUrl}`, {
        auth: { token },
        extraHeaders: {
          Authorization: `Bearer ${token}`
        },
        transports: ['websocket'],
        reconnection: true
      });

      this.socket.on('connect', () => {
        console.log('Socket connected with auth token');
        this.connected = true;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.connected = false;
      });

      this.setupSocketListeners();
    } catch (error) {
      console.error('Socket initialization error:', error);
      this.connected = false;
    }
  }

  // Setup socket listeners
  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('receive_message', (data: {chatId: string, message: Message}) => {
      console.log('New message received:', data);
      this.newMessageSubject.next(data);
    });
    
    this.socket.on('user_status', (data: {userId: string, status: string}) => {
      console.log('User status update:', data);
      this.userStatusSubject.next(data);
    });
    
    this.socket.on('user_typing', (data: {chatId: string, userId: string}) => {
      this.typingSubject.next(data);
    });
    
    this.socket.on('user_stop_typing', (data: {chatId: string, userId: string}) => {
      this.stopTypingSubject.next(data);
    });
    
    this.socket.on('messages_read', (data: {chatId: string, readBy: string}) => {
      this.messagesReadSubject.next(data);
    });
    
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });
  }

  // Disconnect socket
  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Send typing indicator
  sendTyping(chatId: string, userId: string) {
    if (this.socket && this.connected) {
      this.socket.emit('typing', { chatId, userId });
    }
  }

  // Send stop typing indicator
  sendStopTyping(chatId: string, userId: string) {
    if (this.socket && this.connected) {
      this.socket.emit('stop_typing', { chatId, userId });
    }
  }

  // Send message via socket
  sendMessageViaSocket(chatId: string, sender: string, content: string, attachments?: string[]) {
    if (this.socket && this.connected) {
      const message = {
        chatId,
        sender,
        content,
        timestamp: new Date(),
        attachments: attachments || []
      };
      
      this.socket.emit('send_message', message);
    }
  }

  // Mark messages as read via socket
  markMessagesAsReadViaSocket(chatId: string, userId: string) {
    if (this.socket && this.connected) {
      this.socket.emit('mark_read', { chatId, userId });
    }
  }

  // Get all chats for a user (or agent)
  getUserChats(userId?: string): Observable<any> {
    const id = userId || this.authService.getCurrentUser()?._id;
    return this.http.get(`${this.apiUrl}/user/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(chats => console.log('User chats loaded successfully:', chats)),
      catchError(error => {
        console.error('Error loading user chats:', error);
        return throwError(() => error);
      })
    );
  }

  // Get a specific chat
  getChat(chatId: string): Observable<Chat> {
    return this.http.get<Chat>(`${this.apiUrl}/${chatId}`);
  }

  // Create a new chat
  createChat(buyerId: string, sellerId: string, propertyId: string): Observable<any> {
    return this.http.post(this.apiUrl, {
      buyerId,
      sellerId,
      propertyId
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(chat => console.log('Chat created successfully:', chat)),
      catchError(error => {
        console.error('Error creating chat:', error);
        return throwError(() => error);
      })
    );
  }

  // Send a message
  sendMessage(chatId: string, sender: string, content: string): Observable<Chat> {
    // Also send via socket for real-time updates
    this.sendMessageViaSocket(chatId, sender, content);
    
    return this.http.post<Chat>(`${this.apiUrl}/${chatId}/messages`, 
      { sender, content },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(response => console.log('Message sent successfully:', response)),
      catchError(error => {
        console.error('Error sending message:', error);
        return throwError(() => error);
      })
    );
  }

  // Send a message with attachments
  sendMessageWithAttachments(chatId: string, formData: FormData): Observable<Chat> {
    const headers = this.getAuthHeaders();
    return this.http.post<Chat>(
      `${this.apiUrl}/${chatId}/messages/attachments`, 
      formData,
      { headers }
    ).pipe(
      tap(response => console.log('Message with attachments sent successfully:', response)),
      catchError(error => {
        console.error('Error sending message with attachments:', error);
        return throwError(() => error);
      })
    );
  }

  // Mark messages as read
  markMessagesAsRead(chatId: string, userId: string): Observable<any> {
    // Also send via socket for real-time updates
    this.markMessagesAsReadViaSocket(chatId, userId);
    
    return this.http.put<any>(`${this.apiUrl}/${chatId}/read`, { userId });
  }

  // Close a chat
  closeChat(chatId: string): Observable<Chat> {
    return this.http.put<Chat>(`${this.apiUrl}/${chatId}/close`, {});
  }

  // Get chat history
  getChatHistory(chatId: string, limit: number = 50, before?: Date): Observable<Message[]> {
    let url = `${this.apiUrl}/${chatId}/history?limit=${limit}`;
    if (before) {
      url += `&before=${before.toISOString()}`;
    }
    return this.http.get<Message[]>(url);
  }

  // Load messages with limit
  loadMessages(chatId: string, limit: number = 50): Observable<any> {
    const params = new HttpParams().set('limit', limit.toString());
    
    return this.http.get(`${this.apiUrl}/${chatId}/history`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      tap(messages => console.log('Messages loaded successfully:', messages)),
      catchError(error => {
        console.error('Error loading messages:', error);
        return throwError(() => error);
      })
    );
  }
}