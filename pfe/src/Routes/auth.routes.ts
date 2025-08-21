import express from 'express';
import { AuthController } from '../Controllers/auth.controller';
import { diContainer } from '../DI/iversify.config';
import { AuthTYPES } from '../DI/Auth/AuthTypes';
import { authenticateToken } from '../Middlewares/auth.middleware';
import passport from 'passport';

export const router = express.Router();

const controller = diContainer.get<AuthController>(AuthTYPES.authController);

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.post('/change-password', authenticateToken, controller.changePassword);
router.post('/google-login', controller.googleLogin);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Auth service is healthy' });
});

// Google OAuth2 login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth2 callback
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: 'http://localhost:4200/login', // or your login page
  session: false
}), (req: any, res) => {
  // Generate JWT and redirect to frontend with token
  const user = req.user;
  const token = controller['service'].generateToken(user);
  res.redirect(`http://localhost:4200?token=${token}`);
});

export default router;