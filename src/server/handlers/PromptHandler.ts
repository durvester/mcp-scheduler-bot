import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Prompt,
  PromptArgument,
  GetPromptResult,
  PromptMessage,
  TextContent,
  ResourceContents
} from "@modelcontextprotocol/sdk/types.js";
import { AuthConfig } from "../utils/AuthConfig.js";
import { Logger } from "../utils/Logger.js";
import { BaseToolHandler } from "./BaseToolHandler.js";
import { Auth } from "../utils/Auth.js";

export class PromptHandler extends BaseToolHandler {
  
  constructor(authConfig: AuthConfig, baseUrl: string, sharedAuth: Auth) {
    super(authConfig, baseUrl, 'PromptHandler', sharedAuth);
  }

  register(server: Server): void {
    this.logger.debug('Registering MCP prompt handlers...');

    // List available prompts
    server.setRequestHandler(ListPromptsRequestSchema, async () => {
      this.logger.debug('Handling prompts/list request');
      
      const prompts: Prompt[] = [
        // Scheduling Prompts
        {
          name: "schedule-appointment",
          description: "Interactive workflow to schedule a new patient appointment with validation and availability checking",
          arguments: [
            {
              name: "patientInfo",
              description: "Patient identifier (GUID) or search criteria (name, DOB) to find the patient",
              required: true
            },
            {
              name: "appointmentType",
              description: "Type of appointment or reason for visit",
              required: false
            },
            {
              name: "preferredDate",
              description: "Preferred appointment date (YYYY-MM-DD format)",
              required: false
            },
            {
              name: "preferredProvider",
              description: "Preferred provider name or GUID",
              required: false
            },
            {
              name: "facilityPreference",
              description: "Preferred facility name or GUID",
              required: false
            }
          ]
        },
        {
          name: "reschedule-appointment",
          description: "Guide through rescheduling an existing appointment with conflict checking",
          arguments: [
            {
              name: "eventId",
              description: "ID of the appointment to reschedule",
              required: true
            },
            {
              name: "newDate",
              description: "New preferred appointment date (YYYY-MM-DD format)",
              required: false
            },
            {
              name: "reason",
              description: "Reason for rescheduling",
              required: false
            }
          ]
        },
        {
          name: "check-availability",
          description: "Check provider availability and suggest optimal appointment slots",
          arguments: [
            {
              name: "providerGuid",
              description: "Provider's unique identifier",
              required: true
            },
            {
              name: "startDate",
              description: "Start date for availability check (YYYY-MM-DD format)",
              required: true
            },
            {
              name: "endDate",
              description: "End date for availability check (YYYY-MM-DD format)",
              required: true
            },
            {
              name: "appointmentDuration",
              description: "Desired appointment duration (e.g., '0:30:00' for 30 minutes)",
              required: false
            }
          ]
        },

        // Patient Management Prompts
        {
          name: "patient-intake",
          description: "Complete new patient registration workflow with data validation and insurance setup",
          arguments: [
            {
              name: "patientName",
              description: "Patient's full name",
              required: true
            },
            {
              name: "contactInfo",
              description: "Patient's phone number and/or email",
              required: true
            },
            {
              name: "hasInsurance",
              description: "Whether the patient has insurance coverage (true/false)",
              required: false
            }
          ]
        },
        {
          name: "update-patient-info",
          description: "Guided workflow for updating patient demographics, contact info, or insurance",
          arguments: [
            {
              name: "patientGuid",
              description: "Patient's unique identifier",
              required: true
            },
            {
              name: "updateType",
              description: "Type of update needed (contact, demographics, insurance, all)",
              required: false
            }
          ]
        },
        {
          name: "insurance-verification",
          description: "Step-by-step insurance verification and plan setup process",
          arguments: [
            {
              name: "patientGuid",
              description: "Patient's unique identifier",
              required: true
            },
            {
              name: "insuranceInfo",
              description: "Insurance card details or payer information",
              required: false
            }
          ]
        },

        // Administrative Prompts
        {
          name: "daily-schedule-review",
          description: "Comprehensive daily schedule summary with provider workload and appointment details",
          arguments: [
            {
              name: "facilityGuid",
              description: "Facility GUID for schedule review",
              required: true
            },
            {
              name: "date",
              description: "Date for schedule review (YYYY-MM-DD format, defaults to today)",
              required: false
            }
          ]
        },
        {
          name: "patient-search-optimization",
          description: "Help optimize patient search strategies with tips and best practices",
          arguments: [
            {
              name: "searchIssue",
              description: "Description of the search problem or criteria that's not working",
              required: true
            }
          ]
        },
        {
          name: "appointment-status-update",
          description: "Guide through updating appointment status (confirmed, in-lobby, in-room, completed, cancelled)",
          arguments: [
            {
              name: "eventId",
              description: "ID of the appointment to update",
              required: true
            },
            {
              name: "newStatus",
              description: "New appointment status",
              required: false
            }
          ]
        }
      ];

      return { prompts };
    });

    // Get specific prompt
    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.logger.debug('Handling prompts/get request', { name, args });

      try {
        switch (name) {
          case "schedule-appointment":
            return this.generateScheduleAppointmentPrompt(args);
          case "reschedule-appointment":
            return this.generateRescheduleAppointmentPrompt(args);
          case "check-availability":
            return this.generateCheckAvailabilityPrompt(args);
          case "patient-intake":
            return this.generatePatientIntakePrompt(args);
          case "update-patient-info":
            return this.generateUpdatePatientInfoPrompt(args);
          case "insurance-verification":
            return this.generateInsuranceVerificationPrompt(args);
          case "daily-schedule-review":
            return this.generateDailyScheduleReviewPrompt(args);
          case "patient-search-optimization":
            return this.generatePatientSearchOptimizationPrompt(args);
          case "appointment-status-update":
            return this.generateAppointmentStatusUpdatePrompt(args);
          default:
            throw new Error(`Unknown prompt: ${name}`);
        }
      } catch (error) {
        this.logger.error('Error generating prompt', { name, args }, error as Error);
        throw error;
      }
    });

    this.logger.debug('Prompt handlers registered successfully');
  }

  private generateScheduleAppointmentPrompt(args?: Record<string, string>): GetPromptResult {
    const patientInfo = args?.patientInfo || "[Patient information needed]";
    const appointmentType = args?.appointmentType || "[To be determined]";
    const preferredDate = args?.preferredDate || "[To be determined]";
    const preferredProvider = args?.preferredProvider || "[To be determined]";
    const facilityPreference = args?.facilityPreference || "[To be determined]";

    const messages: PromptMessage[] = [
      {
        role: "user",
        content: {
          type: "text",
          text: `I need to schedule an appointment with the following requirements:

Patient: ${patientInfo}
Appointment Type: ${appointmentType}
Preferred Date: ${preferredDate}
Preferred Provider: ${preferredProvider}
Facility Preference: ${facilityPreference}

Please help me through the scheduling process step by step. Start by:
1. Finding/verifying the patient information
2. Checking available appointment types and event types
3. Checking provider availability
4. Confirming facility details
5. Creating the appointment with all required details

Use the available Practice Fusion MCP tools to gather information and create the appointment. Validate all data before proceeding with each step.`
        } as TextContent
      },
      {
        role: "user",
        content: {
          type: "resource",
          resource: {
            uri: "practice://event-types",
            text: "Reference available appointment types and their details"
          }
        }
      },
      {
        role: "user",
        content: {
          type: "resource",
          resource: {
            uri: "practice://facilities",
            text: "Reference available facilities and their information"
          }
        }
      }
    ];

    return {
      description: "Interactive appointment scheduling workflow with validation",
      messages
    };
  }

  private generateRescheduleAppointmentPrompt(args?: Record<string, string>): GetPromptResult {
    const eventId = args?.eventId || "[Event ID needed]";
    const newDate = args?.newDate || "[New date to be determined]";
    const reason = args?.reason || "[Optional]";

    const messages: PromptMessage[] = [
      {
        role: "user",
        content: {
          type: "text",
          text: `I need to reschedule an existing appointment:

Event ID: ${eventId}
New Preferred Date: ${newDate}
Reason for Rescheduling: ${reason}

Please help me reschedule this appointment by:
1. First retrieving the current appointment details
2. Checking the provider's availability for the new date
3. Verifying there are no conflicts
4. Updating the appointment with the new time
5. Confirming the changes with the patient if needed

Use the get_event tool to retrieve current details, then query_events to check availability, and finally update_event to make the changes.`
        } as TextContent
      }
    ];

    return {
      description: "Appointment rescheduling workflow with conflict checking",
      messages
    };
  }

  private generateCheckAvailabilityPrompt(args?: Record<string, string>): GetPromptResult {
    const providerGuid = args?.providerGuid || "[Provider GUID needed]";
    const startDate = args?.startDate || "[Start date needed]";
    const endDate = args?.endDate || "[End date needed]";
    const duration = args?.appointmentDuration || "0:30:00";

    const messages: PromptMessage[] = [
      {
        role: "user",
        content: {
          type: "text",
          text: `I need to check provider availability:

Provider GUID: ${providerGuid}
Date Range: ${startDate} to ${endDate}
Appointment Duration: ${duration}

Please analyze the provider's availability by:
1. Querying existing appointments and blocked time in the date range
2. Identifying open slots that can accommodate the requested duration
3. Suggesting optimal appointment times based on the schedule gaps
4. Providing a summary of the provider's workload during this period

Use the query_events tool to get the provider's current schedule and calendar://availability resource for detailed analysis.`
        } as TextContent
      },
      {
        role: "user",
        content: {
          type: "resource",
          resource: {
            uri: `calendar://availability/${providerGuid}/${startDate}/${endDate}`,
            text: "Provider availability analysis with current schedule"
          }
        }
      }
    ];

    return {
      description: "Provider availability checking with optimal slot suggestions",
      messages
    };
  }

  private generatePatientIntakePrompt(args?: Record<string, string>): GetPromptResult {
    const patientName = args?.patientName || "[Patient name needed]";
    const contactInfo = args?.contactInfo || "[Contact information needed]";
    const hasInsurance = args?.hasInsurance || "unknown";

    const messages: PromptMessage[] = [
      {
        role: "user",
        content: {
          type: "text",
          text: `I need to register a new patient:

Patient Name: ${patientName}
Contact Information: ${contactInfo}
Has Insurance: ${hasInsurance}

Please guide me through the complete patient registration process:

1. **Patient Demographics Setup:**
   - Collect and validate required information (name, DOB, sex, address)
   - Ensure all required fields are properly formatted
   - Validate phone numbers (10 digits), email format, and address details

2. **Contact Information:**
   - Set up primary contact methods (phone, email)
   - Configure address information with proper state codes and ZIP validation
   - Set communication preferences

3. **Insurance Setup (if applicable):**
   - Search for the patient's insurance payer
   - Set up insurance plan details
   - Configure coverage information and copay details

4. **Create Patient Record:**
   - Use the create_patient_v4 tool with all collected information
   - Validate the creation was successful
   - Provide the new patient's GUID for future reference

Please ensure all data is validated before creating the patient record. Use the find_payers tool if insurance setup is needed.`
        } as TextContent
      },
      {
        role: "user",
        content: {
          type: "resource",
          resource: {
            uri: "payers://directory",
            text: "Available insurance payers for patient setup"
          }
        }
      }
    ];

    return {
      description: "Complete new patient registration workflow with validation",
      messages
    };
  }

  private generateUpdatePatientInfoPrompt(args?: Record<string, string>): GetPromptResult {
    const patientGuid = args?.patientGuid || "[Patient GUID needed]";
    const updateType = args?.updateType || "all";

    const messages: PromptMessage[] = [
      {
        role: "user",
        content: {
          type: "text",
          text: `I need to update patient information:

Patient GUID: ${patientGuid}
Update Type: ${updateType}

Please help me update the patient's information by:

1. **Retrieving Current Information:**
   - Get the patient's current profile, contact, and demographics data
   - Review existing information to identify what needs updating

2. **Guided Updates Based on Type:**
   - For contact updates: phone numbers, email, address changes
   - For demographics: race, ethnicity, language preferences
   - For profile updates: name changes, birth date corrections
   - For insurance: add/update insurance plans

3. **Validation and Update:**
   - Validate all new information follows required formats
   - Use update_patient_v4 tool to apply changes
   - Confirm updates were successful

Start by retrieving the current patient information, then guide me through the specific updates needed.`
        } as TextContent
      },
      {
        role: "user",
        content: {
          type: "resource",
          resource: {
            uri: `patient://profile/${patientGuid}`,
            text: "Current patient profile and contact information"
          }
        }
      }
    ];

    return {
      description: "Guided patient information update workflow",
      messages
    };
  }

  private generateInsuranceVerificationPrompt(args?: Record<string, string>): GetPromptResult {
    const patientGuid = args?.patientGuid || "[Patient GUID needed]";
    const insuranceInfo = args?.insuranceInfo || "[Insurance details to be collected]";

    const messages: PromptMessage[] = [
      {
        role: "user",
        content: {
          type: "text",
          text: `I need to verify and set up insurance for a patient:

Patient GUID: ${patientGuid}
Insurance Information: ${insuranceInfo}

Please guide me through the insurance verification process:

1. **Current Insurance Review:**
   - Check existing insurance plans for this patient
   - Identify active vs. inactive plans
   - Review coverage gaps or overlaps

2. **New Insurance Verification:**
   - Search for the insurance payer in the system
   - Verify plan details and coverage types
   - Confirm patient eligibility and relationship to insured

3. **Insurance Plan Setup:**
   - Collect required information (member ID, group number, etc.)
   - Set proper order of benefits (Primary/Secondary/Tertiary)
   - Configure copay and coverage details
   - Set effective dates

4. **Create Insurance Plan:**
   - Use create_patient_insurance_plan tool with verified information
   - Validate the plan was created successfully

Use the get_patient_insurance_plans tool to review current coverage and find_payers to locate the correct insurance provider.`
        } as TextContent
      },
      {
        role: "user",
        content: {
          type: "resource",
          resource: {
            uri: `patient://insurance/${patientGuid}`,
            text: "Current patient insurance plans and coverage details"
          }
        }
      }
    ];

    return {
      description: "Step-by-step insurance verification and setup workflow",
      messages
    };
  }

  private generateDailyScheduleReviewPrompt(args?: Record<string, string>): GetPromptResult {
    const facilityGuid = args?.facilityGuid || "[Facility GUID needed]";
    const date = args?.date || new Date().toISOString().split('T')[0];

    const messages: PromptMessage[] = [
      {
        role: "user",
        content: {
          type: "text",
          text: `I need a comprehensive daily schedule review:

Facility: ${facilityGuid}
Date: ${date}

Please provide a detailed schedule analysis including:

1. **Schedule Overview:**
   - Total appointments and blocked time slots
   - Provider workload distribution
   - Appointment types and durations

2. **Provider Analysis:**
   - Each provider's schedule and patient load
   - Utilization rates and availability gaps
   - Potential scheduling conflicts or issues

3. **Operational Insights:**
   - Peak appointment times
   - No-shows or cancellations (if status indicates)
   - Room/resource utilization

4. **Action Items:**
   - Suggest optimizations for the schedule
   - Identify opportunities for additional bookings
   - Flag any potential issues requiring attention

Use the facility schedule resource and query events by provider to gather comprehensive data.`
        } as TextContent
      },
      {
        role: "user",
        content: {
          type: "resource",
          resource: {
            uri: `calendar://schedule/${facilityGuid}/${date}`,
            text: "Complete daily schedule for analysis"
          }
        }
      }
    ];

    return {
      description: "Comprehensive daily schedule analysis and review",
      messages
    };
  }

  private generatePatientSearchOptimizationPrompt(args?: Record<string, string>): GetPromptResult {
    const searchIssue = args?.searchIssue || "[Describe the search problem]";

    const messages: PromptMessage[] = [
      {
        role: "user",
        content: {
          type: "text",
          text: `I'm having trouble finding patients with my current search approach:

Search Issue: ${searchIssue}

Please help me optimize my patient search strategy by:

1. **Understanding the Search Problem:**
   - Analyze the current search criteria being used
   - Identify why the search might not be returning expected results

2. **Search Best Practices:**
   - Explain how different search fields work (AND vs OR conditions)
   - Provide guidance on effective search combinations
   - Suggest alternative search approaches

3. **Practical Tips:**
   - Name variations and partial matching strategies
   - Date format requirements and flexible date searching
   - Using multiple search criteria effectively
   - Common data entry variations to account for

4. **Specific Recommendations:**
   - Suggest specific search parameter combinations
   - Provide examples of effective search queries
   - Recommend fallback strategies if initial searches fail

The search_patients tool supports: FirstName, LastName, MiddleName, Sex, BirthDate (OR condition), SocialSecurityNumber, PatientRecordNumber, PatientPracticeGuid, PracticeGuid, and IsActive filters.

Remember: First name, last name, and gender work as AND conditions, while birth date works as an OR condition.`
        } as TextContent
      }
    ];

    return {
      description: "Patient search optimization guidance and best practices",
      messages
    };
  }

  private generateAppointmentStatusUpdatePrompt(args?: Record<string, string>): GetPromptResult {
    const eventId = args?.eventId || "[Event ID needed]";
    const newStatus = args?.newStatus || "[Status to be determined]";

    const messages: PromptMessage[] = [
      {
        role: "user",
        content: {
          type: "text",
          text: `I need to update an appointment status:

Event ID: ${eventId}
New Status: ${newStatus}

Please guide me through updating the appointment status:

1. **Current Appointment Review:**
   - Retrieve current appointment details and status
   - Review patient information and appointment type
   - Check current status and confirmation details

2. **Status Update Options:**
   Available statuses include:
   - Pending: Initial appointment status
   - Confirmed: Appointment confirmed by patient
   - InLobby: Patient has arrived and is waiting
   - InRoom: Patient is with the provider
   - Completed: Appointment has been completed
   - Cancelled: Appointment was cancelled
   - NoShow: Patient didn't show up

3. **Update Process:**
   - Select appropriate status based on situation
   - Add any required notes or reasons (for cancellations/no-shows)
   - Include room location if status is "InRoom"
   - Update confirmation details if needed

4. **Confirmation:**
   - Apply the status update using update_event tool
   - Verify the update was successful
   - Provide confirmation of the status change

Use get_event to retrieve current details, then update_event to apply the status change.`
        } as TextContent
      }
    ];

    return {
      description: "Appointment status update workflow with validation",
      messages
    };
  }

  getToolNames(): string[] {
    return []; // Prompts don't have tool names
  }

  async handleTool(): Promise<any> {
    throw new Error('PromptHandler does not handle tool calls');
  }
}