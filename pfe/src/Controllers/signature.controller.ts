import { Request, Response } from 'express';
import { SignatureService } from '../Services/signature.service';
import { logger } from '../Config/logger.config';

export class SignatureController {
  private signatureService: SignatureService;

  constructor() {
    this.signatureService = new SignatureService();
  }

  // Save agent signature to profile
  saveAgentSignature = async (req: Request, res: Response): Promise<void> => {
    try {
      const agentId = req.user?._id;
      const { signatureImage, signatureFont, signatureText, signatureType } = req.body;

      if (!agentId) {
        res.status(401).json({ error: 'Agent not authenticated' });
        return;
      }

      if (!signatureType || !['drawn', 'typed', 'uploaded'].includes(signatureType)) {
        res.status(400).json({ error: 'Invalid signature type' });
        return;
      }

      // Validate signature data based on type
      if (signatureType === 'drawn' && !signatureImage) {
        res.status(400).json({ error: 'Signature image required for drawn signatures' });
        return;
      }

      if (signatureType === 'typed' && (!signatureText || !signatureFont)) {
        res.status(400).json({ error: 'Signature text and font required for typed signatures' });
        return;
      }

      if (signatureType === 'uploaded' && !signatureImage) {
        res.status(400).json({ error: 'Signature image required for uploaded signatures' });
        return;
      }

      const user = await this.signatureService.saveAgentSignature(agentId, {
        signatureImage,
        signatureFont,
        signatureText,
        signatureType
      });

      res.status(200).json({ 
        message: 'Signature saved successfully',
        signature: user?.digitalSignature 
      });
    } catch (error) {
      logger.error('Error saving agent signature:', error);
      res.status(500).json({ error: 'Failed to save signature' });
    }
  };

  // Get agent signature
  getAgentSignature = async (req: Request, res: Response): Promise<void> => {
    try {
      const agentId = req.params.agentId || req.user?._id;

      if (!agentId) {
        res.status(400).json({ error: 'Agent ID required' });
        return;
      }

      const signature = await this.signatureService.getAgentSignature(agentId);
      
      if (!signature) {
        res.status(404).json({ error: 'Signature not found' });
        return;
      }

      res.status(200).json({ signature });
    } catch (error) {
      logger.error('Error fetching agent signature:', error);
      res.status(500).json({ error: 'Failed to fetch signature' });
    }
  };

  // Sign contract as agent (auto-inject signature from profile)
  signContractAsAgent = async (req: Request, res: Response): Promise<void> => {
    try {
      const agentId = req.user?._id;
      const { contractId } = req.params;

      if (!agentId) {
        res.status(401).json({ error: 'Agent not authenticated' });
        return;
      }

      if (!contractId) {
        res.status(400).json({ error: 'Contract ID required' });
        return;
      }

      // Get client IP and user agent for audit trail
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const contract = await this.signatureService.signContractAsAgent(
        contractId, 
        agentId,
        { ipAddress, userAgent }
      );

      res.status(200).json({ 
        message: 'Contract signed successfully by agent',
        contract 
      });
    } catch (error) {
      logger.error('Error signing contract as agent:', error);
      if (error === 'Agent signature not found or inactive') {
        res.status(400).json({ error: 'Please upload your signature to your profile first' });
      } else {
        res.status(500).json({ error: 'Failed to sign contract' });
      }
    }
  };

  // Sign contract as client (capture signature during checkout)
  signContractAsClient = async (req: Request, res: Response): Promise<void> => {
    try {
      const clientId = req.user?._id;
      const { contractId } = req.params;
      const { signatureImage, signatureType } = req.body;

      if (!clientId) {
        res.status(401).json({ error: 'Client not authenticated' });
        return;
      }

      if (!contractId) {
        res.status(400).json({ error: 'Contract ID required' });
        return;
      }

      if (!signatureImage || !signatureType) {
        res.status(400).json({ error: 'Signature image and type are required' });
        return;
      }

      if (!['drawn', 'typed', 'uploaded'].includes(signatureType)) {
        res.status(400).json({ error: 'Invalid signature type' });
        return;
      }

      // Get client IP and user agent for audit trail
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const contract = await this.signatureService.signContractAsClient(
        contractId, 
        clientId,
        { signatureImage, signatureType },
        { ipAddress, userAgent }
      );

      res.status(200).json({ 
        message: 'Contract signed successfully by client',
        contract,
        isReadyForPayment: contract?.signedByAgent && contract?.signedByClient
      });
    } catch (error) {
      logger.error('Error signing contract as client:', error);
      res.status(500).json({ error: 'Failed to sign contract' });
    }
  };

  // Get contract for signing (with terms and agent signature status)
  getContractForSigning = async (req: Request, res: Response): Promise<void> => {
    try {
      const { contractId } = req.params;
      const userId = req.user?._id;

      if (!contractId) {
        res.status(400).json({ error: 'Contract ID required' });
        return;
      }

      const contract = await this.signatureService.getContractForSigning(contractId, userId!);
      
      if (!contract) {
        res.status(404).json({ error: 'Contract not found or access denied' });
        return;
      }

      res.status(200).json({ contract });
    } catch (error) {
      logger.error('Error fetching contract for signing:', error);
      res.status(500).json({ error: 'Failed to fetch contract' });
    }
  };

  // Verify contract signatures
  verifyContractSignatures = async (req: Request, res: Response): Promise<void> => {
    try {
      const { contractId } = req.params;

      if (!contractId) {
        res.status(400).json({ error: 'Contract ID required' });
        return;
      }

      const verification = await this.signatureService.verifyContractSignatures(contractId);

      res.status(200).json({ verification });
    } catch (error) {
      logger.error('Error verifying contract signatures:', error);
      res.status(500).json({ error: 'Failed to verify signatures' });
    }
  };

  // Check if contract is ready for payment
  checkContractPaymentReadiness = async (req: Request, res: Response): Promise<void> => {
    try {
      const { contractId } = req.params;

      if (!contractId) {
        res.status(400).json({ error: 'Contract ID required' });
        return;
      }

      const isReady = await this.signatureService.isContractReadyForPayment(contractId);

      res.status(200).json({ 
        isReadyForPayment: isReady,
        message: isReady ? 'Contract is ready for payment' : 'Contract requires both signatures before payment'
      });
    } catch (error) {
      logger.error('Error checking contract payment readiness:', error);
      res.status(500).json({ error: 'Failed to check payment readiness' });
    }
  };

  // Download signed contract document
  downloadSignedContract = async (req: Request, res: Response): Promise<void> => {
    try {
      const { contractId } = req.params;

      if (!contractId) {
        res.status(400).json({ error: 'Contract ID required' });
        return;
      }

      // This would typically serve the signed PDF file
      // Implementation depends on your file storage setup
      res.status(501).json({ error: 'Download feature not yet implemented' });
    } catch (error) {
      logger.error('Error downloading signed contract:', error);
      res.status(500).json({ error: 'Failed to download contract' });
    }
  };

  // Create a new contract
  createContract = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const contractData = req.body;
      const contract = await this.signatureService.createContract(contractData);

      res.status(201).json({
        message: 'Contract created successfully',
        contract
      });
    } catch (error) {
      logger.error('Error creating contract:', error);
      res.status(500).json({ error: 'Failed to create contract' });
    }
  };

  // Create contract from reservation with tenant signature
  createContractFromReservation = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const contractData = req.body;
      contractData.createdBy = req.user._id;

      const contractResult = await this.signatureService.createContractFromReservation(contractData);

      res.status(201).json(contractResult);
    } catch (error) {
      logger.error('Error creating contract from reservation:', error);
      res.status(500).json({ error: 'Failed to create contract from reservation' });
    }
  };

  // Get contract signing information
  getContractSigningInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { contractId } = req.params;

      if (!contractId) {
        res.status(400).json({ error: 'Contract ID required' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const contractInfo = await this.signatureService.getContractSigningInfo(contractId, req.user._id);

      res.status(200).json(contractInfo);
    } catch (error) {
      logger.error('Error getting contract signing info:', error);
      res.status(500).json({ error: 'Failed to get contract information' });
    }
  };
}
