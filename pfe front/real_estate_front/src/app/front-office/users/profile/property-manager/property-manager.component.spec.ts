import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyManagerComponent } from './property-manager.component';

describe('PropertyManagerComponent', () => {
  let component: PropertyManagerComponent;
  let fixture: ComponentFixture<PropertyManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
