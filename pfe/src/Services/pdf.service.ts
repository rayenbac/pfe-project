import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { IContract } from '../Models/contract.model';
import { User } from '../Models/user';
import { Property } from '../Models/property';

export class PDFService {
  
  async generateRentalContract(contract: IContract): Promise<string> {
    try {
      // Fetch related data
      const [agent, tenant, property] = await Promise.all([
        User.findById(contract.agentId),
        User.findById(contract.clientId),
        Property.findById(contract.propertyId)
      ]);

      if (!agent || !tenant || !property) {
        throw new Error('Missing required data for contract generation');
      }

      const doc = new PDFDocument({ margin: 50 });
      const filename = `rental-contract-${contract._id}.pdf`;
      const filepath = path.join(process.cwd(), 'uploads', 'contracts', filename);
      
      // Ensure directory exists
      const contractsDir = path.dirname(filepath);
      if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir, { recursive: true });
      }

      // Create write stream
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('RENTAL CONTRACT', { align: 'center' });
      doc.moveDown();
      
      // Contract Information
      doc.fontSize(12).font('Helvetica-Bold').text('Contract Information:', { underline: true });
      doc.font('Helvetica').text(`Contract ID: ${contract._id}`);
      doc.text(`Date Created: ${contract.createdAt.toLocaleDateString()}`);
      doc.text(`Contract Type: ${contract.type.toUpperCase()}`);
      doc.text(`Reservation Type: ${contract.reservationType.toUpperCase()}`);
      doc.text(`Payment Status: ${contract.paymentStatus.toUpperCase()}`);
      doc.moveDown();

      // 1. Parties
      doc.fontSize(14).font('Helvetica-Bold').text('1. PARTIES', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(12).font('Helvetica-Bold').text('Owner/Agent:');
      doc.font('Helvetica').text(`Full Name: ${agent.firstName} ${agent.lastName}`);
      doc.text(`Email: ${agent.email}`);
      doc.text(`Phone: ${agent.phone}`);
      if (contract.rentalDetails?.ownerDetails) {
        const ownerDetails = contract.rentalDetails.ownerDetails;
        if (ownerDetails.cinPassportNumber) doc.text(`CIN/Passport: ${ownerDetails.cinPassportNumber}`);
        if (ownerDetails.address) doc.text(`Address: ${ownerDetails.address}`);
      }
      doc.moveDown(0.5);
      
      doc.font('Helvetica-Bold').text('Tenant:');
      doc.font('Helvetica').text(`Full Name: ${tenant.firstName} ${tenant.lastName}`);
      doc.text(`Email: ${tenant.email}`);
      doc.text(`Phone: ${tenant.phone}`);
      if (contract.rentalDetails?.tenantDetails) {
        const tenantDetails = contract.rentalDetails.tenantDetails;
        if (tenantDetails.cinPassportNumber) doc.text(`CIN/Passport: ${tenantDetails.cinPassportNumber}`);
        if (tenantDetails.address) doc.text(`Address: ${tenantDetails.address}`);
      }
      doc.moveDown();

      // 2. Property Details
      doc.fontSize(14).font('Helvetica-Bold').text('2. PROPERTY DETAILS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Property Title: ${property.title}`);
      doc.text(`Property Type: ${property.type}`);
      doc.text(`Address: ${property.address.street}, ${property.address.city}, ${property.address.country}`);
      doc.text(`Description: ${property.description}`);
      doc.text(`Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}`);
      doc.text(`Size: ${property.size.total} ${property.size.unit}`);
      
      if (contract.rentalDetails) {
        const details = contract.rentalDetails;
        doc.text(`Furnished: ${details.furnished ? 'Yes' : 'No'}`);
        if (details.includedEquipment && details.includedEquipment.length > 0) {
          doc.text(`Included Equipment: ${details.includedEquipment.join(', ')}`);
        }
      }
      doc.moveDown();

      // 3. Rental Duration
      doc.fontSize(14).font('Helvetica-Bold').text('3. RENTAL DURATION', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Start Date: ${contract.startDate.toLocaleDateString()}`);
      if (contract.endDate) {
        doc.text(`End Date: ${contract.endDate.toLocaleDateString()}`);
      }
      if (contract.rentalDetails) {
        const details = contract.rentalDetails;
        doc.text(`Renewal Conditions: ${details.renewalConditions}`);
        doc.text(`Termination Notice Period: ${details.terminationNotice} days`);
        if (details.earlyTerminationConditions) {
          doc.text(`Early Termination: ${details.earlyTerminationConditions}`);
        }
      }
      doc.moveDown();

      // 4. Financial Terms
      doc.fontSize(14).font('Helvetica-Bold').text('4. FINANCIAL TERMS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Rent Amount: ${contract.amount} ${contract.currency}`);
      if (contract.rentalDetails) {
        const details = contract.rentalDetails;
        doc.text(`Payment Frequency: ${details.paymentFrequency}`);
        doc.text(`Payment Method: ${details.paymentMethod}`);
        doc.text(`Security Deposit: ${details.securityDeposit} ${contract.currency}`);
        if (details.securityDepositRefundConditions) {
          doc.text(`Deposit Refund Conditions: ${details.securityDepositRefundConditions}`);
        }
        if (details.latePenalties?.enabled) {
          doc.text(`Late Payment Penalties: ${details.latePenalties.amount || details.latePenalties.percentage + '%'}`);
          doc.text(`Grace Period: ${details.latePenalties.gracePeriod} days`);
        }
      }
      doc.moveDown();

      // 5. Responsibilities
      doc.fontSize(14).font('Helvetica-Bold').text('5. RESPONSIBILITIES', { underline: true });
      doc.moveDown(0.5);
      if (contract.rentalDetails) {
        const details = contract.rentalDetails;
        
        doc.font('Helvetica-Bold').text('Tenant Obligations:');
        if (details.tenantObligations && details.tenantObligations.length > 0) {
          details.tenantObligations.forEach((obligation, index) => {
            doc.font('Helvetica').text(`${index + 1}. ${obligation}`);
          });
        } else {
          doc.font('Helvetica').text('• Pay rent on time');
          doc.text('• Maintain property in good condition');
          doc.text('• Respect neighbors and building rules');
        }
        doc.moveDown(0.5);
        
        doc.font('Helvetica-Bold').text('Owner Obligations:');
        if (details.ownerObligations && details.ownerObligations.length > 0) {
          details.ownerObligations.forEach((obligation, index) => {
            doc.font('Helvetica').text(`${index + 1}. ${obligation}`);
          });
        } else {
          doc.font('Helvetica').text('• Provide habitable property');
          doc.text('• Handle necessary maintenance');
          doc.text('• Respect tenant privacy rights');
        }
      }
      doc.moveDown();

      // 6. Usage Conditions
      doc.fontSize(14).font('Helvetica-Bold').text('6. USAGE CONDITIONS', { underline: true });
      doc.moveDown(0.5);
      if (contract.rentalDetails) {
        const details = contract.rentalDetails;
        doc.fontSize(12).font('Helvetica').text(`Authorized Use: ${details.authorizedUse}`);
        doc.text(`Pets Allowed: ${details.petsAllowed ? 'Yes' : 'No'}`);
        doc.text(`Smoking Allowed: ${details.smokingAllowed ? 'Yes' : 'No'}`);
        doc.text(`Subletting Allowed: ${details.sublettingAllowed ? 'Yes' : 'No'}`);
        
        if (details.restrictions && details.restrictions.length > 0) {
          doc.text('Restrictions:');
          details.restrictions.forEach((restriction, index) => {
            doc.text(`${index + 1}. ${restriction}`);
          });
        }
      }
      doc.moveDown();

      // 7. Termination & Cancellation
      doc.fontSize(14).font('Helvetica-Bold').text('7. TERMINATION & CANCELLATION', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`This contract may be terminated with ${contract.rentalDetails?.terminationNotice || 30} days notice.`);
      if (contract.rentalDetails?.earlyTerminationConditions) {
        doc.text(`Early Termination: ${contract.rentalDetails.earlyTerminationConditions}`);
      }
      doc.moveDown();

      // 8. Inspection & Inventory
      doc.fontSize(14).font('Helvetica-Bold').text('8. INSPECTION & INVENTORY', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text('An initial inspection will be conducted before move-in.');
      doc.text(`Final inspection required: ${contract.rentalDetails?.finalInspectionRequired ? 'Yes' : 'No'}`);
      if (contract.rentalDetails?.initialInspectionReport) {
        doc.text(`Initial Inspection: ${contract.rentalDetails.initialInspectionReport}`);
      }
      doc.moveDown();

      // 9. Dispute Resolution
      doc.fontSize(14).font('Helvetica-Bold').text('9. DISPUTE RESOLUTION', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica').text(`Applicable Law: ${contract.rentalDetails?.applicableLaw || 'Tunisian Law'}`);
      doc.text(`Jurisdiction: ${contract.rentalDetails?.jurisdiction || 'Tunisia'}`);
      doc.text(`Dispute Resolution: ${contract.rentalDetails?.disputeResolution || 'Court'}`);
      doc.moveDown();

      // 10. Signatures
      doc.fontSize(14).font('Helvetica-Bold').text('10. SIGNATURES', { underline: true });
      doc.moveDown(0.5);
      
      // Agent signature
      doc.fontSize(12).font('Helvetica-Bold').text('Agent/Owner Signature:');
      if (contract.agentSignature) {
        doc.text(`Signed on: ${contract.agentSignature.signedAt.toLocaleString()}`);
        doc.text(`Signature Type: ${contract.agentSignature.signatureType}`);
        // Note: In a real implementation, you would embed the signature image here
        doc.text('[DIGITAL SIGNATURE APPLIED]');
      } else {
        doc.text('Signature: _________________________');
        doc.text('Date: _________________________');
      }
      doc.moveDown(0.5);
      
      // Tenant signature
      doc.font('Helvetica-Bold').text('Tenant Signature:');
      if (contract.clientSignature) {
        doc.text(`Signed on: ${contract.clientSignature.signedAt.toLocaleString()}`);
        doc.text(`Signature Type: ${contract.clientSignature.signatureType}`);
        doc.text('[DIGITAL SIGNATURE APPLIED]');
      } else {
        doc.text('Signature: _________________________');
        doc.text('Date: _________________________');
      }
      doc.moveDown();

      // Footer
      doc.fontSize(10).font('Helvetica').text(
        'This contract was electronically generated and may contain digital signatures.',
        { align: 'center' }
      );

      // Finalize the PDF
      doc.end();

      // Wait for the PDF to be written
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      return filename;
    } catch (error) {
      console.error('Error generating PDF contract:', error);
      throw error;
    }
  }

  async getContractPDFPath(filename: string): Promise<string> {
    return path.join(process.cwd(), 'uploads', 'contracts', filename);
  }

  async deleteContractPDF(filename: string): Promise<void> {
    const filepath = await this.getContractPDFPath(filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}
