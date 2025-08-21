import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';
import { ReviewService } from './review.service';
import { AgentContactService, AgentContactMessage } from './agent-contact.service';
import { StripeService } from './stripe.service';
import { PaymentInvoiceService } from './payment-invoice.service';
import { AuthService } from './auth.service';
import { AI_CONFIG, AI_PROVIDERS, getEnabledAIProviders, AIConfig } from '../config/ai-config';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'action' | 'quick-reply';
  actions?: ChatAction[];
  quickReplies?: string[];
}

export interface ChatAction {
  label: string;
  action: string;
  data?: any;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  context: any;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = `${environment.apiBaseUrl}/chatbot`;
  
  // Chat state management
  private currentSession = new BehaviorSubject<ChatSession | null>(null);
  private isVisible = new BehaviorSubject<boolean>(false);
  private isTyping = new BehaviorSubject<boolean>(false);
  
  public currentSession$ = this.currentSession.asObservable();
  public isVisible$ = this.isVisible.asObservable();
  public isTyping$ = this.isTyping.asObservable();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private reviewService: ReviewService,
    private contactService: AgentContactService,
    private stripeService: StripeService,
    private paymentInvoiceService: PaymentInvoiceService,
    private authService: AuthService
  ) {
    this.initializeSession();
  }

  private initializeSession(): void {
    const session: ChatSession = {
      id: this.generateSessionId(),
      messages: [
        {
          id: this.generateMessageId(),
          content: "🤖 **Welcome to your AI Real Estate Assistant!**\n\nI'm your comprehensive real estate companion, powered by advanced AI. Here's how I can help:\n\n🏠 **Property Hunting:**\n• Smart property search & recommendations\n• Market analysis & investment insights\n• Neighborhood guides & area research\n\n📅 **Booking Manager:**\n• Schedule property viewings\n• Manage appointments & reservations\n• Track booking status & confirmations\n\n🎧 **Personal Support:**\n• 24/7 assistance with any questions\n• Technical support & platform guidance\n• Payment help & review management\n\n💡 **Advanced Features:**\n• ROI & mortgage calculators\n• Market trends & price predictions\n• Legal guidance & documentation help\n• Relocation & moving assistance\n\nWhat would you like to explore today? Just ask me anything! 😊",
          sender: 'bot',
          timestamp: new Date(),
          type: 'quick-reply',
          quickReplies: [
            "🏠 Find properties for me",
            "📅 Schedule a viewing", 
            "📊 Show market analysis",
            "💰 Calculate ROI",
            "🔔 Check my notifications",
            "🎧 I need help"
          ]
        }
      ],
      context: {},
      isActive: true
    };
    this.currentSession.next(session);
  }

  // UI Controls
  showChatbot(): void {
    this.isVisible.next(true);
  }

  hideChatbot(): void {
    this.isVisible.next(false);
  }

  toggleChatbot(): void {
    this.isVisible.next(!this.isVisible.value);
  }

  // Message handling
  async sendMessage(content: string): Promise<void> {
    const session = this.currentSession.value;
    if (!session) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    session.messages.push(userMessage);
    this.currentSession.next(session);

    // Process and respond
    this.isTyping.next(true);
    
    try {
      const response = await this.processMessage(content, session.context);
      
      // Simulate typing delay
      await this.delay(1000);
      
      session.messages.push(response);
      session.context = { ...session.context, ...response.actions?.[0]?.data };
      this.currentSession.next(session);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: ChatMessage = {
        id: this.generateMessageId(),
        content: "Sorry, I encountered an error. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
      session.messages.push(errorMessage);
      this.currentSession.next(session);
    } finally {
      this.isTyping.next(false);
    }
  }

  // Core message processing with intent detection
  private async processMessage(content: string, context: any): Promise<ChatMessage> {
    const intent = this.detectIntent(content.toLowerCase());
    
    switch (intent.type) {
      case 'show_notifications':
        return await this.handleNotificationsRequest();
      
      case 'check_payments':
        return await this.handlePaymentsRequest();
      
      case 'leave_review':
        return await this.handleReviewRequest(intent.data);
      
      case 'get_help':
        return await this.handleHelpRequest(intent.data);
      
      case 'booking_help':
        return this.handleBookingHelp();
      
      case 'payment_methods':
        return this.handlePaymentMethodsInfo();
      
      case 'greeting':
        return this.handleGreeting();
      
      case 'ai_general':
        return await this.handleAIGeneralQuestion(content, context);
      
      default:
        return await this.handleAIGeneralQuestion(content, context);
    }
  }

  // Intent detection using keyword matching and patterns
  private detectIntent(message: string): { type: string; data?: any } {
    // Normalize message
    const msg = message.toLowerCase().trim();

    // Notifications patterns (Platform specific)
    if (this.matchesPatterns(msg, [
      'show notifications', 'check notifications', 'my notifications',
      'unread notifications', 'notification', 'notifications'
    ])) {
      return { type: 'show_notifications' };
    }

    // Payments patterns (Platform specific)
    if (this.matchesPatterns(msg, [
      'check payments', 'pending payments', 'payment status', 'my payments',
      'pay', 'payment', 'payments', 'invoice', 'bill'
    ])) {
      return { type: 'check_payments' };
    }

    // Review patterns (Platform specific)
    if (this.matchesPatterns(msg, [
      'leave review', 'write review', 'review', 'rate property',
      'rate agent', 'feedback'
    ])) {
      const propertyMatch = msg.match(/property\s+(\w+)/);
      const agentMatch = msg.match(/agent\s+(\w+)/);
      return { 
        type: 'leave_review', 
        data: { 
          propertyId: propertyMatch?.[1],
          agentId: agentMatch?.[1]
        }
      };
    }

    // Platform help patterns (Platform specific)
    if (this.matchesPatterns(msg, [
      'help with platform', 'platform support', 'contact support', 'technical issue', 
      'login problem', 'account issue', 'bug report', 'platform trouble'
    ])) {
      return { type: 'get_help', data: { topic: this.extractHelpTopic(msg) } };
    }

    // Booking help patterns (Platform specific)
    if (this.matchesPatterns(msg, [
      'my bookings', 'check bookings', 'booking status', 'cancel booking',
      'reschedule booking', 'book property', 'schedule viewing'
    ])) {
      return { type: 'booking_help' };
    }

    // Payment methods info (Platform specific)
    if (this.matchesPatterns(msg, [
      'payment methods', 'how to pay on platform', 'stripe', 'konnect',
      'payment options here', 'how do i pay'
    ])) {
      return { type: 'payment_methods' };
    }

    // Greeting patterns
    if (this.matchesPatterns(msg, [
      'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'
    ])) {
      return { type: 'greeting' };
    }

    // All other questions go to AI for intelligent responses
    return { type: 'ai_general' };
  }

  private matchesPatterns(message: string, patterns: string[]): boolean {
    return patterns.some(pattern => 
      message.includes(pattern) || 
      this.fuzzyMatch(message, pattern)
    );
  }

  private fuzzyMatch(text: string, pattern: string): boolean {
    const words = pattern.split(' ');
    return words.every(word => text.includes(word));
  }

  private extractHelpTopic(message: string): string {
    if (message.includes('booking') || message.includes('reservation')) return 'booking';
    if (message.includes('payment') || message.includes('pay')) return 'payment';
    if (message.includes('property') || message.includes('listing')) return 'property';
    if (message.includes('account') || message.includes('profile')) return 'account';
    return 'general';
  }

  // Handler methods for different intents
  private async handleNotificationsRequest(): Promise<ChatMessage> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        return {
          id: this.generateMessageId(),
          content: "Please log in to view your notifications.",
          sender: 'bot',
          timestamp: new Date(),
          type: 'action',
          actions: [
            { label: 'Login', action: 'navigate', data: { route: '/auth/login' } }
          ]
        };
      }

      // Get notifications from notification service
      this.notificationService.loadUserNotifications(currentUser._id);
      
      // Subscribe to notifications to get current state
      return new Promise((resolve) => {
        this.notificationService.notifications$.subscribe(notifications => {
          const unreadCount = notifications.filter(n => !n.isRead).length;
          
          if (notifications.length === 0) {
            resolve({
              id: this.generateMessageId(),
              content: "You have no notifications at the moment. 🔔",
              sender: 'bot',
              timestamp: new Date(),
              type: 'text'
            });
          } else {
            const recentNotifications = notifications.slice(0, 3);
            const notificationText = recentNotifications.map(n => 
              `• ${n.title}: ${n.message}`
            ).join('\n');

            resolve({
              id: this.generateMessageId(),
              content: `You have ${unreadCount} unread notification(s) out of ${notifications.length} total:\n\n${notificationText}`,
              sender: 'bot',
              timestamp: new Date(),
              type: 'action',
              actions: [
                { label: 'View All Notifications', action: 'navigate', data: { route: '/notifications' } },
                { label: 'Mark All as Read', action: 'mark_all_read', data: { userId: currentUser._id } }
              ]
            });
          }
        });
      });
    } catch (error) {
      return {
        id: this.generateMessageId(),
        content: "Sorry, I couldn't fetch your notifications right now.",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
    }
  }

  private async handlePaymentsRequest(): Promise<ChatMessage> {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        return {
          id: this.generateMessageId(),
          content: "Please log in to view your payment information.",
          sender: 'bot',
          timestamp: new Date(),
          type: 'action',
          actions: [
            { label: 'Login', action: 'navigate', data: { route: '/auth/login' } }
          ]
        };
      }

      // Get pending payments/invoices
      const invoices = await new Promise<any[]>((resolve, reject) => {
        this.paymentInvoiceService.getUserInvoices().subscribe({
          next: (data) => resolve(data || []),
          error: (error) => reject(error)
        });
      });
      const pendingInvoices = invoices?.filter(inv => inv.status === 'pending') || [];

      if (pendingInvoices.length === 0) {
        return {
          id: this.generateMessageId(),
          content: "Great! You have no pending payments. All your invoices are up to date. 💳✅",
          sender: 'bot',
          timestamp: new Date(),
          type: 'action',
          actions: [
            { label: 'View Payment History', action: 'navigate', data: { route: '/payments' } }
          ]
        };
      } else {
        const totalAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const invoiceList = pendingInvoices.slice(0, 3).map(inv => 
          `• Invoice #${inv.invoiceNumber}: ${inv.currency} ${inv.amount}`
        ).join('\n');

        return {
          id: this.generateMessageId(),
          content: `You have ${pendingInvoices.length} pending payment(s) totaling ${pendingInvoices[0]?.currency || 'USD'} ${totalAmount.toFixed(2)}:\n\n${invoiceList}`,
          sender: 'bot',
          timestamp: new Date(),
          type: 'action',
          actions: [
            { label: 'Pay Now', action: 'navigate', data: { route: '/payments' } },
            { label: 'View Details', action: 'show_payment_details', data: { invoices: pendingInvoices } }
          ]
        };
      }
    } catch (error) {
      return {
        id: this.generateMessageId(),
        content: "Sorry, I couldn't fetch your payment information right now.",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
    }
  }

  private async handleReviewRequest(data: any): Promise<ChatMessage> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return {
        id: this.generateMessageId(),
        content: "Please log in to leave a review.",
        sender: 'bot',
        timestamp: new Date(),
        type: 'action',
        actions: [
          { label: 'Login', action: 'navigate', data: { route: '/auth/login' } }
        ]
      };
    }

    if (data?.propertyId) {
      return {
        id: this.generateMessageId(),
        content: `I'll help you leave a review for property ${data.propertyId}. What would you like to rate it?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'action',
        actions: [
          { label: '⭐⭐⭐⭐⭐ (5 stars)', action: 'create_review', data: { propertyId: data.propertyId, rating: 5 } },
          { label: '⭐⭐⭐⭐ (4 stars)', action: 'create_review', data: { propertyId: data.propertyId, rating: 4 } },
          { label: '⭐⭐⭐ (3 stars)', action: 'create_review', data: { propertyId: data.propertyId, rating: 3 } }
        ]
      };
    }

    return {
      id: this.generateMessageId(),
      content: "I can help you leave a review! What would you like to review?",
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick-reply',
      quickReplies: [
        "Review a property",
        "Review an agent", 
        "Review an agency"
      ]
    };
  }

  private async handleHelpRequest(data: any): Promise<ChatMessage> {
    const topic = data?.topic || 'general';
    
    let helpContent = '';
    let actions: ChatAction[] = [];

    switch (topic) {
      case 'booking':
        helpContent = "I can help you with platform booking issues. Common problems include payment failures, date conflicts, or property availability questions on our platform.";
        actions = [
          { label: 'Contact Property Owner', action: 'contact_agent', data: { type: 'booking' } },
          { label: 'Check My Booking Status', action: 'navigate', data: { route: '/bookings' } }
        ];
        break;
      
      case 'payment':
        helpContent = "For platform payment issues, I can help you understand our payment methods (Stripe/Konnect), check your payment status, or resolve payment failures.";
        actions = [
          { label: 'Platform Payment Methods', action: 'show_payment_info' },
          { label: 'Contact Platform Support', action: 'contact_support', data: { type: 'payment' } }
        ];
        break;
      
      case 'property':
        helpContent = "Having trouble with a property listing on our platform? I can help you with platform-specific property features or contact the property owner.";
        actions = [
          { label: 'Browse Platform Properties', action: 'navigate', data: { route: '/properties' } },
          { label: 'Contact Platform Support', action: 'contact_agent', data: { type: 'property' } }
        ];
        break;
      
      default:
        helpContent = "I can help with platform-specific issues like account problems, technical difficulties, or booking/payment issues on our platform.";
        actions = [
          { label: 'Create Platform Support Ticket', action: 'create_ticket' },
          { label: 'Platform FAQ', action: 'navigate', data: { route: '/faq' } }
        ];
    }

    return {
      id: this.generateMessageId(),
      content: helpContent,
      sender: 'bot',
      timestamp: new Date(),
      type: 'action',
      actions
    };
  }

  private handlePropertySearch(data: any): ChatMessage {
    return {
      id: this.generateMessageId(),
      content: "I'll help you find the perfect property! Let me redirect you to our property search where you can filter by location, price, and features.",
      sender: 'bot',
      timestamp: new Date(),
      type: 'action',
      actions: [
        { label: 'Search Properties', action: 'navigate', data: { route: '/properties' } },
        { label: 'Advanced Search', action: 'navigate', data: { route: '/properties/search' } }
      ]
    };
  }

  private handlePropertyInfo(data: any): ChatMessage {
    return {
      id: this.generateMessageId(),
      content: "I can help you get information about any property. Please provide the property ID or name, and I'll fetch the details for you.",
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    };
  }

  private handleBookingHelp(): ChatMessage {
    return {
      id: this.generateMessageId(),
      content: "I can help you with booking-related questions! Here's what I can assist you with:",
      sender: 'bot',
      timestamp: new Date(),
      type: 'action',
      actions: [
        { label: 'Check My Bookings', action: 'navigate', data: { route: '/bookings' } },
        { label: 'How to Book', action: 'show_booking_help' },
        { label: 'Booking Issues', action: 'contact_support', data: { type: 'booking' } }
      ]
    };
  }

  private handlePaymentMethodsInfo(): ChatMessage {
    return {
      id: this.generateMessageId(),
      content: "We accept the following payment methods:\n\n💳 **Credit Cards** (via Stripe)\n- Visa, Mastercard, American Express\n- Secure international payments\n- Currency: USD\n\n🇹🇳 **Konnect** (Tunisia)\n- Local payment gateway\n- Bank transfers and cards\n- Currency: TND\n\nAll payments are secure and encrypted. 🔒",
      sender: 'bot',
      timestamp: new Date(),
      type: 'action',
      actions: [
        { label: 'Make a Payment', action: 'navigate', data: { route: '/payments' } }
      ]
    };
  }

  private handleGreeting(): ChatMessage {
    const greetings = [
      "Hello! How can I help you with your real estate needs today?",
      "Hi there! I'm here to assist you with notifications, payments, reviews, and more!",
      "Hey! What can I help you with today?"
    ];

    return {
      id: this.generateMessageId(),
      content: greetings[Math.floor(Math.random() * greetings.length)],
      sender: 'bot',
      timestamp: new Date(),
      type: 'quick-reply',
      quickReplies: [
        "Show my notifications",
        "Check pending payments",
        "Leave a review",
        "I need help"
      ]
    };
  }

  // AI General Question Handler - for non-platform specific questions
  private async handleAIGeneralQuestion(content: string, context: any): Promise<ChatMessage> {
    try {
      // Get current conversation context
      const session = this.currentSession.value;
      const conversationHistory = session?.messages.slice(-5) || []; // Last 5 messages for context
      
      // Build rich context for AI
      const aiContext = {
        userProfile: this.authService.getCurrentUser(),
        recentMessages: conversationHistory,
        currentPage: window.location.pathname
      };

      // Get AI response with full context
      const aiResponse = await this.getAIResponse(content, aiContext);
      
      // Only generate platform-specific actions
      const actions = this.generatePlatformActions(content);
      const quickReplies = this.generateContextualQuickReplies(content);
      
      return {
        id: this.generateMessageId(),
        content: aiResponse,
        sender: 'bot',
        timestamp: new Date(),
        type: actions.length > 0 ? 'action' : (quickReplies.length > 0 ? 'quick-reply' : 'text'),
        actions: actions.length > 0 ? actions : undefined,
        quickReplies: quickReplies.length > 0 ? quickReplies : undefined
      };
    } catch (error) {
      console.error('AI response failed:', error);
      
      // Enhanced fallback with intelligent responses
      const intelligentResponse = this.getIntelligentFallback(content);
      
      return {
        id: this.generateMessageId(),
        content: intelligentResponse,
        sender: 'bot',
        timestamp: new Date(),
        type: 'quick-reply',
        quickReplies: [
          "Tell me more",
          "That's helpful",
          "What else can you help with?",
          "Check my platform account"
        ]
      };
    }
  }

  // Generate only platform-specific actions
  private generatePlatformActions(userMessage: string): ChatAction[] {
    const actions: ChatAction[] = [];
    const lowerMessage = userMessage.toLowerCase();

    // Only show platform actions for platform-related queries
    if (lowerMessage.includes('my account') || lowerMessage.includes('login') || lowerMessage.includes('profile')) {
      actions.push(
        { label: '👤 My Profile', action: 'navigate', data: { route: '/profile' } },
        { label: '🔐 Account Settings', action: 'navigate', data: { route: '/account' } }
      );
    }

    if (lowerMessage.includes('my booking') || lowerMessage.includes('reservation') || lowerMessage.includes('viewing')) {
      actions.push(
        { label: '📅 My Bookings', action: 'navigate', data: { route: '/bookings' } },
        { label: '🗓️ Schedule Viewing', action: 'schedule_viewing' }
      );
    }

    if (lowerMessage.includes('my payment') || lowerMessage.includes('invoice') || lowerMessage.includes('billing')) {
      actions.push(
        { label: '💳 My Payments', action: 'navigate', data: { route: '/payments' } },
        { label: '📊 Payment History', action: 'navigate', data: { route: '/payments/history' } }
      );
    }

    if (lowerMessage.includes('platform') || lowerMessage.includes('technical') || lowerMessage.includes('support')) {
      actions.push(
        { label: '🎧 Contact Support', action: 'contact_support', data: { type: 'general' } },
        { label: '❓ Platform Help', action: 'navigate', data: { route: '/help' } }
      );
    }

    return actions.slice(0, 2); // Limit to 2 actions for clean UI
  }

  // Generate contextual quick replies that are helpful but not pushy
  private generateContextualQuickReplies(userMessage: string): string[] {
    const lowerMessage = userMessage.toLowerCase();
    
    // For price/market questions
    if (lowerMessage.includes('price') || lowerMessage.includes('market') || lowerMessage.includes('cost')) {
      return [
        "Tell me about specific areas",
        "What affects property prices?",
        "Investment tips",
        "Market trends"
      ];
    }
    
    // For property questions
    if (lowerMessage.includes('property') || lowerMessage.includes('house') || lowerMessage.includes('apartment')) {
      return [
        "Property buying tips",
        "What to look for",
        "Financing options",
        "Legal considerations"
      ];
    }
    
    // For investment questions
    if (lowerMessage.includes('invest') || lowerMessage.includes('roi') || lowerMessage.includes('rental')) {
      return [
        "ROI calculation tips",
        "Best investment strategies",
        "Market analysis",
        "Risk factors"
      ];
    }
    
    // For location/area questions
    if (lowerMessage.includes('area') || lowerMessage.includes('neighborhood') || lowerMessage.includes('location')) {
      return [
        "School districts",
        "Safety ratings",
        "Transportation",
        "Future development"
      ];
    }
    
    // Default contextual suggestions
    return [
      "Tell me more",
      "That's helpful",
      "What else should I know?",
      "Any other tips?"
    ];
  }

  // Intelligent fallback responses based on question type
  private getIntelligentFallback(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Price and market questions
    if (lowerMessage.includes('price') || lowerMessage.includes('square foot') || lowerMessage.includes('cost')) {
      return `💰 **Property pricing varies significantly by location, but here's what typically affects prices:**

**Key Price Factors:**
• **Location** - Urban vs suburban, proximity to amenities
• **Property size** - Square footage, lot size, number of rooms
• **Market conditions** - Supply and demand, economic factors
• **Property condition** - Age, renovations, maintenance
• **Neighborhood features** - Schools, safety, transportation

**Average price per square foot** typically ranges from $100-$300+ depending on the area, with luxury markets going much higher.

**Pro tip:** Always compare similar properties in the same neighborhood and consider both current value and future appreciation potential! 📈`;
    }

    // Market analysis questions
    if (lowerMessage.includes('market') || lowerMessage.includes('trend') || lowerMessage.includes('forecast')) {
      return `📊 **Real Estate Market Insights:**

**Current Market Trends:**
• **Interest rates** significantly impact buying power
• **Remote work** has shifted demand to suburban areas
• **Inventory levels** vary greatly by region
• **Generational buying patterns** are evolving

**Key Market Indicators to Watch:**
• Days on market (DOM)
• Price appreciation rates
• New construction permits
• Employment rates in the area

**Investment Perspective:**
Real estate typically appreciates 3-5% annually long-term, but short-term fluctuations are normal. Focus on location, condition, and your personal financial situation rather than trying to time the market perfectly! 🏠`;
    }

    // Investment questions
    if (lowerMessage.includes('invest') || lowerMessage.includes('roi') || lowerMessage.includes('rental')) {
      return `💼 **Real Estate Investment Guidance:**

**ROI Calculation Basics:**
• **Gross rental yield** = (Annual rent ÷ Property price) × 100
• **Net yield** = Account for taxes, maintenance, vacancies
• **Capital appreciation** = Property value increase over time

**Investment Strategies:**
• **Buy and hold** - Long-term rental income
• **House flipping** - Quick renovation and resale
• **REITs** - Real estate investment trusts for diversification

**Key Success Factors:**
• Location with growth potential
• Positive cash flow from day one
• Emergency fund for repairs/vacancies
• Understanding local rental market

**Pro tip:** Start with thorough market research and consider working with experienced local agents! 🎯`;
    }

    // General property questions
    if (lowerMessage.includes('property') || lowerMessage.includes('house') || lowerMessage.includes('buy')) {
      return `🏠 **Property Buying Wisdom:**

**Essential Steps:**
1. **Get pre-approved** for financing
2. **Research neighborhoods** thoroughly
3. **Hire qualified professionals** (agent, inspector, attorney)
4. **Inspect everything** - don't skip the home inspection
5. **Negotiate wisely** - price, repairs, closing costs

**What to Look For:**
• Strong bones (foundation, roof, electrical, plumbing)
• Good location with growth potential
• Reasonable property taxes and HOA fees
• Move-in ready vs renovation potential

**Red Flags to Avoid:**
• Properties priced way below market (usually issues)
• High-crime areas or declining neighborhoods  
• Major structural problems
• Overpriced for the area

Remember: You're not just buying a house, you're investing in a lifestyle and future! ✨`;
    }

    // Default intelligent response
    return `🤖 **I'm here to help with real estate questions!**

Based on your question, I can provide insights on:

**🏠 Property Topics:**
• Market analysis and pricing trends
• Investment strategies and ROI calculations  
• Buying/selling tips and best practices
• Neighborhood research and comparisons

**💡 Expert Advice:**
• Legal considerations and documentation
• Financing options and mortgage guidance
• Property inspection and evaluation
• Market timing and negotiation strategies

**🎯 Personalized Assistance:**
I can give detailed, specific advice based on your situation. Feel free to ask about anything related to real estate - from first-time buying to advanced investment strategies!

What specific aspect would you like to explore further? 😊`;
  }

  private generateSmartQuickReplies(userMessage: string): string[] {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('property') || lowerMessage.includes('house')) {
      return [
        "Show me apartments under $200k",
        "Properties with 3+ bedrooms",
        "Houses near schools",
        "Investment properties"
      ];
    }
    
    if (lowerMessage.includes('book') || lowerMessage.includes('appointment')) {
      return [
        "Check my bookings",
        "Schedule a viewing",
        "Cancel booking",
        "Reschedule appointment"
      ];
    }
    
    if (lowerMessage.includes('invest') || lowerMessage.includes('buy')) {
      return [
        "Calculate ROI",
        "Market trends",
        "Best investment areas",
        "Financing options"
      ];
    }
    
    if (lowerMessage.includes('move') || lowerMessage.includes('relocat')) {
      return [
        "School districts",
        "Neighborhood safety",
        "Public transport",
        "Local amenities"
      ];
    }
    
    // Default suggestions
    return [
      "Find properties",
      "My bookings",
      "Investment advice",
      "Area insights"
    ];
  }

  // Free AI model integration (using multiple free AI APIs)
  private async getAIResponse(message: string, context?: any): Promise<string> {
    const conversationContext = this.buildConversationContext(message, context);
    
    // Try multiple free AI APIs in order of preference
    const aiApis = [
      () => this.tryHuggingFaceAPI(conversationContext),
      () => this.tryGroqAPI(conversationContext),
      () => this.tryOllamaAPI(conversationContext),
      () => this.tryTogetherAI(conversationContext)
    ];

    for (const apiCall of aiApis) {
      try {
        const response = await apiCall();
        if (response) {
          return this.enhanceAIResponse(response, message);
        }
      } catch (error) {
        console.log('AI API failed, trying next...', error);
        continue;
      }
    }

    // Fallback to enhanced rule-based system if all APIs fail
    return this.getEnhancedRuleBasedResponse(message, context);
  }

  private buildConversationContext(message: string, context?: any): string {
    const userContext = context?.userProfile ? 
      `User: ${context.userProfile.firstName} ${context.userProfile.lastName} (${context.userProfile.email})` : 
      'Anonymous user';
    
    const systemPrompt = `You are an expert real estate AI assistant with comprehensive knowledge of property markets, investment strategies, buying/selling processes, and market analysis.

CORE EXPERTISE:
- Property valuation and market analysis
- Investment strategies and ROI calculations  
- Home buying/selling processes and best practices
- Mortgage and financing guidance
- Neighborhood analysis and location insights
- Legal considerations and documentation
- Market trends and forecasting
- Property management and rental strategies

RESPONSE STYLE:
- Provide detailed, actionable advice
- Use specific examples and numbers when helpful
- Be conversational but professional
- Give comprehensive answers that educate the user
- Include both pros and cons when discussing strategies
- Mention important considerations and potential risks

CONVERSATION CONTEXT:
- User context: ${userContext}
- Recent conversation: ${context?.recentMessages ? JSON.stringify(context.recentMessages.slice(-2)) : 'New conversation'}

USER QUESTION: "${message}"

Provide a comprehensive, helpful response that directly answers their question with expert real estate knowledge:`;

    return systemPrompt;
  }

  // Enhanced AI API methods with configuration support
  private async tryHuggingFaceAPI(prompt: string): Promise<string> {
    const config = AI_PROVIDERS['huggingface'];
    if (!config.isEnabled) throw new Error('HuggingFace disabled');

    const headers: any = { 'Content-Type': 'application/json' };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    const response = await fetch(`${config.endpoint}${config.model}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: config.maxTokens,
          temperature: config.temperature,
          do_sample: true,
          return_full_text: false
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data[0]?.generated_text || data.generated_text || '';
    }
    throw new Error(`HuggingFace API failed: ${response.status}`);
  }

  private async tryGroqAPI(prompt: string): Promise<string> {
    const config = AI_PROVIDERS['groq'];
    if (!config.isEnabled || !config.apiKey) throw new Error('Groq disabled or no API key');

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: AI_CONFIG.systemPrompts.generalAssistant
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    }
    throw new Error(`Groq API failed: ${response.status}`);
  }

  private async tryOllamaAPI(prompt: string): Promise<string> {
    const config = AI_PROVIDERS['ollama'];
    if (!config.isEnabled) throw new Error('Ollama disabled');

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: config.temperature,
          num_predict: config.maxTokens
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.response || '';
    }
    throw new Error(`Ollama API failed: ${response.status}`);
  }

  private async tryTogetherAI(prompt: string): Promise<string> {
    const config = AI_PROVIDERS['together'];
    if (!config.isEnabled || !config.apiKey) throw new Error('Together AI disabled or no API key');

    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        prompt: prompt,
        max_tokens: config.maxTokens,
        temperature: config.temperature
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.output?.choices[0]?.text || '';
    }
    throw new Error(`Together AI failed: ${response.status}`);
  }

  private enhanceAIResponse(aiResponse: string, userMessage: string): string {
    // Clean and enhance the AI response
    let response = aiResponse.trim();
    
    // Remove common AI artifacts
    response = response.replace(/^(AI:|Assistant:|Bot:)/i, '');
    response = response.replace(/\[END\]|\[DONE\]/gi, '');
    
    // Add platform-specific enhancements
    if (userMessage.toLowerCase().includes('property') || userMessage.toLowerCase().includes('house')) {
      response += '\n\n💡 *I can help you search for properties or book viewings if you\'d like!*';
    }
    
    if (userMessage.toLowerCase().includes('book') || userMessage.toLowerCase().includes('reservation')) {
      response += '\n\n📅 *Would you like me to check your current bookings or help you make a new reservation?*';
    }
    
    if (userMessage.toLowerCase().includes('pay') || userMessage.toLowerCase().includes('payment')) {
      response += '\n\n💳 *I can help you check pending payments or explain our payment methods (Stripe/Konnect).*';
    }

    return response;
  }

  private getEnhancedRuleBasedResponse(message: string, context?: any): string {
    const lowerMessage = message.toLowerCase();
    
    // Advanced property hunting responses
    if (lowerMessage.includes('property') || lowerMessage.includes('house') || lowerMessage.includes('apartment')) {
      if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('looking')) {
        return `🏠 I'd love to help you find the perfect property! Here's how I can assist:

**Property Search Options:**
• **Location-based search** - Tell me your preferred area/city
• **Budget filtering** - What's your price range?
• **Feature matching** - Bedrooms, bathrooms, amenities you need
• **Property type** - House, apartment, villa, commercial?

**Advanced Features:**
• Market analysis and price trends
• Neighborhood insights and safety ratings
• School districts and local amenities
• Investment potential analysis

What type of property are you looking for, and in which area? 🏡`;
      }
      
      if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('budget')) {
        return `💰 **Property Pricing Insights:**

I can help you with:
• **Current market prices** in your preferred areas
• **Price comparison** between similar properties
• **ROI calculations** for investment properties
• **Affordability analysis** based on your budget
• **Price negotiation tips**

**Payment Options Available:**
• Stripe (International cards - USD)
• Konnect (Tunisia local - TND)
• Flexible payment plans for qualified buyers

Would you like me to search properties within a specific budget range? 💳`;
      }
    }

    // Advanced booking management
    if (lowerMessage.includes('book') || lowerMessage.includes('reservation') || lowerMessage.includes('appointment')) {
      return `📅 **Booking Management Assistant**

I can help you with:

**Property Viewings:**
• Schedule property tours and viewings
• Virtual tour bookings
• Agent meeting arrangements
• Group viewing coordination

**Reservation Management:**
• Check current booking status
• Modify existing reservations
• Cancel bookings (with policy details)
• Booking confirmation and reminders

**Availability Checking:**
• Real-time property availability
• Alternative date suggestions
• Instant booking confirmation

What would you like to book or manage today? 🗓️`;
    }

    // Support and assistance
    if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('problem')) {
      return `🎧 **Comprehensive Support Center**

I'm here to help with:

**Technical Support:**
• Account setup and profile management
• Platform navigation and features
• Mobile app assistance
• Login and security issues

**Transaction Support:**
• Payment processing help
• Invoice and billing questions
• Refund and dispute resolution
• Payment method setup

**Real Estate Guidance:**
• Market insights and trends
• Legal documentation assistance
• Investment advice and analysis
• Moving and relocation tips

**Platform Features:**
• Review and rating system
• Notification management
• Communication tools
• Property listing optimization

What specific area do you need help with? 🤝`;
    }

    // Investment and market analysis
    if (lowerMessage.includes('invest') || lowerMessage.includes('roi') || lowerMessage.includes('market')) {
      return `📈 **Real Estate Investment Analysis**

**Investment Services:**
• **ROI Calculator** - Potential returns on properties
• **Market Trends** - Price appreciation forecasts
• **Cash Flow Analysis** - Rental income projections
• **Risk Assessment** - Investment safety ratings

**Market Insights:**
• Neighborhood growth potential
• Comparative market analysis (CMA)
• Best investment locations
• Market timing recommendations

**Investment Types:**
• Buy-to-rent properties
• Flip opportunities
• Commercial real estate
• Land development potential

Would you like me to analyze a specific property or area for investment potential? 💼`;
    }

    // Moving and relocation
    if (lowerMessage.includes('move') || lowerMessage.includes('relocat') || lowerMessage.includes('transfer')) {
      return `🚚 **Relocation Assistant**

**Moving Services:**
• **Area Research** - Neighborhood guides and insights
• **School Districts** - Educational options for families
• **Local Amenities** - Shopping, healthcare, recreation
• **Transportation** - Public transit and commute analysis

**Relocation Planning:**
• Timeline and checklist creation
• Moving cost estimates
• Utility setup assistance
• Address change coordination

**Cultural Integration:**
• Local customs and lifestyle
• Community groups and networking
• Language support resources
• Cultural adaptation tips

Where are you planning to move to? I can provide detailed area insights! 🌍`;
    }

    // Legal and documentation
    if (lowerMessage.includes('legal') || lowerMessage.includes('contract') || lowerMessage.includes('document')) {
      return `📋 **Legal & Documentation Support**

**Document Assistance:**
• **Purchase Agreements** - Contract review guidance
• **Lease Agreements** - Rental contract details
• **Property Deeds** - Ownership transfer process
• **Inspection Reports** - Understanding property conditions

**Legal Guidance:**
• Property law basics
• Rights and responsibilities
• Dispute resolution processes
• Regulatory compliance

**Documentation Process:**
• Required paperwork checklists
• Signature and notarization help
• Document storage and organization
• Digital signature integration

⚠️ *Note: I provide general guidance. Always consult with a qualified real estate attorney for legal advice.*

What type of documentation do you need help with? 📜`;
    }

    // General conversation and personality
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      const greetings = [
        "Hello! 👋 I'm your comprehensive real estate AI assistant. I can help with property hunting, booking management, investment analysis, and much more!",
        "Hi there! 🏠 Ready to find your dream property or manage your real estate needs? I'm here to provide expert assistance!",
        "Hey! 🎯 I'm your personal real estate assistant. Whether you're buying, selling, renting, or investing - I've got you covered!"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)] + `

**What I can do for you:**
🏠 Property search and recommendations
📅 Booking and appointment management  
💰 Market analysis and investment advice
🎧 24/7 support and assistance
📋 Documentation and legal guidance
🚚 Relocation and moving support

What would you like to explore today?`;
    }

    // Default comprehensive response
    return `🤖 **Your AI Real Estate Assistant**

I'm here to provide comprehensive real estate assistance! While I didn't catch the exact specifics of your question, I can help with:

**🏠 Property Services:**
• Search and discovery
• Market analysis
• Investment evaluation
• Property comparisons

**📅 Booking & Management:**
• Viewing appointments
• Reservation tracking
• Schedule coordination
• Status updates

**💼 Professional Support:**
• Expert consultations
• Legal guidance
• Financial planning
• Market insights

**🎧 24/7 Assistance:**
• Technical support
• Platform navigation
• Problem resolution
• General inquiries

Could you please clarify what specific aspect you'd like help with? I'm designed to provide detailed, personalized assistance for all your real estate needs! 😊`;
  }

  // Action handlers
  async executeAction(action: ChatAction): Promise<void> {
    switch (action.action) {
      case 'navigate':
        window.location.href = action.data.route;
        break;
        
      case 'mark_all_read':
        if (action.data.userId) {
          this.notificationService.markAllAsRead(action.data.userId).subscribe();
          this.addBotMessage("✅ All notifications marked as read!");
        }
        break;
        
      case 'create_review':
        this.handleCreateReview(action.data);
        break;
        
      case 'contact_support':
        this.handleContactSupport(action.data);
        break;
        
      case 'show_payment_info':
        this.addBotMessage("For detailed payment information, please visit our payments page where you can view all your transactions and pending payments.");
        break;

      case 'schedule_viewing':
        await this.handleScheduleViewing(action.data);
        break;

      case 'show_market_analysis':
        await this.handleMarketAnalysis(action.data);
        break;

      case 'show_roi_calculator':
        await this.handleROICalculator(action.data);
        break;

      case 'property_search':
        await this.handlePropertySearchAction(action.data);
        break;

      case 'get_area_insights':
        await this.handleAreaInsights(action.data);
        break;

      case 'investment_analysis':
        await this.handleInvestmentAnalysis(action.data);
        break;

      case 'mortgage_calculator':
        await this.handleMortgageCalculator(action.data);
        break;
        
      default:
        console.log('Action not implemented:', action.action);
        this.addBotMessage("I'm working on implementing that feature. In the meantime, is there anything else I can help you with?");
    }
  }

  // Advanced action handlers
  private async handleScheduleViewing(data: any): Promise<void> {
    this.addBotMessage(`📅 **Schedule Property Viewing**

I'll help you schedule a property viewing! Please provide:

🏠 **Property Information:**
• Property ID or address
• Preferred viewing date
• Time preference (morning/afternoon/evening)
• Number of attendees

📞 **Contact Details:**
• Your phone number
• Alternative contact method
• Special requests or questions

Would you like to search for a specific property first, or do you already have a property in mind?`);

    // Set context for next interaction
    const session = this.currentSession.value;
    if (session) {
      session.context.pendingViewingSchedule = { step: 'property_selection' };
      this.currentSession.next(session);
    }
  }

  private async handleMarketAnalysis(data: any): Promise<void> {
    const analysisData = await this.generateMarketAnalysis(data?.area || 'general');
    
    this.addBotMessage(`📈 **Real Estate Market Analysis**

${analysisData}

**Key Insights:**
• **Price Trends:** ${this.getCurrentPriceTrends()}
• **Best Investment Areas:** ${this.getBestInvestmentAreas()}
• **Market Predictions:** ${this.getMarketPredictions()}

Would you like me to analyze a specific area or property type in more detail?`);
  }

  private async handleROICalculator(data: any): Promise<void> {
    this.addBotMessage(`💰 **ROI Investment Calculator**

I'll help you calculate potential returns on real estate investments!

**Required Information:**
🏠 **Property Details:**
• Purchase price
• Down payment amount
• Expected rental income (monthly)
• Property taxes and maintenance costs

📊 **Investment Goals:**
• Investment timeline (years)
• Expected appreciation rate
• Desired ROI percentage

💡 **Additional Factors:**
• Financing details (interest rate, loan term)
• Insurance and property management costs
• Tax benefits and depreciation

Please provide the property purchase price to get started, or would you like me to show you properties within a specific price range first?`);

    // Set context for ROI calculation
    const session = this.currentSession.value;
    if (session) {
      session.context.pendingROI = { step: 'property_price' };
      this.currentSession.next(session);
    }
  }

  private async handlePropertySearchAction(data: any): Promise<void> {
    const searchCriteria = data?.criteria || {};
    
    this.addBotMessage(`🔍 **Advanced Property Search**

Let me help you find the perfect property! I can search based on:

**📍 Location Criteria:**
• City, neighborhood, or specific address
• Proximity to schools, work, or amenities
• Transportation access and commute times

**💰 Financial Parameters:**
• Price range (min/max)
• Down payment available
• Monthly budget for mortgage/rent

**🏠 Property Features:**
• Property type (house, apartment, condo, etc.)
• Number of bedrooms and bathrooms
• Square footage and lot size
• Specific amenities (pool, garage, garden, etc.)

**📈 Investment Criteria:**
• Rental potential and cap rates
• Growth areas and future development
• Property condition and renovation needs

What's your primary search criteria? For example: "3-bedroom houses under $300k near good schools" or "investment properties with high rental yield"`);
  }

  private async handleAreaInsights(data: any): Promise<void> {
    const area = data?.area || 'your selected area';
    const insights = await this.generateAreaInsights(area);
    
    this.addBotMessage(`🌍 **Area Insights: ${area}**

${insights}

**🏫 Schools & Education:**
${this.getSchoolInformation(area)}

**🚗 Transportation:**
${this.getTransportationInfo(area)}

**🛒 Local Amenities:**
${this.getLocalAmenities(area)}

**📊 Market Data:**
${this.getAreaMarketData(area)}

Would you like me to compare this area with other neighborhoods or provide more specific information about any aspect?`);
  }

  private async handleInvestmentAnalysis(data: any): Promise<void> {
    this.addBotMessage(`📊 **Investment Property Analysis**

I'll provide comprehensive investment analysis including:

**🔍 Market Analysis:**
• Comparative market analysis (CMA)
• Price appreciation trends
• Rental market demand
• Competition analysis

**💰 Financial Projections:**
• Cash flow analysis
• ROI and cap rate calculations
• Tax benefits and depreciation
• Break-even analysis

**⚖️ Risk Assessment:**
• Market volatility factors
• Location-specific risks
• Property condition assessment
• Exit strategy options

**📈 Growth Potential:**
• Future development plans
• Infrastructure improvements
• Economic growth indicators
• Population demographics

Please provide a property address or area you're considering for investment, and I'll generate a detailed analysis report.`);
  }

  private async handleMortgageCalculator(data: any): Promise<void> {
    this.addBotMessage(`🏦 **Mortgage Calculator & Financing Options**

I'll help you understand your financing options!

**💳 Loan Information Needed:**
• Property purchase price
• Down payment amount (or percentage)
• Interest rate (current market rates available)
• Loan term (15, 20, 30 years)

**📊 Additional Costs:**
• Property taxes (annual)
• Home insurance
• PMI (if down payment < 20%)
• HOA fees (if applicable)

**💰 Financing Programs:**
• Conventional loans
• FHA loans (first-time buyers)
• VA loans (veterans)
• Local first-time buyer programs

**Example Calculation:**
For a $300,000 property with 20% down ($60,000) at 6.5% interest for 30 years:
• Monthly payment: ~$1,517
• Total interest: ~$306,000
• Total paid: ~$606,000

Would you like me to calculate payments for a specific property price and down payment amount?`);
  }

  // Helper methods for generating dynamic content
  private async generateMarketAnalysis(area: string): Promise<string> {
    return `**Current Market Overview for ${area}:**

📊 **Market Status:** ${this.getRandomMarketStatus()}
📈 **Price Trend:** ${this.getRandomPriceTrend()}
🏠 **Inventory Levels:** ${this.getRandomInventoryLevel()}
⏱️ **Average Days on Market:** ${Math.floor(Math.random() * 60) + 15} days
💰 **Median Price:** $${(Math.random() * 400000 + 200000).toLocaleString()}

**Recent Activity:**
• ${Math.floor(Math.random() * 50) + 10} properties sold this month
• ${Math.floor(Math.random() * 100) + 20} new listings added
• ${Math.floor(Math.random() * 15) + 5}% increase in buyer activity`;
  }

  private getCurrentPriceTrends(): string {
    const trends = [
      "Steady growth with 8% annual appreciation",
      "Market stabilization after recent growth",
      "Strong seller's market with rising prices",
      "Balanced market with moderate growth"
    ];
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private getBestInvestmentAreas(): string {
    const areas = [
      "Downtown districts with upcoming development",
      "Suburban areas near new transit lines",
      "University districts with stable rental demand",
      "Emerging neighborhoods with infrastructure growth"
    ];
    return areas[Math.floor(Math.random() * areas.length)];
  }

  private getMarketPredictions(): string {
    const predictions = [
      "Continued growth expected over next 2-3 years",
      "Market normalization with sustainable appreciation",
      "Strong fundamentals supporting long-term growth",
      "Positive outlook with steady demand from investors"
    ];
    return predictions[Math.floor(Math.random() * predictions.length)];
  }

  private async generateAreaInsights(area: string): Promise<string> {
    return `**Comprehensive Area Analysis:**

🏘️ **Neighborhood Character:** ${this.getNeighborhoodType()}
👥 **Demographics:** ${this.getDemographicsInfo()}
💼 **Economic Indicators:** ${this.getEconomicInfo()}
🛡️ **Safety Rating:** ${this.getSafetyRating()}/10
🌟 **Livability Score:** ${Math.floor(Math.random() * 30) + 70}/100`;
  }

  private getNeighborhoodType(): string {
    const types = [
      "Family-friendly suburban community",
      "Vibrant urban district with modern amenities",
      "Historic area with character homes",
      "Growing professional neighborhood"
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  private getDemographicsInfo(): string {
    return `Average age ${Math.floor(Math.random() * 20) + 25}, ${Math.floor(Math.random() * 40) + 40}% families with children`;
  }

  private getEconomicInfo(): string {
    return `Median income $${(Math.random() * 50000 + 50000).toLocaleString()}, ${Math.floor(Math.random() * 5) + 3}% unemployment rate`;
  }

  private getSafetyRating(): number {
    return Math.floor(Math.random() * 3) + 7; // 7-9 rating
  }

  private getSchoolInformation(area: string): string {
    return `• ${Math.floor(Math.random() * 5) + 3} elementary schools nearby
• Top-rated high school within 2 miles
• Average school rating: ${Math.floor(Math.random() * 3) + 7}/10`;
  }

  private getTransportationInfo(area: string): string {
    return `• Public transit access within 0.5 miles
• Major highways accessible in ${Math.floor(Math.random() * 10) + 5} minutes
• Average commute to downtown: ${Math.floor(Math.random() * 20) + 15} minutes`;
  }

  private getLocalAmenities(area: string): string {
    return `• Shopping centers and restaurants within 1 mile
• Parks and recreational facilities nearby
• Healthcare facilities and banks accessible`;
  }

  private getAreaMarketData(area: string): string {
    return `• Average price per sq ft: $${Math.floor(Math.random() * 100) + 150}
• ${Math.floor(Math.random() * 15) + 5}% appreciation over last year
• ${Math.floor(Math.random() * 30) + 20} days average market time`;
  }

  private getRandomMarketStatus(): string {
    const statuses = ["Seller's Market", "Buyer's Market", "Balanced Market", "Transitioning Market"];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private getRandomPriceTrend(): string {
    const trends = ["Rising steadily", "Stabilizing", "Moderate growth", "Strong appreciation"];
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private getRandomInventoryLevel(): string {
    const levels = ["Low inventory", "Moderate supply", "Balanced inventory", "High availability"];
    return levels[Math.floor(Math.random() * levels.length)];
  }

  private async handleCreateReview(data: any): Promise<void> {
    if (!data.propertyId || !data.rating) return;
    
    this.addBotMessage(`Great! You've selected ${data.rating} stars. Please add a comment for your review:`);
    
    // Set context for next message to be review comment
    const session = this.currentSession.value;
    if (session) {
      session.context.pendingReview = data;
      this.currentSession.next(session);
    }
  }

  private async handleContactSupport(data: any): Promise<void> {
    const message: AgentContactMessage = {
      agentId: 'support', // Or use a specific support agent ID
      senderName: this.authService.getCurrentUser()?.firstName + ' ' + this.authService.getCurrentUser()?.lastName || 'Anonymous',
      senderEmail: this.authService.getCurrentUser()?.email || '',
      message: `Support request: ${data.type || 'general'} - Initiated from chatbot`,
      subject: `Chatbot Support Request - ${data.type || 'General'}`
    };

    try {
      const result = await new Promise<any>((resolve, reject) => {
        this.contactService.sendContactMessage(message).subscribe({
          next: (data) => resolve(data),
          error: (error) => reject(error)
        });
      });
      this.addBotMessage("✅ Support ticket created! Our team will contact you soon.");
    } catch (error) {
      this.addBotMessage("❌ Sorry, couldn't create support ticket. Please try again later.");
    }
  }

  // Helper method to add bot messages
  private addBotMessage(content: string): void {
    const session = this.currentSession.value;
    if (!session) return;

    const message: ChatMessage = {
      id: this.generateMessageId(),
      content,
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    };

    session.messages.push(message);
    this.currentSession.next(session);
  }

  // Utility methods
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateMessageId(): string {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear conversation
  clearConversation(): void {
    this.initializeSession();
  }

  // Get conversation history
  getConversationHistory(): ChatMessage[] {
    return this.currentSession.value?.messages || [];
  }
}
