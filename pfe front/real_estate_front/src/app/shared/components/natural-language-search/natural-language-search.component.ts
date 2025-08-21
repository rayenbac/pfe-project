import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { NLPService, NLPSearchCriteria } from '../../../core/services/nlp.service';

@Component({
  selector: 'app-natural-language-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './natural-language-search.component.html',
  styleUrls: ['./natural-language-search.component.css']
})
export class NaturalLanguageSearchComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Describe your dream property... (e.g., "3-bedroom apartment near the beach with pool under 1000 DT")';
  @Input() debounceTime: number = 1000; // 1 second debounce
  @Input() enableRealTimeSearch: boolean = false;
  @Output() searchCriteria = new EventEmitter<NLPSearchCriteria>();
  @Output() searchError = new EventEmitter<string>();
  @Output() searchStarted = new EventEmitter<void>();
  @Output() searchCompleted = new EventEmitter<void>();

  searchForm: FormGroup;
  isProcessing = false;
  isServiceAvailable = false;
  lastInterpretation = '';
  searchHistory: string[] = [];
  showSuggestions = false;
  
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Predefined search suggestions
  suggestions = [
    "3-bedroom apartment with pool under 1500 DT",
    "2-bedroom house near the beach",
    "Modern villa with garden and parking",
    "Studio apartment for rent downtown",
    "Luxury condo with gym and sea view",
    "4-bedroom house with large garden",
    "Penthouse with terrace and parking",
    "Affordable apartment near metro"
  ];

  constructor(
    private fb: FormBuilder,
    private nlpService: NLPService
  ) {
    this.searchForm = this.createSearchForm();
  }

  ngOnInit(): void {
    this.initializeComponent();
    this.setupRealTimeSearch();
    this.checkServiceAvailability();
    this.loadSearchHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the component
   */
  private initializeComponent(): void {
    // Set up form validation
    this.searchForm.get('naturalQuery')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      if (value && value.length > 0) {
        this.showSuggestions = false;
      }
    });
  }

  /**
   * Create reactive form for natural language search
   */
  private createSearchForm(): FormGroup {
    return this.fb.group({
      naturalQuery: ['', [Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  /**
   * Setup real-time search with debouncing
   */
  private setupRealTimeSearch(): void {
    if (this.enableRealTimeSearch) {
      this.searchSubject.pipe(
        debounceTime(this.debounceTime),
        distinctUntilChanged(),
        switchMap(query => {
          if (query.trim().length < 10) {
            return [];
          }
          return this.nlpService.parsePropertyQuery(query);
        }),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response) => {
          this.handleSearchResponse(response);
        },
        error: (error) => {
          this.handleSearchError(error);
        }
      });
    }
  }

  /**
   * Check if NLP service is available
   */
  private checkServiceAvailability(): void {
    this.nlpService.checkServiceAvailability().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (isAvailable) => {
        this.isServiceAvailable = isAvailable;
        if (!isAvailable) {
          console.warn('NLP service is not available. Natural language search will use fallback parsing.');
        }
      },
      error: () => {
        this.isServiceAvailable = false;
      }
    });
  }

  /**
   * Load search history from localStorage
   */
  private loadSearchHistory(): void {
    try {
      const history = localStorage.getItem('nlp-search-history');
      if (history) {
        this.searchHistory = JSON.parse(history).slice(0, 5); // Keep only last 5
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
      this.searchHistory = [];
    }
  }

  /**
   * Save search to history
   */
  private saveToHistory(query: string): void {
    try {
      // Add to beginning of array and remove duplicates
      this.searchHistory = [query, ...this.searchHistory.filter(h => h !== query)].slice(0, 5);
      localStorage.setItem('nlp-search-history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  /**
   * Handle real-time search input
   */
  onSearchInput(event: any): void {
    const query = event.target.value;
    if (this.enableRealTimeSearch && query.trim().length >= 10) {
      this.searchSubject.next(query);
    }
  }

  /**
   * Handle manual search submission
   */
  onSearchSubmit(): void {
    if (this.searchForm.valid && !this.isProcessing) {
      const query = this.searchForm.get('naturalQuery')?.value?.trim();
      if (query) {
        this.performSearch(query);
      }
    }
  }

  /**
   * Perform the actual search
   */
  private performSearch(query: string): void {
    this.isProcessing = true;
    this.searchStarted.emit();

    this.nlpService.parsePropertyQuery(query).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.handleSearchResponse(response);
        this.saveToHistory(query);
        this.isProcessing = false;
        this.searchCompleted.emit();
      },
      error: (error) => {
        this.handleSearchError(error);
        this.isProcessing = false;
        this.searchCompleted.emit();
      }
    });
  }

  /**
   * Handle successful search response
   */
  private handleSearchResponse(response: any): void {
    this.lastInterpretation = response.interpretation;
    
    if (response.success) {
      this.searchCriteria.emit(response.criteria);
    } else {
      this.searchError.emit(response.error || 'Failed to parse search query');
    }
  }

  /**
   * Handle search errors
   */
  private handleSearchError(error: any): void {
    console.error('Natural language search error:', error);
    const errorMessage = error.message || 'An error occurred while processing your search';
    this.searchError.emit(errorMessage);
  }

  /**
   * Handle suggestion click
   */
  onSuggestionClick(suggestion: string): void {
    this.searchForm.patchValue({ naturalQuery: suggestion });
    this.showSuggestions = false;
    this.performSearch(suggestion);
  }

  /**
   * Handle history item click
   */
  onHistoryClick(historyItem: string): void {
    this.searchForm.patchValue({ naturalQuery: historyItem });
    this.performSearch(historyItem);
  }

  /**
   * Toggle suggestions visibility
   */
  toggleSuggestions(): void {
    this.showSuggestions = !this.showSuggestions;
  }

  /**
   * Clear search input
   */
  clearSearch(): void {
    this.searchForm.reset();
    this.lastInterpretation = '';
    this.showSuggestions = false;
  }

  /**
   * Get form control for template
   */
  get naturalQueryControl() {
    return this.searchForm.get('naturalQuery');
  }

  /**
   * Check if search is valid
   */
  get isSearchValid(): boolean {
    return this.searchForm.valid && !this.isProcessing;
  }
}
