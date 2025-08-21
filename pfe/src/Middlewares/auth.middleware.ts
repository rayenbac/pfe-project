import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../Config/logger.config';
import { UserRole } from '../Constants/enums';
import { AuthenticatedUser } from '../types/auth';
import { User } from '../Models/user';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      userId: string;
      email: string;
      role: string;
    };

    // Check if user is blocked
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        message: 'Account blocked', 
        reason: user.blockReason || 'Contact admin for details',
        blocked: true
      });
    }

    req.user = {
      _id: decoded.userId,
      email: decoded.email,
      role: decoded.role as UserRole
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Alias for backward compatibility
export const authorizeRoles = requireRole;