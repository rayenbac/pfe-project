import { Contract, IContract, IRentalContractDetails } from '../Models/contract.model';
import { Types } from 'mongoose';
import { PDFService } from './pdf.service';
import { User } from '../Models/user';
import { Property } from '../Models/property';
import { Booking } from '../Models/booking';
import { IBooking } from '../Interfaces/booking/IBooking';
import { EmailService } from './email.service';

export class ContractService {
  private pdfService: PDFService;
  private emailService: EmailService;

  constructor() {
    this.pdfService = new PDFService();
    this.emailService = new EmailService();
  }

  // Create contract from booking (supports both online and offline reservations)
  async createContractFromBooking(booking: IBooking): Promise<IContract> {
    try {
      const [agent, tenant, property] = await Promise.all([
        User.findById(booking.owner),
        User.findById(booking.tenant),
        Property.findById(booking.property)
      ]);

      if (!agent || !tenant || !property) {
        throw new Error('Missing required data: agent, tenant, or property not found');
      }

      // Calculate rental duration in days
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Prepare rental contract details
      const rentalDetails: IRentalContractDetails = {
        propertyAddress: `${property.address.street}, ${property.address.city}, ${property.address.country}`,
        propertyType: property.type,
        propertyDescription: property.description,
        numberOfRooms: property.bedrooms,
        furnished: property.furnishingStatus === 'furnished',
        propertySize: property.size.total,
        includedEquipment: property.amenities?.map(a => a.name) || [],
        
        ownerDetails: {
          fullName: `${agent.firstName} ${agent.lastName}`,
          cinPassportNumber: '', // Will be filled by agent
          address: agent.address || '',
          phone: agent.phone,
          email: agent.email
        },
        
        tenantDetails: {
          fullName: `${tenant.firstName} ${tenant.lastName}`,
          cinPassportNumber: booking.contactInfo.cinPassportNumber || '',
          address: booking.contactInfo.address || tenant.address || '',
          phone: booking.contactInfo.phone,
          email: booking.contactInfo.email
        },
        
        rentAmount: booking.totalAmount,
        paymentFrequency: rentalDays <= 7 ? 'weekly' : rentalDays <= 35 ? 'monthly' : 'quarterly',
        paymentMethod: booking.reservationType === 'online' ? 'online' : 'offline',
        securityDeposit: Math.floor(booking.totalAmount * 0.2), // 20% of total amount
        securityDepositRefundConditions: 'Deposit will be refunded within 30 days after checkout, subject to property inspection.',
        
        renewalConditions: 'by_agreement',
        terminationNotice: 30,
        earlyTerminationConditions: 'Tenant may terminate early with forfeit of security deposit.',
        
        tenantObligations: [
          'Pay rent on time',
          'Maintain property in good condition',
          'Respect neighbors and building rules',
          'Allow property inspections with 24h notice',
          'Report any damages immediately'
        ],
        
        ownerObligations: [
          'Provide habitable and clean property',
          'Handle necessary maintenance and repairs',
          'Respect tenant privacy rights',
          'Provide all amenities as listed',
          'Ensure legal ownership of the property'
        ],
        
        authorizedUse: 'Residential use only',
        restrictions: [
          'No illegal activities',
          'No structural modifications without permission',
          'Maximum guest count as specified in booking'
        ],
        petsAllowed: false,
        smokingAllowed: false,
        sublettingAllowed: false,
        
        finalInspectionRequired: true,
        applicableLaw: 'Tunisian Law',
        jurisdiction: 'Tunisia',
        disputeResolution: 'court'
      };

      // Create the contract
      const contract = new Contract({
        agentId: booking.owner,
        clientId: booking.tenant,
        propertyId: booking.property,
        type: 'rental',
        title: `Rental Contract - ${property.title}`,
        description: `Short-term rental agreement for ${property.title} from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
        terms: this.generateStandardTerms(rentalDetails),
        amount: booking.totalAmount,
        currency: booking.currency,
        commissionRate: 5, // 5% commission rate
        commission: booking.totalAmount * 0.05,
        startDate: startDate,
        endDate: endDate,
        status: 'pending',
        paymentStatus: booking.paymentStatus,
        reservationType: booking.reservationType,
        rentalDetails: rentalDetails,
        signedByAgent: false,
        signedByClient: false
      });

      await contract.save();

      // Generate PDF contract
      const pdfFilename = await this.pdfService.generateRentalContract(contract);
      contract.signedDocumentUrl = `/uploads/contracts/${pdfFilename}`;
      await contract.save();

      // Update booking with contract ID
      await Booking.findByIdAndUpdate(booking._id, {
        'metadata.contractId': contract._id.toString(),
        'metadata.contractGenerated': true
      });

      // Send email to both parties
      await this.sendContractEmail(contract, agent, tenant, pdfFilename);

      return contract;
    } catch (error) {
      throw new Error(`Failed to create contract from booking: ${error}`);
    }
  }

  // Generate standard rental terms
  private generateStandardTerms(rentalDetails: IRentalContractDetails): string {
    return `
STANDARD RENTAL TERMS AND CONDITIONS

1. RENTAL PERIOD
The rental period is from ${rentalDetails.tenantDetails.fullName} check-in to check-out as specified in this agreement.

2. PAYMENT TERMS
Rent is payable ${rentalDetails.paymentFrequency} in advance via ${rentalDetails.paymentMethod}.
Security deposit of ${rentalDetails.securityDeposit} is required and will be refunded subject to property condition.

3. PROPERTY USE
The property is to be used for ${rentalDetails.authorizedUse} only.
Maximum occupancy and guest policies must be respected.

4. TENANT RESPONSIBILITIES
- Maintain the property in clean and good condition
- Pay all utilities if not included in rent
- Report any damages or maintenance issues immediately
- Comply with building rules and local regulations
- Allow access for necessary inspections and repairs

5. OWNER RESPONSIBILITIES
- Provide a clean, safe, and habitable property
- Maintain all essential systems (plumbing, electricity, heating)
- Respect tenant's right to quiet enjoyment
- Handle repairs not caused by tenant negligence

6. TERMINATION
Either party may terminate this agreement with ${rentalDetails.terminationNotice} days written notice.
Early termination may result in penalties as specified in the agreement.

7. APPLICABLE LAW
This agreement is governed by ${rentalDetails.applicableLaw} and disputes will be resolved through ${rentalDetails.disputeResolution}.
    `.trim();
  }

  // Send contract email to both parties
  private async sendContractEmail(contract: IContract, agent: any, tenant: any, pdfFilename: string): Promise<void> {
    try {
      const pdfPath = await this.pdfService.getContractPDFPath(pdfFilename);
      
      // Email to tenant
      await this.emailService.sendContractEmail({
        to: tenant.email,
        subject: 'Rental Contract - Please Review and Sign',
        recipientName: `${tenant.firstName} ${tenant.lastName}`,
        contractId: contract._id.toString(),
        propertyTitle: contract.rentalDetails?.propertyAddress || 'Property',
        startDate: contract.startDate.toLocaleDateString(),
        endDate: contract.endDate?.toLocaleDateString() || '',
        amount: `${contract.amount} ${contract.currency}`,
        isOfflineReservation: contract.reservationType === 'offline',
        attachmentPath: pdfPath
      });

      // Email to agent
      await this.emailService.sendContractEmail({
        to: agent.email,
        subject: 'New Rental Contract Generated',
        recipientName: `${agent.firstName} ${agent.lastName}`,
        contractId: contract._id.toString(),
        propertyTitle: contract.rentalDetails?.propertyAddress || 'Property',
        startDate: contract.startDate.toLocaleDateString(),
        endDate: contract.endDate?.toLocaleDateString() || '',
        amount: `${contract.amount} ${contract.currency}`,
        isOfflineReservation: contract.reservationType === 'offline',
        attachmentPath: pdfPath
      });

      // Mark as sent
      await Booking.findOneAndUpdate(
        { 'metadata.contractId': contract._id.toString() },
        { 'metadata.contractSentToEmail': true }
      );
    } catch (error) {
      console.error('Error sending contract emails:', error);
      // Don't throw error here as contract creation was successful
    }
  }

  // Check offline payment deadlines and revoke expired reservations
  async checkOfflinePaymentDeadlines(): Promise<void> {
    try {
      const now = new Date();
      
      // Find bookings with offline reservations that have passed payment deadline
      const expiredBookings = await Booking.find({
        reservationType: 'offline',
        paymentStatus: 'pending',
        paymentDeadline: { $lt: now },
        status: { $nin: ['cancelled', 'completed'] }
      });

      for (const booking of expiredBookings) {
        // Cancel the booking
        await Booking.findByIdAndUpdate(booking._id, {
          status: 'cancelled',
          paymentStatus: 'failed'
        });

        // Cancel associated contract if exists
        if (booking.metadata?.contractId) {
          await Contract.findByIdAndUpdate(booking.metadata.contractId, {
            status: 'cancelled'
          });
        }

        // Send notification emails (implement as needed)
        console.log(`Cancelled expired offline booking: ${booking._id}`);
      }
    } catch (error) {
      console.error('Error checking offline payment deadlines:', error);
    }
  }

  // Admin method to get all contracts
  async getAllContracts(filters?: {
    status?: string;
    type?: string;
    reservationType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ contracts: IContract[], total: number, page: number, totalPages: number }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (filters?.status) query.status = filters.status;
      if (filters?.type) query.type = filters.type;
      if (filters?.reservationType) query.reservationType = filters.reservationType;

      const [contracts, total] = await Promise.all([
        Contract.find(query)
          .populate('agentId', 'firstName lastName email phone')
          .populate('clientId', 'firstName lastName email phone')
          .populate('propertyId', 'title address pricing')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        Contract.countDocuments(query)
      ]);

      return {
        contracts,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to fetch contracts: ${error}`);
    }
  }

  // Admin method to revoke a contract
  async adminRevokeContract(contractId: string, reason: string): Promise<IContract | null> {
    try {
      const contract = await Contract.findByIdAndUpdate(
        contractId,
        {
          status: 'cancelled',
          metadata: { 
            cancelledByAdmin: true, 
            cancellationReason: reason,
            cancelledAt: new Date()
          }
        },
        { new: true }
      );

      if (contract) {
        // Also cancel associated booking if exists
        await Booking.updateMany(
          { 'metadata.contractId': contractId },
          { status: 'cancelled' }
        );
      }

      return contract;
    } catch (error) {
      throw new Error(`Failed to revoke contract: ${error}`);
    }
  }
  async getAgentContracts(agentId: string): Promise<IContract[]> {
    try {
      const contracts = await Contract.find({ agentId: new Types.ObjectId(agentId) })
        .populate('clientId', 'firstName lastName email phone')
        .populate('propertyId', 'title address pricing images')
        .sort({ createdAt: -1 })
        .exec();
      
      return contracts;
    } catch (error) {
      throw new Error(`Failed to fetch agent contracts: ${error}`);
    }
  }

  // Get client's contracts
  async getClientContracts(clientId: string): Promise<IContract[]> {
    try {
      const contracts = await Contract.find({ clientId: new Types.ObjectId(clientId) })
        .populate('agentId', 'firstName lastName email phone')
        .populate('propertyId', 'title address pricing images')
        .sort({ createdAt: -1 })
        .exec();
      
      return contracts;
    } catch (error) {
      throw new Error(`Failed to fetch client contracts: ${error}`);
    }
  }

  // Create new contract
  async createContract(contractData: Partial<IContract>): Promise<IContract> {
    try {
      const contract = new Contract(contractData);
      await contract.save();
      
      // Populate the created contract
      const populatedContract = await Contract.findById(contract._id)
        .populate('clientId', 'firstName lastName email phone')
        .populate('propertyId', 'title address pricing images')
        .exec();
      
      return populatedContract!;
    } catch (error) {
      throw new Error(`Failed to create contract: ${error}`);
    }
  }

  // Create contract from reservation with tenant signature
  async createContractFromReservation(contractData: any): Promise<any> {
    try {
      // Create the contract with tenant signature already provided
      const contract = new Contract({
        ...contractData,
        signedByClient: true, // Tenant has already signed
        clientSignatureDate: new Date(),
        signedByAgent: false, // Agent still needs to sign
        status: 'pending_agent_signature'
      });
      
      await contract.save();
      
      // Populate the created contract
      const populatedContract = await Contract.findById(contract._id)
        .populate('tenantId', 'firstName lastName email phone')
        .populate('agentId', 'firstName lastName email phone')
        .populate('propertyId', 'title address pricing images')
        .exec();

      // Return in the format expected by the contract-checkout component
      return {
        contract: populatedContract,
        agentSignature: null, // Agent hasn't signed yet
        tenantSignature: contractData.tenantSignature,
        canProceedToPayment: false // Can't proceed until agent signs
      };
    } catch (error) {
      throw new Error(`Failed to create contract from reservation: ${error}`);
    }
  }

  // Update contract
  async updateContract(contractId: string, updateData: Partial<IContract>): Promise<IContract | null> {
    try {
      const contract = await Contract.findByIdAndUpdate(
        contractId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('clientId', 'firstName lastName email phone')
        .populate('agentId', 'firstName lastName email phone')
        .populate('propertyId', 'title address pricing images')
        .exec();
      
      return contract;
    } catch (error) {
      throw new Error(`Failed to update contract: ${error}`);
    }
  }

  // Sign contract
  async signContract(contractId: string, userId: string, signatureType: 'agent' | 'client'): Promise<IContract | null> {
    try {
      const updateData: any = {};
      
      if (signatureType === 'agent') {
        updateData.signedByAgent = true;
        updateData.agentSignatureDate = new Date();
      } else if (signatureType === 'client') {
        updateData.signedByClient = true;
        updateData.clientSignatureDate = new Date();
      }

      const contract = await this.updateContract(contractId, updateData);
      
      // Check if both parties have signed and update status
      if (contract && contract.signedByAgent && contract.signedByClient) {
        await this.updateContract(contractId, { status: 'active' });
      }
      
      return contract;
    } catch (error) {
      throw new Error(`Failed to sign contract: ${error}`);
    }
  }

  // Generate contract PDF
  async generateContractPDF(contractId: string): Promise<Buffer | null> {
    try {
      const contract = await Contract.findById(contractId)
        .populate('clientId', 'firstName lastName email phone')
        .populate('agentId', 'firstName lastName email phone')
        .populate('propertyId', 'title address pricing')
        .exec();

      if (!contract) {
        return null;
      }

      // Use the PDF service to generate the contract
      const pdfFilename = await this.pdfService.generateRentalContract(contract);
      const pdfPath = await this.pdfService.getContractPDFPath(pdfFilename);
      
      // Read the PDF file and return as buffer
      const fs = require('fs');
      if (fs.existsSync(pdfPath)) {
        return fs.readFileSync(pdfPath);
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error}`);
    }
  }

  // Get contract by ID
  async getContractById(contractId: string): Promise<IContract | null> {
    try {
      const contract = await Contract.findById(contractId)
        .populate('clientId', 'firstName lastName email phone')
        .populate('agentId', 'firstName lastName email phone')
        .populate('propertyId', 'title address pricing images')
        .exec();
      
      return contract;
    } catch (error) {
      throw new Error(`Failed to fetch contract: ${error}`);
    }
  }

  // Delete contract
  async deleteContract(contractId: string): Promise<boolean> {
    try {
      const result = await Contract.findByIdAndDelete(contractId).exec();
      return !!result;
    } catch (error) {
      throw new Error(`Failed to delete contract: ${error}`);
    }
  }

  // Get contract statistics for agent
  async getContractStats(agentId: string): Promise<any> {
    try {
      const pipeline = [
        { $match: { agentId: new Types.ObjectId(agentId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalCommission: { $sum: '$commission' }
          }
        }
      ];

      const stats = await Contract.aggregate(pipeline).exec();
      
      // Calculate totals
      const totalContracts = await Contract.countDocuments({ agentId: new Types.ObjectId(agentId) });
      const totalAmount = await Contract.aggregate([
        { $match: { agentId: new Types.ObjectId(agentId) } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalCommission = await Contract.aggregate([
        { $match: { agentId: new Types.ObjectId(agentId) } },
        { $group: { _id: null, total: { $sum: '$commission' } } }
      ]);

      return {
        byStatus: stats,
        totalContracts,
        totalAmount: totalAmount[0]?.total || 0,
        totalCommission: totalCommission[0]?.total || 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch contract stats: ${error}`);
    }
  }
}
