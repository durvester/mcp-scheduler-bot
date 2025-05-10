import { PracticeFusionClient } from './PracticeFusionClient.js';
export class PayerClient extends PracticeFusionClient {
    constructor(config) {
        super({
            ...config,
            baseUrl: `${config.baseUrl}/ehr/payer/v1`
        });
    }
    // Find payers with optional filters
    async findPayers(params) {
        try {
            return await this.get('/payers', params);
        }
        catch (error) {
            console.error('Error finding payers:', error);
            throw error;
        }
    }
    // Get a specific payer by GUID
    async getPayer(payerGuid) {
        try {
            return await this.get(`/payers/${payerGuid}`);
        }
        catch (error) {
            console.error(`Error fetching payer ${payerGuid}:`, error);
            throw error;
        }
    }
    // Get insurance plans for a specific payer
    async getInsurancePlans(payerGuid, params) {
        try {
            return await this.get(`/payers/${payerGuid}/insurancePlans`, params);
        }
        catch (error) {
            console.error(`Error fetching insurance plans for payer ${payerGuid}:`, error);
            throw error;
        }
    }
    // Get a specific insurance plan
    async getInsurancePlan(payerGuid, planGuid) {
        try {
            const response = await this.get(`/payers/${payerGuid}/insurancePlans/${planGuid}`);
            return response;
        }
        catch (error) {
            console.error(`Error fetching insurance plan ${planGuid} for payer ${payerGuid}:`, error);
            throw error;
        }
    }
    // Get patient insurance plans
    async getPatientInsurancePlans(patientPracticeGuid, params) {
        try {
            return await this.get(`/patients/${patientPracticeGuid}/patientInsurancePlans`, params);
        }
        catch (error) {
            console.error(`Error fetching insurance plans for patient ${patientPracticeGuid}:`, error);
            throw error;
        }
    }
    // Get a specific patient insurance plan
    async getPatientInsurancePlan(patientPracticeGuid, patientInsurancePlanGuid) {
        try {
            const response = await this.get(`/patients/${patientPracticeGuid}/patientInsurancePlans/${patientInsurancePlanGuid}`);
            return response;
        }
        catch (error) {
            console.error(`Error fetching patient insurance plan ${patientInsurancePlanGuid}:`, error);
            throw error;
        }
    }
    // Add a patient insurance plan
    async createPatientInsurancePlan(patientPracticeGuid, plan) {
        try {
            return await this.post(`/patients/${patientPracticeGuid}/patientInsurancePlans`, plan);
        }
        catch (error) {
            console.error(`Error creating insurance plan for patient ${patientPracticeGuid}:`, error);
            throw error;
        }
    }
    // Update a patient insurance plan
    async updatePatientInsurancePlan(patientPracticeGuid, patientInsurancePlanGuid, plan) {
        try {
            return await this.put(`/patients/${patientPracticeGuid}/patientInsurancePlans/${patientInsurancePlanGuid}`, plan);
        }
        catch (error) {
            console.error(`Error updating patient insurance plan ${patientInsurancePlanGuid}:`, error);
            throw error;
        }
    }
    // Deactivate a patient insurance plan
    async deactivatePatientInsurancePlan(patientPracticeGuid, patientInsurancePlanGuid) {
        try {
            await this.client.delete(`/patients/${patientPracticeGuid}/patientInsurancePlans/${patientInsurancePlanGuid}`);
        }
        catch (error) {
            console.error(`Error deactivating patient insurance plan ${patientInsurancePlanGuid}:`, error);
            throw error;
        }
    }
    // Get subscriber relationship options
    async getSubscriberRelationshipOptions() {
        try {
            const response = await this.get('/subscriberRelationshipOptions');
            return response;
        }
        catch (error) {
            console.error('Error fetching subscriber relationship options:', error);
            throw error;
        }
    }
}
