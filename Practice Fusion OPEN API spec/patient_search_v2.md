The endpoint allows you to search for patients by sending an HTTP POST request to the specified URL. The request should include parameters such as Sex, FirstName, LastName, MiddleName, SocialSecurityNumber, BirthDate, PatientRecordNumber, PatientPracticeGuid, IsActive, and PracticeGuid in the payload.


Request Body
Sex (string): The sex of the patient.
FirstName (string): The first name of the patient.
LastName (string): The last name of the patient.
MiddleName (string): The middle name of the patient.
SocialSecurityNumber (string): The social security number of the patient.
BirthDate (string): The birth date of the patient.
PatientRecordNumber (string): The unique record number of the patient.
PatientPracticeGuid (string): The unique identifier of the patient's practice.
IsActive (boolean): Indicates whether the patient is active.
PracticeGuid (string): The unique identifier of the practice associated with the patient.

Response


JSON








[
  {
    "Sex": "string",
    "FirstName": "string",
    "LastName": "string",
    "MiddleName": "string",
    "SocialSecurityNumber": "string",
    "BirthDate": "string",
    "PatientRecordNumber": "string",
    "PatientPracticeGuid": "string",
    "IsActive": true,
    "PracticeGuid": "string",
    "EmailAddress": "string",
    "HomePhone": "string",
    "OfficePhone": "string",
    "MobilePhone": "string"
  }
]


This JSON schema represents the structure of the response returned upon a successful execution. It includes attributes such as Sex, FirstName, LastName, MiddleName, SocialSecurityNumber, BirthDate, PatientRecordNumber, PatientPracticeGuid, IsActive, PracticeGuid, EmailAddress, HomePhone, OfficePhone, and MobilePhone.
The response is accompanied by a status code of 200.




curl --location 'https://qa-api.practicefusion.com//ehr/v2/patients/search' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer Byy7XZh1l3-u1gzPkNBN' \
--data '{
    "Sex": "male",
    "FirstName": "Cosmo",
    "LastName": "Kramer",
    "MiddleName": "",
    "SocialSecurityNumber": "",
    "BirthDate": "",
    "PatientRecordNumber": "",
    "IsActive": true,
    "PracticeGuid": "b4ab304f-d1ac-4565-8dca-992b589422a7"
}'
Body
{
    "Sex": "male",
    "FirstName": "Cosmo",
    "LastName": "Kramer",
    "MiddleName": "",
    "SocialSecurityNumber": "",
    "BirthDate": "",
    "PatientRecordNumber": "",
    "IsActive": true,
    "PracticeGuid": "b4ab304f-d1ac-4565-8dca-992b589422a7"
}
response
[
  {
    "Sex": "string",
    "FirstName": "string",
    "LastName": "string",
    "MiddleName": "string",
    "SocialSecurityNumber": "string",
    "BirthDate": "string",
    "PatientRecordNumber": "string",
    "PatientPracticeGuid": "string",
    "IsActive": true,
    "PracticeGuid": "string",
    "EmailAddress": "string",
    "HomePhone": "string",
    "OfficePhone": "string",
    "MobilePhone": "string"
  }
]