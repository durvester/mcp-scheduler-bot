import { BaseToolHandler, ToolResponse } from "./BaseToolHandler.js";
import { PatientsClient, PatientSearchRequest, PatientCreateRequest } from "../clients/PatientsClient.js";
import { ValidationUtil } from "../utils/ValidationUtil.js";
import { PatientSearchSchema, PatientCreateSchema, PatientUpdateSchema } from "../utils/ValidationSchemas.js";
import { AuthConfig } from "../utils/AuthConfig.js";
import { Auth } from "../utils/Auth.js";

export class PatientToolHandler extends BaseToolHandler {
  private patientsClient?: PatientsClient;

  constructor(authConfig: AuthConfig, baseUrl: string, sharedAuth: Auth) {
    super(authConfig, baseUrl, 'PatientToolHandler', sharedAuth);
  }

  getToolNames(): string[] {
    return [
      'search_patients',
      'get_patient_v4', 
      'create_patient_v4',
      'update_patient_v4'
    ];
  }

  private async ensurePatientsClient(): Promise<PatientsClient> {
    if (!this.patientsClient) {
      this.patientsClient = new PatientsClient({
        baseUrl: this.baseUrl,
        auth: this.auth
      });
    }
    return this.patientsClient;
  }

  async handleTool(toolName: string, args: any): Promise<ToolResponse> {
    try {
      const client = await this.ensurePatientsClient();

      switch (toolName) {
        case 'search_patients':
          return await this.handleSearchPatients(client, args);
        case 'get_patient_v4':
          return await this.handleGetPatient(client, args);
        case 'create_patient_v4':
          return await this.handleCreatePatient(client, args);
        case 'update_patient_v4':
          return await this.handleUpdatePatient(client, args);
        default:
          return this.createErrorResponse(`Unknown tool: ${toolName}`);
      }
    } catch (error: any) {
      this.logger.error(`Error in ${toolName}`, { args }, error);
      return this.createErrorResponse(`Error in ${toolName}: ${error.message}`);
    }
  }

  private async handleSearchPatients(client: PatientsClient, args: any): Promise<ToolResponse> {
    const validation = ValidationUtil.validate(PatientSearchSchema, args);
    if (!validation.success) {
      return this.createValidationErrorResponse(validation.errors!);
    }

    const searchParams = validation.data!;
    
    // Remove FirstOrLastName as it's not supported by the API
    const { FirstOrLastName, ...apiSearchParams } = searchParams as any;
    
    const onlyActive = searchParams.onlyActive ?? true;
    const result = await this.executeWithAuth(() => 
      client.searchPatients(apiSearchParams, onlyActive)
    );
    
    return this.createSuccessResponse(result);
  }

  private async handleGetPatient(client: PatientsClient, args: any): Promise<ToolResponse> {
    const { patientPracticeGuid, fields } = args || {};
    
    this.validateGuid(patientPracticeGuid, 'patientPracticeGuid');

    const result = await this.executeWithAuth(() => 
      client.getPatientV4(patientPracticeGuid, fields)
    );
    return this.createSuccessResponse(result);
  }

  private async handleCreatePatient(client: PatientsClient, args: any): Promise<ToolResponse> {
    const validation = ValidationUtil.validate(PatientCreateSchema, args);
    if (!validation.success) {
      return this.createValidationErrorResponse(validation.errors!);
    }

    const patientData = validation.data!;
    const result = await this.executeWithAuth(() => 
      client.createPatientV4(patientData as PatientCreateRequest)
    );
    return this.createSuccessResponse(result);
  }

  private async handleUpdatePatient(client: PatientsClient, args: any): Promise<ToolResponse> {
    const validation = ValidationUtil.validate(PatientUpdateSchema, args);
    if (!validation.success) {
      return this.createValidationErrorResponse(validation.errors!);
    }

    const { patientPracticeGuid, ...updateData } = validation.data!;
    const result = await this.executeWithAuth(() => 
      client.updatePatientV4(patientPracticeGuid, updateData as PatientCreateRequest)
    );
    return this.createSuccessResponse(result);
  }
}