export const PRACTICE_FUSION_TOOLS = [
  {
    name: "get_users",
    description: "Get all users in the Practice Fusion practice",
    inputSchema: {
      type: "object",
      properties: {
        includeFields: {
          type: "array",
          items: { 
            type: "string",
            enum: ["profile", "login", "roles"]
          },
          description: "Fields to include in the response"
        }
      },
      required: []
    }
  },
  {
    name: "get_facilities",
    description: "Get all facilities in the Practice Fusion practice",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["active", "inactive"],
          description: "Filter facilities by status"
        },
        includeDetails: {
          type: "boolean",
          description: "Include detailed facility information"
        }
      },
      required: []
    }
  },
  {
    name: "search_patients",
    description: "Search for patients in the Practice Fusion practice. Note: First name, last name, and gender work like AND conditions, while birth date works like OR condition.",
    inputSchema: {
      type: "object",
      properties: {
        Sex: {
          type: "string",
          description: "The sex of the patient (male/female/unknown)"
        },
        FirstName: {
          type: "string",
          description: "The first name of the patient"
        },
        LastName: {
          type: "string",
          description: "The last name of the patient"
        },
        MiddleName: {
          type: "string",
          description: "The middle name of the patient"
        },
        SocialSecurityNumber: {
          type: "string",
          description: "The social security number of the patient (requires patient:r_ssn_v3 scope)"
        },
        BirthDate: {
          type: "string",
          description: "The birth date of the patient (works as OR condition)"
        },
        PatientRecordNumber: {
          type: "string",
          description: "The unique record number of the patient"
        },
        PatientPracticeGuid: {
          type: "string",
          description: "The unique identifier of the patient's practice"
        },
        IsActive: {
          type: "boolean",
          description: "Indicates whether the patient is active"
        },
        PracticeGuid: {
          type: "string",
          description: "The unique identifier of the practice associated with the patient"
        },
        onlyActive: {
          type: "boolean",
          description: "Whether to return only active patients (defaults to true)",
          default: true
        }
      },
      required: []
    }
  },
  {
    name: "get_patient_v4",
    description: "Get a patient by their Practice Fusion ID using the v4 API. Always includes profile, contact, and demographics information.",
    inputSchema: {
      type: "object",
      properties: {
        patientPracticeGuid: {
          type: "string",
          description: "The unique identifier of the patient",
          format: "uuid"
        },
        fields: {
          type: "array",
          items: {
            type: "string",
            enum: ["profile", "contact", "demographics"]
          },
          description: "Additional fields to include in the response. Note: profile, contact, and demographics are always included."
        }
      },
      required: ["patientPracticeGuid"]
    }
  }
]; 