import { IUser } from '../Interfaces/user/IUser';
import { User } from '../Models/user';
import { IContract } from '../Models/contract.model';
import { Contract } from '../Models/contract.model';
import { Types } from 'mongoose';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { logger } from '../Config/logger.config';

export class SignatureService {

  // Save agent signature to user profile
  async saveAgentSignature(
    agentId: string, 
    signatureData: {
      signatureImage?: string;
      signatureFont?: string;
      signatureText?: string;
      signatureType: 'drawn' | 'typed' | 'uploaded';
    }
  ): Promise<IUser | null> {
    try {
      const user = await User.findById(agentId);
      if (!user) {
        throw new Error('Agent not found');
      }

      // Update digital signature
      user.digitalSignature = {
        signatureImage: signatureData.signatureImage,
        signatureFont: signatureData.signatureFont,
        signatureText: signatureData.signatureText,
        signatureType: signatureData.signatureType,
        uploadedAt: new Date(),
        isActive: true
      };

      await user.save();
      return user;
    } catch (error) {
      logger.error('Error saving agent signature:', error);
      throw error;
    }
  }

  // Get agent signature
  async getAgentSignature(agentId: string): Promise<any> {
    try {
      const user = await User.findById(agentId).select('digitalSignature');
      return user?.digitalSignature || null;
    } catch (error) {
      logger.error('Error fetching agent signature:', error);
      throw error;
    }
  }

  // Sign contract with agent signature (auto-inject from profile)
  async signContractAsAgent(
    contractId: string, 
    agentId: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<IContract | null> {
    try {
      const contract = await Contract.findById(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      if (contract.agentId.toString() !== agentId) {
        throw new Error('Agent not authorized to sign this contract');
      }

      // Get agent signature from profile
      const agentSignature = await this.getAgentSignature(agentId);
      if (!agentSignature || !agentSignature.isActive) {
        throw new Error('Agent signature not found or inactive');
      }

      // Update contract with agent signature
      contract.signedByAgent = true;
      contract.agentSignatureDate = new Date();
      contract.agentSignature = {
        signatureImage: agentSignature.signatureImage,
        signatureType: agentSignature.signatureType,
        signedAt: new Date(),
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent
      };

      await contract.save();
      return contract;
    } catch (error) {
      logger.error('Error signing contract as agent:', error);
      throw error;
    }
  }

  // Sign contract with client signature (captured during checkout)
  async signContractAsClient(
    contractId: string, 
    clientId: string,
    signatureData: {
      signatureImage: string;
      signatureType: 'drawn' | 'typed' | 'uploaded';
    },
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<IContract | null> {
    try {
      const contract = await Contract.findById(contractId);
      if (!contract) {
        throw new Error('Contract not found');
      }

      if (contract.clientId.toString() !== clientId) {
        throw new Error('Client not authorized to sign this contract');
      }

      // Update contract with client signature
      contract.signedByClient = true;
      contract.clientSignatureDate = new Date();
      contract.clientSignature = {
        signatureImage: signatureData.signatureImage,
        signatureType: signatureData.signatureType,
        signedAt: new Date(),
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent
      };

      // Check if both parties have signed
      if (contract.signedByAgent && contract.signedByClient) {
        contract.status = 'active';
        // Generate signed PDF document
        const signedDocumentUrl = await this.generateSignedDocument(contract);
        contract.signedDocumentUrl = signedDocumentUrl;
      }

      await contract.save();
      return contract;
    } catch (error) {
      logger.error('Error signing contract as client:', error);
      throw error;
    }
  }

  // Generate PDF document with signatures
  async generateSignedDocument(contract: IContract): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Populate contract data
        const populatedContract = await Contract.findById(contract._id)
          .populate('agentId', 'firstName lastName email')
          .populate('clientId', 'firstName lastName email')
          .populate('propertyId', 'title address pricing')
          .exec();

        if (!populatedContract) {
          throw new Error('Contract not found');
        }

        const doc = new PDFDocument({ margin: 50 });
        const fileName = `contract-${contract._id}-signed.pdf`;
        const filePath = path.join(process.cwd(), 'uploads', 'contracts', fileName);

        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Document header
        doc.fontSize(20).text('SIGNED REAL ESTATE CONTRACT', { align: 'center' });
        doc.moveDown(2);

        // Contract information
        doc.fontSize(14).text(`Contract ID: ${contract._id}`, { align: 'left' });
        doc.text(`Contract Type: ${contract.type.toUpperCase()}`);
        doc.text(`Status: ${contract.status.toUpperCase()}`);
        doc.moveDown();

        // Property information
        doc.fontSize(16).text('PROPERTY INFORMATION:', { underline: true });
        doc.fontSize(12);
        doc.text(`Title: ${(populatedContract.propertyId as any)?.title || 'N/A'}`);
        doc.text(`Address: ${(populatedContract.propertyId as any)?.address || 'N/A'}`);
        doc.moveDown();

        // Parties information
        doc.fontSize(16).text('PARTIES:', { underline: true });
        doc.fontSize(12);
        
        const agent = populatedContract.agentId as any;
        const client = populatedContract.clientId as any;
        
        doc.text(`Agent: ${agent?.firstName || ''} ${agent?.lastName || ''} (${agent?.email || ''})`);
        doc.text(`Client: ${client?.firstName || ''} ${client?.lastName || ''} (${client?.email || ''})`);
        doc.moveDown();

        // Contract details
        doc.fontSize(16).text('CONTRACT DETAILS:', { underline: true });
        doc.fontSize(12);
        doc.text(`Title: ${contract.title}`);
        doc.text(`Description: ${contract.description}`, { width: 500 });
        doc.text(`Amount: ${contract.currency} ${contract.amount}`);
        doc.text(`Commission Rate: ${contract.commissionRate}%`);
        doc.text(`Commission: ${contract.currency} ${contract.commission}`);
        doc.text(`Start Date: ${contract.startDate.toDateString()}`);
        if (contract.endDate) {
          doc.text(`End Date: ${contract.endDate.toDateString()}`);
        }
        doc.moveDown();

        // Terms and conditions
        doc.fontSize(16).text('TERMS AND CONDITIONS:', { underline: true });
        doc.fontSize(12);
        doc.text(contract.terms, { width: 500 });
        doc.moveDown(2);

        // Signatures section
        doc.fontSize(16).text('DIGITAL SIGNATURES:', { underline: true });
        doc.moveDown();

        // Agent signature
        if (contract.agentSignature) {
          doc.fontSize(14).text('Agent Signature:');
          doc.fontSize(10);
          doc.text(`Signed by: ${agent?.firstName || ''} ${agent?.lastName || ''}`);
          doc.text(`Date: ${contract.agentSignature.signedAt?.toLocaleString()}`);
          doc.text(`Signature Type: ${contract.agentSignature.signatureType}`);
          doc.text(`IP Address: ${contract.agentSignature.ipAddress || 'N/A'}`);

          // Add signature image if available
          if (contract.agentSignature.signatureImage) {
            try {
              // Convert base64 to buffer
              const base64Data = contract.agentSignature.signatureImage.replace(/^data:image\/\w+;base64,/, '');
              const signatureBuffer = Buffer.from(base64Data, 'base64');
              doc.image(signatureBuffer, { width: 150, height: 75 });
            } catch (imgError) {
              doc.text('Signature image could not be embedded');
            }
          }
          doc.moveDown();
        }

        // Client signature
        if (contract.clientSignature) {
          doc.fontSize(14).text('Client Signature:');
          doc.fontSize(10);
          doc.text(`Signed by: ${client?.firstName || ''} ${client?.lastName || ''}`);
          doc.text(`Date: ${contract.clientSignature.signedAt?.toLocaleString()}`);
          doc.text(`Signature Type: ${contract.clientSignature.signatureType}`);
          doc.text(`IP Address: ${contract.clientSignature.ipAddress || 'N/A'}`);

          // Add signature image if available
          if (contract.clientSignature.signatureImage) {
            try {
              // Convert base64 to buffer
              const base64Data = contract.clientSignature.signatureImage.replace(/^data:image\/\w+;base64,/, '');
              const signatureBuffer = Buffer.from(base64Data, 'base64');
              doc.image(signatureBuffer, { width: 150, height: 75 });
            } catch (imgError) {
              doc.text('Signature image could not be embedded');
            }
          }
        }

        // Document footer
        doc.moveDown(2);
        doc.fontSize(10);
        doc.text('This is a digitally signed document generated on ' + new Date().toLocaleString(), 
                { align: 'center' });
        doc.text('Both parties have provided electronic signatures in accordance with applicable e-signature laws.',
                { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          const relativePath = `/uploads/contracts/${fileName}`;
          resolve(relativePath);
        });

        stream.on('error', (error) => {
          logger.error('Error creating signed document:', error);
          reject(error);
        });

      } catch (error) {
        logger.error('Error generating signed document:', error);
        reject(error);
      }
    });
  }

  // Verify contract signatures
  async verifyContractSignatures(contractId: string): Promise<{
    isValid: boolean;
    agentSignatureValid: boolean;
    clientSignatureValid: boolean;
    errors: string[];
  }> {
    try {
      const contract = await Contract.findById(contractId);
      if (!contract) {
        return {
          isValid: false,
          agentSignatureValid: false,
          clientSignatureValid: false,
          errors: ['Contract not found']
        };
      }

      const errors: string[] = [];
      let agentSignatureValid = false;
      let clientSignatureValid = false;

      // Verify agent signature
      if (contract.signedByAgent && contract.agentSignature) {
        const agentSignature = await this.getAgentSignature(contract.agentId.toString());
        if (agentSignature && 
            agentSignature.signatureImage === contract.agentSignature.signatureImage) {
          agentSignatureValid = true;
        } else {
          errors.push('Agent signature verification failed');
        }
      } else {
        errors.push('Agent signature missing');
      }

      // Verify client signature
      if (contract.signedByClient && contract.clientSignature) {
        // Client signature is verified by presence and timestamp
        clientSignatureValid = true;
      } else {
        errors.push('Client signature missing');
      }

      return {
        isValid: agentSignatureValid && clientSignatureValid && errors.length === 0,
        agentSignatureValid,
        clientSignatureValid,
        errors
      };

    } catch (error) {
      logger.error('Error verifying contract signatures:', error);
      return {
        isValid: false,
        agentSignatureValid: false,
        clientSignatureValid: false,
        errors: ['Verification error: ' + error]
      };
    }
  }

  // Check if contract is ready for payment (both signatures present)
  async isContractReadyForPayment(contractId: string): Promise<boolean> {
    try {
      const contract = await Contract.findById(contractId);
      return !!(contract && 
                contract.signedByAgent && 
                contract.signedByClient && 
                contract.agentSignature && 
                contract.clientSignature);
    } catch (error) {
      logger.error('Error checking contract payment readiness:', error);
      return false;
    }
  }

  // Get contract for signing (with populated data)
  async getContractForSigning(contractId: string, userId: string): Promise<IContract | null> {
    try {
      const contract = await Contract.findById(contractId)
        .populate('agentId', 'firstName lastName email digitalSignature')
        .populate('clientId', 'firstName lastName email')
        .populate('propertyId', 'title address pricing images')
        .exec();

      if (!contract) {
        return null;
      }

      // Check if user has access to this contract
      if (contract.agentId.toString() !== userId && contract.clientId.toString() !== userId) {
        return null;
      }

      return contract;
    } catch (error) {
      logger.error('Error fetching contract for signing:', error);
      throw error;
    }
  }

  // Create a new contract
  async createContract(contractData: any): Promise<IContract> {
    try {
      const contract = new Contract(contractData);
      await contract.save();
      
      logger.info('Contract created successfully:', contract._id);
      return contract;
    } catch (error) {
      logger.error('Error creating contract:', error);
      throw error;
    }
  }

  // Create contract from reservation with tenant signature
  async createContractFromReservation(contractData: any): Promise<any> {
    try {
      console.log('Creating contract with data:', contractData); // Debug log
      
      // Validate required fields
      if (!contractData.propertyId) {
        throw new Error('Property ID is required');
      }
      if (!contractData.clientId) {
        throw new Error('Client ID is required');
      }
      if (!contractData.agentId) {
        throw new Error('Agent ID is required');
      }
      if (!contractData.amount) {
        throw new Error('Amount is required');
      }
      if (!contractData.checkInDate || !contractData.checkOutDate) {
        throw new Error('Check-in and check-out dates are required');
      }

      // Parse dates properly
      const startDate = new Date(contractData.checkInDate);
      const endDate = new Date(contractData.checkOutDate);
      
      // Validate dates
      if (isNaN(startDate.getTime())) {
        throw new Error('Invalid check-in date');
      }
      if (isNaN(endDate.getTime())) {
        throw new Error('Invalid check-out date');
      }

      // Calculate commission (assume 5% rate for property rental)
      const commissionRate = 0.05;
      const commission = contractData.amount * commissionRate;
      
      // Create the contract with all required fields
      const contract = new Contract({
        agentId: contractData.agentId,
        clientId: contractData.clientId, // Use clientId directly
        propertyId: contractData.propertyId,
        type: 'rental', // Assuming this is a rental contract
        title: `Rental Agreement - ${contractData.metadata?.propertyTitle || 'Property'}`,
        description: `Rental agreement for property from ${contractData.checkInDate} to ${contractData.checkOutDate} for ${contractData.guestCount} guests.`,
        terms: `This is a rental agreement for the specified property. Check-in: ${contractData.checkInDate}, Check-out: ${contractData.checkOutDate}, Guests: ${contractData.guestCount}. Total amount: ${contractData.currency} ${contractData.amount}.`,
        amount: contractData.amount,
        currency: contractData.currency || 'USD',
        commissionRate: commissionRate,
        commission: commission,
        startDate: startDate,
        endDate: endDate,
        status: 'pending', // Use valid enum value
        signedByAgent: false, // Agent still needs to sign
        signedByClient: !!contractData.tenantSignature, // Client has signed if signature data is provided
        clientSignatureDate: contractData.tenantSignature ? new Date() : undefined,
        clientSignature: contractData.tenantSignature ? {
          signatureImage: contractData.tenantSignature.signatureImage,
          signatureType: contractData.tenantSignature.signatureType,
          signedAt: new Date(),
          ipAddress: contractData.tenantSignature.ipAddress,
          userAgent: contractData.tenantSignature.userAgent
        } : undefined,
        metadata: {
          ...contractData.metadata,
          checkInDate: contractData.checkInDate,
          checkOutDate: contractData.checkOutDate,
          guestCount: contractData.guestCount,
          createdFromReservation: true
        }
      });
      
      await contract.save();
      
      // Populate the created contract
      const populatedContract = await Contract.findById(contract._id)
        .populate('clientId', 'firstName lastName email phone')
        .populate('agentId', 'firstName lastName email phone')
        .populate('propertyId', 'title address pricing images')
        .exec();

      logger.info('Contract created from reservation successfully:', contract._id);

      // Return in the format expected by the contract-checkout component (ContractSigningData)
      return {
        contract: populatedContract,
        isAgent: false, // User is the client in this flow
        isClient: true,
        requiresSignature: true,
        agentSigned: false, // Agent hasn't signed yet
        clientSigned: !!contractData.tenantSignature, // Client has signed if signature data provided
        canProceedToPayment: false // Can't proceed until agent signs
      };
    } catch (error) {
      logger.error('Error creating contract from reservation:', error);
      throw error;
    }
  }

  // Get contract signing information for frontend
  async getContractSigningInfo(contractId: string, userId: string): Promise<any> {
    try {
      const contract = await Contract.findById(contractId);

      if (!contract) {
        throw new Error('Contract not found');
      }

      // Check if user is agent or client
      const isAgent = contract.agentId?.toString() === userId;
      const isClient = contract.clientId?.toString() === userId;

      if (!isAgent && !isClient) {
        throw new Error('User not authorized to view this contract');
      }

      const agentSigned = !!(contract.agentSignature && contract.agentSignature.signedAt);
      const clientSigned = !!(contract.clientSignature && contract.clientSignature.signedAt);
      const canProceedToPayment = agentSigned && clientSigned;

      return {
        contract: {
          _id: contract._id,
          propertyTitle: contract.title || 'Property Rental',
          checkInDate: contract.startDate,
          checkOutDate: contract.endDate,
          totalAmount: contract.amount,
          agentName: 'Agent', // We'll populate this from agent lookup if needed
          clientName: 'Client' // We'll populate this from client lookup if needed
        },
        isAgent,
        isClient,
        requiresSignature: true,
        agentSigned,
        clientSigned,
        canProceedToPayment
      };
    } catch (error) {
      logger.error('Error getting contract signing info:', error);
      throw error;
    }
  }
}
