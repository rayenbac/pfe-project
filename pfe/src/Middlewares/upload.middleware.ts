import { Request, Response, NextFunction } from 'express';
import { UploadService } from '../Services/upload.service';
import { diContainer } from '../DI/iversify.config';

const uploadService = diContainer.get<UploadService>(Symbol.for("UploadService"));

export const uploadProfileImage = uploadService.getMulterUpload('profile').single('profileImage');
export const uploadVerificationImage = uploadService.getMulterUpload('verification').single('verificationImage');
export const uploadPropertyMediaAndAttachments = uploadService.getPropertyMulterUpload();

export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof Error) {
        return res.status(400).json({ message: err.message });
    }
    next();
};