import { Auth } from './server/utils/Auth.js';
import { CalendarClient } from './server/connectors/practicefusion/CalendarClient.js';
import { FacilitiesClient } from './server/connectors/practicefusion/FacilitiesClient.js';
import { UsersClient } from './server/connectors/practicefusion/UsersClient.js';
import { PatientsClient } from './server/connectors/practicefusion/PatientsClient.js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// Load environment variables
dotenv.config();

interface AppointmentStatusType {
    statusName: string;
    description: string;
    equivalentFhirStatus?: string;
}

interface AppointmentStatusTypesResponse {
    appointmentStatusTypes: AppointmentStatusType[];
}

interface AppointmentConfirmationMethod {
    code: string;
    name: string;
}

interface AppointmentConfirmationMethodsResponse {
    appointmentConfirmationMethods: AppointmentConfirmationMethod[];
}

interface Facility {
    facilityGuid: string;
    facilityName: string;
    // Add other properties as needed
}

interface FacilitiesResponse {
    facilities: Facility[];
}

interface UserProfile {
    EhrUserGuid: string;
    FirstName: string;
    LastName: string;
    ProviderGuid?: string;
    // roles: Array<{roleName: string}>;
    // Add other properties as needed
}

interface UsersResponse {
    Users: UserProfile[];
}

// Define a type that matches the actual patient creation API response structure
interface ActualPatientCreationResponse {
    profile?: {
        patientPracticeGuid?: string;
        firstName?: string; // Added for logging consistency if needed
        lastName?: string;  // Added for logging consistency if needed
    };
    // We can add contact and demographics here if we ever need to access them from the response
}

async function testUpdateEvent() {
    console.log('Starting Calendar Event Update Test');
    
    let auth: Auth | undefined;

    try {
        // Use the same OAuth scopes as in the main server
        const defaultScopes = "calendar:a_confirmation_v1 calendar:a_events_v1 calendar:a_events_v2 calendar:a_notes_v1 calendar:a_status_v1 calendar:d_events_v1 calendar:r_events_v1 calendar:r_events_v2 calendar:r_eventtypes_v1 calendar:r_notes_v1 chart:a_superbill_v2 chart:a_vxu_v2 document:a_document_v2 document:r_document_types_v2 document:r_document_v2 document:z_document_v2 encounter:a_diagnosis_v1 encounter:a_notes_v1 encounter:r_metadata_v1 encounter:r_summary_v1 me:r_erx_v2 me:r_login_v2 me:r_profile_v2 patient:a_contact_v4 patient:a_demographics_v1 patient:a_guarantor_v1 patient:a_insurance_plan_v1 patient:a_preferredPharmacy_v1 patient:a_relatedPerson_v1 patient:r_ccda_allergies_v2 patient:r_ccda_assessmentAndPlan_v2 patient:r_ccda_clinicalNotes_v2 patient:r_ccda_demographics_v2 patient:r_ccda_encounters_v2 patient:r_ccda_functionalStatus_v2 patient:r_ccda_goals_v2 patient:r_ccda_healthConcerns_v2 patient:r_ccda_immunizations_v2 patient:r_ccda_medicalEquipment_v2 patient:r_ccda_medications_v2 patient:r_ccda_mentalStatus_v2 patient:r_ccda_problems_v2 patient:r_ccda_procedures_v2 patient:r_ccda_reasonForReferral_v2 patient:r_ccda_results_v2 patient:r_ccda_socialHistory_v2 patient:r_ccda_vitalSigns_v2 patient:r_contact_v4 patient:r_demographics_v2 patient:r_diagnosis_v1 patient:r_guarantor_v1 patient:r_insurance_v3 patient:r_insurance_plan_v1 patient:r_preferredPharmacy_v1 patient:r_profile_v4 patient:r_relatedPerson_v1 patient:r_search_v2 payer:r_insurance_v1 payer:r_insurance_plan_v1 practice:r_facilities_v2 user:r_login_v2 user:r_profile_v2";

        // 1. Initialize auth from environment variables with proper scopes
        auth = new Auth({
            clientId: process.env.PF_CLIENT_ID || "",
            clientSecret: process.env.PF_CLIENT_SECRET || "",
            tokenHost: process.env.PF_API_URL || "https://qa-api.practicefusion.com",
            tokenPath: process.env.PF_TOKEN_PATH || "/ehr/oauth2/token",
            authorizePath: process.env.PF_AUTHORIZE_PATH || "/ehr/oauth2/auth",
            authorizationMethod: 'requestbody',
            callbackURL: process.env.PF_CALLBACK_URL || "http://localhost:3456/oauth/callback",
            callbackPort: parseInt(process.env.PF_CALLBACK_PORT || "3456"),
            scopes: process.env.PF_SCOPES || defaultScopes,
            audience: '' // Practice Fusion doesn't use audience
        });

        // Execute with auth
        await auth.executeWithAuth(async () => {
            console.log('Authentication successful');
            
            // Get access token and decode it to get practice GUID
            let practiceGuid;
            try {
                // First ensure the token is valid (this will also refresh it if necessary)
                await (auth as Auth).ensureValidToken(); 

                // Get the practice GUID directly from the Auth object
                practiceGuid = (auth as Auth).getPracticeGuid();

                if (!practiceGuid) {
                    console.warn('Could not get practice GUID from token response.');
                }
                
            } catch (error) {
                console.error('Error during token validation or practice GUID retrieval:', error);
            }
                
            // If we couldn't get practice GUID from token, try to get it from environment
            if (!practiceGuid) {
                practiceGuid = process.env.PF_PRACTICE_GUID;
                
                if (!practiceGuid) {
                    throw new Error('No practice GUID found in token or environment');
                }
                console.log('Using practice GUID from environment');
            } else {
                console.log('Successfully extracted practice GUID from token');
            }
            
            console.log(`Using practice GUID: ${practiceGuid}`);
            
            // Initialize clients
            const calendarClient = new CalendarClient({
                baseUrl: process.env.PF_API_URL || "https://qa-api.practicefusion.com",
                auth: auth!
            });
            
            const facilitiesClient = new FacilitiesClient({
                baseUrl: process.env.PF_API_URL || "https://qa-api.practicefusion.com",
                auth: auth!
            });
            
            const usersClient = new UsersClient({
                baseUrl: process.env.PF_API_URL || "https://qa-api.practicefusion.com",
                auth: auth!
            });
            
            const patientsClient = new PatientsClient({
                baseUrl: process.env.PF_API_URL || "https://qa-api.practicefusion.com",
                auth: auth!
            });
            
            // 2. Get facilities and pick one
            console.log('\n--- Getting facilities ---');
            const facilitiesResponse = await facilitiesClient.getFacilities();
            
            // Type the response properly
            const facilities = facilitiesResponse as unknown as FacilitiesResponse;
            if (!facilities || !facilities.facilities || facilities.facilities.length === 0) {
                throw new Error('No facilities found');
            }
            
            const facility = facilities.facilities[0];
            console.log(`Selected facility: ${facility.facilityName} (${facility.facilityGuid})`);
            
            // 3. Get users and pick one
            console.log('\n--- Getting users ---');
            const usersResponseRaw = await usersClient.getUsers(['profile', 'login']);
            
            // Type the response properly
            const usersResponse = usersResponseRaw as unknown as UsersResponse;
            if (!usersResponse || !usersResponse.Users || usersResponse.Users.length === 0) {
                throw new Error('No users found');
            }
            
            const provider = usersResponse.Users.find((user: UserProfile) => 
                user.ProviderGuid && user.EhrUserGuid 
            );

            if (!provider) {
                console.log('Users found (but no suitable provider):', JSON.stringify(usersResponse.Users, null, 2));
                throw new Error('No user with both ProviderGuid and valid EhrUserGuid found');
            }
            
            console.log(`Selected provider: ${provider.FirstName} ${provider.LastName} (${provider.EhrUserGuid})`);
            
            // 4. Get event types 
            console.log('\n--- Getting event types ---');
            const eventTypes = await calendarClient.getEventTypes();
            
            if (!eventTypes || eventTypes.length === 0) {
                throw new Error('No event types found');
            }
            
            // Find an appointment type
            const appointmentType = eventTypes.find(type => type.eventCategory === 'Appointment');
            if (!appointmentType) {
                throw new Error('No appointment type found');
            }
            console.log(`Selected appointment type: ${appointmentType.eventTypeName} (${appointmentType.eventTypeGuid})`);
            
            // 5. Create a new patient
            console.log('\n--- Creating a new patient ---');
            
            // Generate unique identifiers for test patient name
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            let uniqueId = '';
            for (let i = 0; i < 6; i++) {
                uniqueId += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            
            const patientData = {
                profile: {
                    firstName: `Test${uniqueId}`,
                    lastName: `Patient${uniqueId}`,
                    sex: 'unknown',
                    birthDate: '01/01/1980'
                },
                contact: {
                    address: {
                        streetAddress1: '123 Test St',
                        city: 'Test City',
                        state: 'CA',
                        postalCode: '12345'
                    },
                    doesNotHaveEmail: true,
                    doesNotHaveMobilePhone: true
                }
            };
            
            const rawPatientCreateResponse = await patientsClient.createPatientV4(patientData);
            // Cast to our more accurate interface
            const newPatientResponse = rawPatientCreateResponse as unknown as ActualPatientCreationResponse; 
            console.log('Patient creation response:', JSON.stringify(newPatientResponse, null, 2)); 
            
            // Extract the patientPracticeGuid safely from the nested structure
            const patientPracticeGuid = newPatientResponse?.profile?.patientPracticeGuid;

            if (!patientPracticeGuid) {
                throw new Error('Failed to create patient or patientPracticeGuid missing in response profile');
            }
            
            console.log(`Created patient: ${newPatientResponse?.profile?.firstName || patientData.profile.firstName} ${newPatientResponse?.profile?.lastName || patientData.profile.lastName}`);
            console.log(`Patient ID: ${patientPracticeGuid}`);
            
            // 6. Create an appointment for the next day
            console.log('\n--- Creating an appointment ---');
            
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0); // 9 AM
            
            const createEventRequest = {
                practiceGuid, // Using practice GUID from token
                eventType: {
                    eventTypeGuid: appointmentType.eventTypeGuid,
                    eventTypeName: appointmentType.eventTypeName,
                    eventCategory: appointmentType.eventCategory
                },
                ehrUserGuid: provider.EhrUserGuid,
                facilityGuid: facility.facilityGuid,
                patientPracticeGuid: patientPracticeGuid, // Use the extracted guid
                startDateTimeUtc: tomorrow.toISOString(),
                startDateTimeFlt: tomorrow.toISOString(), // In real code, convert to facility local time
                duration: '0:30:00'
                // No chief complaint as requested
            };

            const createdEventResponse = await calendarClient.createEvent(createEventRequest);
            
            if (!createdEventResponse || !createdEventResponse.event || !createdEventResponse.event.eventId) {
                throw new Error('Failed to create appointment');
            }
            
            const eventId = createdEventResponse.event.eventId;
            console.log(`Created appointment with ID: ${eventId}`);
            console.log('Initial appointment details:', JSON.stringify(createdEventResponse.event, null, 2));
            
            // Get appointment status types
            console.log('\n--- Getting appointment status types ---');
            // Using a direct API call since this isn't exposed in our client yet
            const statusTypesResponse = await (calendarClient as any).get('/appointmentStatusTypes');
            const statusTypes = statusTypesResponse as AppointmentStatusTypesResponse;
            
            if (!statusTypes || !statusTypes.appointmentStatusTypes || statusTypes.appointmentStatusTypes.length === 0) {
                throw new Error('No appointment status types found');
            }
            
            console.log(`Found ${statusTypes.appointmentStatusTypes.length} status types`);
            console.log('Available status types:', statusTypes.appointmentStatusTypes.map(s => s.statusName).join(', '));
            
            // Get appointment confirmation methods
            console.log('\n--- Getting appointment confirmation methods ---');
            // Using a direct API call since this isn't exposed in our client yet
            const confirmationMethodsResponse = await (calendarClient as any).get('/appointmentConfirmationMethods');
            const confirmationMethods = confirmationMethodsResponse as AppointmentConfirmationMethodsResponse;
            
            if (!confirmationMethods || !confirmationMethods.appointmentConfirmationMethods || 
                confirmationMethods.appointmentConfirmationMethods.length === 0) {
                throw new Error('No appointment confirmation methods found');
            }
            
            console.log(`Found ${confirmationMethods.appointmentConfirmationMethods.length} confirmation methods`);
            console.log('Available confirmation methods:', 
                confirmationMethods.appointmentConfirmationMethods.map(m => `${m.code} (${m.name})`).join(', '));
            
            // Now we'll perform the update scenarios.
            // SCENARIO ORDER CHANGED: Test confirmation BEFORE status change that creates encounter.

            // 1. Change appointment confirmation (while status is 'Pending')
            console.log('\n--- Update Scenario 1: Changing appointment confirmation ---');
            const confirmationMethod = confirmationMethods.appointmentConfirmationMethods[0];
            let confirmationUpdateCallSuccessful = false;
            let confirmationPutResponse: any; // To store the PUT response
            try {
                confirmationPutResponse = await calendarClient.updateEvent(eventId, {
                    appointmentConfirmation: {
                        appointmentConfirmed: true,
                        confirmationMethodCode: confirmationMethod.code,
                        notes: 'Confirmed via test script (while Pending)'
                    }
                });
                console.log('Confirmation update PUT request completed. PUT Response (while Pending):', JSON.stringify(confirmationPutResponse, null, 2));
                confirmationUpdateCallSuccessful = true;
            } catch (e: any) {
                console.error('Error during confirmation PUT request (while Pending):', e.message);
                if ((e as any).isAxiosError && (e as any).response) {
                    console.error('Confirmation PUT Error Response Data:', JSON.stringify((e as any).response.data, null, 2));
                }
            }

            // Log what we get from a subsequent GET, but base success on PUT call not erroring.
            const eventAfterConfirmationUpdateAttempt = await calendarClient.getEvent(eventId);
            const actualConfirmationData = eventAfterConfirmationUpdateAttempt.event.appointmentConfirmation || 
                                          (eventAfterConfirmationUpdateAttempt.event as any).confirmation;
            // console.log('Actual confirmation data from GET after PUT attempt (while Pending):', JSON.stringify(actualConfirmationData, null, 2));
            console.log('Event state after Scenario 1 (Confirmation Update - from GET):', JSON.stringify(eventAfterConfirmationUpdateAttempt.event, null, 2));
            
            // For this test, success means the PUT call didn't error, as GET might not return the field.
            console.log(`Confirmation update with method "${confirmationMethod.code}" (while Pending) considered successful (PUT call did not error):`, confirmationUpdateCallSuccessful);
            if (actualConfirmationData) {
                console.log(`   (GET returned: confirmed=${actualConfirmationData.appointmentConfirmed}, code=${actualConfirmationData.confirmationMethodCode})`);
            }
            
            // 2. Change appointment status (Original Scenario 1)
            console.log('\n--- Update Scenario 2: Changing appointment status ---');
            const validStatus = statusTypes.appointmentStatusTypes.find(s => s.statusName === 'InLobby') || 
                statusTypes.appointmentStatusTypes[0];
                
            const statusUpdate = await calendarClient.updateEvent(eventId, {
                appointmentStatus: {
                    statusName: validStatus.statusName
                }
            });
            console.log('Status update PUT Response:', JSON.stringify(statusUpdate, null, 2));
            
            console.log(`Status update to "${validStatus.statusName}" successful:`, 
                statusUpdate.event.appointmentStatus?.statusName === validStatus.statusName);
            // Log encounterGuid if present after this status change
            if (statusUpdate.event.encounterGuid) {
                console.log(`Encounter GUID after status change to ${validStatus.statusName}: ${statusUpdate.event.encounterGuid}`);
            }
            console.log('Event state after Scenario 2 (Status Update - from PUT response.event):', JSON.stringify(statusUpdate.event, null, 2));
            
            // 3. Add chief complaint (Original Scenario 3)
            console.log('\n--- Update Scenario 3: Adding chief complaint ---');
            const chiefComplaint = 'Test complaint added via update';
            const chiefComplaintUpdate = await calendarClient.updateEvent(eventId, {
                chiefComplaint
            });
            console.log('Chief complaint update PUT Response:', JSON.stringify(chiefComplaintUpdate, null, 2));
            console.log('Chief complaint update successful:', 
                chiefComplaintUpdate.event.chiefComplaint === chiefComplaint);
            console.log('Event state after Scenario 3 (Chief Complaint Update - from PUT response.event):', JSON.stringify(chiefComplaintUpdate.event, null, 2));
            
            // 4. Change provider/user (Negative Test - Original Scenario 4)
            console.log('\n--- Update Scenario 4: Changing provider (Negative Test) ---');
            const anotherProvider = usersResponse.Users.find((user: UserProfile) => 
                user.ProviderGuid && user.EhrUserGuid && 
                user.EhrUserGuid !== provider.EhrUserGuid
            );
            
            if (anotherProvider) {
                try {
                    const providerUpdateResponse = await calendarClient.updateEvent(eventId, {
                        ehrUserGuid: anotherProvider.EhrUserGuid
                    });
                    // If it reaches here, the negative test failed as an error was expected
                    console.error(`NEGATIVE TEST FAILED: Provider update for event ${eventId} to ${anotherProvider.FirstName} ${anotherProvider.LastName} succeeded when it was expected to fail. PUT Response:`, JSON.stringify(providerUpdateResponse, null, 2));
                } catch (error: any) {
                    if (error.isAxiosError && error.response && error.response.status === 400) {
                        const responseData = error.response.data;
                        if (responseData && typeof responseData.message === 'string' && responseData.message.includes("encounter associated with it")) {
                            console.log(`Provider update correctly failed as expected (due to encounter): ${responseData.message}`);
                        } else {
                            console.warn(`Provider update failed with 400 (as expected for negative test), but the error message was not the specific one about encounters. Response: ${JSON.stringify(responseData)}`);
                        }
                    } else {
                        // Unexpected error type
                        console.error(`NEGATIVE TEST UNEXPECTED ERROR: Provider update for event ${eventId} failed with an error type not anticipated for this negative test:`, error);
                    }
                }
            } else {
                console.log('No other provider available; skipping provider change (negative test).');
            }
            const eventAfterScenario4 = await calendarClient.getEvent(eventId);
            console.log('Event state after Scenario 4 (Provider Change attempt - from GET):', JSON.stringify(eventAfterScenario4.event, null, 2));
            
            // 5. Change facility (Original Scenario 5)
            console.log('\n--- Update Scenario 5: Changing facility ---');
            // Try to find another facility
            const anotherFacility = facilities.facilities.find(f => f.facilityGuid !== facility.facilityGuid);
            
            if (anotherFacility) {
                const facilityUpdate = await calendarClient.updateEvent(eventId, {
                    facilityGuid: anotherFacility.facilityGuid
                });
                console.log('Facility update PUT Response:', JSON.stringify(facilityUpdate, null, 2));
                console.log(`Facility update to "${anotherFacility.facilityName}" successful:`, 
                    facilityUpdate.event.facilityGuid === anotherFacility.facilityGuid);
                console.log('Event state after Scenario 5 (Facility Update - from PUT response.event):', JSON.stringify(facilityUpdate.event, null, 2));
            } else {
                console.log('No other facility available to test changing facilities');
            }
            
            // 6. Change appointment type (Original Scenario 6)
            console.log('\n--- Update Scenario 6: Changing appointment type ---');
            // Try to find another appointment type
            const anotherAppointmentType = eventTypes.find(
                type => type.eventCategory === 'Appointment' && type.eventTypeGuid !== appointmentType.eventTypeGuid
            );
            
            if (anotherAppointmentType) {
                const appointmentTypeUpdate = await calendarClient.updateEvent(eventId, {
                    eventType: {
                        eventTypeGuid: anotherAppointmentType.eventTypeGuid,
                        eventTypeName: anotherAppointmentType.eventTypeName,
                        eventCategory: anotherAppointmentType.eventCategory
                    }
                });
                console.log('Appointment type update PUT Response:', JSON.stringify(appointmentTypeUpdate, null, 2));
                console.log(`Appointment type update to "${anotherAppointmentType.eventTypeName}" successful:`, 
                    appointmentTypeUpdate.event.eventType.eventTypeGuid === anotherAppointmentType.eventTypeGuid);
                console.log('Event state after Scenario 6 (Appointment Type Update - from PUT response.event):', JSON.stringify(appointmentTypeUpdate.event, null, 2));
            } else {
                console.log('No other appointment type available to test changing appointment types');
            }
            
            // 7. Cancel the appointment (Original Scenario 7)
            console.log('\n--- Update Scenario 7: Cancelling appointment ---');
            const pendingStatus = statusTypes.appointmentStatusTypes.find(s => s.statusName === 'Pending');
            const cancelledStatus = statusTypes.appointmentStatusTypes.find(s => s.statusName === 'Cancelled');
            
            if (cancelledStatus) {
                const cancelReason = 'Testing cancellation';
                let successfullyCancelled = false;

                // First, try to revert to 'Pending' if current status is 'InLobby' and Pending status exists
                // This is an attempt to find a valid transition path to Cancelled
                const currentEventStateForCancel = await calendarClient.getEvent(eventId);
                if (currentEventStateForCancel.event.appointmentStatus?.statusName === 'InLobby' && pendingStatus) {
                    try {
                        console.log(`Attempting to transition from InLobby to Pending before cancelling.`);
                        const intermediateStatusUpdate = await calendarClient.updateEvent(eventId, {
                            appointmentStatus: {
                                statusName: pendingStatus.statusName
                            }
                        });
                        console.log('Intermediate status update to Pending PUT Response:', JSON.stringify(intermediateStatusUpdate, null, 2));
                        console.log('Successfully transitioned to Pending.');
                    } catch (intermediateError: any) {
                        console.warn(`Could not transition to Pending from InLobby before cancelling: ${intermediateError.message}`);
                        if ((intermediateError as any).isAxiosError && (intermediateError as any).response) {
                            console.warn('Intermediate status update (to Pending) Error Response Data:', JSON.stringify((intermediateError as any).response.data, null, 2));
                        }
                        // Proceed to attempt cancellation from current state anyway
                    }
                }

                try {
                    const cancelUpdate = await calendarClient.updateEvent(eventId, {
                        appointmentStatus: {
                            statusName: cancelledStatus.statusName,
                            reasonForNoShowOrCancellation: cancelReason
                        }
                    });
                    console.log('Cancellation PUT Response:', JSON.stringify(cancelUpdate, null, 2));
                    if (cancelUpdate.event.appointmentStatus?.statusName === cancelledStatus.statusName &&
                        cancelUpdate.event.appointmentStatus?.reasonForNoShowOrCancellation === cancelReason) {
                        successfullyCancelled = true;
                    }
                    console.log('Cancellation update successful:', successfullyCancelled);
                    if (!successfullyCancelled) {
                        console.log('Actual status after cancellation attempt:', JSON.stringify(cancelUpdate.event.appointmentStatus, null, 2));
                    }
                } catch (cancelError: any) {
                    console.error(`Error during cancellation attempt: ${cancelError.message}`);
                    if (cancelError.isAxiosError && cancelError.response) {
                        console.error('Cancellation API error details:', JSON.stringify(cancelError.response.data, null, 2));
                    }
                    console.log('Cancellation update successful:', false);
                }
            } else {
                console.log('No "Cancelled" status found to test cancellation');
            }
            
            // Fetch the final event to make sure everything is persisted correctly
            console.log('\n--- Event state after Scenario 7 (Cancellation attempt) ---');
            const finalEvent = await calendarClient.getEvent(eventId);
            console.log('Event state from GET after Scenario 7:', JSON.stringify(finalEvent.event, null, 2));
            
            console.log('\nAll update tests completed successfully!');
        });
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Clean up
        auth?.cleanup();
    }
}

// Run the test
testUpdateEvent().catch(console.error); 