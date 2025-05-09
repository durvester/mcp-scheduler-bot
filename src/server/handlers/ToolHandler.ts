import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";
import { Auth } from "../utils/Auth.js";
import { AuthConfig } from "../utils/AuthConfig.js";
import { UsersClient } from "../connectors/practicefusion/UsersClient.js";
import { FacilitiesClient } from "../connectors/practicefusion/FacilitiesClient.js";
import { PatientsClient, PatientSearchRequest, PatientCreateRequest } from "../connectors/practicefusion/PatientsClient.js";
import { CalendarClient } from "../connectors/calendar/CalendarClient.js";
import { PRACTICE_FUSION_TOOLS } from "../constants/practicefusion-tools.js";

// Define request schemas
const listSchema = z.object({
  method: z.literal("tools/list")
});

const callSchema = z.object({
  method: z.literal("tools/call"),
  params: z.object({
    name: z.string(),
    arguments: z.record(z.string(), z.any()).optional(),
    params: z.record(z.string(), z.string()).optional()
  }).optional()
});

export class ToolHandler {
  private auth?: Auth;
  private authInitialized = false;
  private usersClient?: UsersClient;
  private facilitiesClient?: FacilitiesClient;
  private patientsClient?: PatientsClient;
  private calendarClient?: CalendarClient;
  private authConfig: AuthConfig;
  private baseUrl: string;

  constructor(authConfig: AuthConfig, baseUrl: string) {
    this.authConfig = authConfig;
    this.baseUrl = baseUrl;
  }

  register(server: Server) {
    // Register list handler
    server.setRequestHandler(listSchema, async (_request) => {
      return {
        tools: PRACTICE_FUSION_TOOLS
      };
    });

    // Register call handler
    server.setRequestHandler(callSchema, async (request) => {
      // Initialize auth if not already initialized
      if (!this.authInitialized) {
        this.auth = new Auth(this.authConfig);
        this.authInitialized = true;
      }

      return this.auth!.executeWithAuth(async () => {
        // Initialize clients if needed
        if (!this.usersClient) {
          this.usersClient = new UsersClient({
            baseUrl: this.baseUrl,
            auth: this.auth!
          });
        }
        if (!this.facilitiesClient) {
          this.facilitiesClient = new FacilitiesClient({
            baseUrl: this.baseUrl,
            auth: this.auth!
          });
        }
        if (!this.patientsClient) {
          this.patientsClient = new PatientsClient({
            baseUrl: this.baseUrl,
            auth: this.auth!
          });
        }
        if (!this.calendarClient) {
          this.calendarClient = new CalendarClient({
            baseUrl: this.baseUrl,
            auth: this.auth!
          });
        }

        // Handle the request based on the tool name
        let result;
        switch (request.params?.name) {
          case "get_users":
            result = await this.usersClient!.getUsers(['profile', 'login']);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
              }]
            };
          case "get_facilities":
            result = await this.facilitiesClient!.getFacilities();
            return {
              content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
              }]
            };
          case "search_patients":
            const searchParams = (request.params?.arguments || {}) as PatientSearchRequest;
            // Remove FirstOrLastName as it's not supported by the API
            const { FirstOrLastName, ...apiSearchParams } = searchParams;
            
            // Validate that we have at least one search parameter (other than sex)
            const hasSearchParam = apiSearchParams.FirstName || apiSearchParams.LastName || 
              apiSearchParams.BirthDate || apiSearchParams.SocialSecurityNumber || 
              apiSearchParams.PatientRecordNumber || apiSearchParams.PatientPracticeGuid || 
              apiSearchParams.PracticeGuid;

            if (!hasSearchParam) {
              return {
                content: [{
                  type: "text",
                  text: "Please provide at least one search parameter (other than sex) to search for patients. Required fields include: FirstName, LastName, BirthDate, SocialSecurityNumber, PatientRecordNumber, PatientPracticeGuid, or PracticeGuid."
                }]
              };
            }

            const onlyActive = request.params?.arguments?.onlyActive === undefined ? true : Boolean(request.params.arguments.onlyActive);
            result = await this.patientsClient!.searchPatients(apiSearchParams, onlyActive);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
              }]
            };
          case "get_patient_v4":
            const { patientPracticeGuid, fields } = request.params?.arguments || {};
            
            if (!patientPracticeGuid) {
              return {
                content: [{
                  type: "text",
                  text: "Patient Practice GUID is required"
                }]
              };
            }

            result = await this.patientsClient!.getPatientV4(patientPracticeGuid, fields);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
              }]
            };
          case "create_patient_v4":
            const patientData = request.params?.arguments as PatientCreateRequest;
            
            if (!patientData) {
              return {
                content: [{
                  type: "text",
                  text: "Patient data is required"
                }]
              };
            }

            try {
              result = await this.patientsClient!.createPatientV4(patientData);
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify(result, null, 2)
                }]
              };
            } catch (error: any) {
              return {
                content: [{
                  type: "text",
                  text: `Error creating patient: ${error.message}`
                }]
              };
            }
          case "update_patient_v4":
            const { patientPracticeGuid: updatePatientGuid, ...updateData } = request.params?.arguments || {};
            
            if (!updatePatientGuid) {
              return {
                content: [{
                  type: "text",
                  text: "Patient Practice GUID is required"
                }]
              };
            }

            if (!updateData) {
              return {
                content: [{
                  type: "text",
                  text: "Patient data is required"
                }]
              };
            }

            try {
              result = await this.patientsClient!.updatePatientV4(updatePatientGuid, updateData as PatientCreateRequest);
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify(result, null, 2)
                }]
              };
            } catch (error: any) {
              return {
                content: [{
                  type: "text",
                  text: `Error updating patient: ${error.message}`
                }]
              };
            }
          case "get_event_types":
            result = await this.calendarClient!.getEventTypes();
            return {
              content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
              }]
            };
          default:
            throw new Error(`Unknown tool: ${request.params?.name}`);
        }
      });
    });
  }
} 