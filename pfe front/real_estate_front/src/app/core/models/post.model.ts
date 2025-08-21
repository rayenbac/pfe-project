export interface Author {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
}

export interface Post {
    _id: string; // Optional, since MongoDB generates it
    title: string;
    description: string;
    author: string | Author; // Reference to User or populated Author object
    likes: number;
    published: boolean;
    image?: string;
    category?: string;
    tags?: string[]; // Array of tags
    createdAt?: Date;
    updatedAt?: Date;
    slug: string;
  }
  