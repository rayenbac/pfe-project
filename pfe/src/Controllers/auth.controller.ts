import { AuthService } from '../Services/auth.service';
import { injectable, inject } from 'inversify';
import { AuthTYPES } from "../DI/Auth/AuthTypes";
import { Request, Response } from 'express';
import { UserSchemaValidate } from '../Models/user';
import { logger } from '../Config/logger.config';
import { OAuth2Client } from 'google-auth-library';
import { AuthenticatedUser } from '../types/auth';

@injectable()
class AuthController {
    private service: AuthService;
    private GOOGLE_CLIENT_ID: string;

    constructor(@inject(AuthTYPES.authService) service: AuthService) {
        this.service = service;
        this.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '236472496562-2984u751kafhg9hp0cla3fmsb7dsnltq.apps.googleusercontent.com';
    }

    register = async (req: Request, res: Response) => {
        try {
            const { error, value } = UserSchemaValidate.validate(req.body);
            if (error) {
                return res.status(400).json({ message: error.message });
            }

            const result = await this.service.register(value);
            res.status(201).json(result);
        } catch (error: any) {
            logger.error('Registration error:', error);
            res.status(400).json({ message: error.message });
        }
    }

    login = async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const result = await this.service.login(email, password);
            res.status(200).json(result);
        } catch (error: any) {
            logger.error('Login error:', error);
            res.status(401).json({ message: error.message });
        }
    }

    forgotPassword = async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            const frontendUrl = req.body.frontendUrl || 'http://localhost:4200';
            const result = await this.service.forgotPassword(email, frontendUrl);
            res.status(200).json(result);
        } catch (error: any) {
            logger.error('Forgot password error:', error);
            res.status(400).json({ message: error.message });
        }
    }

    resetPassword = async (req: Request, res: Response) => {
        try {
            const { token, newPassword } = req.body;
            const result = await this.service.resetPassword(token, newPassword);
            res.status(200).json(result);
        } catch (error: any) {
            logger.error('Reset password error:', error);
            res.status(400).json({ message: error.message });
        }
    }

    changePassword = async (req: Request, res: Response) => {
        try {
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized: User not found' });
            }
    
            const userId = (req.user as AuthenticatedUser)._id;
            const { currentPassword, newPassword } = req.body;
            const result = await this.service.changePassword(userId, currentPassword, newPassword);
            res.status(200).json(result);
        } catch (error: any) {
            logger.error('Change password error:', error);
            res.status(400).json({ message: error.message });
        }
    };
    
    googleLogin = async (req: Request, res: Response) => {
        try {
            const { idToken } = req.body;
            const client = new OAuth2Client(this.GOOGLE_CLIENT_ID);
            const ticket = await client.verifyIdToken({
                idToken,
                audience: this.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                return res.status(400).json({ message: 'Invalid Google token' });
            }
            const { email, given_name, family_name, sub } = payload;
            if (!email) {
                return res.status(400).json({ message: 'Google account email not found.' });
            }
            let user = await this.service.findUserByEmail(email);
            if (!user) {
                user = await this.service.registerGoogleUser({
                    firstName: given_name,
                    lastName: family_name,
                    email,
                    googleId: sub,
                });
            }
            const token = this.service.generateToken(user);
            res.status(200).json({ user, token });
        } catch (error: any) {
            logger.error('Google login error:', error);
            res.status(400).json({ message: error.message });
        }
    }
}

export { AuthController };