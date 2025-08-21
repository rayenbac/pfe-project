import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PropertyService } from '../../../core/services/property.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-city-properties',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './city-properties.component.html',
  styleUrl: './city-properties.component.css'
})
export class CityPropertiesComponent implements OnInit {
  cities: { city: string, count: number }[] = [];
  loading = false;
  error: string | null = null;
  cityImages: { [city: string]: string } = {};
  private unsplashAccessKey = 'y80khM-kr_QMMb7Pd6lD2g3HZ0K9g9q_p-8RHkGuhqg';

  constructor(private propertyService: PropertyService, private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    this.loading = true;
    this.propertyService.getCitiesWithPropertyCount().subscribe({
      next: (data) => {
        console.log('Villes récupérées depuis l’API :', data);
        this.cities = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des villes';
        this.loading = false;
      }
    });
  }

  goToCity(city: string): void {
    this.router.navigate(['/properties/city', city]);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    console.warn('Image non trouvée pour la ville :', img.alt, '| URL demandée :', img.src);
    img.src = 'assets/images/property/default-city.avif';
  }

  getCityImageUrl(city: string): string {
    if (!city) return 'assets/images/property/default-city.avif';
    if (this.cityImages[city]) {
      return this.cityImages[city];
    }
    // Appel à l'API Unsplash
    const cityParam = encodeURIComponent(city.split(',')[0].trim());
    const url = `https://api.unsplash.com/search/photos?query=${cityParam}&client_id=${this.unsplashAccessKey}&orientation=landscape&per_page=1`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        if (res.results && res.results.length > 0) {
          this.cityImages[city] = res.results[0].urls.regular;
        } else {
          this.cityImages[city] = 'assets/images/property/default-city.avif';
        }
      },
      error: () => {
        this.cityImages[city] = 'assets/images/property/default-city.avif';
      }
    });
    // Retourne une image par défaut en attendant la réponse
    return 'assets/images/property/default-city.avif';
  }
}
