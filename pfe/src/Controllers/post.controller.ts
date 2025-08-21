import { PostService } from '../Services/post.service'
import { Post, PostschemaValidate } from '../Models/post'
import { injectable, inject } from 'inversify'
import { TYPES, SORT_OPT } from "../DI/Post/types" // used in inversify
import { IResult } from '../Interfaces/IResult'
import { resourceLimits } from 'worker_threads'
import { Express, Request, Response } from 'express';
import { NextFunction } from 'express-serve-static-core'
import { error } from 'console'
import { UploadService } from '../Services/upload.service';
import { diContainer } from '../DI/iversify.config';
import { realtimeNotificationService } from '../Server/app';
import { AuthenticatedUser } from '../types/auth';
import { User } from '../Models/user';





@injectable() // that is called as decorator-annotation
class PostController {
    private service: PostService; // there is no private modifier in JS 
    private uploadService: UploadService;

    constructor(@inject(TYPES.service) service: PostService) { // constructor injection
        this.service = service
        this.uploadService = diContainer.get<UploadService>(Symbol.for("UploadService"));
    }

    //get all posts
    getPosts = async (req: Request, res: Response) => { // non-blocking approach
        const sortParam = req.query.sort;
        const isValid = this.isValidSortOption(sortParam)



        const posts = await this.service.getPosts();
        res.send(posts);
    }

    isValidSortOption(value: any): value is SORT_OPT {
        return Object.values(SORT_OPT).includes(value);
    }

    //get a single post
    getAPost = async (req: Request, res: Response) => { // when the async task is finished fires a callback function
        const id = req.params.id // extract id from the link
        const post = await this.service.getPost(id)
        if (post == '404') {
            console.log("the post is ",post);
            return res.status(404).json({ message: 'Post not found' });
        }else{
            console.log("post is not undefined")
            res.status(200).send(post)

        }
    }

    //add post controller
    addpost = async (req: Request, res: Response) => {
        let imagePath = '';
        if (req.file) {
            imagePath = this.uploadService.getFilePath(req.file.filename, 'post'); // Use 'post' for post images
        }
        // Generate slug from title
        let slug = req.body.title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');
        // Ensure slug is unique
        let uniqueSlug = slug;
        let counter = 1;
        while (await Post.findOne({ slug: uniqueSlug })) {
            uniqueSlug = `${slug}-${counter++}`;
        }
        //data to be saved in database
        const data = {
            title: req.body.title,
            author: req.body.author,
            description: req.body.description,
            published: req.body.published,
            likes: req.body.likes,
            image: imagePath,
            category: req.body.category || 'General',
            tags: req.body.tags ? (typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags) : [],
            slug: uniqueSlug
        }
        //validating the request
        const { error, value } = PostschemaValidate.validate(data)

        if (error) {
            res.send(error.message)
        } else {
            //call the create post function in the service and pass the data from the request
            const post = await this.service.createPost(value)
            res.status(201).send(post) // status is set to ok
        }
    }

    //update post
    updatePost = async (req: Request, res: Response) => {
        const id = req.params.id
        const post = await this.service.updatePost(id, req.body)
        res.send(post)
    }

    //delete a post
    deletePost = async (req: Request, res: Response) => {
        const id = req.params.id
        await this.service.deletePost(id)
        res.send('post deleted')
    }

    //pagination
    getChunk = async (req: Request, res: Response) => {
        const limit = 5;

        // Cast req.filter to unknown first, then to the expected type
        let filter = req.filter as unknown as { likes: { $gte: number; $lte: number } } | undefined;
        if (
            !filter ||
            typeof filter !== 'object' ||
            !('likes' in filter) ||
            typeof filter.likes !== 'object' ||
            !('$gte' in filter.likes) ||
            !('$lte' in filter.likes)
        ) {
            filter = { likes: { $gte: 0, $lte: 1000000 } }; // sensible default
        }

        const queryPool = {
            sortType: req.sortType,
            pageIndex: req.pageIndex,
            orderBy: req.orderBy,
            filter
        }

        const answer: IResult | undefined = await this.service.getChunk(queryPool, limit);

        if (typeof answer === 'string') {
            return res.status(400).json({ message: answer });
        }
        return res.status(200).json(answer);
    }
    //update post with patch
    patchPost = async (req: Request, res: Response) => {
        const id = req.params.id
        const post = await this.service.patchUpdate(id, req.body)
        res.send(post)
    }
    search = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const queryPool = {
                sortType: req.sortType,
                pageIndex: req.pageIndex,
                orderBy: req.orderBy
            }
            const query = req.query.q as string
            console.log(req.query.q);
            
            const answer = await this.service.search(query, queryPool)
                return res.status(200).json(answer)
        } catch (error) { console.log(error) }
    }

    // Add review to a post
    addReview = async (req: Request, res: Response) => {
        const postId = req.params.id;
        const { userId, rating, comment } = req.body;
        const review = { userId, rating, comment, createdAt: new Date() };
        const result = await this.service.addReview(postId, review);
        if (!result) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Send notification for post review
        if (result && realtimeNotificationService && req.user) {
            const user = await User.findById((req.user as AuthenticatedUser)._id);
            if (user && result.review && result.review._id) {
                await realtimeNotificationService.notifyPostReviewed(
                    (req.user as AuthenticatedUser)._id,
                    {
                        postId,
                        reviewId: result.review._id.toString(),
                        reviewerName: `${user.firstName} ${user.lastName}`,
                        rating
                    }
                );
            }
        }

        res.status(201).send(result.post);
    }
}

export { PostController } 