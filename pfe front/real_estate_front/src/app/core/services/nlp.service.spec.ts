import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NLPService } from './nlp.service';

describe('NLPService', () => {
  let service: NLPService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NLPService]
    });
    service = TestBed.inject(NLPService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should parse simple property type query', (done) => {
    const query = 'apartment in Tunis';
    
    service.parseQuery(query).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.criteria.propertyType).toBe('apartment');
      expect(response.criteria.location).toBe('Tunis');
      done();
    });
  });

  it('should parse bedroom count', (done) => {
    const query = '3-bedroom house';
    
    service.parseQuery(query).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.criteria.bedrooms).toBe(3);
      expect(response.criteria.propertyType).toBe('house');
      done();
    });
  });

  it('should parse price range', (done) => {
    const query = 'apartment under 1500 DT';
    
    service.parseQuery(query).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.criteria.maxPrice).toBe(1500);
      expect(response.criteria.propertyType).toBe('apartment');
      done();
    });
  });

  it('should parse amenities', (done) => {
    const query = 'house with swimming pool and parking';
    
    service.parseQuery(query).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.criteria.amenities).toContain('Swimming Pool');
      expect(response.criteria.amenities).toContain('Parking');
      expect(response.criteria.propertyType).toBe('house');
      done();
    });
  });

  it('should parse complex query', (done) => {
    const query = '3-bedroom apartment near the beach with pool under 1500 DT';
    
    service.parseQuery(query).subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.criteria.bedrooms).toBe(3);
      expect(response.criteria.propertyType).toBe('apartment');
      expect(response.criteria.maxPrice).toBe(1500);
      expect(response.criteria.amenities).toContain('Swimming Pool');
      expect(response.confidence).toBeGreaterThan(0.5);
      done();
    });
  });

  it('should handle empty query', (done) => {
    const query = '';
    
    service.parseQuery(query).subscribe(response => {
      expect(response.success).toBe(false);
      expect(response.error).toBeTruthy();
      done();
    });
  });

  it('should provide search suggestions', () => {
    const suggestions = service.getSearchSuggestions();
    expect(suggestions).toBeDefined();
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toContain('bedroom');
  });

  it('should check service availability', async () => {
    const availability = await service.checkServiceAvailability();
    expect(availability).toBeDefined();
    expect(availability).toHaveProperty('ollama');
    expect(availability).toHaveProperty('openai');
  });
});
