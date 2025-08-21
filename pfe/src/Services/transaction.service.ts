import { injectable } from 'inversify';
import { Transaction } from '../Models/transaction';  // Ensure the path is correct
import { ITransactionRepository } from '../Interfaces/transaction/ITransactionRepository';
import { ITransaction } from '../Interfaces/transaction/ITransaction';
import "reflect-metadata";
import { Document } from 'mongoose';

@injectable()
class TransactionService implements ITransactionRepository {

    // Fetch all transactions
    async getTransactions(): Promise<(Document<unknown, any, ITransaction> & ITransaction)[]> {
        try {
            const transactions = await Transaction.find({});
            return transactions;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Fetch a single transaction by ID
    async getTransaction(id: string): Promise<Document<unknown, any, ITransaction> & ITransaction | null> {
        try {
            const transaction = await Transaction.findById(id);
            if (!transaction) {
                return null;  // Or you can throw a custom error
            }
            return transaction;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // Create a new transaction
    async createTransaction(data: Omit<ITransaction, '_id'>): Promise<Document<unknown, any, ITransaction> & ITransaction> {
        try {
            const newTransaction = await Transaction.create(data);
            return newTransaction;
        } catch (error) {
            console.log(error);
            throw new Error('Error creating transaction');  // You can customize error handling
        }
    }

    // Update a transaction
    async updateTransaction(id: string, data: Partial<ITransaction>): Promise<Document<unknown, any, ITransaction> & ITransaction | null> {
        try {
            const transaction = await Transaction.findByIdAndUpdate(id, data, { new: true });
            if (!transaction) {
                return null;  // Or you can throw a custom error
            }
            return transaction;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    // Delete a transaction by ID
    async deleteTransaction(id: string): Promise<void> {
        try {
            const transaction = await Transaction.findByIdAndDelete(id);
            if (!transaction) {
                throw new Error('Transaction not found');
            }
        } catch (error) {
            console.log(error);
            throw new Error('Error deleting transaction');
        }
    }

    // Find transactions by user ID
    async findTransactionsByUser(userId: string): Promise<(Document<unknown, any, ITransaction> & ITransaction)[]> {
        try {
            const transactions = await Transaction.find({ user: userId });
            return transactions;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Find transactions by property ID
    async findTransactionsByProperty(propertyId: string): Promise<(Document<unknown, any, ITransaction> & ITransaction)[]> {
        try {
            const transactions = await Transaction.find({ property: propertyId });
            return transactions;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    // Find transactions by status
    async findTransactionsByStatus(status: string): Promise<(Document<unknown, any, ITransaction> & ITransaction)[]> {
        try {
            const transactions = await Transaction.find({ status });
            return transactions;
        } catch (error) {
            console.log(error);
            return [];
        }
    }
}

export { TransactionService };
