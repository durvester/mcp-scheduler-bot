import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";
import { Auth } from "../utils/Auth.js";
import { AuthConfig } from "../utils/AuthConfig.js";
import { UsersClient } from "../connectors/practicefusion/UsersClient.js";
import { FacilitiesClient } from "../connectors/practicefusion/FacilitiesClient.js";
import { PatientsClient, PatientSearchRequest, PatientCreateRequest } from "../connectors/practicefusion/PatientsClient.js";
import { CalendarClient, CreateEventRequest, CalendarEventResponse } from "../connectors/practicefusion/CalendarClient.js";
import { PayerClient, PayerSearchParams } from "../connectors/practicefusion/PayerClient.js";
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
  private payerClient?: PayerClient;
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
        if (!this.payerClient) {
          this.payerClient = new PayerClient({
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
          case "query_events":
            const queryParams = request.params?.arguments as {
              minimumStartDateTimeUtc: string;
              maximumStartDateTimeUtc: string;
              eventTypeCategory?: 'Appointment' | 'BlockedTime';
              ehrUserGuid?: string;
              facilityGuid?: string;
            };
            
            if (!queryParams?.minimumStartDateTimeUtc || !queryParams?.maximumStartDateTimeUtc) {
              return {
                content: [{
                  type: "text",
                  text: "minimumStartDateTimeUtc and maximumStartDateTimeUtc are required parameters"
                }]
              };
            }

            result = await this.calendarClient!.queryEvents(queryParams);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
              }]
            };
          case "get_event":
            const { eventId } = request.params?.arguments || {};
            
            if (!eventId) {
              return {
                content: [{
                  type: "text",
                  text: "eventId is required"
                }]
              };
            }

            result = await this.calendarClient!.getEvent(eventId);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
              }]
            };
          case "get_events":
            const { eventId: eventIds } = request.params?.arguments || {};
            
            if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
              return {
                content: [{
                  type: "text",
                  text: "eventId must be a non-empty array of event IDs"
                }]
              };
            }

            result = await this.calendarClient!.getEvents({ eventId: eventIds });
            return {
              content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
              }]
            };
          case "create_event":
            const eventData = request.params?.arguments as CreateEventRequest;
            
            if (!eventData) {
              return {
                content: [{
                  type: "text",
                  text: "Event data is required"
                }]
              };
            }

            // Validate required fields
            if (!eventData.practiceGuid || !eventData.eventType || 
                !eventData.startDateTimeUtc || !eventData.startDateTimeFlt || 
                !eventData.duration) {
              return {
                content: [{
                  type: "text",
                  text: "Missing required fields: practiceGuid, eventType, startDateTimeUtc, startDateTimeFlt, and/or duration"
                }]
              };
            }

            // Additional validation for eventType
            if (!eventData.eventType.eventTypeGuid || !eventData.eventType.eventCategory) {
              return {
                content: [{
                  type: "text",
                  text: "eventType must include eventTypeGuid and eventCategory"
                }]
              };
            }

            result = await this.calendarClient!.createEvent(eventData);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
              }]
            };
          case "update_event":
            const { eventId: updateEventId, ...updateEventData } = request.params?.arguments || {};
            
            if (!updateEventId) {
              return {
                content: [{
                  type: "text",
                  text: "eventId is required"
                }]
              };
            }

            if (!updateEventData || Object.keys(updateEventData).length === 0) {
              return {
                content: [{
                  type: "text",
                  text: "At least one field to update is required"
                }]
              };
            }

            // If eventType is provided, validate it has required fields
            if (updateEventData.eventType) {
              // If providing partial eventType, make sure required fields are included
              if (!updateEventData.eventType.eventTypeGuid || !updateEventData.eventType.eventCategory) {
                return {
                  content: [{
                    type: "text",
                    text: "When providing eventType, it must include eventTypeGuid and eventCategory"
                  }]
                };
              }
            }

            try {
              // Note: The implementation will first fetch the existing event 
              // and merge your changes with the current data
              result = await this.calendarClient!.updateEvent(updateEventId, updateEventData);
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify(result, null, 2)
                }]
              };
            } catch (error: any) {
              console.error(`Error in update_event handler:`, error);
              
              // Provide more detailed error messages
              let errorMessage = `Error updating event: ${error.message || "Unknown error"}`;
              
              // Add hint for common issues
              if (error.message?.includes('not found') || error.message?.includes('404')) {
                errorMessage += "\nHint: The event may not exist or you may not have permission to update it.";
              } else if (error.message?.includes('startDateTimeUtc') || error.message?.includes('startDateTimeFlt')) {
                errorMessage += "\nHint: There may be an issue with the date format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ).";
              } else if (error.message?.includes('appointment')) {
                errorMessage += "\nHint: Make sure appointment-specific fields are provided for appointment events.";
              }
              
              return {
                content: [{
                  type: "text",
                  text: errorMessage
                }]
              };
            }
          case "find_payers":
            const payerSearchParams = (request.params?.arguments || {}) as PayerSearchParams;
            result = await this.payerClient!.findPayers(payerSearchParams);
            return {
              content: [{
                type: "text",
                text: JSON.stringify(result, null, 2)
              }]
            };
          case "get_payer":
            const { payerGuid } = request.params?.arguments || {};
            
            if (!payerGuid) {
              return {
                content: [{
                  type: "text",
                  text: "Payer GUID is required"
                }]
              };
            }

            try {
              const payerResult = await this.payerClient!.getPayer(payerGuid);
              
              // Ensure we have a properly formatted response
              if (!payerResult) {
                return {
                  content: [{
                    type: "text",
                    text: "No payer found with the specified GUID"
                  }]
                };
              }
              
              // Make sure the response exactly matches the expected format
              const responseText = JSON.stringify(payerResult, null, 2);
              
              console.log("Payer API response:", responseText);
              
              return {
                content: [{
                  type: "text",
                  text: responseText
                }]
              };
            } catch (error: any) {
              console.error(`Error in get_payer handler:`, error);
              return {
                content: [{
                  type: "text",
                  text: `Error fetching payer: ${error.message || "Unknown error"}`
                }]
              };
            }
          case "get_payer_insurance_plans":
            const { payerGuid: insurancePayerGuid, restrictToPracticePreferredList } = request.params?.arguments || {};
            
            if (!insurancePayerGuid) {
              return {
                content: [{
                  type: "text",
                  text: "Payer GUID is required"
                }]
              };
            }

            try {
              const plansResult = await this.payerClient!.getInsurancePlans(insurancePayerGuid, { 
                restrictToPracticePreferredList: restrictToPracticePreferredList === true 
              });
              
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify(plansResult || { insurancePlans: [] }, null, 2)
                }]
              };
            } catch (error: any) {
              console.error(`Error in get_payer_insurance_plans handler:`, error);
              return {
                content: [{
                  type: "text",
                  text: `Error fetching insurance plans: ${error.message || "Unknown error"}`
                }]
              };
            }
          case "get_payer_insurance_plan":
            const { payerGuid: planPayerGuid, planGuid } = request.params?.arguments || {};
            
            if (!planPayerGuid) {
              return {
                content: [{
                  type: "text",
                  text: "Payer GUID is required"
                }]
              };
            }
            
            if (!planGuid) {
              return {
                content: [{
                  type: "text",
                  text: "Plan GUID is required"
                }]
              };
            }

            try {
              const planResult = await this.payerClient!.getInsurancePlan(planPayerGuid, planGuid);
              
              if (!planResult) {
                return {
                  content: [{
                    type: "text",
                    text: "No insurance plan found with the specified GUIDs"
                  }]
                };
              }
              
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify(planResult, null, 2)
                }]
              };
            } catch (error: any) {
              console.error(`Error in get_payer_insurance_plan handler:`, error);
              return {
                content: [{
                  type: "text",
                  text: `Error fetching insurance plan: ${error.message || "Unknown error"}`
                }]
              };
            }
          case "get_patient_insurance_plans":
            const { patientPracticeGuid: insurancePlanPatientGuid, coverageType, planType, orderOfBenefits, activeOnly } = request.params?.arguments || {};
            
            if (!insurancePlanPatientGuid) {
              return {
                content: [{
                  type: "text",
                  text: "Patient Practice GUID is required"
                }]
              };
            }

            try {
              const patientPlansResult = await this.payerClient!.getPatientInsurancePlans(insurancePlanPatientGuid, { 
                coverageType, 
                planType, 
                orderOfBenefits, 
                activeOnly 
              });
              
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify(patientPlansResult || { patientInsurancePlans: [] }, null, 2)
                }]
              };
            } catch (error: any) {
              console.error(`Error in get_patient_insurance_plans handler:`, error);
              return {
                content: [{
                  type: "text",
                  text: `Error fetching patient insurance plans: ${error.message || "Unknown error"}`
                }]
              };
            }
          case "get_patient_insurance_plan":
            const { patientPracticeGuid: specificPatientGuid, patientInsurancePlanGuid } = request.params?.arguments || {};
            
            if (!specificPatientGuid) {
              return {
                content: [{
                  type: "text",
                  text: "Patient Practice GUID is required"
                }]
              };
            }
            
            if (!patientInsurancePlanGuid) {
              return {
                content: [{
                  type: "text",
                  text: "Patient Insurance Plan GUID is required"
                }]
              };
            }

            try {
              const patientPlanResult = await this.payerClient!.getPatientInsurancePlan(specificPatientGuid, patientInsurancePlanGuid);
              
              if (!patientPlanResult) {
                return {
                  content: [{
                    type: "text",
                    text: "No patient insurance plan found with the specified GUIDs"
                  }]
                };
              }
              
              return {
                content: [{
                  type: "text",
                  text: JSON.stringify(patientPlanResult, null, 2)
                }]
              };
            } catch (error: any) {
              console.error(`Error in get_patient_insurance_plan handler:`, error);
              return {
                content: [{
                  type: "text",
                  text: `Error fetching patient insurance plan: ${error.message || "Unknown error"}`
                }]
              };
            }
          case "create_patient_insurance_plan":
            const { patientPracticeGuid: newPlanPatientGuid, ...insurancePlanData } = request.params?.arguments || {};
            
            if (!newPlanPatientGuid) {
              return {
                content: [{
                  type: "text",
                  text: "Patient Practice GUID is required"
                }]
              };
            }
            
            if (!insurancePlanData || Object.keys(insurancePlanData).length === 0) {
              return {
                content: [{
                  type: "text",
                  text: "Insurance plan data is required"
                }]
              };
            }
            
            // Basic validation for required fields
            const requiredFields = ['relationshipToInsured', 'insuredId', 'orderOfBenefits', 
                                    'coverageStartDate', 'coPayType', 'baseCopay', 'insurancePlan'];
            
            const missingFields = requiredFields.filter(field => !insurancePlanData[field]);
            if (missingFields.length > 0) {
              return {
                content: [{
                  type: "text",
                  text: `Missing required fields: ${missingFields.join(', ')}`
                }]
              };
            }
            
            // Additional validation for insurance plan
            if (!insurancePlanData.insurancePlan?.planGuid || 
                !insurancePlanData.insurancePlan?.payerGuid || 
                !insurancePlanData.insurancePlan?.coverageType || 
                !insurancePlanData.insurancePlan?.planType) {
              return {
                content: [{
                  type: "text",
                  text: "Insurance plan must include planGuid, payerGuid, coverageType, and planType"
                }]
              };
            }

            try {
              // Cast the data to the correct type and include the patientPracticeGuid
              const fullPlanData = {
                patientPracticeGuid: newPlanPatientGuid,
                relationshipToInsured: insurancePlanData.relationshipToInsured,
                insuredId: insurancePlanData.insuredId,
                orderOfBenefits: insurancePlanData.orderOfBenefits,
                coverageStartDate: insurancePlanData.coverageStartDate,
                coPayType: insurancePlanData.coPayType,
                baseCopay: insurancePlanData.baseCopay,
                insurancePlan: insurancePlanData.insurancePlan,
                ...('groupNumber' in insurancePlanData && { groupNumber: insurancePlanData.groupNumber }),
                ...('coverageEndDate' in insurancePlanData && { coverageEndDate: insurancePlanData.coverageEndDate }),
                ...('nameOfEmployer' in insurancePlanData && { nameOfEmployer: insurancePlanData.nameOfEmployer }),
                ...('comments' in insurancePlanData && { comments: insurancePlanData.comments }),
                ...('isActive' in insurancePlanData && { isActive: insurancePlanData.isActive }),
                ...('claimNumber' in insurancePlanData && { claimNumber: insurancePlanData.claimNumber }),
                ...('employerContact' in insurancePlanData && { employerContact: insurancePlanData.employerContact }),
                ...('subscriber' in insurancePlanData && { subscriber: insurancePlanData.subscriber })
              };
              
              result = await this.payerClient!.createPatientInsurancePlan(newPlanPatientGuid, fullPlanData);
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
                  text: `Error creating patient insurance plan: ${error.message}`
                }]
              };
            }
          default:
            throw new Error(`Unknown tool: ${request.params?.name}`);
        }
      });
    });
  }
} 