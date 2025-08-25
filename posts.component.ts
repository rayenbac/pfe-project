import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="posts">
      <div class="posts-header">
        <h1>My Posts</h1>
        <div class="header-actions">
          <button class="btn btn-outline">Bulk Actions</button>
          <button class="btn btn-primary">+ Create Post</button>
        </div>
      </div>

      <div class="posts-stats">
        <div class="row">
          <div class="col-3">
            <div class="stat-card">
              <div class="stat-number">{{ postStats.total }}</div>
              <div class="stat-label">Total Posts</div>
              <div class="stat-trend positive">+12% this month</div>
            </div>
          </div>
          <div class="col-3">
            <div class="stat-card">
              <div class="stat-number">{{ postStats.published }}</div>
              <div class="stat-label">Published</div>
              <div class="stat-trend positive">+8% this month</div>
            </div>
          </div>
          <div class="col-3">
            <div class="stat-card">
              <div class="stat-number">{{ postStats.totalViews }}</div>
              <div class="stat-label">Total Views</div>
              <div class="stat-trend positive">+25% this month</div>
            </div>
          </div>
          <div class="col-3">
            <div class="stat-card">
              <div class="stat-number">{{ postStats.totalLikes }}</div>
              <div class="stat-label">Total Likes</div>
              <div class="stat-trend positive">+18% this month</div>
            </div>
          </div>
        </div>
      </div>

      <div class="posts-filters">
        <div class="filter-group">
          <select class="form-control">
            <option>All Status</option>
            <option>Published</option>
            <option>Draft</option>
            <option>Scheduled</option>
            <option>Archived</option>
          </select>
        </div>
        <div class="filter-group">
          <select class="form-control">
            <option>All Categories</option>
            <option>Property Listing</option>
            <option>Market Update</option>
            <option>Tips & Advice</option>
            <option>Success Story</option>
          </select>
        </div>
        <div class="filter-group">
          <input type="text" class="form-control" placeholder="Search posts...">
        </div>
      </div>

      <div class="posts-grid">
        <div class="post-card" *ngFor="let post of posts">
          <div class="post-header">
            <div class="post-status" [ngClass]="'status-' + post.status.toLowerCase()">
              {{ post.status }}
            </div>
            <div class="post-actions">
              <button class="action-btn" title="Edit">✏️</button>
              <button class="action-btn" title="View">👁️</button>
              <button class="action-btn" title="Share">📤</button>
            </div>
          </div>

          <div class="post-image" *ngIf="post.image">
            <img [src]="post.image" [alt]="post.title">
          </div>

          <div class="post-content">
            <div class="post-category">{{ post.category }}</div>
            <h3 class="post-title">{{ post.title }}</h3>
            <p class="post-excerpt">{{ post.excerpt }}</p>

            <div class="post-tags">
              <span class="tag" *ngFor="let tag of post.tags">#{{ tag }}</span>
            </div>

            <div class="post-meta">
              <div class="post-date">
                <span class="meta-label">Published:</span>
                <span class="meta-value">{{ post.datePublished | date:'short' }}</span>
              </div>
              <div class="post-stats-inline">
                <div class="stat">
                  <span class="stat-icon">👁️</span>
                  <span class="stat-value">{{ post.views }}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">❤️</span>
                  <span class="stat-value">{{ post.likes }}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">💬</span>
                  <span class="stat-value">{{ post.comments }}</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">📤</span>
                  <span class="stat-value">{{ post.shares }}</span>
                </div>
              </div>
            </div>

            <div class="post-performance">
              <div class="performance-bar">
                <div class="performance-fill" [style.width.%]="post.engagementRate"></div>
              </div>
              <div class="performance-label">
                {{ post.engagementRate }}% engagement rate
              </div>
            </div>
          </div>

          <div class="post-footer">
            <div class="post-platform">
              <span class="platform-icon" *ngFor="let platform of post.platforms">
                {{ getPlatformIcon(platform) }}
              </span>
            </div>
            <div class="post-quick-actions">
              <button class="btn btn-outline btn-sm">Edit</button>
              <button class="btn btn-primary btn-sm">Boost</button>
            </div>
          </div>
        </div>
      </div>

      <div class="content-calendar">
        <div class="card">
          <div class="card-header">
            <h3>Content Calendar</h3>
            <button class="btn btn-outline btn-sm">View Full Calendar</button>
          </div>
          <div class="calendar-preview">
            <div class="calendar-day" *ngFor="let day of upcomingPosts">
              <div class="day-date">
                <div class="day-number">{{ day.date }}</div>
                <div class="day-name">{{ day.dayName }}</div>
              </div>
              <div class="day-posts">
                <div class="scheduled-post" *ngFor="let post of day.posts">
                  <div class="post-time">{{ post.time }}</div>
                  <div class="post-title-small">{{ post.title }}</div>
                  <div class="post-platform-small">{{ post.platform }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="analytics-overview">
        <div class="card">
          <div class="card-header">
            <h3>Performance Analytics</h3>
            <div class="period-selector">
              <button class="period-btn active">7 days</button>
              <button class="period-btn">30 days</button>
              <button class="period-btn">90 days</button>
            </div>
          </div>
          <div class="analytics-content">
            <div class="analytics-chart">
              <div class="chart-title">Post Engagement Over Time</div>
              <div class="chart-placeholder">
                <div class="chart-line">
                  <div class="chart-point" *ngFor="let point of engagementData" 
                       [style.left.%]="point.x" 
                       [style.bottom.%]="point.y"
                       [title]="point.label"></div>
                </div>
              </div>
            </div>
            <div class="top-performing-posts">
              <h4>Top Performing Posts</h4>
              <div class="top-post" *ngFor="let post of topPosts">
                <div class="top-post-title">{{ post.title }}</div>
                <div class="top-post-stats">
                  <span class="stat">{{ post.views }} views</span>
                  <span class="stat">{{ post.engagement }}% engagement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .posts {
      padding: 2rem;
    }

    .posts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .posts-stats {
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      text-align: center;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    }

    .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0.5rem;
    }

    .stat-label {
      font-size: 1rem;
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }

    .stat-trend {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .stat-trend.positive {
      color: #28a745;
    }

    .stat-trend.negative {
      color: #dc3545;
    }

    .posts-filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--accent);
      border-radius: 12px;
    }

    .filter-group {
      flex: 1;
    }

    .posts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .post-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .post-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }

    .post-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
    }

    .post-status {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.875rem;
      text-transform: uppercase;
    }

    .status-published {
      background: #28a745;
      color: white;
    }

    .status-draft {
      background: #6c757d;
      color: white;
    }

    .status-scheduled {
      background: #17a2b8;
      color: white;
    }

    .post-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: var(--accent);
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .action-btn:hover {
      background: var(--primary);
      color: white;
      transform: scale(1.1);
    }

    .post-image {
      height: 200px;
      overflow: hidden;
    }

    .post-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .post-card:hover .post-image img {
      transform: scale(1.05);
    }

    .post-content {
      padding: 1.5rem;
    }

    .post-category {
      font-size: 0.875rem;
      color: var(--primary);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }

    .post-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--secondary);
      margin-bottom: 0.75rem;
      line-height: 1.4;
    }

    .post-excerpt {
      color: #666;
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .post-tags {
      margin-bottom: 1rem;
    }

    .tag {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: var(--accent);
      color: var(--primary);
      border-radius: 20px;
      font-size: 0.875rem;
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .post-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding: 1rem 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .post-date {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .meta-label {
      font-size: 0.875rem;
      color: #666;
    }

    .meta-value {
      font-weight: 500;
      color: var(--secondary);
    }

    .post-stats-inline {
      display: flex;
      gap: 1rem;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      color: #666;
    }

    .stat-icon {
      font-size: 1rem;
    }

    .post-performance {
      margin-bottom: 1rem;
    }

    .performance-bar {
      height: 6px;
      background: var(--border);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .performance-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), #28a745);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .performance-label {
      font-size: 0.875rem;
      color: #666;
      text-align: center;
    }

    .post-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: var(--accent);
    }

    .post-platform {
      display: flex;
      gap: 0.5rem;
    }

    .platform-icon {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }

    .post-quick-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .content-calendar,
    .analytics-overview {
      margin-top: 2rem;
    }

    .calendar-preview {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      overflow-x: auto;
    }

    .calendar-day {
      min-width: 200px;
      background: var(--accent);
      border-radius: 12px;
      padding: 1rem;
    }

    .day-date {
      text-align: center;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }

    .day-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary);
    }

    .day-name {
      font-size: 0.875rem;
      color: #666;
    }

    .scheduled-post {
      background: white;
      border-radius: 8px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .post-time {
      font-weight: 600;
      color: var(--primary);
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .post-title-small {
      font-weight: 500;
      color: var(--secondary);
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
      line-height: 1.3;
    }

    .post-platform-small {
      font-size: 0.75rem;
      color: #666;
    }

    .analytics-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
      padding: 1rem;
    }

    .period-selector {
      display: flex;
      gap: 0.5rem;
    }

    .period-btn {
      padding: 0.5rem 1rem;
      border: 2px solid var(--border);
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .period-btn.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    .chart-placeholder {
      height: 200px;
      background: var(--accent);
      border-radius: 12px;
      position: relative;
      margin-top: 1rem;
    }

    .chart-line {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .chart-point {
      position: absolute;
      width: 8px;
      height: 8px;
      background: var(--primary);
      border-radius: 50%;
      cursor: pointer;
      transform: translate(-50%, 50%);
    }

    .top-performing-posts h4 {
      margin-bottom: 1rem;
      color: var(--secondary);
    }

    .top-post {
      padding: 1rem;
      background: var(--accent);
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .top-post-title {
      font-weight: 500;
      color: var(--secondary);
      margin-bottom: 0.5rem;
    }

    .top-post-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
      color: #666;
    }

    @media (max-width: 1024px) {
      .posts-grid {
        grid-template-columns: 1fr;
      }

      .analytics-content {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .posts-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .posts-filters {
        flex-direction: column;
      }

      .calendar-preview {
        flex-direction: column;
      }

      .calendar-day {
        min-width: unset;
      }
    }
  `]
})
export class PostsComponent {
  postStats = {
    total: 48,
    published: 42,
    totalViews: 15420,
    totalLikes: 1285
  };

  posts = [
    {
      id: 1,
      title: 'Top 5 Neighborhoods for First-Time Buyers in 2024',
      excerpt: 'Discover the most affordable and promising neighborhoods perfect for your first home purchase. Our expert analysis covers market trends, amenities, and future growth potential.',
      category: 'Tips & Advice',
      status: 'Published',
      image: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400',
      datePublished: new Date('2024-01-20'),
      views: 1245,
      likes: 89,
      comments: 23,
      shares: 15,
      tags: ['FirstTimeBuyer', 'Neighborhoods', 'RealEstate', 'Tips'],
      platforms: ['Facebook', 'Instagram', 'LinkedIn'],
      engagementRate: 78
    },
    {
      id: 2,
      title: 'Stunning Waterfront Property Now Available',
      excerpt: 'Exclusive listing: Luxury 4-bedroom home with panoramic ocean views, private beach access, and modern amenities. Schedule your private showing today.',
      category: 'Property Listing',
      status: 'Published',
      image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400',
      datePublished: new Date('2024-01-18'),
      views: 2156,
      likes: 156,
      comments: 45,
      shares: 32,
      tags: ['Luxury', 'Waterfront', 'Listing', 'Exclusive'],
      platforms: ['Instagram', 'Facebook', 'Twitter'],
      engagementRate: 85
    },
    {
      id: 3,
      title: 'Q1 2024 Market Analysis: What to Expect',
      excerpt: 'Comprehensive market analysis covering price trends, inventory levels, and expert predictions for the upcoming quarter. Essential reading for buyers and sellers.',
      category: 'Market Update',
      status: 'Scheduled',
      image: 'https://images.pexels.com/photos/1647962/pexels-photo-1647962.jpeg?auto=compress&cs=tinysrgb&w=400',
      datePublished: new Date('2024-02-01'),
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      tags: ['MarketAnalysis', 'Trends', 'Q1', '2024'],
      platforms: ['LinkedIn', 'Facebook'],
      engagementRate: 0
    },
    {
      id: 4,
      title: 'Client Success Story: From Renting to Homeowning',
      excerpt: 'Follow Sarah\'s journey from apartment renting to proud homeowner. Learn about the challenges, solutions, and joy of achieving the American Dream.',
      category: 'Success Story',
      status: 'Draft',
      image: 'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=400',
      datePublished: null,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      tags: ['SuccessStory', 'Client', 'Homeowning', 'Journey'],
      platforms: ['Facebook', 'Instagram'],
      engagementRate: 0
    },
    {
      id: 5,
      title: 'Home Staging Tips That Actually Work',
      excerpt: 'Professional staging secrets that can increase your home\'s value by up to 15%. Simple, cost-effective tips that make a huge difference in buyer appeal.',
      category: 'Tips & Advice',
      status: 'Published',
      image: 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=400',
      datePublished: new Date('2024-01-15'),
      views: 987,
      likes: 67,
      comments: 18,
      shares: 9,
      tags: ['HomeStaging', 'Tips', 'Selling', 'Value'],
      platforms: ['Pinterest', 'Instagram', 'Facebook'],
      engagementRate: 72
    },
    {
      id: 6,
      title: 'Investment Property Spotlight: Downtown Development',
      excerpt: 'Exciting investment opportunity in the heart of downtown. New development project promises excellent ROI with modern amenities and prime location.',
      category: 'Property Listing',
      status: 'Published',
      image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=400',
      datePublished: new Date('2024-01-12'),
      views: 1456,
      likes: 98,
      comments: 28,
      shares: 21,
      tags: ['Investment', 'Downtown', 'Development', 'ROI'],
      platforms: ['LinkedIn', 'Facebook'],
      engagementRate: 81
    }
  ];

  upcomingPosts = [
    {
      date: 25,
      dayName: 'Mon',
      posts: [
        { time: '09:00', title: 'Market Monday Update', platform: 'LinkedIn' },
        { time: '15:00', title: 'New Listing Showcase', platform: 'Instagram' }
      ]
    },
    {
      date: 26,
      dayName: 'Tue',
      posts: [
        { time: '12:00', title: 'Tips Tuesday: Home Inspection', platform: 'Facebook' }
      ]
    },
    {
      date: 27,
      dayName: 'Wed',
      posts: [
        { time: '10:00', title: 'Client Testimonial', platform: 'Instagram' },
        { time: '16:00', title: 'Market Analysis', platform: 'LinkedIn' }
      ]
    },
    {
      date: 28,
      dayName: 'Thu',
      posts: [
        { time: '14:00', title: 'Property Spotlight', platform: 'Facebook' }
      ]
    },
    {
      date: 29,
      dayName: 'Fri',
      posts: [
        { time: '11:00', title: 'Feature Friday: Luxury Home', platform: 'Instagram' }
      ]
    }
  ];

  engagementData = [
    { x: 10, y: 20, label: 'Week 1' },
    { x: 30, y: 45, label: 'Week 2' },
    { x: 50, y: 35, label: 'Week 3' },
    { x: 70, y: 60, label: 'Week 4' },
    { x: 90, y: 75, label: 'Week 5' }
  ];

  topPosts = [
    { title: 'Stunning Waterfront Property Now Available', views: 2156, engagement: 85 },
    { title: 'Investment Property Spotlight: Downtown Development', views: 1456, engagement: 81 },
    { title: 'Top 5 Neighborhoods for First-Time Buyers in 2024', views: 1245, engagement: 78 }
  ];

  getPlatformIcon(platform: string): string {
    const icons: { [key: string]: string } = {
      'Facebook': '📘',
      'Instagram': '📸',
      'LinkedIn': '💼',
      'Twitter': '🐦',
      'Pinterest': '📌'
    };
    return icons[platform] || '🌐';
  }
}