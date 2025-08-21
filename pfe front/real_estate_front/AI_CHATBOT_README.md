# 🤖 Advanced AI Real Estate Chatbot

A comprehensive AI-powered chatbot for your real estate platform that provides property hunting assistance, booking management, investment analysis, and personalized support.

## ✨ Features

### 🏠 **Property Hunting Assistant**
- Smart property search with AI-powered recommendations
- Market analysis and price trend insights
- Neighborhood research and area insights
- Investment potential analysis and ROI calculations
- Comparative market analysis (CMA)

### 📅 **Booking Manager**
- Schedule property viewings and appointments
- Manage existing bookings and reservations
- Real-time availability checking
- Booking confirmation and reminder system
- Multi-agent coordination for group viewings

### 🎧 **Personal Support Bot**
- 24/7 customer support and assistance
- Technical troubleshooting and platform guidance
- Payment support (Stripe & Konnect integration)
- Review and feedback management
- Account and profile assistance

### 💡 **Advanced AI Features**
- Multiple free AI model integration (Hugging Face, Groq, Ollama, Together AI)
- Natural language understanding for complex queries
- Context-aware conversations with memory
- Real-time market data and predictions
- Investment analysis with detailed ROI calculations
- Legal guidance and documentation assistance
- Relocation and moving support

## 🚀 Quick Start

### 1. **Basic Setup (No API Key Required)**
The chatbot works out of the box with:
- Enhanced rule-based responses
- Platform integration (notifications, payments, reviews)
- Basic property search and booking assistance

### 2. **AI-Powered Setup (Recommended)**
For advanced AI capabilities, set up at least one free AI provider:

#### **Option A: Hugging Face (Easiest)**
```typescript
// In src/app/core/config/ai-config.ts
AI_PROVIDERS.huggingface.isEnabled = true;
AI_PROVIDERS.huggingface.apiKey = 'hf_your_token_here'; // Optional
```

1. Visit [https://huggingface.co/join](https://huggingface.co/join)
2. Create a free account
3. Optionally get an API token from [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

#### **Option B: Groq (Fastest)**
```typescript
// In src/app/core/config/ai-config.ts
AI_PROVIDERS.groq.isEnabled = true;
AI_PROVIDERS.groq.apiKey = 'gsk_your_api_key_here';
```

1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up for free (6000 tokens/minute)
3. Generate an API key

#### **Option C: Ollama (Self-hosted)**
```bash
# Install Ollama locally
curl -fsSL https://ollama.ai/install.sh | sh

# Run Ollama
ollama serve

# Pull a model
ollama pull llama2
```

```typescript
// In src/app/core/config/ai-config.ts
AI_PROVIDERS.ollama.isEnabled = true;
```

### 3. **Run the Application**
```bash
npm start
```

Look for the purple chat button in the bottom-left corner! 💜

## 🎯 Usage Examples

### Property Search
```
User: "I'm looking for a 3-bedroom house under $300k near good schools"
Bot: Provides detailed search results, market analysis, and scheduling options
```

### Investment Analysis
```
User: "What's the ROI potential for properties in downtown?"
Bot: Delivers comprehensive market analysis, ROI calculations, and investment recommendations
```

### Booking Management
```
User: "I want to schedule a viewing for tomorrow afternoon"
Bot: Checks availability, schedules appointment, and sends confirmation
```

### Market Insights
```
User: "Tell me about the real estate market trends"
Bot: Provides current market analysis, price trends, and future predictions
```

## 🔧 Configuration

### AI Provider Priority
Edit `src/app/core/config/ai-config.ts` to customize:

```typescript
export const AI_CONFIG = {
  primaryProvider: 'huggingface', // Your preferred provider
  fallbackOrder: ['huggingface', 'groq', 'together', 'ollama'], // Fallback sequence
  enableAI: true, // Enable/disable AI features
  requestTimeout: 10000, // API timeout (ms)
  fallbackToRules: true // Use rule-based system if all APIs fail
};
```

### Custom Prompts
Customize AI behavior by editing system prompts:

```typescript
systemPrompts: {
  propertySearch: `Your custom property search prompt...`,
  investmentAdvice: `Your custom investment advice prompt...`,
  bookingAssistant: `Your custom booking assistant prompt...`,
  supportAgent: `Your custom support agent prompt...`,
  generalAssistant: `Your custom general assistant prompt...`
}
```

## 🌟 Advanced Features

### Smart Actions
The chatbot automatically generates contextual action buttons based on conversation:
- **Property Search** → "🏠 Search Properties", "🔍 Advanced Search"
- **Booking Queries** → "📅 My Bookings", "🗓️ Schedule Viewing"
- **Payment Questions** → "💳 Check Payments", "📊 Payment History"
- **Investment Talk** → "📈 Market Analysis", "💼 ROI Calculator"

### Quick Replies
Dynamic quick reply suggestions based on conversation context:
- Property-focused: "Show me apartments under $200k", "Properties with 3+ bedrooms"
- Investment-focused: "Calculate ROI", "Market trends", "Best investment areas"
- Booking-focused: "Check my bookings", "Schedule a viewing"

### Context Memory
The chatbot remembers conversation context and user preferences:
- Previous property searches
- Investment criteria
- Booking preferences
- User profile information

## 🔄 Integration

### Existing Services
The chatbot integrates seamlessly with your existing platform services:

```typescript
// Notifications
this.notificationService.loadUserNotifications()

// Payments
this.paymentInvoiceService.getUserInvoices()

// Reviews
this.reviewService.createReview()

// Agent Contact
this.contactService.sendContactMessage()

// Authentication
this.authService.getCurrentUser()
```

### Custom Actions
Add new actions by extending the `executeAction` method:

```typescript
case 'your_custom_action':
  await this.handleYourCustomAction(action.data);
  break;
```

## 🎨 UI Customization

### Chat Button Position
```css
/* In chatbot.component.css */
.chat-button {
  bottom: 20px;
  left: 20px; /* or right: 20px */
}
```

### Chat Window Size
```css
.chat-window {
  width: 400px; /* Adjust width */
  height: 600px; /* Adjust height */
}
```

### Color Scheme
```css
:root {
  --chatbot-primary: #6f42c1; /* Purple theme */
  --chatbot-secondary: #f8f9fa;
  --chatbot-text: #333;
}
```

## 📊 Analytics & Monitoring

### Conversation Tracking
```typescript
// Get conversation history
const history = this.chatbotService.getConversationHistory();

// Track user interactions
this.chatbotService.currentSession$.subscribe(session => {
  // Analytics logic here
});
```

### Performance Monitoring
```typescript
// Monitor AI API performance
console.log('AI Response Time:', responseTime);
console.log('Fallback Used:', fallbackProvider);
```

## 🔒 Security & Privacy

### Data Protection
- User conversations are stored locally in browser session
- No sensitive data is sent to AI providers
- API keys are stored in configuration (use environment variables in production)

### API Key Security
```typescript
// Production: Use environment variables
AI_PROVIDERS.groq.apiKey = environment.groqApiKey;
AI_PROVIDERS.huggingface.apiKey = environment.huggingFaceApiKey;
```

## 🐛 Troubleshooting

### Common Issues

#### 1. **Chatbot not appearing**
- Check if `ChatbotComponent` is imported in `app.component.ts`
- Verify the chat button CSS positioning

#### 2. **AI responses not working**
- Check browser console for API errors
- Verify API keys are correctly configured
- Ensure at least one AI provider is enabled

#### 3. **Integration errors**
- Verify all service dependencies are properly injected
- Check for TypeScript compilation errors
- Ensure service methods match expected signatures

#### 4. **Performance issues**
- Reduce `maxTokens` in AI configuration
- Increase `requestTimeout` for slower connections
- Enable fewer AI providers to reduce fallback attempts

### Debug Mode
```typescript
// Enable detailed logging
console.log('Chatbot Debug:', {
  enabledProviders: getEnabledAIProviders(),
  currentSession: this.currentSession.value,
  userContext: context
});
```

## 🚀 Production Deployment

### Environment Configuration
```typescript
// environment.prod.ts
export const environment = {
  production: true,
  groqApiKey: 'your_production_groq_key',
  huggingFaceApiKey: 'your_production_hf_key',
  // ... other config
};
```

### Performance Optimization
1. **Enable only necessary AI providers**
2. **Set appropriate timeout values**
3. **Monitor API usage and costs**
4. **Implement conversation analytics**
5. **Add rate limiting for API calls**

### Security Checklist
- [ ] API keys stored securely (environment variables)
- [ ] Input sanitization for user messages
- [ ] Rate limiting implemented
- [ ] Error handling for all API calls
- [ ] User data privacy compliance

## 🤝 Contributing

### Adding New AI Providers
1. Add provider configuration to `ai-config.ts`
2. Implement API method in `chatbot.service.ts`
3. Add to fallback order
4. Update documentation

### Adding New Features
1. Extend `ChatMessage` interface if needed
2. Add new intent detection patterns
3. Implement handler methods
4. Add corresponding actions and UI elements

## 📝 License

This chatbot system is part of your real estate platform. See your main project license for details.

## 🆘 Support

For technical support or feature requests:
1. Check the troubleshooting section above
2. Review console errors for specific issues
3. Ensure all dependencies are properly installed
4. Verify configuration settings

---

**Happy chatting! 🎉** Your AI real estate assistant is ready to help users find their dream properties! 🏠✨
