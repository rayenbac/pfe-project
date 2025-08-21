import { injectable } from 'inversify';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import "reflect-metadata";
import { logger } from '../Config/logger.config';

@injectable()
class UploadService {
    private baseUploadDir: string;
    private allowedTypes: string[];
    private readonly validFolders = ['profile', 'verification', 'property', 'property-attachment', 'chat', 'agency', 'post'];

    constructor() {
        this.baseUploadDir = path.join(process.cwd(), 'uploads');
        this.allowedTypes = [
            'image/jpeg', 
            'image/png', 
            'image/gif', 
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
        ];
        this.ensureUploadDirectories();
    }

    private ensureUploadDirectories(): void {
        const directories = [
            path.join(this.baseUploadDir, 'users', 'profile'),
            path.join(this.baseUploadDir, 'users', 'verification'),
            path.join(this.baseUploadDir, 'properties'),
            path.join(this.baseUploadDir, 'properties', 'attachments'),
            path.join(this.baseUploadDir, 'chat'),
            path.join(this.baseUploadDir, 'agencies'),
            path.join(this.baseUploadDir, 'posts')
        ];

        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                logger.info(`Created directory: ${dir}`);
            }
        });
    }

    public getMulterUpload(uploadType: 'profile' | 'verification' | 'property' | 'property-attachment' | 'chat' | 'agency' | 'post') {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                let uploadPath;
                switch (uploadType) {
                    case 'profile':
                        uploadPath = path.join(this.baseUploadDir, 'users', 'profile');
                        break;
                    case 'verification':
                        uploadPath = path.join(this.baseUploadDir, 'users', 'verification');
                        break;
                    case 'property':
                        uploadPath = path.join(this.baseUploadDir, 'properties');
                        break;
                    case 'property-attachment':
                        uploadPath = path.join(this.baseUploadDir, 'properties', 'attachments');
                        break;
                    case 'chat':
                        uploadPath = path.join(this.baseUploadDir, 'chat');
                        break;
                    case 'agency':
                        uploadPath = path.join(this.baseUploadDir, 'agencies');
                        break;
                    case 'post':
                        uploadPath = path.join(this.baseUploadDir, 'posts');
                        break;
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
                logger.info(`Uploading file: ${file.originalname} as ${uniqueFileName}`);
                cb(null, uniqueFileName);
            }
        });

        const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
            if (this.allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                logger.warn(`Rejected file upload: ${file.originalname} (${file.mimetype})`);
                cb(new Error(`Invalid file type. Allowed types: ${this.allowedTypes.join(', ')}`));
            }
        };

        return multer({
            storage,
            fileFilter,
            limits: {
                fileSize: 10 * 1024 * 1024 // 10MB limit
            }
        });
    }

    public getFilePath(filename: string, type: 'profile' | 'verification' | 'property' | 'property-attachment' | 'chat' | 'agency' | 'post'): string {
        switch (type) {
            case 'profile':
                return `/uploads/users/profile/${filename}`;
            case 'verification':
                return `/uploads/users/verification/${filename}`;
            case 'property':
                return `/uploads/properties/${filename}`;
            case 'property-attachment':
                return `/uploads/properties/attachments/${filename}`;
            case 'chat':
                return `/uploads/chat/${filename}`;
            case 'agency':
                return `/uploads/agencies/${filename}`;
            case 'post':
                return `/uploads/posts/${filename}`;
            default:
                throw new Error('Invalid upload type');
        }
    }

    public async deleteFile(filename: string, type: 'profile' | 'verification' | 'property' | 'chat' | 'agency' | 'post'): Promise<void> {
        let filePath: string;
        switch (type) {
            case 'profile':
                filePath = path.join(process.cwd(), 'uploads', 'users', 'profile', filename);
                break;
            case 'verification':
                filePath = path.join(process.cwd(), 'uploads', 'users', 'verification', filename);
                break;
            case 'property':
                filePath = path.join(process.cwd(), 'uploads', 'properties', filename);
                break;
            case 'chat':
                filePath = path.join(process.cwd(), 'uploads', 'chat', filename);
                break;
            case 'agency':
                filePath = path.join(process.cwd(), 'uploads', 'agencies', filename);
                break;
            case 'post':
                filePath = path.join(process.cwd(), 'uploads', 'posts', filename);
                break;
            default:
                throw new Error('Invalid upload type');
        }

        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    }

    public getPropertyMulterUpload() {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                let uploadPath;
                if (file.fieldname === 'images') {
                    uploadPath = path.join(this.baseUploadDir, 'properties');
                } else if (file.fieldname === 'attachments') {
                    uploadPath = path.join(this.baseUploadDir, 'properties', 'attachments');
                } else {
                    return cb(new Error('Unexpected fieldname for property upload'), '');
                }
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
                logger.info(`Uploading file: ${file.originalname} as ${uniqueFileName}`);
                cb(null, uniqueFileName);
            }
        });

        const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
            if (this.allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                logger.warn(`Rejected file upload: ${file.originalname} (${file.mimetype})`);
                cb(new Error(`Invalid file type. Allowed types: ${this.allowedTypes.join(', ')}`));
            }
        };

        return multer({
            storage,
            fileFilter,
            limits: {
                fileSize: 10 * 1024 * 1024 // 10MB limit
            }
        }).fields([
            { name: 'images', maxCount: 10 },
            { name: 'attachments', maxCount: 10 }
        ]);
    }
}

export { UploadService };