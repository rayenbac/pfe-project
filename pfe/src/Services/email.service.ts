import { injectable } from 'inversify';
import nodemailer from 'nodemailer';
import "reflect-metadata";
import { logger } from '../Config/logger.config';
import fs from 'fs';

export interface ContractEmailData {
  to: string;
  subject: string;
  recipientName: string;
  contractId: string;
  propertyTitle: string;
  startDate: string;
  endDate: string;
  amount: string;
  isOfflineReservation: boolean;
  attachmentPath?: string;
}

@injectable()
class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'realestateplatefrom@gmail.com',
                pass: process.env.EMAIL_APP_PASSWORD || 'tywh uext qalb ngmd'
            }
        });
    }

    async sendPasswordResetEmail(email: string, resetToken: string, frontendUrl: string): Promise<boolean> {
        try {
            const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
            
            const mailOptions = {
                from: process.env.EMAIL_USER || 'realestateplatefrom@gmail.com',
                to: email,
                subject: 'Password Reset Request',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <h2 style="color: #ff5a5f; text-align: center;">Password Reset Request</h2>
                        <p>Hello,</p>
                        <p>We received a request to reset your password. Please click the button below to reset your password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background-color: #ff5a5f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                        </div>
                        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                        <p>This link will expire in 1 hour for security reasons.</p>
                        <p>Regards,<br>Real Estate Platform Team</p>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Password reset email sent to ${email}: ${info.messageId}`);
            return true;
        } catch (error) {
            logger.error('Error sending password reset email:', error);
            return false;
        }
    }

    async sendPasswordResetConfirmation(email: string): Promise<boolean> {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER || 'realestateplatefrom@gmail.com',
                to: email,
                subject: 'Your Password Has Been Reset',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                        <h2 style="color: #ff5a5f; text-align: center;">Password Reset Successful</h2>
                        <p>Hello,</p>
                        <p>Your password has been successfully reset.</p>
                        <p>If you did not make this change, please contact our support team immediately.</p>
                        <p>Regards,<br>Real Estate Platform Team</p>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Password reset confirmation email sent to ${email}: ${info.messageId}`);
            return true;
        } catch (error) {
            logger.error('Error sending password reset confirmation email:', error);
            return false;
        }
    }

    async sendContractEmail(data: ContractEmailData): Promise<void> {
        try {
            const htmlContent = this.generateContractEmailHTML(data);
            
            const mailOptions: nodemailer.SendMailOptions = {
                from: process.env.EMAIL_USER || 'realestateplatefrom@gmail.com',
                to: data.to,
                subject: data.subject,
                html: htmlContent
            };

            // Add PDF attachment if provided
            if (data.attachmentPath && fs.existsSync(data.attachmentPath)) {
                mailOptions.attachments = [{
                    filename: `rental-contract-${data.contractId}.pdf`,
                    path: data.attachmentPath,
                    contentType: 'application/pdf'
                }];
            }

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`Contract email sent to ${data.to}: ${info.messageId}`);
        } catch (error) {
            logger.error('Failed to send contract email:', error);
            throw error;
        }
    }

    async sendContractNotification(
        email: string, 
        recipientName: string, 
        contract: any, 
        recipientType: 'agent' | 'tenant',
        attachmentPath?: string
    ): Promise<void> {
        try {
            const data: ContractEmailData = {
                to: email,
                subject: `${recipientType === 'agent' ? 'New' : 'Your'} Rental Contract - ${contract.title}`,
                recipientName: recipientName,
                contractId: contract._id.toString(),
                propertyTitle: contract.title,
                startDate: contract.startDate.toLocaleDateString(),
                endDate: contract.endDate?.toLocaleDateString() || 'N/A',
                amount: `${contract.amount} ${contract.currency}`,
                isOfflineReservation: contract.reservationType === 'offline',
                attachmentPath: attachmentPath
            };

            await this.sendContractEmail(data);
        } catch (error) {
            logger.error(`Failed to send contract notification to ${email}:`, error);
            throw error;
        }
    }

    private generateContractEmailHTML(data: ContractEmailData): string {
        const isAgent = data.subject.includes('New Rental Contract Generated');
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Rental Contract</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #ff5a5f; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
                .button { display: inline-block; padding: 12px 25px; background-color: #ff5a5f; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                .warning { background-color: #f39c12; color: white; padding: 10px; border-radius: 5px; margin: 10px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏠 Rental Contract</h1>
                    <h2>${data.subject}</h2>
                </div>
                
                <div class="content">
                    <p>Dear ${data.recipientName},</p>
                    
                    ${isAgent ? 
                        '<p>A new rental contract has been generated for your property. Please review and sign the contract to complete the booking process.</p>' :
                        '<p>Your rental booking has been confirmed! Please review the attached contract and follow the instructions below.</p>'
                    }
                    
                    <div class="details">
                        <h3>📋 Contract Details</h3>
                        <p><strong>Contract ID:</strong> ${data.contractId}</p>
                        <p><strong>Property:</strong> ${data.propertyTitle}</p>
                        <p><strong>Check-in:</strong> ${data.startDate}</p>
                        <p><strong>Check-out:</strong> ${data.endDate}</p>
                        <p><strong>Total Amount:</strong> ${data.amount}</p>
                        <p><strong>Reservation Type:</strong> ${data.isOfflineReservation ? 'Pay Later (Offline)' : 'Online Payment'}</p>
                    </div>
                    
                    ${data.isOfflineReservation ? `
                    <div class="warning">
                        <h3>⚠️ Payment Required</h3>
                        <p>This is an offline reservation. Payment must be completed within the specified deadline to confirm your booking. Failure to pay on time will result in automatic cancellation.</p>
                    </div>
                    ` : ''}
                    
                    <div class="details">
                        <h3>📝 Next Steps</h3>
                        ${isAgent ? `
                        <ol>
                            <li>Review the attached contract PDF</li>
                            <li>Log in to your agent dashboard</li>
                            <li>Navigate to the contract section</li>
                            <li>Add your digital signature to complete the contract</li>
                        </ol>
                        ` : `
                        <ol>
                            <li>Review the attached contract PDF carefully</li>
                            <li>Keep this contract for your records</li>
                            ${data.isOfflineReservation ? 
                                '<li>Complete payment as per the instructions provided</li>' : 
                                '<li>Your online payment has been processed</li>'
                            }
                            <li>Contact us if you have any questions</li>
                        </ol>
                        `}
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/contracts/${data.contractId}" class="button">
                            View Contract Online
                        </a>
                    </div>
                    
                    <div class="details">
                        <h3>📞 Contact Information</h3>
                        <p>If you have any questions or concerns, please don't hesitate to contact us:</p>
                        <p><strong>Email:</strong> support@realestate.com</p>
                        <p><strong>Phone:</strong> +216 XX XXX XXX</p>
                        <p><strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM</p>
                    </div>
                    
                    <p>Thank you for choosing our platform for your rental needs!</p>
                    
                    <p>Best regards,<br>
                    The Real Estate Platform Team</p>
                </div>
                
                <div class="footer">
                    <p>This email was sent automatically. Please do not reply to this email.</p>
                    <p>© 2025 Real Estate Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}

export { EmailService };