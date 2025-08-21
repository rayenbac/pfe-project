import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CookieConsentService } from '../../../core/services/cookie-consent.service';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div 
      class="cookie-consent-banner" 
      *ngIf="showBanner"
      [@slideInUp]
    >
      <div class="cookie-content">
        <div class="cookie-header">
          <h4>🍪 Cookie Preferences</h4>
        </div>
        
        <div class="cookie-body">
          <p>
            We use cookies to enhance your browsing experience and provide personalized property recommendations. 
            You can choose which cookies to accept below.
          </p>
          
          <div class="cookie-options" *ngIf="showDetails">
            <div class="cookie-option">
              <label class="cookie-checkbox">
                <input 
                  type="checkbox" 
                  [(ngModel)]="preferences.necessary"
                  disabled
                >
                <span class="checkmark"></span>
                <span class="cookie-label">
                  <strong>Essential Cookies</strong> (Required)
                  <small>These cookies are necessary for the website to function properly.</small>
                </span>
              </label>
            </div>
            
            <div class="cookie-option">
              <label class="cookie-checkbox">
                <input 
                  type="checkbox" 
                  [(ngModel)]="preferences.analytics"
                >
                <span class="checkmark"></span>
                <span class="cookie-label">
                  <strong>Analytics Cookies</strong>
                  <small>Help us understand how visitors interact with our website.</small>
                </span>
              </label>
            </div>
            
            <div class="cookie-option">
              <label class="cookie-checkbox">
                <input 
                  type="checkbox" 
                  [(ngModel)]="preferences.preferences"
                >
                <span class="checkmark"></span>
                <span class="cookie-label">
                  <strong>Preference Cookies</strong>
                  <small>Remember your viewing history for personalized recommendations.</small>
                </span>
              </label>
            </div>
            
            <div class="cookie-option">
              <label class="cookie-checkbox">
                <input 
                  type="checkbox" 
                  [(ngModel)]="preferences.marketing"
                >
                <span class="checkmark"></span>
                <span class="cookie-label">
                  <strong>Marketing Cookies</strong>
                  <small>Used to show you relevant property advertisements.</small>
                </span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="cookie-actions">
          <button 
            class="btn btn-link" 
            (click)="toggleDetails()"
            *ngIf="!showDetails"
          >
            Customize Settings
          </button>
          
          <div class="button-group">
            <button 
              class="btn btn-outline-secondary" 
              (click)="rejectAll()"
              *ngIf="showDetails"
            >
              Reject All
            </button>
            
            <button 
              class="btn btn-secondary" 
              (click)="acceptEssential()"
            >
              Essential Only
            </button>
            
            <button 
              class="btn btn-primary" 
              (click)="acceptSelected()"
              *ngIf="showDetails"
            >
              Save Preferences
            </button>
            
            <button 
              class="btn btn-primary" 
              (click)="acceptAll()"
              *ngIf="!showDetails"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Backdrop -->
    <div 
      class="cookie-backdrop" 
      *ngIf="showBanner"
      (click)="acceptEssential()"
    ></div>
  `,
  styles: [`
    .cookie-consent-banner {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      max-width: 600px;
      margin: 0 auto;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      border: 1px solid #e0e0e0;
    }
    
    .cookie-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 9999;
    }
    
    .cookie-content {
      padding: 24px;
    }
    
    .cookie-header h4 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    }
    
    .cookie-body p {
      margin: 0 0 20px 0;
      color: #666;
      line-height: 1.5;
      font-size: 14px;
    }
    
    .cookie-options {
      margin: 20px 0;
    }
    
    .cookie-option {
      margin-bottom: 16px;
    }
    
    .cookie-checkbox {
      display: flex;
      align-items: flex-start;
      cursor: pointer;
      position: relative;
    }
    
    .cookie-checkbox input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
    }
    
    .checkmark {
      height: 20px;
      width: 20px;
      background-color: #fff;
      border: 2px solid #ddd;
      border-radius: 4px;
      margin-right: 12px;
      margin-top: 2px;
      flex-shrink: 0;
      position: relative;
    }
    
    .cookie-checkbox input:checked ~ .checkmark {
      background-color: #007bff;
      border-color: #007bff;
    }
    
    .cookie-checkbox input:disabled ~ .checkmark {
      background-color: #f8f9fa;
      border-color: #dee2e6;
      cursor: not-allowed;
    }
    
    .checkmark:after {
      content: "";
      position: absolute;
      display: none;
      left: 6px;
      top: 2px;
      width: 6px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
    
    .cookie-checkbox input:checked ~ .checkmark:after {
      display: block;
    }
    
    .cookie-label {
      flex: 1;
    }
    
    .cookie-label strong {
      display: block;
      color: #333;
      font-size: 14px;
      margin-bottom: 2px;
    }
    
    .cookie-label small {
      color: #666;
      font-size: 12px;
      line-height: 1.4;
    }
    
    .cookie-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 20px;
    }
    
    .button-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
      text-decoration: none;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
      border-color: #007bff;
    }
    
    .btn-primary:hover {
      background-color: #0056b3;
      border-color: #0056b3;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
      border-color: #6c757d;
    }
    
    .btn-secondary:hover {
      background-color: #545b62;
      border-color: #545b62;
    }
    
    .btn-outline-secondary {
      background-color: transparent;
      color: #6c757d;
      border-color: #6c757d;
    }
    
    .btn-outline-secondary:hover {
      background-color: #6c757d;
      color: white;
    }
    
    .btn-link {
      background: none;
      border: none;
      color: #007bff;
      text-decoration: underline;
      padding: 0;
      font-size: 14px;
    }
    
    .btn-link:hover {
      color: #0056b3;
    }
    
    @media (max-width: 576px) {
      .cookie-consent-banner {
        left: 10px;
        right: 10px;
        bottom: 10px;
      }
      
      .cookie-content {
        padding: 20px;
      }
      
      .button-group {
        flex-direction: column;
      }
      
      .btn {
        text-align: center;
      }
    }
    
    @keyframes slideInUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    .cookie-consent-banner {
      animation: slideInUp 0.3s ease-out;
    }
  `],
  animations: []
})
export class CookieConsentComponent implements OnInit {
  showBanner = false;
  showDetails = false;
  
  preferences = {
    necessary: true,
    analytics: true,
    preferences: true,
    marketing: false
  };

  constructor(private consentService: CookieConsentService) {}

  ngOnInit(): void {
    this.showBanner = this.consentService.showConsentBanner();
  }

  toggleDetails(): void {
    this.showDetails = !this.showDetails;
  }

  acceptAll(): void {
    this.consentService.setConsent({
      necessary: true,
      analytics: true,
      preferences: true,
      marketing: true
    });
    this.showBanner = false;
  }

  acceptEssential(): void {
    this.consentService.setConsent({
      necessary: true,
      analytics: false,
      preferences: false,
      marketing: false
    });
    this.showBanner = false;
  }

  acceptSelected(): void {
    this.consentService.setConsent(this.preferences);
    this.showBanner = false;
  }

  rejectAll(): void {
    this.preferences = {
      necessary: true,
      analytics: false,
      preferences: false,
      marketing: false
    };
    this.acceptSelected();
  }
}
