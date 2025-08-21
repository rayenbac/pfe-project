import { ICategory } from '../../Interfaces/category/ICategory';  // Import ICategory interface
import { returnCategoryType, getCategoriesReturnType } from '../../DI/Category/CategoryTypes';


export interface ICategoryRepository {
    getCategories(): getCategoriesReturnType;                       // Fetch all categories
    getCategory(id: string): returnCategoryType;                    // Fetch a single category by ID
    createCategory(data: any): returnCategoryType; // Create a new category
    updateCategory(id: string, data: any): returnCategoryType; // Update a category
    deleteCategory(id: string): void;                       // Delete a category by ID
}
