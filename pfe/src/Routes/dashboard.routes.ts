import { Router } from 'express';
import { diContainer } from '../DI/iversify.config';
import { DashboardController } from '../Controllers/dashboard.controller';
import { authenticateToken, requireRole } from '../Middlewares/auth.middleware';
import { UserRole } from '../Constants/enums';

const router = Router();
const dashboardController = diContainer.get<DashboardController>('DashboardController');

// Admin dashboard routes
router.get('/statistics', 
    authenticateToken, 
    requireRole([UserRole.ADMIN]), 
    dashboardController.getAdminStatistics
);

router.get('/quick-stats', 
    authenticateToken, 
    requireRole([UserRole.ADMIN]), 
    dashboardController.getQuickStats
);

router.get('/property-analytics', 
    authenticateToken, 
    requireRole([UserRole.ADMIN]), 
    dashboardController.getPropertyAnalytics
);

export { router as dashboardRoutes };
