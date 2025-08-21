import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

export interface NLPSearchCriteria {
  keyword?: string;
  propertyType?: string;
  location?: string;
  bedrooms?: number;
  bathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  minArea?: number;
  maxArea?: number;
  yearBuilt?: number;
  listingType?: 'sale' | 'rent';
  confidence?: number;
}

export interface NLPResponse {
  success: boolean;
  criteria: NLPSearchCriteria;
  originalQuery: string;
  interpretation: string;
  confidence: number;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NLPService {
  private readonly ollamaUrl = 'http://localhost:11434/api/generate'; // Ollama default endpoint
  private readonly timeout = 10000; // 10 seconds timeout
  private readonly model = 'llama3'; // Default model for property search

  constructor(private http: HttpClient) {}

  /**
   * Parse natural language query into structured search criteria
   * @param query The natural language query from the user
   * @returns Observable<NLPResponse> containing parsed criteria
   */
  parsePropertyQuery(query: string): Observable<NLPResponse> {
    if (!query || query.trim().length === 0) {
      return of({
        success: false,
        criteria: {},
        originalQuery: query,
        interpretation: 'Empty query provided',
        confidence: 0,
        error: 'Query cannot be empty'
      });
    }

    // Create the prompt for the LLM
    const prompt = this.createPropertySearchPrompt(query);

    const requestBody = {
      model: this.model,
      prompt: prompt,
      format: 'json',
      stream: false,
      options: {
        temperature: 0.1, // Low temperature for consistent parsing
        top_p: 0.9,
        max_tokens: 500
      }
    };

    return this.http.post<any>(this.ollamaUrl, requestBody).pipe(
      timeout(this.timeout),
      map(response => this.parseNLPResponse(response, query)),
      catchError(error => this.handleNLPError(error, query))
    );
  }

  /**
   * Create a structured prompt for property search parsing
   * @param query User's natural language query
   * @returns Formatted prompt string
   */
  private createPropertySearchPrompt(query: string): string {
    return `You are a real estate search assistant. Parse the following natural language query into structured search criteria. 

Query: "${query}"

Extract and return ONLY a valid JSON object with the following structure:
{
  "propertyType": "apartment|house|villa|studio|condo|townhouse|penthouse|duplex|bungalow|land|single family", 
  "location": "city or area mentioned",
  "bedrooms": number or null,
  "bathrooms": number or null,
  "minPrice": number or null,
  "maxPrice": number or null,
  "amenities": ["pool", "gym", "parking", "garden", "balcony", "air conditioning", "wifi", "laundry", "elevator"],
  "minArea": number in square feet or null,
  "maxArea": number in square feet or null,
  "listingType": "sale|rent",
  "confidence": 0.0-1.0,
  "interpretation": "brief explanation of what was understood"
}

Rules:
- Extract only information explicitly mentioned
- Convert currencies: DT/TND = Tunisian Dinar, USD = US Dollar, EUR = Euro
- For "near beach/sea/ocean", add "beachfront" to amenities
- For "with pool/swimming pool", add "pool" to amenities
- For "with parking/garage", add "parking" to amenities
- For "with garden/yard", add "garden" to amenities
- Set confidence based on clarity of the query (0.0-1.0)
- If bedrooms/bathrooms mentioned as "3-bedroom", extract as bedrooms: 3
- If price range like "under 1000", set maxPrice: 1000
- If price range like "between 500-1000", set minPrice: 500, maxPrice: 1000
- For rent queries, set listingType: "rent", otherwise "sale"

Return only the JSON object, no other text.`;
  }

  /**
   * Parse the response from the LLM
   * @param response Raw response from LLM
   * @param originalQuery Original user query
   * @returns Structured NLP response
   */
  private parseNLPResponse(response: any, originalQuery: string): NLPResponse {
    try {
      // Extract the response content
      let content = response.response || response.content || response.message?.content;
      
      if (!content) {
        throw new Error('No content in LLM response');
      }

      // Clean up the response (remove any non-JSON content)
      content = content.trim();
      
      // Find JSON content between braces
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      // Parse JSON
      const parsedCriteria = JSON.parse(content);

      // Validate and clean the parsed criteria
      const cleanedCriteria = this.validateAndCleanCriteria(parsedCriteria);

      return {
        success: true,
        criteria: cleanedCriteria,
        originalQuery: originalQuery,
        interpretation: parsedCriteria.interpretation || 'Successfully parsed search criteria',
        confidence: parsedCriteria.confidence || 0.8
      };

    } catch (error) {
      console.error('Error parsing NLP response:', error);
      
      // Fallback: Try to extract some basic criteria using regex
      const fallbackCriteria = this.extractBasicCriteria(originalQuery);
      
      return {
        success: true,
        criteria: fallbackCriteria,
        originalQuery: originalQuery,
        interpretation: this.generateInterpretation(fallbackCriteria) || 'Basic parsing - searching for properties',
        confidence: Object.keys(fallbackCriteria).length > 0 ? 0.6 : 0.4,
        error: `LLM parsing failed: ${error}`
      };
    }
  }

  /**
   * Validate and clean the criteria from LLM response
   * @param criteria Raw criteria from LLM
   * @returns Cleaned and validated criteria
   */
  private validateAndCleanCriteria(criteria: any): NLPSearchCriteria {
    const cleaned: NLPSearchCriteria = {};

    // Validate property type
    const validPropertyTypes = ['apartment', 'house', 'villa', 'studio', 'condo', 'townhouse', 'penthouse', 'duplex', 'bungalow', 'land', 'single family'];
    if (criteria.propertyType && validPropertyTypes.includes(criteria.propertyType.toLowerCase())) {
      cleaned.propertyType = criteria.propertyType.toLowerCase();
    }

    // Validate location
    if (criteria.location && typeof criteria.location === 'string') {
      cleaned.location = criteria.location.trim();
    }

    // Validate numbers
    if (criteria.bedrooms && Number.isInteger(criteria.bedrooms) && criteria.bedrooms > 0) {
      cleaned.bedrooms = criteria.bedrooms;
    }

    if (criteria.bathrooms && Number.isInteger(criteria.bathrooms) && criteria.bathrooms > 0) {
      cleaned.bathrooms = criteria.bathrooms;
    }

    if (criteria.minPrice && typeof criteria.minPrice === 'number' && criteria.minPrice > 0) {
      cleaned.minPrice = criteria.minPrice;
    }

    if (criteria.maxPrice && typeof criteria.maxPrice === 'number' && criteria.maxPrice > 0) {
      cleaned.maxPrice = criteria.maxPrice;
    }

    if (criteria.minArea && typeof criteria.minArea === 'number' && criteria.minArea > 0) {
      cleaned.minArea = criteria.minArea;
    }

    if (criteria.maxArea && typeof criteria.maxArea === 'number' && criteria.maxArea > 0) {
      cleaned.maxArea = criteria.maxArea;
    }

    if (criteria.yearBuilt && Number.isInteger(criteria.yearBuilt) && criteria.yearBuilt > 1900) {
      cleaned.yearBuilt = criteria.yearBuilt;
    }

    // Validate amenities
    if (criteria.amenities && Array.isArray(criteria.amenities)) {
      cleaned.amenities = criteria.amenities.filter((amenity: any) => typeof amenity === 'string');
    }

    // Validate listing type
    if (criteria.listingType && ['sale', 'rent'].includes(criteria.listingType)) {
      cleaned.listingType = criteria.listingType;
    }

    return cleaned;
  }

  /**
   * Fallback method to extract basic criteria using regex patterns
   * @param query Natural language query
   * @returns Basic search criteria
   */
  private extractBasicCriteria(query: string): NLPSearchCriteria {
    const criteria: NLPSearchCriteria = {};
    const lowerQuery = query.toLowerCase();
    
    console.log('Extracting basic criteria from query:', query);

    // Extract bedrooms - handle both singular and plural, and different number formats
    const bedroomMatch = lowerQuery.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)[-\s]?bedrooms?/) ||
                         lowerQuery.match(/(?:room|property|place|apartment|house).*?(?:with|having).*?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)[-\s]?bedrooms?/);
    if (bedroomMatch) {
      const numberStr = bedroomMatch[1];
      // Convert word numbers to digits
      const numberMap: {[key: string]: number} = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      };
      criteria.bedrooms = numberMap[numberStr] || parseInt(numberStr);
      console.log('Extracted bedrooms:', criteria.bedrooms);
    }

    // Extract bathrooms - handle both singular and plural, and different number formats
    const bathroomMatch = lowerQuery.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)[-\s]?bathrooms?/);
    if (bathroomMatch) {
      const numberStr = bathroomMatch[1];
      // Convert word numbers to digits
      const numberMap: {[key: string]: number} = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      };
      criteria.bathrooms = numberMap[numberStr] || parseInt(numberStr);
      console.log('Extracted bathrooms:', criteria.bathrooms);
    }

    // Extract property type - expanded list and better matching
    const propertyTypes = ['apartment', 'house', 'villa', 'studio', 'condo', 'penthouse', 'duplex', 'townhouse', 'flat', 'bungalow'];
    for (const type of propertyTypes) {
      if (lowerQuery.includes(type)) {
        criteria.propertyType = type;
        console.log('Extracted property type:', criteria.propertyType);
        break;
      }
    }
    
    // If no specific type found but mentions "room", default to apartment
    if (!criteria.propertyType && (lowerQuery.includes('room') || lowerQuery.includes('place'))) {
      criteria.propertyType = 'apartment';
      console.log('Defaulted property type to apartment');
    }

    // Extract price - more comprehensive patterns
    let priceMatch = lowerQuery.match(/under\s+(\d+)/);
    if (priceMatch) {
      criteria.maxPrice = parseInt(priceMatch[1]);
      console.log('Extracted max price:', criteria.maxPrice);
    }
    
    // Extract price range patterns
    priceMatch = lowerQuery.match(/between\s+(\d+)\s+and\s+(\d+)/);
    if (priceMatch) {
      criteria.minPrice = parseInt(priceMatch[1]);
      criteria.maxPrice = parseInt(priceMatch[2]);
      console.log('Extracted price range:', criteria.minPrice, '-', criteria.maxPrice);
    }
    
    priceMatch = lowerQuery.match(/above\s+(\d+)/);
    if (priceMatch) {
      criteria.minPrice = parseInt(priceMatch[1]);
      console.log('Extracted min price:', criteria.minPrice);
    }

    // Extract amenities
    const amenities = [];
    if (lowerQuery.includes('pool')) amenities.push('pool');
    if (lowerQuery.includes('gym')) amenities.push('gym');
    if (lowerQuery.includes('parking')) amenities.push('parking');
    if (lowerQuery.includes('garden')) amenities.push('garden');
    if (lowerQuery.includes('beach')) amenities.push('beachfront');
    
    if (amenities.length > 0) {
      criteria.amenities = amenities;
      console.log('Extracted amenities:', criteria.amenities);
    }

    // Determine listing type
    if (lowerQuery.includes('rent') || lowerQuery.includes('rental')) {
      criteria.listingType = 'rent';
      console.log('Extracted listing type: rent');
    } else {
      criteria.listingType = 'sale';
      console.log('Extracted listing type: sale');
    }

    console.log('Final extracted criteria:', criteria);
    return criteria;
  }

  /**
   * Handle NLP service errors
   * @param error HTTP error or other error
   * @param originalQuery Original user query
   * @returns Error response observable
   */
  private handleNLPError(error: any, originalQuery: string): Observable<NLPResponse> {
    console.error('NLP Service Error:', error);

    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        errorMessage = 'Cannot connect to NLP service. Please check if Ollama is running.';
      } else if (error.status === 404) {
        errorMessage = 'NLP model not found. Please ensure the model is installed.';
      } else {
        errorMessage = `NLP service error: ${error.status} - ${error.message}`;
      }
    } else if (error.name === 'TimeoutError') {
      errorMessage = 'NLP service timeout. Please try again.';
    }

    // Return fallback parsing
    const fallbackCriteria = this.extractBasicCriteria(originalQuery);
    
    return of({
      success: true,
      criteria: fallbackCriteria,
      originalQuery: originalQuery,
      interpretation: this.generateInterpretation(fallbackCriteria) || 'Basic parsing - searching for properties',
      confidence: Object.keys(fallbackCriteria).length > 0 ? 0.6 : 0.3,
      error: errorMessage
    });
  }

  /**
   * Check if NLP service is available
   * @returns Observable<boolean> indicating service availability
   */
  checkServiceAvailability(): Observable<boolean> {
    return this.http.get(`${this.ollamaUrl.replace('/api/generate', '/api/tags')}`).pipe(
      map(() => true),
      catchError(() => of(false)),
      timeout(5000)
    );
  }

  /**
   * Generate human-readable interpretation of parsed criteria
   */
  private generateInterpretation(criteria: NLPSearchCriteria): string {
    const parts: string[] = [];
    
    if (criteria.propertyType) {
      parts.push(`Looking for a ${criteria.propertyType}`);
    } else {
      parts.push('Looking for a property');
    }
    
    if (criteria.bedrooms) {
      parts.push(`with ${criteria.bedrooms} bedroom${criteria.bedrooms > 1 ? 's' : ''}`);
    }
    
    if (criteria.bathrooms) {
      parts.push(`and ${criteria.bathrooms} bathroom${criteria.bathrooms > 1 ? 's' : ''}`);
    }
    
    if (criteria.amenities && criteria.amenities.length > 0) {
      parts.push(`with ${criteria.amenities.join(', ')}`);
    }
    
    if (criteria.maxPrice) {
      parts.push(`under ${criteria.maxPrice} DT`);
    }
    
    if (criteria.listingType === 'rent') {
      parts.push('for rent');
    } else if (criteria.listingType === 'sale') {
      parts.push('for sale');
    }
    
    return parts.join(' ');
  }
}
