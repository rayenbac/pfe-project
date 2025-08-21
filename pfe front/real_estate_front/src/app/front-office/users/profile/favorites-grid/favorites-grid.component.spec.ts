import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoritesGridComponent } from './favorites-grid.component';

describe('FavoritesGridComponent', () => {
  let component: FavoritesGridComponent;
  let fixture: ComponentFixture<FavoritesGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavoritesGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FavoritesGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
