Get Facilities
This endpoint retrieves a list of facilities.
Request
Method: GET
URL: {{Base URL}}/ehr/v2/facilities

Response
The response for this request follows the JSON schema below:


JSON








{
  "type": "object",
  "properties": {
    "facilities": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "facilityGuid": { "type": "string" },
          "facilityName": { "type": "string" },
          "facilityPhone": { "type": "string" },
          "isPrimary": { "type": "boolean" },
          "address1": { "type": "string" },
          "address2": { "type": "string" },
          "city": { "type": "string" },
          "state": { "type": "string" },
          "postalCode": { "type": "string" },
          "country": { "type": "string" },
          "facilityHuid": { "type": "string" },
          "practiceGuid": { "type": "string" },
          "facilityHours": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "dayOfWeek": { "type": "integer" },
                "openTime": { "type": "string" },
                "closeTime": { "type": "string" }
              }
            }
          }
        }
      }
    }
  }
}


