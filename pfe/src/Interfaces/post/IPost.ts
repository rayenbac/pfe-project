export interface IPostReview {
    _id?: string;
    userId: string;
    rating: number;
    comment?: string;
    createdAt: Date;
}

export interface IPost {
    id: string;
    title: string;
    description: string;
    author: string;
    likes: number;
    published: boolean;
    image?: string;
    category?: string;
    tags?: string[];
    reviews?: IPostReview[];
    createdAt: Date;
    updatedAt: Date;
    slug: string;
}
