import { injectable } from 'inversify';
import { Category } from '../Models/category';  // Assuming you have a Category model
import { ICategoryRepository } from '../Interfaces/category/ICategoryRepository';
import { ICategory } from '../Interfaces/category/ICategory';
import "reflect-metadata";

@injectable()
class CategoryService implements ICategoryRepository {

    // Fetch all categories
    async getCategories() {
        try {
            const categories = await Category.find({});
            return categories;
        } catch (error) {
            console.log(error);
            return [];
        }
    }

    async getCategory(id: string) {
        try {
            const category = await Category.findById({ _id: id });
            if (!category) {
                return '404';  // Or you can throw a custom error
            }
            return category;
        } catch (error) {
            console.log(error);
            return '404';
        }
    }

    // Create a new category
    async createCategory(data: Omit<ICategory, '_id'>) {
        try {
            const newCategory = await Category.create(data);
            return newCategory;
        } catch (error) {
            console.log(error);
            return 'Error creating category';  // You can customize error handling
        }
    }

    // Update a category
    async updateCategory(id: string, data: any) {
        try {
            const category = await Category.findByIdAndUpdate({ _id: id }, data, { new: true });
            if (!category) {
                return "User not found";  // Or you can throw a custom error
            }
            return category;
        } catch (error) {
            console.log(error);
        }
    }

    // Delete a category by ID
    async deleteCategory(id: string) {
        try {
            const category = await Category.findByIdAndDelete(id);
            if (!category) {
                return 'Category not found';
            }
        } catch (error) {
            console.log(error);
            return 'Error deleting category';
        }
    }
}

export { CategoryService };
