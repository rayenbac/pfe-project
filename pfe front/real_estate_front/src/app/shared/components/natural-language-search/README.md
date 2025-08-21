# Natural Language Search Feature

## Overview

The Natural Language Search feature allows users to search for properties using natural language descriptions instead of filling out traditional search forms. Users can type queries like "3-bedroom apartment near the beach with pool under 1500 DT" and the system will parse this into structured search criteria.

## Features

### 🤖 AI-Powered Parsing
- **Ollama Integration**: Local LLM support (recommended)
- **OpenAI Integration**: Cloud-based AI parsing
- **Fallback Pattern Matching**: Basic parsing when AI is unavailable

### 🔍 Smart Query Understanding
- Property types (apartment, house, villa, etc.)
- Location and area preferences
- Number of bedrooms and bathrooms
- Price ranges with currency support
- Amenities and features
- Property status (sale/rent)

### 🎯 User Experience
- Real-time query interpretation
- Search suggestions and autocomplete
- Search history tracking
- Responsive design for mobile/desktop
- Accessibility compliant

### 🛡️ Production Ready
- Error handling and fallback mechanisms
- Input validation and sanitization
- Performance optimization
- Security best practices
- Comprehensive testing

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Ollama (Recommended)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2

# Start service
ollama serve
```

### 3. Use the Component
```html
<app-natural-language-search
  (searchCriteria)="onSearch($event)"
  (searchError)="onError($event)">
</app-natural-language-search>
```

### 4. Handle Search Results
```typescript
onSearch(criteria: NLPSearchCriteria): void {
  // Use criteria to search properties
  this.propertyService.searchProperties(criteria).subscribe(results => {
    // Handle results
  });
}
```

## Architecture

### Core Components

#### NLPService
- **Purpose**: Parse natural language queries into structured search criteria
- **Location**: `src/app/core/services/nlp.service.ts`
- **Features**:
  - Multiple LLM provider support
  - Fallback pattern matching
  - Confidence scoring
  - Caching support

#### NaturalLanguageSearchComponent
- **Purpose**: UI component for natural language input
- **Location**: `src/app/shared/components/natural-language-search/`
- **Features**:
  - Real-time parsing
  - Suggestions panel
  - Search history
  - Error handling

### Data Flow

```
User Input → NLPService → AI/Pattern Matching → Structured Criteria → Property Search
```

## Configuration

### Environment Variables
```typescript
// environment.ts
export const environment = {
  production: false,
  nlp: {
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3.2',
    openaiApiKey: '', // Optional
    enableFallback: true,
    cacheEnabled: true,
    debugMode: false
  }
};
```

### Component Configuration
```typescript
<app-natural-language-search
  [debounceTime]="1000"
  [maxLength]="500"
  [showSuggestions]="true"
  [showHistory]="true"
  placeholder="Describe your dream property..."
  (searchCriteria)="onSearch($event)"
  (searchStarted)="onSearchStarted()"
  (searchCompleted)="onSearchCompleted()"
  (searchError)="onError($event)">
</app-natural-language-search>
```

## Query Examples

### Simple Queries
```
"apartment in Tunis"
"house for sale"
"2-bedroom villa"
"studio with balcony"
```

### Complex Queries
```
"3-bedroom apartment near the beach with swimming pool under 1500 DT"
"Modern villa with garden and parking for sale in Tunis above 500000 DT"
"Luxury penthouse with gym and sea view for rent"
"Family house with 4 bedrooms and 2 bathrooms with air conditioning"
```

### Supported Features

| Feature | Example | Parsed To |
|---------|---------|-----------|
| Property Type | "apartment", "house", "villa" | `propertyType: "apartment"` |
| Location | "in Tunis", "near beach" | `location: "Tunis"` |
| Bedrooms | "3-bedroom", "three bedroom" | `bedrooms: 3` |
| Bathrooms | "2-bathroom", "two bath" | `bathrooms: 2` |
| Price Range | "under 1500 DT", "above 500 DT" | `maxPrice: 1500` |
| Amenities | "with pool", "with parking" | `amenities: ["Swimming Pool"]` |
| Status | "for sale", "for rent" | `listingType: "sale"` |

## API Reference

### NLPService Methods

#### `parseQuery(query: string): Observable<NLPResponse>`
Parse a natural language query into structured search criteria.

**Parameters:**
- `query`: The natural language query string

**Returns:**
- `Observable<NLPResponse>`: Parsed search criteria with confidence score

#### `getSearchSuggestions(): string[]`
Get predefined search suggestions for user guidance.

**Returns:**
- `string[]`: Array of suggested query strings

#### `checkServiceAvailability(): Promise<{ollama: boolean, openai: boolean}>`
Check which AI services are available.

**Returns:**
- `Promise`: Status of available services

### NLPResponse Interface
```typescript
interface NLPResponse {
  success: boolean;
  criteria: NLPSearchCriteria;
  interpretation: string;
  confidence: number;
  error?: string;
}
```

### NLPSearchCriteria Interface
```typescript
interface NLPSearchCriteria {
  propertyType?: string;
  location?: string;
  listingType?: 'sale' | 'rent';
  bedrooms?: number;
  bathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  yearBuilt?: number;
  builtUpArea?: string;
  keywords?: string[];
}
```

## Testing

### Unit Tests
```bash
# Run NLP service tests
ng test --include="**/nlp.service.spec.ts"

# Run component tests
ng test --include="**/natural-language-search.component.spec.ts"
```

### Integration Tests
```bash
# Run full test suite
ng test

# Run e2e tests
ng e2e
```

### Manual Testing
1. Start the application
2. Navigate to the search page
3. Try various natural language queries
4. Verify parsed criteria matches expectations
5. Test error handling with invalid inputs

## Performance Optimization

### Caching
```typescript
// Enable response caching
const cache = new Map<string, NLPResponse>();

// Cache query results
if (cache.has(query)) {
  return of(cache.get(query)!);
}
```

### Debouncing
```typescript
// Debounce user input
searchSubject.pipe(
  debounceTime(1000),
  distinctUntilChanged()
).subscribe(query => {
  this.parseQuery(query);
});
```

### Model Selection
- **llama3.2**: Best balance (recommended)
- **mistral**: Faster, smaller
- **llama3**: Higher quality, slower

## Troubleshooting

### Common Issues

#### Service Not Available
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve
```

#### Poor Parse Quality
1. Check model is loaded: `ollama list`
2. Try different model: `ollama pull mistral`
3. Verify prompt engineering in service

#### Performance Issues
1. Enable caching
2. Increase debounce time
3. Use smaller model
4. Optimize prompt length

### Debug Mode
```typescript
// Enable debug logging
environment.nlp.debugMode = true;
```

## Contributing

### Adding New Features
1. Update patterns in `nlp.service.ts`
2. Add corresponding tests
3. Update documentation
4. Test with various queries

### Improving Accuracy
1. Enhance prompt engineering
2. Add more pattern matching rules
3. Train custom models
4. Collect user feedback

## License

This feature is part of the real estate application and follows the same licensing terms.

## Support

For issues and questions:
1. Check the setup guide
2. Review troubleshooting section
3. Test with sample queries
4. Check browser console for errors
5. Verify service availability
