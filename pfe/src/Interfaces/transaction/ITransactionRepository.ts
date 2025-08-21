import { ITransaction } from './ITransaction';
import { Document } from 'mongoose';

export interface ITransactionRepository {
    getTransactions(): Promise<(Document<unknown, any, ITransaction> & ITransaction)[]>; // Get all transactions
    getTransaction(id: string): Promise<Document<unknown, any, ITransaction> & ITransaction | null>; // Get a single transaction by ID
    createTransaction(data: Omit<ITransaction, '_id'>): Promise<Document<unknown, any, ITransaction> & ITransaction>; // Create a new transaction
    updateTransaction(id: string, data: Partial<ITransaction>): Promise<Document<unknown, any, ITransaction> & ITransaction | null>; // Update a transaction
    deleteTransaction(id: string): Promise<void>; // Delete a transaction
    findTransactionsByUser(userId: string): Promise<(Document<unknown, any, ITransaction> & ITransaction)[]>; // Find transactions by user ID
    findTransactionsByProperty(propertyId: string): Promise<(Document<unknown, any, ITransaction> & ITransaction)[]>; // Find transactions by property ID
    findTransactionsByStatus(status: string): Promise<(Document<unknown, any, ITransaction> & ITransaction)[]>; // Find transactions by status (e.g., "Pending", "Completed")
}
