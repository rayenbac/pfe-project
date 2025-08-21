// Importing modules
import express from 'express';
import { TransactionController } from '../Controllers/transaction.controller'; // Import the TransactionController
import { diContainer } from '../DI/iversify.config';
import { TransactionTYPES } from '../DI/Transaction/TransactionTypes'; // Ensure the path is correct

// Initiating the router
export const router = express.Router();

// Getting the controller instance from the DI container
const controller = diContainer.get<TransactionController>(TransactionTYPES.transactionController); // Get TransactionController from DI container

// Transaction routes
router.post('/', controller.addTransaction); // Create a new transaction
router.get('/', controller.getTransactions); // Get all transactions
router.get('/:id', controller.getTransaction); // Get a single transaction by ID
router.put('/:id', controller.updateTransaction); // Update a transaction
router.delete('/:id', controller.deleteTransaction); // Delete a transaction
router.get('/user/:userId', controller.findTransactionsByUser); // Find transactions by user ID
router.get('/property/:propertyId', controller.findTransactionsByProperty); // Find transactions by property ID

export default router;
