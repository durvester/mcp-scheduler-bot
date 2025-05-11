import { Auth } from './server/utils/Auth.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CalendarClient } from './server/connectors/practicefusion/CalendarClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testUpdateEvent() {
    let auth: Auth | undefined;
    let testEventId: string | undefined;
    let config: any;

    try {
        // Read config
        const configPath = path.join(__dirname, '..', 'config', 'claude_desktop_config_practicefusion.json');
        const configFile = JSON.parse(readFileSync(configPath, 'utf8'));
        config = configFile.mcpServers['practice-fusion-mcp'].env;

        // Initialize auth
        auth = new Auth({
            clientId: config.OAUTH_CLIENT_ID,
            clientSecret: config.OAUTH_CLIENT_SECRET,
            tokenHost: config.BASE_URL,
            tokenPath: config.OAUTH_TOKEN_PATH,
            authorizePath: config.OAUTH_AUTHORIZE_PATH,
            authorizationMethod: 'requestbody',
            callbackURL: config.OAUTH_CALLBACK_URL,
            callbackPort: parseInt(config.OAUTH_CALLBACK_PORT),
            scopes: config.OAUTH_SCOPES,
            audience: '' // Practice Fusion doesn't use audience
        });

        // Get initial token
        console.log('Getting initial token...');
        await auth.executeWithAuth(async () => {
            console.log('Successfully authenticated!');
        });

        // Initialize calendar client
        const calendarClient = new CalendarClient({
            baseUrl: config.BASE_URL,
            auth: auth!
        });

        // Get event types
        console.log('\nGetting event types...');
        const eventTypes = await calendarClient.getEventTypes();
        console.log('Event Types:', JSON.stringify(eventTypes, null, 2));

        // Find an appointment type
        const appointmentType = eventTypes.find(type => type.eventCategory === 'Appointment');
        if (!appointmentType) {
            throw new Error('No appointment type found');
        }

        // Create a test event
        console.log('\nCreating test event...');
        const now = new Date();
        const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
        const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes later

        const createEventRequest = {
            practiceGuid: config.PRACTICE_GUID,
            eventType: {
                eventTypeGuid: appointmentType.eventTypeGuid,
                eventTypeName: appointmentType.eventTypeName,
                eventCategory: 'Appointment' as const
            },
            startDateTimeUtc: startTime.toISOString(),
            startDateTimeFlt: startTime.toISOString(),
            duration: '0:30:00',
            chiefComplaint: 'Test appointment'
        };

        const createdEvent = await calendarClient.createEvent(createEventRequest);
        testEventId = createdEvent.event.eventId;
        console.log('Created Event:', JSON.stringify(createdEvent, null, 2));

        // Update the event
        console.log('\nUpdating event...');
        const updateEventRequest = {
            practiceGuid: config.PRACTICE_GUID,
            eventType: {
                eventTypeGuid: appointmentType.eventTypeGuid,
                eventTypeName: appointmentType.eventTypeName,
                eventCategory: 'Appointment' as const
            },
            startDateTimeUtc: startTime.toISOString(),
            startDateTimeFlt: startTime.toISOString(),
            duration: '0:30:00',
            chiefComplaint: 'Updated test appointment',
            appointmentStatus: {
                statusName: 'Pending'
            },
            appointmentConfirmation: {
                appointmentConfirmed: true,
                confirmationMethodCode: 'PGR',
                notes: 'Confirmed via test'
            }
        };

        const updatedEvent = await calendarClient.updateEvent(testEventId, updateEventRequest);
        console.log('Updated Event:', JSON.stringify(updatedEvent, null, 2));

        // Verify the update
        console.log('\nVerifying update...');
        const retrievedEvent = await calendarClient.getEvent(testEventId);
        console.log('Retrieved Event:', JSON.stringify(retrievedEvent, null, 2));

        // Verify the changes
        if (retrievedEvent.event.chiefComplaint !== 'Updated test appointment') {
            throw new Error('Chief complaint was not updated correctly');
        }
        if (retrievedEvent.event.appointmentStatus?.statusName !== 'Pending') {
            throw new Error('Appointment status was not updated correctly');
        }
        if (!retrievedEvent.event.appointmentConfirmation?.appointmentConfirmed) {
            throw new Error('Appointment confirmation was not updated correctly');
        }

        console.log('\nAll verifications passed!');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Clean up the server
        auth?.cleanup();
    }
}

testUpdateEvent().catch(console.error); 