import { Component } from '@angular/core';
import { PropertySearchComponent } from '../property-search/property-search.component';
import { FeaturedPropertiesComponent } from '../properties/featured-properties/featured-properties.component';
import { CityPropertiesComponent } from './city-properties/city-properties.component';
import { BestPropertyValueComponent } from './best-property-value/best-property-value.component';
import { OurAgentsComponent } from './our-agents/our-agents.component';
import { HomepageRecommendationsComponent } from './homepage-recommendations/homepage-recommendations.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    PropertySearchComponent, 
    FeaturedPropertiesComponent, 
    CityPropertiesComponent, 
    BestPropertyValueComponent, 
    OurAgentsComponent, 
    HomepageRecommendationsComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  constructor() {
    console.log('HomeComponent loaded'); // Debugging
  }
}