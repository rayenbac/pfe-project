import { AgencyService } from '../Services/agency.service';
import { injectable, inject } from 'inversify';
import { AgencyTYPES } from '../DI/Agency/AgencyTypes';
import { Request, Response } from 'express';
import { UploadService } from '../Services/upload.service';
import { diContainer } from '../DI/iversify.config';

@injectable()
class AgencyController {
    private service: AgencyService;
    private uploadService: UploadService;

    constructor(
        @inject(AgencyTYPES.agencyService) service: AgencyService
    ) {
        this.service = service;
        this.uploadService = diContainer.get<UploadService>(Symbol.for("UploadService"));
    }

    // Get all agencies
    getAgencies = async (req: Request, res: Response) => {
        try {
            const agencies = await this.service.getAgencies();
            res.status(200).send(agencies);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get a single agency
    getAgency = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const agency = await this.service.getAgency(id);
            if (agency === '404') {
                return res.status(404).json({ message: 'Agency not found' });
            }
            res.status(200).send(agency);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    // Create a new agency
    createAgency = async (req: Request, res: Response) => {
        try {
            const agencyData = { ...req.body };

            // Handle logo upload
            if (req.file) {
                const filePath = this.uploadService.getFilePath(req.file.filename, 'agency');
                agencyData.logo = filePath;
            }

            const agency = await this.service.createAgency(agencyData);
            res.status(201).send(agency);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Update an agency
    updateAgency = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const updateData = { ...req.body };

            // Handle logo upload
            if (req.file) {
                const filePath = this.uploadService.getFilePath(req.file.filename, 'agency');
                updateData.logo = filePath;
            }

            const agency = await this.service.updateAgency(id, updateData);
            if (agency === "Agency not found") {
                return res.status(404).json({ message: 'Agency not found' });
            }
            res.status(200).send(agency);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    // Delete an agency
    deleteAgency = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const result = await this.service.deleteAgency(id);
            if (result === 'Agency not found') {
                return res.status(404).json({ message: 'Agency not found' });
            }
            res.status(200).json({ message: result });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get agency agents
    getAgencyAgents = async (req: Request, res: Response) => {
        try {
            const id = req.params.id;
            const agents = await this.service.getAgencyAgents(id);
            if (agents === '404') {
                return res.status(404).json({ message: 'Agency not found' });
            }
            res.status(200).send(agents);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    // Search agencies
    searchAgencies = async (req: Request, res: Response) => {
        try {
            const query = req.query.q as string;
            if (!query) {
                return res.status(400).json({ message: 'Search query is required' });
            }
            const agencies = await this.service.searchAgencies(query);
            res.status(200).send(agencies);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}

export { AgencyController }; 