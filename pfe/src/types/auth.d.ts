import { UserRole } from '../Constants/enums';

export interface AuthenticatedUser {
  _id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface User {
      _id: string;
      email: string;
      role: UserRole;
    }
  }
} 