# Natural Language Search Setup Guide

## Overview
This guide explains how to set up the Natural Language Search feature for your real estate application. The feature allows users to search for properties using natural language queries like "3-bedroom apartment near the beach with pool under 1500 DT".

## Architecture

### Components
1. **NLPService** - Core service for parsing natural language queries
2. **NaturalLanguageSearchComponent** - UI component for natural language input
3. **PropertySearchComponent** - Integration with existing search functionality

### LLM Integration Options
The system supports multiple LLM providers with fallback mechanisms:

1. **Ollama** (Recommended - Free & Local)
2. **OpenAI API** (Requires API key)
3. **Fallback Pattern Matching** (Basic parsing when AI is unavailable)

## Installation & Setup

### Option 1: Ollama (Recommended)

Ollama is a free, local LLM runner that doesn't require API keys or internet connectivity.

#### 1. Install Ollama

**Windows:**
```powershell
# Download from https://ollama.ai/download
# Or use winget
winget install Ollama.Ollama
```

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### 2. Pull a Model

```bash
# Pull Llama 3 (recommended for good quality, ~4.7GB)
ollama pull llama3

# Alternative models:
# ollama pull llama3.2     # Smaller model, faster (~2GB)
# ollama pull mistral      # Alternative model (~4GB)
# ollama pull codellama    # Code-focused model
```

#### 3. Start Ollama Service

```bash
# Start the service (runs on localhost:11434)
ollama serve
```

#### 4. Verify Installation

```bash
# Test the API
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Hello world",
  "stream": false
}'
```

### Option 2: OpenAI API

If you prefer to use OpenAI's API:

#### 1. Get API Key
- Visit https://platform.openai.com/
- Create an account and get your API key

#### 2. Configure in Environment
```typescript
// In your environment.ts file
export const environment = {
  // ... other config
  openaiApiKey: 'your-api-key-here'
};
```

#### 3. Update NLP Service
```typescript
// In nlp.service.ts
private getOpenAIKey(): string {
  return environment.openaiApiKey || '';
}
```

### Option 3: Fallback Mode

If no AI service is available, the system will use basic pattern matching. This provides basic functionality without external dependencies.

## Usage

### Basic Integration

```typescript
// In your component
import { NaturalLanguageSearchComponent } from './path/to/natural-language-search.component';

@Component({
  // ...
  imports: [NaturalLanguageSearchComponent]
})
export class YourComponent {
  onNaturalLanguageSearch(criteria: NLPSearchCriteria): void {
    console.log('Parsed criteria:', criteria);
    // Use criteria to search properties
  }
}
```

```html
<!-- In your template -->
<app-natural-language-search
  placeholder="Describe your dream property..."
  (searchCriteria)="onNaturalLanguageSearch($event)"
  (searchError)="onSearchError($event)">
</app-natural-language-search>
```

### Advanced Configuration

```typescript
// Custom configuration
<app-natural-language-search
  [debounceTime]="1000"
  [maxLength]="500"
  [showSuggestions]="true"
  [showHistory]="true"
  placeholder="Custom placeholder..."
  (searchCriteria)="onSearch($event)"
  (searchStarted)="onSearchStarted()"
  (searchCompleted)="onSearchCompleted()"
  (searchError)="onSearchError($event)">
</app-natural-language-search>
```

## Sample Queries

The system can parse various types of natural language queries:

### Property Type & Location
- "apartment in Tunis"
- "house near the beach"
- "villa in downtown area"

### Specifications
- "3-bedroom apartment"
- "2-bathroom house"
- "studio with balcony"

### Price Range
- "under 1500 DT"
- "between 1000 and 2000 DT"
- "above 500 DT"

### Amenities
- "with swimming pool"
- "with parking and gym"
- "with garden and air conditioning"

### Complex Queries
- "3-bedroom apartment near the beach with pool under 1500 DT"
- "Modern villa with garden and parking for sale in Tunis"
- "2-bedroom house for rent with air conditioning under 800 DT"

## Troubleshooting

### Common Issues

#### 1. Ollama Not Responding
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve
```

#### 2. Model Not Found
```bash
# List available models
ollama list

# Pull the required model
ollama pull llama3.2
```

#### 3. CORS Issues
If you encounter CORS issues, you may need to configure your development server:

```typescript
// In your proxy.conf.json
{
  "/api/ollama/*": {
    "target": "http://localhost:11434",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

#### 4. Service Detection
The system automatically detects available services. Check the console for:
```
NLP Service Status: { ollama: true, openai: false }
```

### Performance Optimization

#### 1. Model Selection
- **llama3.2**: Best balance of speed and quality (~2GB)
- **mistral**: Faster, smaller model (~4GB)
- **llama3**: Higher quality, slower (~7GB)

#### 2. Caching
Enable response caching for better performance:

```typescript
// In nlp.service.ts
private cache = new Map<string, NLPResponse>();

parseQuery(query: string): Observable<NLPResponse> {
  const cacheKey = query.toLowerCase().trim();
  
  if (this.cache.has(cacheKey)) {
    return of(this.cache.get(cacheKey)!);
  }
  
  // ... rest of the method
}
```

## Production Deployment

### Environment Variables
```bash
# .env file
OLLAMA_HOST=localhost
OLLAMA_PORT=11434
OLLAMA_MODEL=llama3.2
OPENAI_API_KEY=your-key-here
```

### Docker Setup
```dockerfile
# docker-compose.yml
version: '3.8'
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
      
  your-app:
    build: .
    ports:
      - "4200:4200"
    environment:
      - OLLAMA_URL=http://ollama:11434
    depends_on:
      - ollama

volumes:
  ollama_data:
```

### Security Considerations

1. **API Keys**: Never expose API keys in client-side code
2. **Rate Limiting**: Implement rate limiting for API calls
3. **Input Validation**: Validate and sanitize all user inputs
4. **HTTPS**: Use HTTPS in production
5. **CORS**: Configure CORS properly for your domain

## Monitoring & Analytics

### Logging
```typescript
// Add to nlp.service.ts
private logQuery(query: string, response: NLPResponse): void {
  console.log('NLP Query:', {
    query,
    success: response.success,
    confidence: response.confidence,
    criteria: response.criteria,
    timestamp: new Date().toISOString()
  });
}
```

### Performance Metrics
- Query parsing time
- Success rate
- Confidence scores
- Most common queries
- Error rates

## Contributing

To extend the natural language processing capabilities:

1. **Add New Patterns**: Update the `PATTERNS` object in `nlp.service.ts`
2. **Improve Prompts**: Modify the `buildPrompt()` method
3. **Add Languages**: Extend pattern matching for other languages
4. **Custom Models**: Train custom models for real estate domain

## Support

For issues and questions:
1. Check the browser console for error messages
2. Verify Ollama is running: `ollama list`
3. Test API endpoints manually
4. Check network connectivity
5. Review the troubleshooting section above

## License

This natural language search feature is part of your real estate application and follows the same licensing terms.
