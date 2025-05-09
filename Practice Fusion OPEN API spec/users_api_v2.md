Retrieve User Profile and Login Information
This endpoint makes an HTTP GET request to retrieve user information including profile and login details.
Request
Method: GET
URL: {{Base URL}}/ehr/v2/users
Query Parameters:
fields (string, required): Specifies the fields to be included in the response. Example: fields=profile,login


Response
The response will include an array of user objects, each containing the following fields:
FirstName (string): The first name of the user.
LastName (string): The last name of the user.
LoginEmailAddress (string): The email address associated with the user's login.
EhrUserGuid (string): The unique identifier for the user in the EHR system.
PracticeGuid (string): The unique identifier for the user's practice.
IsActive (boolean): Indicates whether the user is active.
IsAdministrator (boolean): Indicates whether the user has administrator privileges.
EhrEditLevel (integer): The level of edit access the user has in the EHR system.
IsRequester (boolean): Indicates whether the user is the requester.

Note: Other fields such as Sex, AuthenticationPhoneNumber, ProviderGuid, OfficePhone, PrimaryFacility, ProviderSpecializations, IsLimitedAccess, etc., may also be included in the response based on the user's profile and login information.
Examples of Response
{ "Users": [     {         "Sex": "",         "AuthenticationPhoneNumber": "",         "ProviderGuid": "",         "OfficePhone": "",         "PrimaryFacility": "",         "ProviderSpecializations": [             {                 "Specialization": "",                 "IsPrimary": true             }         ],         "IsLimitedAccess": true,         "FirstName": "",         "LastName": "",         "LoginEmailAddress": "",         "EhrUserGuid": "",         "PracticeGuid": "",         "IsActive": true,         "IsAdministrator": true,         "EhrEditLevel": 0,         "IsRequester": true     } ]}
{ "Users": [     {         "FirstName": "",         "LastName": "",         "LoginEmailAddress": "",         "EhrUserGuid": "",         "PracticeGuid": "",         "IsActive": true,         "IsAdministrator": true,         "EhrEditLevel": 0,         "IsRequester": true     } ]}





