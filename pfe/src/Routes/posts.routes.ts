//importing modules
import { error } from 'console';
import { PostController } from '../Controllers/post.controller'
import { diContainer } from "../DI/iversify.config";
import { TYPES } from "../DI/Post/types";
import { pageIndexChecker, sortParamChecker, orderByParamChecker, filterChecker } from "../Middlewares/param.validator";
import express from 'express';
import { UploadService } from '../Services/upload.service';


//initiating the router, express is a framework like springboot in java
export const router = express.Router()
// holds the registered dependencies and manages their creation and resolution
const controller = diContainer.get<PostController>(TYPES.controller);

const middlewares = [pageIndexChecker, sortParamChecker, orderByParamChecker, filterChecker]; // should they combined

const uploadService = new UploadService();
const uploadPostImage = uploadService.getMulterUpload('post').single('image'); // Use 'post' for post images

// sub-routes after /api/posts
router.get('/pagination', middlewares, controller.getChunk)
router.post('/', uploadPostImage, controller.addpost) // the same URL can have multiple HTTP methods
router.get('/', controller.getPosts)
router.get('/search',middlewares, controller.search)
router.get('/:id', controller.getAPost) // query parametres uses ?=id 
router.put('/:id', controller.updatePost)
router.patch('/:id', controller.patchPost)
router.delete('/:id', controller.deletePost)
router.post('/:id/review', controller.addReview)


