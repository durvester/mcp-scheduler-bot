import { PracticeFusionClient, PracticeFusionConfig } from './PracticeFusionClient.js';

// Payer API Types
export interface Payer {
  payerGuid: string;
  payerName: string;
  clearingHouses?: ClearingHouse[];
}

export interface ClearingHouse {
  clearingHouseName: string;
  payerCode: string;
}

export interface PayersResponse {
  payers: Payer[];
  meta?: {
    totalPages: number;
    totalItems: number;
  };
}

export interface InsurancePlan {
  payerGuid: string;
  payerName: string;
  planGuid: string;
  planName: string;
  planType: PlanType;
  coverageTypeCode: CoverageTypeCode;
  coverageType: CoverageType;
  claimsContactInfo?: ContactInformation;
  attorneyContactInfo?: ContactInformation;
}

export interface ContactInformation {
  address?: Address;
  telephoneNumber?: string;
  telephoneExtension?: string;
  faxNumber?: string;
  faxExtension?: string;
}

export interface Address {
  streetAddress1: string;
  streetAddress2?: string;
  city: string;
  state: State;
  postalCode: string;
}

export type State = 'AL' | 'AK' | 'AS' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'DC' | 'FM' | 'FL' | 'GA' | 'GU' | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MH' | 'MD' | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ' | 'NM' | 'NY' | 'NC' | 'ND' | 'MP' | 'OH' | 'OK' | 'OR' | 'PW' | 'PA' | 'PR' | 'RI' | 'SC' | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VI' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY';

export type PlanType = 'PPO' | 'HMO' | 'Medicare' | 'HSA' | 'Private' | 'EPO' | 'POS' | 'Medicaid' | 'Dental' | 'Vision' | 'Other' | 'Workers Compensation' | 'Behavioral health' | 'Motor Vehicle' | 'Uninsured';

export type CoverageTypeCode = 'Med' | 'Dental' | 'Other' | 'WC' | 'BH' | 'MV' | 'Unins';

export type CoverageType = 'Medical' | 'Dental' | 'Other' | "Worker's Comp" | 'Behavioral Health' | 'Motor Vehicle' | 'Uninsured';

export type OrderOfBenefits = 'Primary' | 'Secondary' | 'Tertiary' | 'Unknown/None';

export interface InsurancePlansResponse {
  insurancePlans: InsurancePlan[];
}

export interface PayerSearchParams {
  payerName?: string;
  payerCode?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface InsurancePlansQueryParams {
  restrictToPracticePreferredList?: boolean;
}

export interface PatientInsurancePlan {
  patientInsurancePlanGuid?: string;
  patientPracticeGuid: string;
  relationshipToInsured: 'Self' | 'Spouse' | 'Child' | 'Other';
  insuredId: string;
  groupNumber?: string;
  orderOfBenefits: OrderOfBenefits;
  coverageStartDate: string;
  coverageEndDate?: string;
  nameOfEmployer?: string;
  coPayType: 'Fixed' | 'Percentage';
  baseCopay: number;
  comments?: string;
  isActive?: boolean;
  claimNumber?: string;
  insurancePlan: InsurancePlanSummary;
  employerContact?: EmployerContact;
  subscriber?: Subscriber;
}

export interface InsurancePlanSummary {
  planGuid: string;
  payerGuid: string;
  coverageType: CoverageType;
  planType: PlanType;
}

export interface EmployerContact {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  address?: Address;
  phoneNumber?: string;
  phoneExtension?: string;
  faxNumber?: string;
  faxExtension?: string;
  emailAddress?: string;
}

export interface Subscriber {
  firstName: string;
  middleInitial?: string;
  lastName: string;
  socialSecurityNumber?: string;
  birthDate?: string;
  sex: 'Male' | 'Female' | 'Unknown';
  address?: Address;
  primaryPhoneNumber?: string;
  primaryPhoneExtension?: string;
  secondaryPhoneNumber?: string;
  secondaryPhoneExtension?: string;
}

export interface PatientInsurancePlansResponse {
  patientInsurancePlans: PatientInsurancePlan[];
}

export interface PatientInsurancePlansQueryParams {
  coverageType?: string;
  planType?: string;
  orderOfBenefits?: OrderOfBenefits;
  activeOnly?: boolean;
}

export class PayerClient extends PracticeFusionClient {
  constructor(config: PracticeFusionConfig) {
    super({
      ...config,
      baseUrl: `${config.baseUrl}/ehr/payer/v1`
    });
  }

  // Find payers with optional filters
  async findPayers(params?: PayerSearchParams): Promise<PayersResponse> {
    try {
      return await this.get<PayersResponse>('/payers', params);
    } catch (error) {
      this.logger.error('Error finding payers', { params }, error as Error);
      throw error;
    }
  }

  // Get a specific payer by GUID
  async getPayer(payerGuid: string): Promise<Payer> {
    try {
      return await this.get<Payer>(`/payers/${payerGuid}`);
    } catch (error) {
      this.logger.error('Error fetching payer', { payerGuid }, error as Error);
      throw error;
    }
  }

  // Get insurance plans for a specific payer
  async getInsurancePlans(payerGuid: string, params?: InsurancePlansQueryParams): Promise<InsurancePlansResponse> {
    try {
      return await this.get<InsurancePlansResponse>(`/payers/${payerGuid}/insurancePlans`, params);
    } catch (error) {
      this.logger.error('Error fetching insurance plans for payer', { payerGuid }, error as Error);
      throw error;
    }
  }

  // Get a specific insurance plan
  async getInsurancePlan(payerGuid: string, planGuid: string): Promise<InsurancePlan> {
    try {
      const response = await this.get<InsurancePlan>(`/payers/${payerGuid}/insurancePlans/${planGuid}`);
      return response;
    } catch (error) {
      this.logger.error('Error fetching insurance plan', { planGuid, payerGuid }, error as Error);
      throw error;
    }
  }

  // Get patient insurance plans
  async getPatientInsurancePlans(patientPracticeGuid: string, params?: PatientInsurancePlansQueryParams): Promise<PatientInsurancePlansResponse> {
    try {
      return await this.get<PatientInsurancePlansResponse>(`/patients/${patientPracticeGuid}/patientInsurancePlans`, params);
    } catch (error) {
      this.logger.error('Error fetching insurance plans for patient', { patientPracticeGuid }, error as Error);
      throw error;
    }
  }

  // Get a specific patient insurance plan
  async getPatientInsurancePlan(patientPracticeGuid: string, patientInsurancePlanGuid: string): Promise<PatientInsurancePlan> {
    try {
      const response = await this.get<PatientInsurancePlan>(`/patients/${patientPracticeGuid}/patientInsurancePlans/${patientInsurancePlanGuid}`);
      return response;
    } catch (error) {
      this.logger.error('Error fetching patient insurance plan', { patientInsurancePlanGuid }, error as Error);
      throw error;
    }
  }

  // Add a patient insurance plan
  async createPatientInsurancePlan(patientPracticeGuid: string, plan: PatientInsurancePlan): Promise<PatientInsurancePlan> {
    try {
      return await this.post<PatientInsurancePlan>(`/patients/${patientPracticeGuid}/patientInsurancePlans`, plan);
    } catch (error) {
      this.logger.error('Error creating insurance plan for patient', { patientPracticeGuid }, error as Error);
      throw error;
    }
  }

  // Update a patient insurance plan
  async updatePatientInsurancePlan(patientPracticeGuid: string, patientInsurancePlanGuid: string, plan: PatientInsurancePlan): Promise<PatientInsurancePlan> {
    try {
      return await this.put<PatientInsurancePlan>(`/patients/${patientPracticeGuid}/patientInsurancePlans/${patientInsurancePlanGuid}`, plan);
    } catch (error) {
      this.logger.error('Error updating patient insurance plan', { patientInsurancePlanGuid }, error as Error);
      throw error;
    }
  }

  // Deactivate a patient insurance plan
  async deactivatePatientInsurancePlan(patientPracticeGuid: string, patientInsurancePlanGuid: string): Promise<void> {
    try {
      await this.client.delete(`/patients/${patientPracticeGuid}/patientInsurancePlans/${patientInsurancePlanGuid}`);
    } catch (error) {
      this.logger.error('Error deactivating patient insurance plan', { patientInsurancePlanGuid }, error as Error);
      throw error;
    }
  }

  // Get subscriber relationship options
  async getSubscriberRelationshipOptions(): Promise<string[]> {
    try {
      const response = await this.get<string[]>('/subscriberRelationshipOptions');
      return response;
    } catch (error) {
      this.logger.error('Error fetching subscriber relationship options', {}, error as Error);
      throw error;
    }
  }
} 