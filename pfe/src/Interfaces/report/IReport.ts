import { Document, Types } from 'mongoose';

export interface IReport extends Document {
    _id: Types.ObjectId;
    reporterId: Types.ObjectId; // User who submitted the report
    targetType: 'post' | 'property' | 'agent' | 'agency'; // What is being reported
    targetId: Types.ObjectId; // ID of the target entity
    reason: string; // User provided reason for reporting
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'; // Report status
    adminNotes?: string; // Admin notes when reviewing
    reviewedBy?: Types.ObjectId; // Admin who reviewed it
    reviewedAt?: Date; // When it was reviewed
    actionTaken?: string; // What action was taken (warning, content removal, user blocking, etc.)
    priority: 'low' | 'medium' | 'high'; // Priority level
    category?: string; // Category of violation (spam, inappropriate content, harassment, etc.)
    evidence?: string[]; // Array of evidence URLs (images, screenshots, etc.)
    createdAt: Date;
    updatedAt: Date;
}

export interface IReportRepository {
    createReport(data: any): Promise<IReport>;
    getReports(): Promise<IReport[]>;
    getReport(id: string): Promise<IReport | string>;
    updateReport(id: string, data: any): Promise<IReport | string>;
    deleteReport(id: string): Promise<string>;
    getReportsByTarget(targetType: string, targetId: string): Promise<IReport[]>;
    getReportsByReporter(reporterId: string): Promise<IReport[]>;
    getReportsByStatus(status: string): Promise<IReport[]>;
    searchReports(query: string): Promise<IReport[]>;
}
