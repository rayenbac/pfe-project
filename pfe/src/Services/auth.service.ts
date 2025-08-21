import { injectable } from 'inversify';
import { User } from '../Models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../Config/logger.config';
import { UserRole } from '../Constants/enums';
import "reflect-metadata";
import { EmailService } from './email.service';
import { diContainer } from '../DI/iversify.config';
import crypto from 'crypto';

@injectable()
class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_EXPIRES_IN = '24h';
  private readonly RESET_TOKEN_EXPIRES_IN = '1h';
  private emailService: EmailService;

  constructor() {
    this.initializeAdmin();
    this.emailService = diContainer.get<EmailService>(Symbol.for("EmailService"));
  }

  private async initializeAdmin() {
    try {
      const adminExists = await User.findOne({ role: UserRole.ADMIN });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          password: hashedPassword,
          phone: '1234567890',
          role: UserRole.ADMIN,
          isVerified: true
        });
        logger.info('Default admin user created');
      }
    } catch (error) {
      logger.error('Error creating default admin:', error);
    }
  }

  async register(userData: any) {
    try {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('User already exists');
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        role: userData.role || UserRole.USER
      });

      const token = this.generateToken(user);
      return { user, token };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if user is blocked
      if (user.isBlocked) {
        throw new Error(`Account blocked: ${user.blockReason || 'Contact admin for details'}`);
      }
      
      if (user.password === 'google-oauth') {
        throw new Error('This account was registered with Google. Please use Google login or reset your password.');
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }
      const token = this.generateToken(user);
      return { user, token };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async forgotPassword(email: string, frontendUrl: string) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found');
      }

      // Generate a reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Save the token to the user
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpiry;
      await user.save();

      // Send the reset email
      const emailSent = await this.emailService.sendPasswordResetEmail(email, resetToken, frontendUrl);
      
      if (!emailSent) {
        throw new Error('Failed to send reset email');
      }

      return { message: 'Reset password email sent' };
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new Error('Invalid or expired token');
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      // Send confirmation email
      await this.emailService.sendPasswordResetConfirmation(user.email);

      return { message: 'Password successfully reset' };
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      return { message: 'Password successfully changed' };
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  async findUserByEmail(email: string) {
    return await User.findOne({ email });
  }

  async registerGoogleUser(userData: any) {
    // Generate a random password (not used, but required by schema)
    const randomPassword = crypto.randomBytes(16).toString('hex');
    // Use a placeholder phone number or prompt user later
    const phone = userData.phone || '0000000000';

    const user = await User.create({
      ...userData,
      password: randomPassword,
      phone,
      isVerified: true,
      role: UserRole.USER,
    });
    return user;
  }

  public generateToken(user: any) {
    return jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }
}

export { AuthService };