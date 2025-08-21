import { Request, Response } from 'express';
import { ContractService } from '../Services/contract.service';
import { logger } from '../Config/logger.config';
import { UserRole } from '../Constants/enums';

export class ContractController {
  private contractService: ContractService;

  constructor() {
    this.contractService = new ContractService();
  }

  // Get agent's contracts
  getAgentContracts = async (req: Request, res: Response): Promise<void> => {
    try {
      const agentId = req.params.agentId || req.user?._id;
      
      if (!agentId) {
        res.status(400).json({ error: 'Agent ID is required' });
        return;
      }

      const contracts = await this.contractService.getAgentContracts(agentId);
      res.status(200).json(contracts);
    } catch (error) {
      logger.error('Error fetching agent contracts:', error);
      res.status(500).json({ error: 'Failed to fetch contracts' });
    }
  };

  // Get client's contracts
  getClientContracts = async (req: Request, res: Response): Promise<void> => {
    try {
      const clientId = req.params.clientId || req.user?._id;
      
      if (!clientId) {
        res.status(400).json({ error: 'Client ID is required' });
        return;
      }

      const contracts = await this.contractService.getClientContracts(clientId);
      res.status(200).json(contracts);
    } catch (error) {
      logger.error('Error fetching client contracts:', error);
      res.status(500).json({ error: 'Failed to fetch contracts' });
    }
  };

  // Create new contract
  createContract = async (req: Request, res: Response): Promise<void> => {
    try {
      const contractData = req.body;
      contractData.agentId = req.user?._id;

      const contract = await this.contractService.createContract(contractData);
      res.status(201).json(contract);
    } catch (error) {
      logger.error('Error creating contract:', error);
      res.status(500).json({ error: 'Failed to create contract' });
    }
  };

  // Create contract from reservation with tenant signature
  createContractFromReservation = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        propertyId,
        tenantId,
        agentId,
        amount,
        currency,
        checkInDate,
        checkOutDate,
        guestCount,
        tenantSignature,
        metadata
      } = req.body;

      // Create contract with tenant signature already provided
      const contractData = {
        propertyId,
        tenantId,
        agentId,
        amount,
        currency,
        checkInDate,
        checkOutDate,
        guestCount,
        tenantSignature,
        metadata,
        status: 'pending_agent_signature', // Agent still needs to sign
        createdBy: req.user?._id
      };

      const contract = await this.contractService.createContractFromReservation(contractData);
      res.status(201).json(contract);
    } catch (error) {
      logger.error('Error creating contract from reservation:', error);
      res.status(500).json({ error: 'Failed to create contract from reservation' });
    }
  };

  // Update contract
  updateContract = async (req: Request, res: Response): Promise<void> => {
    try {
      const contractId = req.params.id;
      const updateData = req.body;

      const contract = await this.contractService.updateContract(contractId, updateData);
      
      if (!contract) {
        res.status(404).json({ error: 'Contract not found' });
        return;
      }

      res.status(200).json(contract);
    } catch (error) {
      logger.error('Error updating contract:', error);
      res.status(500).json({ error: 'Failed to update contract' });
    }
  };

  // Sign contract
  signContract = async (req: Request, res: Response): Promise<void> => {
    try {
      const contractId = req.params.id;
      const { signatureType } = req.body; // 'agent' or 'client'
      const userId = req.user?._id;

      const contract = await this.contractService.signContract(contractId, userId!, signatureType);
      
      if (!contract) {
        res.status(404).json({ error: 'Contract not found' });
        return;
      }

      res.status(200).json(contract);
    } catch (error) {
      logger.error('Error signing contract:', error);
      res.status(500).json({ error: 'Failed to sign contract' });
    }
  };

  // Generate contract PDF
  generateContractPDF = async (req: Request, res: Response): Promise<void> => {
    try {
      const contractId = req.params.id;

      const pdfBuffer = await this.contractService.generateContractPDF(contractId);
      
      if (!pdfBuffer) {
        res.status(404).json({ error: 'Contract not found' });
        return;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=contract-${contractId}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      logger.error('Error generating contract PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  };

  // Download contract PDF (alias for generateContractPDF)
  downloadContractPDF = async (req: Request, res: Response): Promise<void> => {
    try {
      const contractId = req.params.contractId || req.params.id;

      const pdfBuffer = await this.contractService.generateContractPDF(contractId);
      
      if (!pdfBuffer) {
        res.status(404).json({ 
          success: false,
          error: 'Contract not found' 
        });
        return;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=contract-${contractId}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      logger.error('Error downloading contract PDF:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to download PDF' 
      });
    }
  };

  // Get contract by ID
  getContract = async (req: Request, res: Response): Promise<void> => {
    try {
      const contractId = req.params.id;

      const contract = await this.contractService.getContractById(contractId);
      
      if (!contract) {
        res.status(404).json({ error: 'Contract not found' });
        return;
      }

      res.status(200).json(contract);
    } catch (error) {
      logger.error('Error fetching contract:', error);
      res.status(500).json({ error: 'Failed to fetch contract' });
    }
  };

  // Delete contract
  deleteContract = async (req: Request, res: Response): Promise<void> => {
    try {
      const contractId = req.params.id;

      const result = await this.contractService.deleteContract(contractId);
      
      if (!result) {
        res.status(404).json({ error: 'Contract not found' });
        return;
      }

      res.status(200).json({ message: 'Contract deleted successfully' });
    } catch (error) {
      logger.error('Error deleting contract:', error);
      res.status(500).json({ error: 'Failed to delete contract' });
    }
  };

  // Get contract statistics for agent
  getContractStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const agentId = req.params.agentId || req.user?._id;
      
      if (!agentId) {
        res.status(400).json({ error: 'Agent ID is required' });
        return;
      }

      const stats = await this.contractService.getContractStats(agentId);
      res.status(200).json(stats);
    } catch (error) {
      logger.error('Error fetching contract stats:', error);
      res.status(500).json({ error: 'Failed to fetch contract statistics' });
    }
  };

  // ============ ADMIN METHODS ============

  // Admin: Get all contracts with filtering and pagination
  getAllContractsAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({ 
          success: false,
          error: 'Access denied. Admin privileges required.' 
        });
        return;
      }

      const {
        status,
        type,
        reservationType,
        page = 1,
        limit = 20
      } = req.query;

      const filters: any = {};
      if (status) filters.status = status;
      if (type) filters.type = type;
      if (reservationType) filters.reservationType = reservationType;

      const result = await this.contractService.getAllContracts({
        ...filters,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'All contracts retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching all contracts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch contracts'
      });
    }
  };

  // Admin: Revoke/cancel a contract
  revokeContract = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({ 
          success: false,
          error: 'Access denied. Admin privileges required.' 
        });
        return;
      }

      const { contractId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({ 
          success: false,
          error: 'Cancellation reason is required' 
        });
        return;
      }

      const contract = await this.contractService.adminRevokeContract(contractId, reason);

      if (!contract) {
        res.status(404).json({ 
          success: false,
          error: 'Contract not found' 
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: contract,
        message: 'Contract revoked successfully'
      });
    } catch (error) {
      logger.error('Error revoking contract:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to revoke contract'
      });
    }
  };

  // Admin: Get contract analytics and statistics  
  getAdminContractStats = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({ 
          success: false,
          error: 'Access denied. Admin privileges required.' 
        });
        return;
      }

      const { Contract } = require('../Models/contract.model');
      
      const stats = await Contract.aggregate([
        {
          $group: {
            _id: null,
            totalContracts: { $sum: 1 },
            activeContracts: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            pendingContracts: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            completedContracts: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            cancelledContracts: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            onlineReservations: { $sum: { $cond: [{ $eq: ['$reservationType', 'online'] }, 1, 0] } },
            offlineReservations: { $sum: { $cond: [{ $eq: ['$reservationType', 'offline'] }, 1, 0] } },
            totalRevenue: { $sum: '$amount' },
            totalCommission: { $sum: '$commission' }
          }
        }
      ]);

      const contractsByMonth = await Contract.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);

      res.status(200).json({
        success: true,
        data: {
          overview: stats[0] || {},
          monthly: contractsByMonth
        },
        message: 'Contract statistics retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching admin contract stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch contract statistics'
      });
    }
  };

  // Admin: Check and handle offline payment deadlines
  checkOfflinePaymentDeadlines = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        res.status(403).json({ 
          success: false,
          error: 'Access denied. Admin privileges required.' 
        });
        return;
      }

      await this.contractService.checkOfflinePaymentDeadlines();

      res.status(200).json({
        success: true,
        message: 'Offline payment deadlines checked and processed'
      });
    } catch (error) {
      logger.error('Error checking offline payment deadlines:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check offline payment deadlines'
      });
    }
  };
}
