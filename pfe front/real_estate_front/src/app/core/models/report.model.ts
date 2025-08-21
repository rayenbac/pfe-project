export interface Report {
  _id: string;
  reporterId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
  targetType: 'post' | 'property' | 'agent' | 'agency';
  targetId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes?: string;
  reviewedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reviewedAt?: Date;
  actionTaken?: string;
  priority: 'low' | 'medium' | 'high';
  category?: 'spam' | 'inappropriate_content' | 'harassment' | 'fake_listing' | 'fraud' | 'offensive_language' | 'copyright_violation' | 'other';
  evidence?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReportRequest {
  targetType: 'post' | 'property' | 'agent' | 'agency';
  targetId: string;
  reason: string;
  category?: string;
  evidence?: string[];
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateReportRequest {
  status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes?: string;
  actionTaken?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface ReportStatistics {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  highPriorityReports: number;
  statusBreakdown: { _id: string; count: number }[];
  categoryBreakdown: { _id: string; count: number }[];
}

export interface BulkUpdateRequest {
  reportIds: string[];
  updateData: UpdateReportRequest;
}
