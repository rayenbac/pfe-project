import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoriteService } from '../../../../core/services/favorite.service';
import { Property } from '../../../../core/models/property.model';

@Component({
  selector: 'app-favorites-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorites-grid.component.html',
  styleUrls: ['./favorites-grid.component.css']
})
export class FavoritesGridComponent implements OnInit {
  favorites: Property[] = [];
  loading = false;
  removing: string | null = null;
  
  message = '';
  messageType: 'success' | 'error' | '' = '';

  constructor(private favoriteService: FavoriteService) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  loadFavorites(): void {
    this.loading = true;
    this.favoriteService.getUserFavorites().subscribe({
      next: (properties: Property[]) => {
        this.favorites = properties;
        this.loading = false;
      },
      error: (error: any) => {
        this.showMessage('Failed to load favorites', 'error');
        this.loading = false;
      }
    });
  }

  removeFromFavorites(property: Property): void {
    this.removing = property._id;
    
    this.favoriteService.removeFromFavorites(property._id).subscribe({
      next: () => {
        this.favorites = this.favorites.filter(p => p._id !== property._id);
        this.showMessage('Removed from favorites', 'success');
        this.removing = null;
      },
      error: (error: any) => {
        this.showMessage('Failed to remove from favorites', 'error');
        this.removing = null;
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    this.messageType = type;
    setTimeout(() => this.clearMessage(), 3000);
  }

  clearMessage(): void {
    this.message = '';
    this.messageType = '';
  }
}