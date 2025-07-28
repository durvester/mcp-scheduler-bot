import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  Resource,
  ResourceTemplate,
  ReadResourceResult
} from "@modelcontextprotocol/sdk/types.js";
import { AuthConfig } from "../utils/AuthConfig.js";
import { Logger } from "../utils/Logger.js";
import { BaseToolHandler } from "./BaseToolHandler.js";
import { Auth } from "../utils/Auth.js";
import { UsersClient } from "../clients/UsersClient.js";
import { FacilitiesClient } from "../clients/FacilitiesClient.js";
import { PatientsClient } from "../clients/PatientsClient.js";
import { CalendarClient } from "../clients/CalendarClient.js";
import { PayerClient } from "../clients/PayerClient.js";

export class ResourceHandler extends BaseToolHandler {
  private usersClient: UsersClient;
  private facilitiesClient: FacilitiesClient;
  private patientsClient: PatientsClient;
  private calendarClient: CalendarClient;
  private payerClient: PayerClient;

  constructor(authConfig: AuthConfig, baseUrl: string, sharedAuth: Auth) {
    super(authConfig, baseUrl, 'ResourceHandler', sharedAuth);
    
    this.usersClient = new UsersClient({ baseUrl, auth: sharedAuth });
    this.facilitiesClient = new FacilitiesClient({ baseUrl, auth: sharedAuth });
    this.patientsClient = new PatientsClient({ baseUrl, auth: sharedAuth });
    this.calendarClient = new CalendarClient({ baseUrl, auth: sharedAuth });
    this.payerClient = new PayerClient({ baseUrl, auth: sharedAuth });
  }

  register(server: Server): void {
    this.logger.debug('Registering MCP resource handlers...');

    // List available resources
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.logger.debug('Handling resources/list request');
      
      const resources: Resource[] = [
        // Practice Resources
        {
          uri: "practice://facilities",
          name: "Practice Facilities",
          description: "All facilities in the practice with locations, contact info, and operational details",
          mimeType: "application/json"
        },
        {
          uri: "practice://users",
          name: "Practice Users & Providers",
          description: "Directory of all users and providers with profiles, roles, and contact information",
          mimeType: "application/json"
        },
        {
          uri: "practice://event-types",
          name: "Calendar Event Types",
          description: "Available appointment types and blocked time categories for scheduling",
          mimeType: "application/json"
        },
        
        // Payer Resources
        {
          uri: "payers://directory",
          name: "Insurance Payers Directory",
          description: "Directory of available insurance payers and their coverage plans",
          mimeType: "application/json"
        }
      ];

      const resourceTemplates: ResourceTemplate[] = [
        // Patient Resources (dynamic)
        {
          uriTemplate: "patient://profile/{patientGuid}",
          name: "Patient Profile",
          description: "Complete patient information including demographics, contact details, and medical identifiers",
          mimeType: "application/json"
        },
        {
          uriTemplate: "patient://insurance/{patientGuid}",
          name: "Patient Insurance Plans",
          description: "All insurance plans and coverage details for a specific patient",
          mimeType: "application/json"
        },
        
        // Calendar Resources (dynamic)
        {
          uriTemplate: "calendar://schedule/{facilityGuid}/{date}",
          name: "Daily Facility Schedule",
          description: "Complete schedule for a facility on a specific date (YYYY-MM-DD format)",
          mimeType: "application/json"
        },
        {
          uriTemplate: "calendar://availability/{ehrUserGuid}/{startDate}/{endDate}",
          name: "Provider Availability",
          description: "Provider availability and appointments within a date range",
          mimeType: "application/json"
        }
      ];

      return {
        resources,
        resourceTemplates
      };
    });

    // Read resource contents
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      this.logger.debug('Handling resources/read request', { uri });

      try {
        if (uri.startsWith("practice://")) {
          return await this.handlePracticeResource(uri);
        } else if (uri.startsWith("patient://")) {
          return await this.handlePatientResource(uri);
        } else if (uri.startsWith("calendar://")) {
          return await this.handleCalendarResource(uri);
        } else if (uri.startsWith("payers://")) {
          return await this.handlePayerResource(uri);
        } else {
          throw new Error(`Unsupported resource URI: ${uri}`);
        }
      } catch (error) {
        this.logger.error('Error reading resource', { uri }, error as Error);
        throw error;
      }
    });

    this.logger.debug('Resource handlers registered successfully');
  }

  private async handlePracticeResource(uri: string): Promise<ReadResourceResult> {
    const path = uri.replace("practice://", "");

    switch (path) {
      case "facilities":
        return await this.executeWithAuth(async () => {
          const response = await this.facilitiesClient.getFacilities();
          const facilities = response.facilities;
          const summary = {
            totalFacilities: facilities.length,
            activeFacilities: facilities.length, // All returned facilities are assumed active
            facilities: facilities.map(f => ({
              guid: f.facilityGuid,
              name: f.facilityName,
              isPrimary: f.isPrimary,
              address: {
                address1: f.address1,
                address2: f.address2,
                city: f.city,
                state: f.state,
                postalCode: f.postalCode,
                country: f.country
              },
              phone: f.facilityPhone,
              hours: f.facilityHours
            }))
          };

          return {
            contents: [{
              uri,
              mimeType: "application/json",
              text: JSON.stringify(summary, null, 2)
            }]
          };
        });

      case "users":
        return await this.executeWithAuth(async () => {
          const response = await this.usersClient.getUsers(['profile', 'login']);
          const users = response.Users;
          const summary = {
            totalUsers: users.length,
            activeUsers: users.filter(u => u.IsActive).length,
            usersByRole: this.groupUsersByRole(users),
            users: users.map(u => ({
              guid: u.EhrUserGuid,
              name: `${u.FirstName} ${u.LastName}`,
              email: u.LoginEmailAddress,
              isActive: u.IsActive,
              isAdministrator: u.IsAdministrator,
              providerGuid: u.ProviderGuid,
              specializations: u.ProviderSpecializations,
              officePhone: u.OfficePhone
            }))
          };

          return {
            contents: [{
              uri,
              mimeType: "application/json",
              text: JSON.stringify(summary, null, 2)
            }]
          };
        });

      case "event-types":
        return await this.executeWithAuth(async () => {
          const eventTypes = await this.calendarClient.getEventTypes();
          const summary = {
            totalEventTypes: eventTypes.length,
            appointmentTypes: eventTypes.filter(et => et.eventCategory === 'Appointment'),
            blockedTimeTypes: eventTypes.filter(et => et.eventCategory === 'BlockedTime'),
            eventTypes: eventTypes.map(et => ({
              guid: et.eventTypeGuid,
              name: et.eventTypeName,
              category: et.eventCategory
            }))
          };

          return {
            contents: [{
              uri,
              mimeType: "application/json",
              text: JSON.stringify(summary, null, 2)
            }]
          };
        });

      default:
        throw new Error(`Unknown practice resource: ${path}`);
    }
  }

  private async handlePatientResource(uri: string): Promise<ReadResourceResult> {
    const path = uri.replace("patient://", "");
    const parts = path.split("/");
    
    if (parts.length !== 2) {
      throw new Error(`Invalid patient resource URI format: ${uri}`);
    }

    const [resourceType, patientGuid] = parts;
    this.validateGuid(patientGuid, 'patientGuid');

    switch (resourceType) {
      case "profile":
        return await this.executeWithAuth(async () => {
          const patient = await this.patientsClient.getPatientV4(patientGuid, ['profile', 'contact', 'demographics']);
          const summary = {
            patientGuid: patient.PatientPracticeGuid,
            profile: {
              firstName: patient.FirstName,
              lastName: patient.LastName,
              middleName: patient.MiddleName,
              sex: patient.Sex,
              birthDate: patient.BirthDate,
              patientRecordNumber: patient.PatientRecordNumber,
              isActive: patient.IsActive,
              practiceGuid: patient.PracticeGuid
            },
            contact: {
              emailAddress: patient.EmailAddress,
              homePhone: patient.HomePhone,
              officePhone: patient.OfficePhone,
              mobilePhone: patient.MobilePhone
            },
            summary: {
              fullName: `${patient.FirstName} ${patient.LastName}`,
              age: this.calculateAge(patient.BirthDate),
              primaryPhone: patient.MobilePhone || patient.HomePhone,
              primaryEmail: patient.EmailAddress,
              ssn: patient.SocialSecurityNumber
            }
          };

          return {
            contents: [{
              uri,
              mimeType: "application/json",
              text: JSON.stringify(summary, null, 2)
            }]
          };
        });

      case "insurance":
        return await this.executeWithAuth(async () => {
          const response = await this.payerClient.getPatientInsurancePlans(patientGuid);
          const insurancePlans = response.patientInsurancePlans;
          const summary = {
            patientGuid,
            totalPlans: insurancePlans.length,
            activePlans: insurancePlans.filter(p => p.isActive).length,
            plansByOrder: {
              primary: insurancePlans.filter(p => p.orderOfBenefits === 'Primary'),
              secondary: insurancePlans.filter(p => p.orderOfBenefits === 'Secondary'),
              tertiary: insurancePlans.filter(p => p.orderOfBenefits === 'Tertiary')
            },
            insurancePlans: insurancePlans.map(p => ({
              planGuid: p.patientInsurancePlanGuid,
              orderOfBenefits: p.orderOfBenefits,
              relationshipToInsured: p.relationshipToInsured,
              isActive: p.isActive,
              coverageStartDate: p.coverageStartDate,
              coverageEndDate: p.coverageEndDate,
              insurancePlan: p.insurancePlan,
              baseCopay: p.baseCopay,
              coPayType: p.coPayType
            }))
          };

          return {
            contents: [{
              uri,
              mimeType: "application/json",
              text: JSON.stringify(summary, null, 2)
            }]
          };
        });

      default:
        throw new Error(`Unknown patient resource type: ${resourceType}`);
    }
  }

  private async handleCalendarResource(uri: string): Promise<ReadResourceResult> {
    const path = uri.replace("calendar://", "");
    const parts = path.split("/");

    if (parts[0] === "schedule" && parts.length === 3) {
      const [, facilityGuid, date] = parts;
      this.validateGuid(facilityGuid, 'facilityGuid');

      return await this.executeWithAuth(async () => {
        const startDate = new Date(`${date}T00:00:00Z`);
        const endDate = new Date(`${date}T23:59:59Z`);
        
        const response = await this.calendarClient.queryEvents({
          minimumStartDateTimeUtc: startDate.toISOString(),
          maximumStartDateTimeUtc: endDate.toISOString(),
          facilityGuid
        });

        const events = response.events;
        const summary = {
          facilityGuid,
          date,
          totalEvents: events.length,
          appointments: events.filter(e => e.eventType.eventCategory === 'Appointment'),
          blockedTime: events.filter(e => e.eventType.eventCategory === 'BlockedTime'),
          eventsByProvider: this.groupEventsByProvider(events),
          schedule: events.map(e => ({
            eventId: e.eventId,
            startTime: e.startDateTimeFlt,
            duration: e.duration,
            eventType: e.eventType.eventTypeName,
            category: e.eventType.eventCategory,
            providerGuid: e.ehrUserGuid,
            patientGuid: e.patientPracticeGuid,
            status: e.appointmentStatus?.statusName,
            chiefComplaint: e.chiefComplaint
          }))
        };

        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(summary, null, 2)
          }]
        };
      });

    } else if (parts[0] === "availability" && parts.length === 4) {
      const [, ehrUserGuid, startDate, endDate] = parts;
      this.validateGuid(ehrUserGuid, 'ehrUserGuid');

      return await this.executeWithAuth(async () => {
        const response = await this.calendarClient.queryEvents({
          minimumStartDateTimeUtc: `${startDate}T00:00:00Z`,
          maximumStartDateTimeUtc: `${endDate}T23:59:59Z`,
          ehrUserGuid
        });

        const events = response.events;
        const summary = {
          ehrUserGuid,
          dateRange: { startDate, endDate },
          totalEvents: events.length,
          appointments: events.filter(e => e.eventType.eventCategory === 'Appointment').length,
          blockedTime: events.filter(e => e.eventType.eventCategory === 'BlockedTime').length,
          dailySchedule: this.groupEventsByDate(events),
          availability: this.analyzeProviderAvailability(events, startDate, endDate)
        };

        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(summary, null, 2)
          }]
        };
      });

    } else {
      throw new Error(`Invalid calendar resource URI format: ${uri}`);
    }
  }

  private async handlePayerResource(uri: string): Promise<ReadResourceResult> {
    const path = uri.replace("payers://", "");

    switch (path) {
      case "directory":
        return await this.executeWithAuth(async () => {
          const response = await this.payerClient.findPayers();
          const payers = response.payers;
          const summary = {
            totalPayers: payers.length,
            payers: payers.map(p => ({
              payerGuid: p.payerGuid,
              payerName: p.payerName,
              clearingHouses: p.clearingHouses
            }))
          };

          return {
            contents: [{
              uri,
              mimeType: "application/json",
              text: JSON.stringify(summary, null, 2)
            }]
          };
        });

      default:
        throw new Error(`Unknown payer resource: ${path}`);
    }
  }

  // Helper methods
  private groupUsersByRole(users: any[]): Record<string, number> {
    const roleCount: Record<string, number> = {};
    users.forEach(user => {
      if (user.IsAdministrator) {
        roleCount['Administrator'] = (roleCount['Administrator'] || 0) + 1;
      }
      if (user.ProviderGuid) {
        roleCount['Provider'] = (roleCount['Provider'] || 0) + 1;
      }
      if (user.IsRequester) {
        roleCount['Requester'] = (roleCount['Requester'] || 0) + 1;
      }
    });
    return roleCount;
  }

  private groupEventsByProvider(events: any[]): Record<string, number> {
    const providerCount: Record<string, number> = {};
    events.forEach(event => {
      if (event.ehrUserGuid) {
        providerCount[event.ehrUserGuid] = (providerCount[event.ehrUserGuid] || 0) + 1;
      }
    });
    return providerCount;
  }

  private groupEventsByDate(events: any[]): Record<string, any[]> {
    const dateGroups: Record<string, any[]> = {};
    events.forEach(event => {
      const date = event.startDateTimeFlt?.split('T')[0];
      if (date) {
        if (!dateGroups[date]) dateGroups[date] = [];
        dateGroups[date].push(event);
      }
    });
    return dateGroups;
  }

  private analyzeProviderAvailability(events: any[], startDate: string, endDate: string): any {
    // Simple availability analysis
    const totalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const busyDays = Object.keys(this.groupEventsByDate(events)).length;
    
    return {
      totalDays,
      busyDays,
      availableDays: totalDays - busyDays,
      utilizationRate: busyDays / totalDays
    };
  }

  private calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  getToolNames(): string[] {
    return []; // Resources don't have tool names
  }

  async handleTool(): Promise<any> {
    throw new Error('ResourceHandler does not handle tool calls');
  }
}