// src/app/services/property-search.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PropertySearch } from '../models/property-search.model';

@Injectable({
  providedIn: 'root'
})
export class PropertySearchService {
  private baseUrl = 'http://localhost:3000/api/properties/search';

  constructor(private http: HttpClient) {}

  searchProperties(searchCriteria: PropertySearch): Observable<any> {
    return this.http.post(this.baseUrl, searchCriteria);
  }
}