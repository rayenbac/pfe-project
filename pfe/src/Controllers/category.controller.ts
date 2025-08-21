import { CategoryService } from '../Services/category.service'; // Import the CategoryService
import { injectable, inject } from 'inversify';
import { CategoryTYPES } from "../DI/Category/CategoryTypes"; // Make sure this path is correct
import { Request, Response } from 'express';
import { ICategory } from '../Interfaces/category/ICategory';
import { CategorySchemaValidate } from '../Models/category'; // Assuming you have a Category schema validator

@injectable()
class CategoryController {
    private service: CategoryService;

    constructor(@inject(CategoryTYPES.categoryService) service: CategoryService) {
        this.service = service;
    }

    // Get all categories
    getCategories = async (req: Request, res: Response) => {
        const categories = await this.service.getCategories();
        res.status(200).send(categories);
    }

    // Get a single category
    getCategory = async (req: Request, res: Response) => {
        const id = req.params.id;
        const category = await this.service.getCategory(id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).send(category);
    }

    // Add a new category
    addCategory = async (req: Request, res: Response) => {
        const { error, value } = CategorySchemaValidate.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.message });
        }
        const category = await this.service.createCategory(value); // Pass the validated category data to the service
        res.status(201).send(category);
    }

    // Update a category
    updateCategory = async (req: Request, res: Response) => {
        const id = req.params.id;
        const category = await this.service.updateCategory(id, req.body);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).send(category);
    }

    // Delete a category
    deleteCategory = async (req: Request, res: Response) => {
        const id = req.params.id;
        await this.service.deleteCategory(id);
        res.status(200).send({ message: 'Category deleted' });
    }
}

export { CategoryController };
