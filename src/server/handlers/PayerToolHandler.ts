import { BaseToolHandler, ToolResponse } from "./BaseToolHandler.js";
import { PayerClient, PayerSearchParams } from "../connectors/practicefusion/PayerClient.js";
import { ValidationUtil } from "../utils/ValidationUtil.js";
import { PayerSearchSchema, InsurancePlanCreateSchema } from "../utils/ValidationSchemas.js";
import { AuthConfig } from "../utils/AuthConfig.js";
import { Auth } from "../utils/Auth.js";

export class PayerToolHandler extends BaseToolHandler {
  private payerClient?: PayerClient;

  constructor(authConfig: AuthConfig, baseUrl: string, sharedAuth: Auth) {
    super(authConfig, baseUrl, 'PayerToolHandler', sharedAuth);
  }

  getToolNames(): string[] {
    return [
      'find_payers',
      'get_payer',
      'get_payer_insurance_plans',
      'get_payer_insurance_plan',
      'get_patient_insurance_plans',
      'get_patient_insurance_plan',
      'create_patient_insurance_plan'
    ];
  }

  private async ensurePayerClient(): Promise<PayerClient> {
    if (!this.payerClient) {
      this.payerClient = new PayerClient({
        baseUrl: this.baseUrl,
        auth: this.auth
      });
    }
    return this.payerClient;
  }

  async handleTool(toolName: string, args: any): Promise<ToolResponse> {
    try {
      const client = await this.ensurePayerClient();

      switch (toolName) {
        case 'find_payers':
          return await this.handleFindPayers(client, args);
        case 'get_payer':
          return await this.handleGetPayer(client, args);
        case 'get_payer_insurance_plans':
          return await this.handleGetPayerInsurancePlans(client, args);
        case 'get_payer_insurance_plan':
          return await this.handleGetPayerInsurancePlan(client, args);
        case 'get_patient_insurance_plans':
          return await this.handleGetPatientInsurancePlans(client, args);
        case 'get_patient_insurance_plan':
          return await this.handleGetPatientInsurancePlan(client, args);
        case 'create_patient_insurance_plan':
          return await this.handleCreatePatientInsurancePlan(client, args);
        default:
          return this.createErrorResponse(`Unknown tool: ${toolName}`);
      }
    } catch (error: any) {
      this.logger.error(`Error in ${toolName}`, { args }, error);
      return this.createErrorResponse(`Error in ${toolName}: ${error.message}`);
    }
  }

  private async handleFindPayers(client: PayerClient, args: any): Promise<ToolResponse> {
    const validation = ValidationUtil.validate(PayerSearchSchema, args || {});
    if (!validation.success) {
      return this.createValidationErrorResponse(validation.errors!);
    }

    const searchParams = validation.data! as PayerSearchParams;
    const result = await this.executeWithAuth(() => 
      client.findPayers(searchParams)
    );
    return this.createSuccessResponse(result);
  }

  private async handleGetPayer(client: PayerClient, args: any): Promise<ToolResponse> {
    const { payerGuid } = args || {};
    
    this.validateGuid(payerGuid, 'payerGuid');

    const result = await this.executeWithAuth(() => 
      client.getPayer(payerGuid)
    );
    
    if (!result) {
      return this.createErrorResponse('No payer found with the specified GUID');
    }
    
    return this.createSuccessResponse(result);
  }

  private async handleGetPayerInsurancePlans(client: PayerClient, args: any): Promise<ToolResponse> {
    const { payerGuid, restrictToPracticePreferredList } = args || {};
    
    this.validateGuid(payerGuid, 'payerGuid');

    const result = await this.executeWithAuth(() => 
      client.getInsurancePlans(payerGuid, { 
        restrictToPracticePreferredList: restrictToPracticePreferredList === true 
      })
    );
    
    return this.createSuccessResponse(result || { insurancePlans: [] });
  }

  private async handleGetPayerInsurancePlan(client: PayerClient, args: any): Promise<ToolResponse> {
    const { payerGuid, planGuid } = args || {};
    
    this.validateGuid(payerGuid, 'payerGuid');
    this.validateGuid(planGuid, 'planGuid');

    const result = await this.executeWithAuth(() => 
      client.getInsurancePlan(payerGuid, planGuid)
    );
    
    if (!result) {
      return this.createErrorResponse('No insurance plan found with the specified GUIDs');
    }
    
    return this.createSuccessResponse(result);
  }

  private async handleGetPatientInsurancePlans(client: PayerClient, args: any): Promise<ToolResponse> {
    const { patientPracticeGuid, coverageType, planType, orderOfBenefits, activeOnly } = args || {};
    
    this.validateGuid(patientPracticeGuid, 'patientPracticeGuid');

    const result = await this.executeWithAuth(() => 
      client.getPatientInsurancePlans(patientPracticeGuid, { 
        coverageType, 
        planType, 
        orderOfBenefits, 
        activeOnly 
      })
    );
    
    return this.createSuccessResponse(result || { patientInsurancePlans: [] });
  }

  private async handleGetPatientInsurancePlan(client: PayerClient, args: any): Promise<ToolResponse> {
    const { patientPracticeGuid, patientInsurancePlanGuid } = args || {};
    
    this.validateGuid(patientPracticeGuid, 'patientPracticeGuid');
    this.validateGuid(patientInsurancePlanGuid, 'patientInsurancePlanGuid');

    const result = await this.executeWithAuth(() => 
      client.getPatientInsurancePlan(patientPracticeGuid, patientInsurancePlanGuid)
    );
    
    if (!result) {
      return this.createErrorResponse('No patient insurance plan found with the specified GUIDs');
    }
    
    return this.createSuccessResponse(result);
  }

  private async handleCreatePatientInsurancePlan(client: PayerClient, args: any): Promise<ToolResponse> {
    const validation = ValidationUtil.validate(InsurancePlanCreateSchema, args || {});
    if (!validation.success) {
      return this.createValidationErrorResponse(validation.errors!);
    }

    const { patientPracticeGuid, ...insurancePlanData } = validation.data!;
    
    // Create the full plan data object
    const fullPlanData = {
      patientPracticeGuid,
      ...insurancePlanData
    };
    
    const result = await this.executeWithAuth(() => 
      client.createPatientInsurancePlan(patientPracticeGuid, fullPlanData as any)
    );
    return this.createSuccessResponse(result);
  }
}