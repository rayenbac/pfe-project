import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

interface WebsiteSettings {
  siteName: string;
  siteDescription: string;
  logo: string;
  favicon: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  maintenanceMode: boolean;
  enableRegistration: boolean;
  enableSearch: boolean;
  enableNotifications: boolean;
  currency: string;
  timezone: string;
  language: string;
}

interface PaymentSettings {
  stripePublicKey: string;
  stripeSecretKey: string;
  paypalClientId: string;
  paypalClientSecret: string;
  enableStripe: boolean;
  enablePaypal: boolean;
  enableBankTransfer: boolean;
  commissionRate: number;
  minimumWithdrawal: number;
  processingFee: number;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  senderEmail: string;
  senderName: string;
  enableWelcomeEmail: boolean;
  enableBookingConfirmation: boolean;
  enablePaymentNotification: boolean;
  enableWeeklyReports: boolean;
}

interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  analyticsId: string;
  googleSearchConsole: string;
  facebookPixel: string;
  enableSitemap: boolean;
  enableRobots: boolean;
}

interface SecuritySettings {
  maxLoginAttempts: number;
  sessionTimeout: number;
  enableTwoFactor: boolean;
  passwordMinLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  enableCaptcha: boolean;
  captchaSiteKey: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  loading = false;
  error: string | null = null;
  activeTab = 'website';
  saving = false;

  // Forms
  websiteForm!: FormGroup;
  paymentForm!: FormGroup;
  emailForm!: FormGroup;
  seoForm!: FormGroup;
  securityForm!: FormGroup;

  // Data
  websiteSettings: WebsiteSettings = {
    siteName: 'Real Estate Platform',
    siteDescription: 'Premium real estate platform for properties',
    logo: '',
    favicon: '',
    contactEmail: 'contact@realestate.com',
    contactPhone: '+1 234 567 8900',
    address: '123 Business Street, City, Country',
    maintenanceMode: false,
    enableRegistration: true,
    enableSearch: true,
    enableNotifications: true,
    currency: 'USD',
    timezone: 'UTC',
    language: 'en'
  };

  paymentSettings: PaymentSettings = {
    stripePublicKey: '',
    stripeSecretKey: '',
    paypalClientId: '',
    paypalClientSecret: '',
    enableStripe: true,
    enablePaypal: true,
    enableBankTransfer: false,
    commissionRate: 5,
    minimumWithdrawal: 100,
    processingFee: 2.5
  };

  emailSettings: EmailSettings = {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    senderEmail: 'noreply@realestate.com',
    senderName: 'Real Estate Platform',
    enableWelcomeEmail: true,
    enableBookingConfirmation: true,
    enablePaymentNotification: true,
    enableWeeklyReports: false
  };

  seoSettings: SEOSettings = {
    metaTitle: 'Real Estate Platform - Find Your Dream Property',
    metaDescription: 'Discover premium properties with our advanced real estate platform',
    metaKeywords: 'real estate, properties, buy, sell, rent',
    analyticsId: '',
    googleSearchConsole: '',
    facebookPixel: '',
    enableSitemap: true,
    enableRobots: true
  };

  securitySettings: SecuritySettings = {
    maxLoginAttempts: 5,
    sessionTimeout: 1440,
    enableTwoFactor: false,
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    enableCaptcha: false,
    captchaSiteKey: ''
  };

  roles: Role[] = [
    {
      id: '1',
      name: 'Super Admin',
      permissions: ['all'],
      userCount: 1,
      isSystem: true
    },
    {
      id: '2',
      name: 'Admin',
      permissions: ['manage_users', 'manage_properties', 'manage_bookings', 'view_reports'],
      userCount: 3,
      isSystem: true
    },
    {
      id: '3',
      name: 'Agent',
      permissions: ['manage_own_properties', 'manage_own_bookings', 'view_own_reports'],
      userCount: 25,
      isSystem: false
    },
    {
      id: '4',
      name: 'User',
      permissions: ['book_properties', 'view_own_bookings'],
      userCount: 1248,
      isSystem: true
    }
  ];

  currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' }
  ];

  timezones = [
    { value: 'UTC', name: 'UTC' },
    { value: 'America/New_York', name: 'Eastern Time' },
    { value: 'America/Chicago', name: 'Central Time' },
    { value: 'America/Denver', name: 'Mountain Time' },
    { value: 'America/Los_Angeles', name: 'Pacific Time' },
    { value: 'Europe/London', name: 'London' },
    { value: 'Europe/Paris', name: 'Paris' },
    { value: 'Asia/Tokyo', name: 'Tokyo' }
  ];

  languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' }
  ];

  availablePermissions = [
    'manage_users',
    'manage_properties',
    'manage_bookings',
    'manage_payments',
    'view_reports',
    'manage_settings',
    'manage_roles',
    'view_analytics'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.loadSettings();
  }

  initializeForms() {
    this.websiteForm = this.fb.group({
      siteName: [this.websiteSettings.siteName, Validators.required],
      siteDescription: [this.websiteSettings.siteDescription],
      contactEmail: [this.websiteSettings.contactEmail, [Validators.required, Validators.email]],
      contactPhone: [this.websiteSettings.contactPhone],
      address: [this.websiteSettings.address],
      maintenanceMode: [this.websiteSettings.maintenanceMode],
      enableRegistration: [this.websiteSettings.enableRegistration],
      enableSearch: [this.websiteSettings.enableSearch],
      enableNotifications: [this.websiteSettings.enableNotifications],
      currency: [this.websiteSettings.currency, Validators.required],
      timezone: [this.websiteSettings.timezone, Validators.required],
      language: [this.websiteSettings.language, Validators.required]
    });

    this.paymentForm = this.fb.group({
      stripePublicKey: [this.paymentSettings.stripePublicKey],
      stripeSecretKey: [this.paymentSettings.stripeSecretKey],
      paypalClientId: [this.paymentSettings.paypalClientId],
      paypalClientSecret: [this.paymentSettings.paypalClientSecret],
      enableStripe: [this.paymentSettings.enableStripe],
      enablePaypal: [this.paymentSettings.enablePaypal],
      enableBankTransfer: [this.paymentSettings.enableBankTransfer],
      commissionRate: [this.paymentSettings.commissionRate, [Validators.required, Validators.min(0), Validators.max(100)]],
      minimumWithdrawal: [this.paymentSettings.minimumWithdrawal, [Validators.required, Validators.min(0)]],
      processingFee: [this.paymentSettings.processingFee, [Validators.required, Validators.min(0)]]
    });

    this.emailForm = this.fb.group({
      smtpHost: [this.emailSettings.smtpHost, Validators.required],
      smtpPort: [this.emailSettings.smtpPort, [Validators.required, Validators.min(1), Validators.max(65535)]],
      smtpUsername: [this.emailSettings.smtpUsername, Validators.required],
      smtpPassword: [this.emailSettings.smtpPassword, Validators.required],
      senderEmail: [this.emailSettings.senderEmail, [Validators.required, Validators.email]],
      senderName: [this.emailSettings.senderName, Validators.required],
      enableWelcomeEmail: [this.emailSettings.enableWelcomeEmail],
      enableBookingConfirmation: [this.emailSettings.enableBookingConfirmation],
      enablePaymentNotification: [this.emailSettings.enablePaymentNotification],
      enableWeeklyReports: [this.emailSettings.enableWeeklyReports]
    });

    this.seoForm = this.fb.group({
      metaTitle: [this.seoSettings.metaTitle, Validators.required],
      metaDescription: [this.seoSettings.metaDescription, Validators.required],
      metaKeywords: [this.seoSettings.metaKeywords],
      analyticsId: [this.seoSettings.analyticsId],
      googleSearchConsole: [this.seoSettings.googleSearchConsole],
      facebookPixel: [this.seoSettings.facebookPixel],
      enableSitemap: [this.seoSettings.enableSitemap],
      enableRobots: [this.seoSettings.enableRobots]
    });

    this.securityForm = this.fb.group({
      maxLoginAttempts: [this.securitySettings.maxLoginAttempts, [Validators.required, Validators.min(1), Validators.max(10)]],
      sessionTimeout: [this.securitySettings.sessionTimeout, [Validators.required, Validators.min(1)]],
      enableTwoFactor: [this.securitySettings.enableTwoFactor],
      passwordMinLength: [this.securitySettings.passwordMinLength, [Validators.required, Validators.min(6), Validators.max(20)]],
      requireUppercase: [this.securitySettings.requireUppercase],
      requireNumbers: [this.securitySettings.requireNumbers],
      requireSpecialChars: [this.securitySettings.requireSpecialChars],
      enableCaptcha: [this.securitySettings.enableCaptcha],
      captchaSiteKey: [this.securitySettings.captchaSiteKey]
    });
  }

  loadSettings() {
    this.loading = true;
    this.error = null;

    // Simulate API call
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  async saveWebsiteSettings() {
    if (this.websiteForm.valid) {
      this.saving = true;
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.websiteSettings = { ...this.websiteSettings, ...this.websiteForm.value };
        // Success notification would go here
      } catch (error) {
        this.error = 'Failed to save website settings';
      }
      this.saving = false;
    }
  }

  async savePaymentSettings() {
    if (this.paymentForm.valid) {
      this.saving = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.paymentSettings = { ...this.paymentSettings, ...this.paymentForm.value };
      } catch (error) {
        this.error = 'Failed to save payment settings';
      }
      this.saving = false;
    }
  }

  async saveEmailSettings() {
    if (this.emailForm.valid) {
      this.saving = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.emailSettings = { ...this.emailSettings, ...this.emailForm.value };
      } catch (error) {
        this.error = 'Failed to save email settings';
      }
      this.saving = false;
    }
  }

  async saveSEOSettings() {
    if (this.seoForm.valid) {
      this.saving = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.seoSettings = { ...this.seoSettings, ...this.seoForm.value };
      } catch (error) {
        this.error = 'Failed to save SEO settings';
      }
      this.saving = false;
    }
  }

  async saveSecuritySettings() {
    if (this.securityForm.valid) {
      this.saving = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.securitySettings = { ...this.securitySettings, ...this.securityForm.value };
      } catch (error) {
        this.error = 'Failed to save security settings';
      }
      this.saving = false;
    }
  }

  testEmailConnection() {
    if (this.emailForm.valid) {
      this.loading = true;
      // Simulate testing email connection
      setTimeout(() => {
        this.loading = false;
        // Show success/error message
      }, 2000);
    }
  }

  generateSitemap() {
    this.loading = true;
    // Simulate sitemap generation
    setTimeout(() => {
      this.loading = false;
      // Show success message
    }, 2000);
  }

  clearCache() {
    this.loading = true;
    // Simulate cache clearing
    setTimeout(() => {
      this.loading = false;
      // Show success message
    }, 1000);
  }

  createRole() {
    // Navigate to role creation or open modal
    console.log('Create new role');
  }

  editRole(role: Role) {
    // Navigate to role editing or open modal
    console.log('Edit role:', role);
  }

  deleteRole(roleId: string) {
    if (confirm('Are you sure you want to delete this role?')) {
      this.roles = this.roles.filter(role => role.id !== roleId);
    }
  }

  uploadLogo(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Handle logo upload
      console.log('Upload logo:', file);
    }
  }

  uploadFavicon(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Handle favicon upload
      console.log('Upload favicon:', file);
    }
  }

  exportSettings() {
    const settings = {
      website: this.websiteSettings,
      payment: this.paymentSettings,
      email: this.emailSettings,
      seo: this.seoSettings,
      security: this.securitySettings
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'settings-export.json';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  importSettings(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target?.result as string);
          // Update forms with imported settings
          console.log('Import settings:', settings);
        } catch (error) {
          this.error = 'Invalid settings file';
        }
      };
      reader.readAsText(file);
    }
  }
}
