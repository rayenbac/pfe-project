import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  source: 'website' | 'referral' | 'social' | 'advertising' | 'other';
  interestedIn: string;
  budget: number;
  location: string;
  notes: string;
  assignedTo?: string;
  createdAt: Date;
  lastContactDate?: Date;
  nextFollowUp?: Date;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  propertyType: string;
  conversionProbability: number;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  position?: string;
  type: 'client' | 'vendor' | 'partner' | 'investor';
  status: 'active' | 'inactive';
  lastContact: Date;
  totalValue: number;
  notes: string;
  tags: string[];
  socialLinks: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'social' | 'advertising';
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
  roi: number;
  description: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  type: 'call' | 'email' | 'meeting' | 'follow-up' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo: string;
  relatedTo?: string; // Lead or Contact ID
  dueDate: Date;
  createdAt: Date;
  completedAt?: Date;
  notes: string;
}

@Component({
  selector: 'app-crm',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './crm.component.html',
  styleUrl: './crm.component.css'
})
export class CrmComponent implements OnInit {
  loading = false;
  error: string | null = null;
  activeTab = 'leads';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  
  // Search and filters
  searchTerm = '';
  statusFilter = '';
  sourceFilter = '';
  priorityFilter = '';
  
  // Forms
  leadForm!: FormGroup;
  contactForm!: FormGroup;
  campaignForm!: FormGroup;
  taskForm!: FormGroup;
  
  // Modals
  showLeadModal = false;
  showContactModal = false;
  showCampaignModal = false;
  showTaskModal = false;
  editingItem: any = null;

  // Data
  leads: Lead[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 234 567 8900',
      status: 'new',
      source: 'website',
      interestedIn: 'Modern Apartment Downtown',
      budget: 350000,
      location: 'New York',
      notes: 'Looking for 2-bedroom apartment, prefers downtown area',
      assignedTo: 'Agent 1',
      createdAt: new Date('2024-01-15'),
      nextFollowUp: new Date('2024-01-20'),
      priority: 'high',
      tags: ['hot-lead', 'apartment', 'downtown'],
      propertyType: 'apartment',
      conversionProbability: 85
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1 234 567 8901',
      status: 'contacted',
      source: 'referral',
      interestedIn: 'Family House with Garden',
      budget: 500000,
      location: 'Brooklyn',
      notes: 'Family of 4, needs good schools nearby',
      assignedTo: 'Agent 2',
      createdAt: new Date('2024-01-14'),
      lastContactDate: new Date('2024-01-18'),
      nextFollowUp: new Date('2024-01-22'),
      priority: 'medium',
      tags: ['family', 'house', 'schools'],
      propertyType: 'house',
      conversionProbability: 65
    }
  ];

  contacts: Contact[] = [
    {
      id: '1',
      name: 'Mike Brown',
      email: 'mike.brown@company.com',
      phone: '+1 234 567 8902',
      company: 'Brown Construction',
      position: 'CEO',
      type: 'vendor',
      status: 'active',
      lastContact: new Date('2024-01-16'),
      totalValue: 250000,
      notes: 'Reliable construction partner',
      tags: ['construction', 'vendor', 'reliable'],
      socialLinks: {
        linkedin: 'linkedin.com/in/mikebrown'
      },
      address: {
        street: '123 Construction Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      }
    }
  ];

  campaigns: Campaign[] = [
    {
      id: '1',
      name: 'Downtown Apartments Promotion',
      type: 'email',
      status: 'active',
      targetAudience: 'Young professionals',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      budget: 5000,
      spent: 3200,
      leads: 45,
      conversions: 8,
      roi: 250,
      description: 'Email campaign targeting young professionals for downtown apartments'
    }
  ];

  tasks: Task[] = [
    {
      id: '1',
      title: 'Call John Smith',
      description: 'Follow up on apartment viewing',
      type: 'call',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Agent 1',
      relatedTo: '1',
      dueDate: new Date('2024-01-20'),
      createdAt: new Date('2024-01-18'),
      notes: 'Client interested in viewing this weekend'
    }
  ];

  // Options
  leadStatuses = [
    { value: 'new', label: 'New', color: '#28a745' },
    { value: 'contacted', label: 'Contacted', color: '#17a2b8' },
    { value: 'qualified', label: 'Qualified', color: '#ffc107' },
    { value: 'unqualified', label: 'Unqualified', color: '#6c757d' },
    { value: 'converted', label: 'Converted', color: '#007bff' }
  ];

  leadSources = [
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referral' },
    { value: 'social', label: 'Social Media' },
    { value: 'advertising', label: 'Advertising' },
    { value: 'other', label: 'Other' }
  ];

  priorities = [
    { value: 'low', label: 'Low', color: '#28a745' },
    { value: 'medium', label: 'Medium', color: '#ffc107' },
    { value: 'high', label: 'High', color: '#dc3545' }
  ];

  contactTypes = [
    { value: 'client', label: 'Client' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'partner', label: 'Partner' },
    { value: 'investor', label: 'Investor' }
  ];

  campaignTypes = [
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'social', label: 'Social Media' },
    { value: 'advertising', label: 'Advertising' }
  ];

  taskTypes = [
    { value: 'call', label: 'Phone Call' },
    { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'other', label: 'Other' }
  ];

  Math = Math;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.loadData();
  }

  initializeForms() {
    this.leadForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      status: ['new', Validators.required],
      source: ['website', Validators.required],
      interestedIn: [''],
      budget: [0, [Validators.required, Validators.min(0)]],
      location: [''],
      notes: [''],
      assignedTo: [''],
      priority: ['medium', Validators.required],
      propertyType: ['', Validators.required],
      nextFollowUp: ['']
    });

    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      company: [''],
      position: [''],
      type: ['client', Validators.required],
      notes: [''],
      street: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      country: [''],
      linkedin: [''],
      facebook: [''],
      twitter: ['']
    });

    this.campaignForm = this.fb.group({
      name: ['', Validators.required],
      type: ['email', Validators.required],
      targetAudience: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      budget: [0, [Validators.required, Validators.min(0)]],
      description: ['']
    });

    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      type: ['call', Validators.required],
      priority: ['medium', Validators.required],
      assignedTo: ['', Validators.required],
      relatedTo: [''],
      dueDate: ['', Validators.required],
      notes: ['']
    });
  }

  loadData() {
    this.loading = true;
    this.error = null;

    // Simulate API call
    setTimeout(() => {
      this.totalItems = this.getFilteredData().length;
      this.loading = false;
    }, 1000);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.currentPage = 1;
    this.searchTerm = '';
    this.statusFilter = '';
    this.sourceFilter = '';
    this.priorityFilter = '';
  }

  getFilteredData() {
    let data: any[] = [];
    
    switch (this.activeTab) {
      case 'leads':
        data = this.leads;
        break;
      case 'contacts':
        data = this.contacts;
        break;
      case 'campaigns':
        data = this.campaigns;
        break;
      case 'tasks':
        data = this.tasks;
        break;
    }

    return data.filter(item => {
      const matchesSearch = !this.searchTerm || 
        item.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.title?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = !this.statusFilter || item.status === this.statusFilter;
      const matchesSource = !this.sourceFilter || item.source === this.sourceFilter;
      const matchesPriority = !this.priorityFilter || item.priority === this.priorityFilter;

      return matchesSearch && matchesStatus && matchesSource && matchesPriority;
    });
  }

  getPaginatedData() {
    const filtered = this.getFilteredData();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  getTotalPages() {
    return Math.ceil(this.getFilteredData().length / this.itemsPerPage);
  }

  goToPage(page: number) {
    this.currentPage = page;
  }

  // Lead Management
  openLeadModal(lead?: Lead) {
    this.editingItem = lead;
    if (lead) {
      this.leadForm.patchValue(lead);
    } else {
      this.leadForm.reset();
      this.leadForm.patchValue({
        status: 'new',
        source: 'website',
        priority: 'medium'
      });
    }
    this.showLeadModal = true;
  }

  saveLead() {
    if (this.leadForm.valid) {
      const leadData = this.leadForm.value;
      
      if (this.editingItem) {
        // Update existing lead
        const index = this.leads.findIndex(l => l.id === this.editingItem.id);
        if (index !== -1) {
          this.leads[index] = { ...this.leads[index], ...leadData };
        }
      } else {
        // Create new lead
        const newLead: Lead = {
          id: Date.now().toString(),
          createdAt: new Date(),
          tags: [],
          conversionProbability: 50,
          ...leadData
        };
        this.leads.push(newLead);
      }
      
      this.closeLeadModal();
      this.loadData();
    }
  }

  deleteLead(leadId: string) {
    if (confirm('Are you sure you want to delete this lead?')) {
      this.leads = this.leads.filter(l => l.id !== leadId);
      this.loadData();
    }
  }

  closeLeadModal() {
    this.showLeadModal = false;
    this.editingItem = null;
    this.leadForm.reset();
  }

  // Contact Management
  openContactModal(contact?: Contact) {
    this.editingItem = contact;
    if (contact) {
      this.contactForm.patchValue({
        ...contact,
        street: contact.address.street,
        city: contact.address.city,
        state: contact.address.state,
        zipCode: contact.address.zipCode,
        country: contact.address.country,
        linkedin: contact.socialLinks.linkedin,
        facebook: contact.socialLinks.facebook,
        twitter: contact.socialLinks.twitter
      });
    } else {
      this.contactForm.reset();
      this.contactForm.patchValue({ type: 'client' });
    }
    this.showContactModal = true;
  }

  saveContact() {
    if (this.contactForm.valid) {
      const formData = this.contactForm.value;
      const contactData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        position: formData.position,
        type: formData.type,
        notes: formData.notes,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        socialLinks: {
          linkedin: formData.linkedin,
          facebook: formData.facebook,
          twitter: formData.twitter
        }
      };

      if (this.editingItem) {
        // Update existing contact
        const index = this.contacts.findIndex(c => c.id === this.editingItem.id);
        if (index !== -1) {
          this.contacts[index] = { ...this.contacts[index], ...contactData };
        }
      } else {
        // Create new contact
        const newContact: Contact = {
          id: Date.now().toString(),
          status: 'active',
          lastContact: new Date(),
          totalValue: 0,
          tags: [],
          ...contactData
        };
        this.contacts.push(newContact);
      }
      
      this.closeContactModal();
      this.loadData();
    }
  }

  deleteContact(contactId: string) {
    if (confirm('Are you sure you want to delete this contact?')) {
      this.contacts = this.contacts.filter(c => c.id !== contactId);
      this.loadData();
    }
  }

  closeContactModal() {
    this.showContactModal = false;
    this.editingItem = null;
    this.contactForm.reset();
  }

  // Campaign Management
  openCampaignModal(campaign?: Campaign) {
    this.editingItem = campaign;
    if (campaign) {
      this.campaignForm.patchValue(campaign);
    } else {
      this.campaignForm.reset();
      this.campaignForm.patchValue({ type: 'email' });
    }
    this.showCampaignModal = true;
  }

  saveCampaign() {
    if (this.campaignForm.valid) {
      const campaignData = this.campaignForm.value;
      
      if (this.editingItem) {
        // Update existing campaign
        const index = this.campaigns.findIndex(c => c.id === this.editingItem.id);
        if (index !== -1) {
          this.campaigns[index] = { ...this.campaigns[index], ...campaignData };
        }
      } else {
        // Create new campaign
        const newCampaign: Campaign = {
          id: Date.now().toString(),
          status: 'draft',
          spent: 0,
          leads: 0,
          conversions: 0,
          roi: 0,
          ...campaignData
        };
        this.campaigns.push(newCampaign);
      }
      
      this.closeCampaignModal();
      this.loadData();
    }
  }

  deleteCampaign(campaignId: string) {
    if (confirm('Are you sure you want to delete this campaign?')) {
      this.campaigns = this.campaigns.filter(c => c.id !== campaignId);
      this.loadData();
    }
  }

  closeCampaignModal() {
    this.showCampaignModal = false;
    this.editingItem = null;
    this.campaignForm.reset();
  }

  // Task Management
  openTaskModal(task?: Task) {
    this.editingItem = task;
    if (task) {
      this.taskForm.patchValue(task);
    } else {
      this.taskForm.reset();
      this.taskForm.patchValue({
        type: 'call',
        priority: 'medium'
      });
    }
    this.showTaskModal = true;
  }

  saveTask() {
    if (this.taskForm.valid) {
      const taskData = this.taskForm.value;
      
      if (this.editingItem) {
        // Update existing task
        const index = this.tasks.findIndex(t => t.id === this.editingItem.id);
        if (index !== -1) {
          this.tasks[index] = { ...this.tasks[index], ...taskData };
        }
      } else {
        // Create new task
        const newTask: Task = {
          id: Date.now().toString(),
          status: 'pending',
          createdAt: new Date(),
          ...taskData
        };
        this.tasks.push(newTask);
      }
      
      this.closeTaskModal();
      this.loadData();
    }
  }

  deleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.loadData();
    }
  }

  completeTask(taskId: string) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
      task.completedAt = new Date();
      this.loadData();
    }
  }

  closeTaskModal() {
    this.showTaskModal = false;
    this.editingItem = null;
    this.taskForm.reset();
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    const statusConfig = this.leadStatuses.find(s => s.value === status);
    return statusConfig ? `status-${status}` : 'status-default';
  }

  getPriorityBadgeClass(priority: string): string {
    return `priority-${priority}`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  exportData() {
    const data = this.getFilteredData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.activeTab}-export.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
