// Importing modules
import express from 'express';
import { CategoryController } from '../Controllers/category.controller'; // Import the CategoryController
import { diContainer } from '../DI/iversify.config';
import { CategoryTYPES } from '../DI/Category/CategoryTypes'; // Import the correct CategoryTYPES

// Initiating the router
export const router = express.Router();

// Getting the controller instance from the DI container
const controller = diContainer.get<CategoryController>(CategoryTYPES.controller); // Get CategoryController from DI container

// Category routes
router.post('/', controller.addCategory); // Create a new category
router.get('/', controller.getCategories); // Get all categories
router.get('/:id', controller.getCategory); // Get a single category by ID
router.put('/:id', controller.updateCategory); // Update a category
router.delete('/:id', controller.deleteCategory); // Delete a category

export default router;
