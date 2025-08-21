import { IAgency } from './IAgency';

export interface IAgencyRepository {
    getAgencies(): Promise<IAgency[]>;
    getAgency(id: string): Promise<IAgency | string>;
    createAgency(data: any): Promise<IAgency>;
    updateAgency(id: string, data: any): Promise<IAgency | string>;
    deleteAgency(id: string): Promise<string>;
    getAgencyAgents(id: string): Promise<IAgency | string>;
    searchAgencies(query: string): Promise<IAgency[]>;
} 