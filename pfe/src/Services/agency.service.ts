import { injectable } from 'inversify';
import { Agency, AgencySchemaValidate } from '../Models/agency';
import { IAgency } from '../Interfaces/agency/IAgency';
import { IAgencyRepository } from '../Interfaces/agency/IAgencyRepository';
import { UploadService } from './upload.service';
import { diContainer } from '../DI/iversify.config';
import { Types } from 'mongoose';
import { User } from '../Models/user';
import fs from 'fs';
import path from 'path';

@injectable()
class AgencyService implements IAgencyRepository {
    private uploadService: UploadService;

    constructor() {
        this.uploadService = diContainer.get<UploadService>(Symbol.for("UploadService"));
    }

    async getAgencies(): Promise<IAgency[]> {
        try {
            const agencies = await Agency.find();
            return agencies;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async getAgency(id: string): Promise<IAgency | string> {
        try {
            const agency = await Agency.findById(id);
            if (!agency) {
                return '404';
            }
            return agency;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async createAgency(data: any): Promise<IAgency> {
        try {
            // Create a copy of the data for validation
            const validationData = { ...data };
            
            // If logo is a file object, remove it from validation data
            if (data.logo && typeof data.logo !== 'string') {
                delete validationData.logo;
            }

            // Validate the data
            const { error } = AgencySchemaValidate.validate(validationData);
            if (error) {
                throw new Error(error.details[0].message);
            }

            // Handle logo upload
            if (data.logo && typeof data.logo !== 'string') {
                // Create agencies directory if it doesn't exist
                const agenciesDir = path.join(process.cwd(), 'uploads', 'agencies');
                if (!fs.existsSync(agenciesDir)) {
                    fs.mkdirSync(agenciesDir, { recursive: true });
                }
                // Set the logo path to point to the agencies directory
                data.logo = `/uploads/agencies/${data.logo.filename}`;
            }

            // Create the agency with ownerId
            const agency = new Agency({
                ...data,
                ownerId: new Types.ObjectId(data.ownerId)
            });

            await agency.save();
            return agency;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    async updateAgency(id: string, data: any): Promise<IAgency | string> {
        try {
            // First check if the agency exists and if the user is the owner
            const existingAgency = await Agency.findById(id);
            if (!existingAgency) {
                return "Agency not found";
            }

            // Check if the user is the owner
            if (existingAgency.ownerId.toString() !== data.ownerId) {
                throw new Error("You don't have permission to update this agency");
            }

            // Create a copy of the data for validation
            const validationData = { ...data };
            
            // If logo is a file object, remove it from validation data
            if (data.logo && typeof data.logo !== 'string') {
                delete validationData.logo;
            }

            // Validate the data
            const { error } = AgencySchemaValidate.validate(validationData);
            if (error) {
                throw new Error(error.details[0].message);
            }

            // Handle logo upload
            if (data.logo && typeof data.logo !== 'string') {
                // Delete old logo if it exists
                if (existingAgency.logo && existingAgency.logo.startsWith('/uploads/agencies/')) {
                    const oldLogoPath = existingAgency.logo.replace('/uploads/agencies/', '');
                    await this.uploadService.deleteFile(oldLogoPath, 'agency');
                }
                // Create agencies directory if it doesn't exist
                const agenciesDir = path.join(process.cwd(), 'uploads', 'agencies');
                if (!fs.existsSync(agenciesDir)) {
                    fs.mkdirSync(agenciesDir, { recursive: true });
                }
                // Set the logo path to point to the agencies directory
                data.logo = `/uploads/agencies/${data.logo.filename}`;
            }

            const agency = await Agency.findByIdAndUpdate(
                id,
                { ...data, ownerId: new Types.ObjectId(data.ownerId) },
                { new: true }
            ) as IAgency | null;

            if (!agency) {
                return "Agency not found";
            }

            return agency;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    async deleteAgency(id: string): Promise<string> {
        try {
            const agency = await Agency.findById(id);
            if (!agency) {
                return 'Agency not found';
            }

            // Update all users associated with this agency to be particular agents
            await User.updateMany(
                { agencyId: id },
                { 
                    $set: { 
                        agencyId: null,
                        agentType: 'particular',
                        isAgencyCreator: false
                    }
                }
            );

            // Delete the agency logo file if it exists
            if (agency.logo && agency.logo.startsWith('/uploads/')) {
                const logoPath = agency.logo.replace('/uploads/', '');
                await this.uploadService.deleteFile(logoPath, 'agency');
            }

            // Delete the agency
            await Agency.findByIdAndDelete(id);
            return 'Agency deleted successfully';
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async getAgencyAgents(id: string): Promise<IAgency | string> {
        try {
            const agents = await Agency.findById(id).populate('agents');
            if (!agents) {
                return '404';
            }
            return agents;
        } catch (error) {
            console.log(error);
            return '404';
        }
    }

    async searchAgencies(query: string): Promise<IAgency[]> {
        try {
            const agencies = await Agency.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { address: { $regex: query, $options: 'i' } }
                ]
            });
            return agencies;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
}

export { AgencyService }; 