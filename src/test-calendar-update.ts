import { Auth } from './server/utils/Auth.js';
import { CalendarClient } from './server/connectors/practicefusion/CalendarClient.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testCalendarEventUpdate() {
    console.log('Starting Calendar Event Update Test');
    
    let auth: Auth | undefined;

    try {
        // Initialize auth from environment variables
        auth = new Auth({
            clientId: process.env.PF_CLIENT_ID || "",
            clientSecret: process.env.PF_CLIENT_SECRET || "",
            tokenHost: process.env.PF_API_URL || "https://api.practicefusion.com",
            tokenPath: process.env.PF_TOKEN_PATH || "/ehr/oauth2/token",
            authorizePath: process.env.PF_AUTHORIZE_PATH || "/ehr/oauth2/auth",
            authorizationMethod: 'requestbody',
            callbackURL: process.env.PF_CALLBACK_URL || "http://localhost:3456/oauth/callback",
            callbackPort: parseInt(process.env.PF_CALLBACK_PORT || "3456"),
            scopes: process.env.PF_SCOPES || "",
            audience: '' // Practice Fusion doesn't use audience
        });

        // Execute with auth
        await auth.executeWithAuth(async () => {
            const calendarClient = new CalendarClient({
                baseUrl: process.env.PF_API_URL || "https://api.practicefusion.com",
                auth: auth!
            });

            // 1. Get event types to find an appointment type
            console.log('Fetching event types...');
            const eventTypes = await calendarClient.getEventTypes();
            const appointmentType = eventTypes.find(type => type.eventCategory === 'Appointment');
            
            if (!appointmentType) {
                throw new Error('No appointment type found');
            }
            console.log(`Using appointment type: ${appointmentType.eventTypeName}`);

            // 2. Create a test event
            console.log('Creating a test event...');
            const practiceGuid = process.env.PF_PRACTICE_GUID;
            
            if (!practiceGuid) {
                throw new Error('PF_PRACTICE_GUID is not set in environment variables');
            }

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);

            const createEventRequest = {
                practiceGuid,
                eventType: {
                    eventTypeGuid: appointmentType.eventTypeGuid,
                    eventTypeName: appointmentType.eventTypeName,
                    eventCategory: appointmentType.eventCategory
                },
                startDateTimeUtc: tomorrow.toISOString(),
                startDateTimeFlt: tomorrow.toISOString(), // In real code, this would be converted to facility local time
                duration: '0:30:00',
                chiefComplaint: 'Initial test appointment'
            };

            const createdEvent = await calendarClient.createEvent(createEventRequest);
            const eventId = createdEvent.event.eventId;
            console.log(`Created test event with ID: ${eventId}`);
            
            // Store initial structure for verification
            console.log('Initial event structure:', JSON.stringify(createdEvent, null, 2));

            // 3. Update only the chief complaint
            console.log('\nTest 1: Updating only the chief complaint...');
            const update1 = await calendarClient.updateEvent(eventId, {
                chiefComplaint: 'Updated chief complaint'
            });
            console.log('Update 1 successful:', update1.event.chiefComplaint === 'Updated chief complaint');
            
            // Verify all other fields remained intact
            const originalFields = Object.keys(createdEvent.event).filter(k => k !== 'chiefComplaint');
            let allFieldsPresent = true;
            for (const field of originalFields) {
                if (!(field in update1.event)) {
                    console.error(`Field ${field} missing in update1 response`);
                    allFieldsPresent = false;
                }
            }
            console.log('All original fields preserved:', allFieldsPresent);

            // 4. Update appointment status
            console.log('\nTest 2: Updating appointment status...');
            const update2 = await calendarClient.updateEvent(eventId, {
                appointmentStatus: {
                    statusName: 'Pending'
                }
            });
            // Verify status was updated
            console.log('Update 2 successful:', 
                update2.event.appointmentStatus?.statusName === 'Pending' &&
                update2.event.chiefComplaint === 'Updated chief complaint' // Previous update still reflected
            );

            // 5. Update appointment confirmation
            console.log('\nTest 3: Updating appointment confirmation...');
            const update3 = await calendarClient.updateEvent(eventId, {
                appointmentConfirmation: {
                    appointmentConfirmed: true,
                    confirmationMethodCode: 'PGR',
                    notes: 'Confirmed via test'
                }
            });
            // Verify confirmation was updated and previous updates preserved
            console.log('Update 3 successful:',
                update3.event.appointmentConfirmation?.appointmentConfirmed === true &&
                update3.event.appointmentConfirmation?.confirmationMethodCode === 'PGR' &&
                update3.event.appointmentStatus?.statusName === 'Pending' && // Previous update still reflected
                update3.event.chiefComplaint === 'Updated chief complaint' // Previous update still reflected
            );

            // 6. Update multiple fields at once including complex objects
            console.log('\nTest 4: Updating multiple fields at once...');
            // Move appointment to start 30 minutes later
            const laterTime = new Date(tomorrow);
            laterTime.setMinutes(laterTime.getMinutes() + 30);
            
            const update4 = await calendarClient.updateEvent(eventId, {
                startDateTimeUtc: laterTime.toISOString(),
                startDateTimeFlt: laterTime.toISOString(),
                chiefComplaint: 'Final update with multiple fields',
                appointmentStatus: {
                    statusName: 'InLobby',
                    roomLocation: 'Room 101'
                }
            });
            
            console.log('Update 4 successful:',
                update4.event.startDateTimeUtc === laterTime.toISOString() &&
                update4.event.chiefComplaint === 'Final update with multiple fields' &&
                update4.event.appointmentStatus?.statusName === 'InLobby' &&
                update4.event.appointmentStatus?.roomLocation === 'Room 101' &&
                update4.event.appointmentConfirmation?.appointmentConfirmed === true // Previous update still reflected
            );

            // 7. Fetch the final event to make sure everything is persisted correctly
            console.log('\nTest 5: Fetching final event to verify persistence...');
            const finalEvent = await calendarClient.getEvent(eventId);
            
            console.log('Final event matches last update:',
                finalEvent.event.startDateTimeUtc === laterTime.toISOString() &&
                finalEvent.event.chiefComplaint === 'Final update with multiple fields' &&
                finalEvent.event.appointmentStatus?.statusName === 'InLobby' &&
                finalEvent.event.appointmentStatus?.roomLocation === 'Room 101' &&
                finalEvent.event.appointmentConfirmation?.appointmentConfirmed === true
            );
            
            console.log('Final event structure:', JSON.stringify(finalEvent, null, 2));
            console.log('\nAll tests completed successfully!');
        });
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Clean up
        auth?.cleanup();
    }
}

// Run the test
testCalendarEventUpdate().catch(console.error); 