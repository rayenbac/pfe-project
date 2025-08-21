import { TransactionService } from '../Services/transaction.service'; // Import the TransactionService
import { injectable, inject } from 'inversify';
import { TransactionTYPES } from "../DI/Transaction/TransactionTypes"; // Ensure the path is correct
import { Request, Response } from 'express';
import { ITransaction } from '../Interfaces/transaction/ITransaction';
import { TransactionSchemaValidate } from '../Models/transaction'; // Assuming you have a Transaction schema validator

@injectable()
class TransactionController {
    private service: TransactionService;

    constructor(@inject(TransactionTYPES.transactionService) service: TransactionService) {
        this.service = service;
    }

    // Get all transactions
    getTransactions = async (req: Request, res: Response) => {
        const transactions = await this.service.getTransactions();
        res.status(200).send(transactions);
    }

    // Get a single transaction
    getTransaction = async (req: Request, res: Response) => {
        const id = req.params.id;
        const transaction = await this.service.getTransaction(id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.status(200).send(transaction);
    }

    // Add a new transaction
    addTransaction = async (req: Request, res: Response) => {
        const { error, value } = TransactionSchemaValidate.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.message });
        }
        const transaction = await this.service.createTransaction(value);
        res.status(201).send(transaction);
    }

    // Update a transaction
    updateTransaction = async (req: Request, res: Response) => {
        const id = req.params.id;
        const transaction = await this.service.updateTransaction(id, req.body);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.status(200).send(transaction);
    }

    // Delete a transaction
    deleteTransaction = async (req: Request, res: Response) => {
        const id = req.params.id;
        await this.service.deleteTransaction(id);
        res.status(200).send({ message: 'Transaction deleted' });
    }

    // Find transactions by user ID
    findTransactionsByUser = async (req: Request, res: Response) => {
        const userId = req.params.userId;
        const transactions = await this.service.findTransactionsByUser(userId);
        if (!transactions || transactions.length === 0) {
            return res.status(404).json({ message: 'No transactions found for this user' });
        }
        res.status(200).send(transactions);
    }

    // Find transactions by property ID
    findTransactionsByProperty = async (req: Request, res: Response) => {
        const propertyId = req.params.propertyId;
        const transactions = await this.service.findTransactionsByProperty(propertyId);
        if (!transactions || transactions.length === 0) {
            return res.status(404).json({ message: 'No transactions found for this property' });
        }
        res.status(200).send(transactions);
    }

    // Find transactions by status
    findTransactionsByStatus = async (req: Request, res: Response) => {
        const status = req.params.status;
        const transactions = await this.service.findTransactionsByStatus(status);
        if (!transactions || transactions.length === 0) {
            return res.status(404).json({ message: 'No transactions found with this status' });
        }
        res.status(200).send(transactions);
    }
}

export { TransactionController };
