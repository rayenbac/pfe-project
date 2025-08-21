# Admin Reports Dashboard Access Guide

## Overview
The reporting system allows users to report inappropriate content (posts, properties, agents, agencies) and provides administrators with a comprehensive dashboard to manage these reports.

## 🔐 Admin Access Instructions

### 1. Login as Administrator
1. Navigate to your frontend application (typically `http://localhost:4200`)
2. Log in with administrator credentials
3. Your user account must have `role: 'admin'` in the database

### 2. Access Reports Dashboard
Once logged in as admin, you can access the reports dashboard through:

**Method 1: Direct URL**
```
http://localhost:4200/admin/reports
```

**Method 2: Navigation Menu**
1. Go to the admin dashboard
2. In the left sidebar, find the "Moderation" section
3. Click on "Reports" to expand the menu
4. Choose from:
   - **All Reports** - View all reports
   - **Pending Reports** - View only unresolved reports
   - **Resolved Reports** - View completed reports

## 📊 Dashboard Features

### Main Dashboard View
- **Statistics Cards**: Total reports, pending, resolved, blocked users
- **Quick Filters**: Filter by status, category, date range
- **Search**: Search by reported content or reporter
- **Bulk Actions**: Resolve multiple reports at once

### Report Management Actions
1. **View Details**: Click on any report to see full details
2. **Resolve Report**: Mark report as resolved with admin notes
3. **Block User**: Block the reported user temporarily or permanently
4. **Dismiss Report**: Mark as invalid/spam
5. **Take Action**: Additional moderation actions

### Filtering Options
- **By Status**: All, Pending, Resolved, Dismissed
- **By Category**: 
  - Spam
  - Inappropriate Content
  - Harassment
  - Fake Listing
  - Fraud
  - Offensive Language
  - Copyright Violation
  - Other
- **By Date**: Last 7 days, Last 30 days, Custom range
- **By Type**: Post, Property, Agent, Agency

## 🚀 Getting Started

### Prerequisites
1. **Backend Server Running**:
   ```bash
   cd "d:\pfe project\pfe"
   npm run dev
   ```

2. **Frontend Server Running**:
   ```bash
   cd "d:\pfe project\pfe front\real_estate_front"
   ng serve
   ```

3. **Database Connection**: Ensure MongoDB is running and connected

### First Time Setup
1. Start both backend and frontend servers
2. Create an admin user account with `role: 'admin'`
3. Login to the application
4. Navigate to `/admin/reports`

## 🔄 Real-time Features

### Live Notifications
- New reports trigger real-time notifications
- Report status changes update automatically
- Admin dashboard shows live statistics

### WebSocket Events
- `new_report`: Triggered when users submit reports
- `report_resolved`: Triggered when admin resolves reports
- `user_blocked`: Triggered when users are blocked

## 📝 User Reporting Process

### How Users Can Report Content

**1. Report a Property**
- Go to property details page
- Click "Report Property" button
- Select category and add description
- Submit report

**2. Report an Agent**
- Go to agent profile page
- Click "Report Agent" button
- Select category and add description
- Submit report

**3. Report a Post**
- Go to post details page
- Click "Report Post" button
- Select category and add description
- Submit report

**4. Report an Agency**
- Go to agency profile page
- Click "Report Agency" button
- Select category and add description
- Submit report

## 🛠️ Technical Implementation

### Backend Endpoints (Express.js)
```
GET    /api/reports           - Get all reports (admin only)
GET    /api/reports/:id       - Get specific report
POST   /api/reports           - Create new report
PUT    /api/reports/:id       - Update report (admin only)
DELETE /api/reports/:id       - Delete report (admin only)
```

### Frontend Routes (Angular)
```
/admin/reports              - Main reports dashboard
/admin/reports/:id          - View specific report details
```

### Database Schema
```typescript
{
  reportedContent: { type: String, enum: ['post', 'property', 'agent', 'agency'] },
  reportedContentId: ObjectId,
  reportedBy: ObjectId,
  category: { 
    type: String, 
    enum: ['spam', 'inappropriate_content', 'harassment', 'fake_listing', 'fraud', 'offensive_language', 'copyright_violation', 'other']
  },
  description: String,
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
  resolvedBy: ObjectId,
  resolvedAt: Date,
  adminNotes: String,
  createdAt: Date
}
```

## 🔍 Troubleshooting

### Common Issues

1. **Cannot Access Admin Dashboard**
   - Verify user has `role: 'admin'`
   - Check authentication token
   - Ensure proper login

2. **Reports Not Loading**
   - Verify backend server is running
   - Check API endpoints are accessible
   - Review browser console for errors

3. **Real-time Updates Not Working**
   - Verify WebSocket connection
   - Check Socket.IO configuration
   - Ensure both servers are running

### Error Messages
- `"Unauthorized"` - User lacks admin privileges
- `"Report not found"` - Invalid report ID
- `"Validation error"` - Invalid category or missing fields

## 📞 Support

For technical issues or questions:
1. Check browser console for errors
2. Review server logs
3. Verify database connections
4. Check authentication status

## 🔄 Next Steps

### Recommended Actions
1. Test the complete workflow from user report to admin resolution
2. Set up proper admin user accounts
3. Configure real-time notifications
4. Review and adjust report categories as needed
5. Set up monitoring for report volumes and response times

### Future Enhancements
- Email notifications for new reports
- Advanced analytics and reporting
- Automated spam detection
- Integration with content moderation APIs
- Mobile app support
