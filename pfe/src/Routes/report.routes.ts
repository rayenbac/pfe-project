import { Router } from 'express';
import { ReportController } from '../Controllers/report.controller';
import { diContainer } from '../DI/iversify.config';
import { ReportTYPES } from '../DI/Report/ReportTypes';
import { authenticateToken, requireRole } from '../Middlewares/auth.middleware';
import { UserRole } from '../Constants/enums';

const router = Router();
const reportController = diContainer.get<ReportController>(ReportTYPES.reportController);

// User routes (require authentication)
router.post('/', authenticateToken, reportController.createReport);
router.get('/my-reports', authenticateToken, reportController.getMyReports);

// Admin routes (require admin role)
router.get('/', authenticateToken, requireRole([UserRole.ADMIN]), reportController.getReports);
router.get('/statistics', authenticateToken, requireRole([UserRole.ADMIN]), reportController.getReportStatistics);
router.get('/search', authenticateToken, requireRole([UserRole.ADMIN]), reportController.searchReports);
router.get('/target/:targetType/:targetId', authenticateToken, requireRole([UserRole.ADMIN]), reportController.getTargetReports);
router.get('/:id', authenticateToken, requireRole([UserRole.ADMIN]), reportController.getReport);
router.put('/:id', authenticateToken, requireRole([UserRole.ADMIN]), reportController.updateReport);
router.delete('/:id', authenticateToken, requireRole([UserRole.ADMIN]), reportController.deleteReport);
router.put('/bulk/update', authenticateToken, requireRole([UserRole.ADMIN]), reportController.bulkUpdateReports);

export default router;
