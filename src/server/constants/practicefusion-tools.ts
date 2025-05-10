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
  },
  {
    name: "create_patient_v4",
    description: "Create a new patient in the Practice Fusion practice using the v4 API. Note: Phone numbers must be 10 digits, dates must be in MM/DD/YYYY format, and state codes must be valid two-letter US state codes.",
    inputSchema: {
      type: "object",
      properties: {
        profile: {
          type: "object",
          properties: {
            firstName: {
              type: "string",
              description: "Patient's first name"
            },
            lastName: {
              type: "string",
              description: "Patient's last name"
            },
            sex: {
              type: "string",
              enum: ["male", "female", "unknown"],
              description: "Patient's sex (must be one of: male, female, unknown)"
            },
            birthDate: {
              type: "string",
              format: "date",
              description: "Patient's birth date in MM/DD/YYYY format"
            },
            middleName: {
              type: "string",
              description: "Patient's middle name"
            },
            patientRecordNumber: {
              type: "string",
              description: "Patient's record number"
            },
            practiceGuid: {
              type: "string",
              format: "uuid",
              description: "Practice GUID"
            },
            isActive: {
              type: "boolean",
              description: "Whether the patient is active"
            },
            nickname: {
              type: "string",
              description: "Patient's nickname"
            },
            suffix: {
              type: "string",
              description: "Patient's suffix"
            },
            prefix: {
              type: "string",
              description: "Patient's prefix"
            }
          },
          required: ["firstName", "lastName", "sex", "birthDate"]
        },
        contact: {
          type: "object",
          properties: {
            address: {
              type: "object",
              properties: {
                streetAddress1: {
                  type: "string",
                  description: "Street address line 1"
                },
                streetAddress2: {
                  type: "string",
                  description: "Street address line 2"
                },
                city: {
                  type: "string",
                  description: "City"
                },
                state: {
                  type: "string",
                  description: "Two-letter US state code (e.g., CA, NY)"
                },
                postalCode: {
                  type: "string",
                  description: "US ZIP code (5 digits or 5+4 format)"
                },
                country: {
                  type: "string",
                  description: "Country"
                }
              },
              required: ["streetAddress1", "city", "state", "postalCode"]
            },
            emailAddress: {
              type: "string",
              format: "email",
              description: "Patient's email address (required if doesNotHaveEmail is false)"
            },
            mobilePhone: {
              type: "string",
              description: "Patient's mobile phone number (10 digits, required if doesNotHaveMobilePhone is false)"
            },
            homePhone: {
              type: "string",
              description: "Patient's home phone number (10 digits)"
            },
            officePhone: {
              type: "string",
              description: "Patient's office phone number (10 digits)"
            },
            officePhoneExtension: {
              type: "string",
              description: "Patient's office phone extension"
            },
            doesNotHaveMobilePhone: {
              type: "boolean",
              description: "Set to true if patient does not have a mobile phone"
            },
            doesNotHaveEmail: {
              type: "boolean",
              description: "Set to true if patient does not have an email address"
            }
          },
          required: ["address"]
        },
        demographics: {
          type: "object",
          properties: {
            raceList: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: {
                    type: "string",
                    description: "Race code"
                  },
                  codeSystem: {
                    type: "string",
                    description: "Code system identifier"
                  },
                  description: {
                    type: "string",
                    description: "Race description"
                  }
                },
                required: ["code", "codeSystem"]
              }
            },
            ethnicityList: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: {
                    type: "string",
                    description: "Ethnicity code"
                  },
                  codeSystem: {
                    type: "string",
                    description: "Code system identifier"
                  },
                  description: {
                    type: "string",
                    description: "Ethnicity description"
                  }
                },
                required: ["code", "codeSystem"]
              }
            }
          }
        }
      },
      required: ["profile", "contact"]
    }
  },
  {
    name: "update_patient_v4",
    description: "Update an existing patient in the Practice Fusion practice using the v4 API. Note: Phone numbers must be 10 digits, dates must be in MM/DD/YYYY format, and state codes must be valid two-letter US state codes. Requires OAuth2 scopes: patient:a_contact_v4, patient:a_ssn_v3, patient:a_demographics_v1, patient:a_active_status_v1. Returns the updated patient data including lastModifiedDateTimeUtc.",
    inputSchema: {
      type: "object",
      properties: {
        patientPracticeGuid: {
          type: "string",
          format: "uuid",
          description: "The unique identifier of the patient to update"
        },
        profile: {
          type: "object",
          properties: {
            firstName: {
              type: "string",
              description: "Patient's first name"
            },
            lastName: {
              type: "string",
              description: "Patient's last name"
            },
            sex: {
              type: "string",
              enum: ["male", "female", "unknown"],
              description: "Patient's sex (must be one of: male, female, unknown)"
            },
            birthDate: {
              type: "string",
              format: "date",
              description: "Patient's birth date in MM/DD/YYYY format"
            },
            middleName: {
              type: "string",
              description: "Patient's middle name"
            },
            patientRecordNumber: {
              type: "string",
              description: "Patient's record number"
            },
            practiceGuid: {
              type: "string",
              format: "uuid",
              description: "Practice GUID"
            },
            isActive: {
              type: "boolean",
              description: "Whether the patient is active"
            },
            nickname: {
              type: "string",
              description: "Patient's nickname"
            },
            suffix: {
              type: "string",
              description: "Patient's suffix"
            },
            prefix: {
              type: "string",
              description: "Patient's prefix"
            },
            isMultipleBirth: {
              type: "boolean",
              description: "Indicates if the patient was born in a twin/triplet/etc. birth"
            },
            birthSequence: {
              type: "integer",
              description: "Indicates the birth sequence if multiple birth is true"
            },
            deathDate: {
              type: "string",
              format: "date",
              description: "Patient's death date in MM/DD/YYYY format"
            },
            previousFirstName: {
              type: "string",
              description: "Patient's former first name"
            },
            previousMiddleName: {
              type: "string",
              description: "Patient's former middle name"
            },
            previousLastName: {
              type: "string",
              description: "Patient's former last name"
            },
            comments: {
              type: "string",
              description: "Comments for the patient"
            }
          },
          required: ["firstName", "lastName", "sex", "birthDate"]
        },
        contact: {
          type: "object",
          properties: {
            address: {
              type: "object",
              properties: {
                streetAddress1: {
                  type: "string",
                  description: "Street address line 1"
                },
                streetAddress2: {
                  type: "string",
                  description: "Street address line 2"
                },
                city: {
                  type: "string",
                  description: "City"
                },
                state: {
                  type: "string",
                  description: "Two-letter US state code (e.g., CA, NY)"
                },
                postalCode: {
                  type: "string",
                  description: "US ZIP code (5 digits or 5+4 format)"
                },
                country: {
                  type: "string",
                  description: "Country"
                },
                notes: {
                  type: "string",
                  description: "Address notes"
                },
                effectiveStartDate: {
                  type: "string",
                  format: "date-time",
                  description: "Address effective start date"
                },
                effectiveEndDate: {
                  type: "string",
                  format: "date-time",
                  description: "Address effective end date"
                }
              },
              required: ["streetAddress1", "city", "state", "postalCode"]
            },
            emailAddress: {
              type: "string",
              format: "email",
              description: "Patient's email address (required if doesNotHaveEmail is false)"
            },
            mobilePhone: {
              type: "string",
              description: "Patient's mobile phone number (10 digits, required if doesNotHaveMobilePhone is false)"
            },
            homePhone: {
              type: "string",
              description: "Patient's home phone number (10 digits)"
            },
            officePhone: {
              type: "string",
              description: "Patient's office phone number (10 digits)"
            },
            officePhoneExtension: {
              type: "string",
              description: "Patient's office phone extension"
            },
            doesNotHaveMobilePhone: {
              type: "boolean",
              description: "Set to true if patient does not have a mobile phone"
            },
            doesNotHaveEmail: {
              type: "boolean",
              description: "Set to true if patient does not have an email address"
            },
            preferredMethodOfCommunication: {
              type: "string",
              description: "Indicates patient's preferred contact method"
            }
          },
          required: ["address"]
        },
        demographics: {
          type: "object",
          properties: {
            raceList: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: {
                    type: "string",
                    description: "Race code"
                  },
                  codeSystem: {
                    type: "string",
                    description: "Code system identifier"
                  },
                  description: {
                    type: "string",
                    description: "Race description"
                  }
                },
                required: ["code", "codeSystem"]
              }
            },
            ethnicityList: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  code: {
                    type: "string",
                    description: "Ethnicity code"
                  },
                  codeSystem: {
                    type: "string",
                    description: "Code system identifier"
                  },
                  description: {
                    type: "string",
                    description: "Ethnicity description"
                  }
                },
                required: ["code", "codeSystem"]
              }
            },
            preferredLanguage: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description: "Language code"
                },
                codeSystem: {
                  type: "string",
                  description: "Code system identifier"
                },
                description: {
                  type: "string",
                  description: "Language description"
                }
              },
              required: ["code", "codeSystem"]
            },
            sexualOrientation: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description: "Sexual orientation code"
                },
                codeSystem: {
                  type: "string",
                  description: "Code system identifier"
                },
                description: {
                  type: "string",
                  description: "Sexual orientation description"
                }
              },
              required: ["code", "codeSystem"]
            },
            genderIdentity: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description: "Gender identity code"
                },
                codeSystem: {
                  type: "string",
                  description: "Code system identifier"
                },
                description: {
                  type: "string",
                  description: "Gender identity description"
                }
              },
              required: ["code", "codeSystem"]
            }
          }
        },
        socialSecurityNumber: {
          type: "string",
          description: "The social security number of the patient (e.g., XXX-XX-XXXX). Requires patient:a_ssn_v3 scope."
        }
      },
      required: ["patientPracticeGuid", "profile", "contact"]
    }
  },
  {
    name: "get_event_types",
    description: "Get all calendar event types in the Practice Fusion practice. This includes both appointment types and blocked time types.",
    inputSchema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "query_events",
    description: "Query for existing events that match the given criteria. Returns events within the specified time range and optional filters.",
    inputSchema: {
      type: "object",
      properties: {
        minimumStartDateTimeUtc: {
          type: "string",
          format: "date-time",
          description: "The earliest UTC start date and time for the events to be returned"
        },
        maximumStartDateTimeUtc: {
          type: "string",
          format: "date-time",
          description: "The latest UTC start date and time for the events to be returned"
        },
        eventTypeCategory: {
          type: "string",
          enum: ["Appointment", "BlockedTime"],
          description: "Filter events by category (Appointment or BlockedTime)"
        },
        ehrUserGuid: {
          type: "string",
          format: "uuid",
          description: "Filter events by provider GUID"
        },
        facilityGuid: {
          type: "string",
          format: "uuid",
          description: "Filter events by facility GUID"
        }
      },
      required: ["minimumStartDateTimeUtc", "maximumStartDateTimeUtc"]
    }
  },
  {
    name: "get_event",
    description: "Retrieve a single calendar event by its ID.",
    inputSchema: {
      type: "object",
      properties: {
        eventId: {
          type: "string",
          description: "The unique identifier of the event to retrieve"
        }
      },
      required: ["eventId"]
    }
  },
  {
    name: "get_events",
    description: "Retrieve multiple calendar events by their IDs. This is more efficient than making multiple single-event requests.",
    inputSchema: {
      type: "object",
      properties: {
        eventId: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Array of event IDs to retrieve"
        }
      },
      required: ["eventId"]
    }
  },
  {
    name: "create_event",
    description: "Create a new calendar event (appointment or blocked time).",
    inputSchema: {
      type: "object",
      properties: {
        practiceGuid: {
          type: "string",
          format: "uuid",
          description: "The unique identifier of the practice where the event will be created"
        },
        ehrUserGuid: {
          type: "string",
          format: "uuid",
          description: "The provider's unique identifier"
        },
        facilityGuid: {
          type: "string",
          format: "uuid",
          description: "The facility's unique identifier"
        },
        patientPracticeGuid: {
          type: "string",
          format: "uuid",
          description: "The patient's unique identifier (required for appointments)"
        },
        chiefComplaint: {
          type: "string",
          description: "The chief complaint or reason for the appointment"
        },
        eventType: {
          type: "object",
          properties: {
            eventTypeGuid: {
              type: "string",
              format: "uuid",
              description: "The unique identifier of the event type"
            },
            eventTypeName: {
              type: "string",
              description: "The name of the event type"
            },
            eventCategory: {
              type: "string",
              enum: ["Appointment", "BlockedTime"],
              description: "The category of the event"
            }
          },
          required: ["eventTypeGuid", "eventCategory"],
          description: "The type of event to create"
        },
        startDateTimeUtc: {
          type: "string",
          format: "date-time",
          description: "The start date and time of the event in UTC"
        },
        startDateTimeFlt: {
          type: "string",
          format: "date-time",
          description: "The start date and time of the event in facility local time"
        },
        duration: {
          type: "string",
          description: "The duration of the event in time span format (e.g. '0:30:00' for 30 minutes). Must be between 1 minute and 12 hours for appointments."
        },
        appointmentConfirmation: {
          type: "object",
          properties: {
            appointmentConfirmed: {
              type: "boolean",
              description: "Whether the appointment is confirmed"
            },
            confirmationMethodCode: {
              type: "string",
              description: "The method used to confirm the appointment"
            },
            notes: {
              type: "string",
              description: "Additional notes about the confirmation"
            }
          },
          required: ["appointmentConfirmed"],
          description: "Appointment confirmation details"
        },
        appointmentStatus: {
          type: "object",
          properties: {
            statusName: {
              type: "string",
              description: "The status of the appointment (e.g., 'Pending', 'InLobby', 'InRoom')"
            },
            reasonForNoShowOrCancellation: {
              type: "string",
              description: "The reason if the appointment is cancelled or marked as no-show"
            },
            roomLocation: {
              type: "string",
              description: "The room location when status is 'InRoom'"
            }
          },
          required: ["statusName"],
          description: "Appointment status details"
        }
      },
      required: ["practiceGuid", "eventType", "startDateTimeUtc", "startDateTimeFlt", "duration"]
    }
  },
  {
    name: "update_event",
    description: "Update an existing calendar event (appointment or blocked time).",
    inputSchema: {
      type: "object",
      properties: {
        eventId: {
          type: "string",
          description: "The unique identifier of the event to update"
        },
        practiceGuid: {
          type: "string",
          format: "uuid",
          description: "The unique identifier of the practice where the event exists"
        },
        ehrUserGuid: {
          type: "string",
          format: "uuid",
          description: "The provider's unique identifier"
        },
        facilityGuid: {
          type: "string",
          format: "uuid",
          description: "The facility's unique identifier"
        },
        patientPracticeGuid: {
          type: "string",
          format: "uuid",
          description: "The patient's unique identifier (required for appointments)"
        },
        chiefComplaint: {
          type: "string",
          description: "The chief complaint or reason for the appointment"
        },
        eventType: {
          type: "object",
          properties: {
            eventTypeGuid: {
              type: "string",
              format: "uuid",
              description: "The unique identifier of the event type"
            },
            eventTypeName: {
              type: "string",
              description: "The name of the event type"
            },
            eventCategory: {
              type: "string",
              enum: ["Appointment", "BlockedTime"],
              description: "The category of the event"
            }
          },
          required: ["eventTypeGuid", "eventCategory"],
          description: "The type of event"
        },
        startDateTimeUtc: {
          type: "string",
          format: "date-time",
          description: "The start date and time of the event in UTC"
        },
        startDateTimeFlt: {
          type: "string",
          format: "date-time",
          description: "The start date and time of the event in facility local time"
        },
        duration: {
          type: "string",
          description: "The duration of the event in time span format (e.g. '0:30:00' for 30 minutes). Must be between 1 minute and 12 hours for appointments."
        },
        appointmentConfirmation: {
          type: "object",
          properties: {
            appointmentConfirmed: {
              type: "boolean",
              description: "Whether the appointment is confirmed"
            },
            confirmationMethodCode: {
              type: "string",
              description: "The method used to confirm the appointment"
            },
            notes: {
              type: "string",
              description: "Additional notes about the confirmation"
            }
          },
          required: ["appointmentConfirmed"],
          description: "Appointment confirmation details"
        },
        appointmentStatus: {
          type: "object",
          properties: {
            statusName: {
              type: "string",
              description: "The status of the appointment (e.g., 'Pending', 'InLobby', 'InRoom')"
            },
            reasonForNoShowOrCancellation: {
              type: "string",
              description: "The reason if the appointment is cancelled or marked as no-show"
            },
            roomLocation: {
              type: "string",
              description: "The room location when status is 'InRoom'"
            }
          },
          required: ["statusName"],
          description: "Appointment status details"
        }
      },
      required: ["eventId", "practiceGuid", "eventType", "startDateTimeUtc", "startDateTimeFlt", "duration"]
    }
  },
  {
    name: "find_payers",
    description: "Search for payers in the Practice Fusion system based on optional filters.",
    inputSchema: {
      type: "object",
      properties: {
        payerName: {
          type: "string",
          description: "Search for payers whose names begin with or include the specified name"
        },
        payerCode: {
          type: "string",
          description: "Search for payers with the exact specified payer code"
        },
        pageNumber: {
          type: "integer",
          description: "Page number to retrieve results for a specific page (1-200)",
          default: 1
        },
        pageSize: {
          type: "integer",
          description: "Page size to retrieve specific number of records per page (1-100)",
          default: 50
        }
      },
      required: []
    }
  },
  {
    name: "get_payer",
    description: "Retrieve a specific payer by its unique identifier.",
    inputSchema: {
      type: "object",
      properties: {
        payerGuid: {
          type: "string",
          format: "uuid",
          description: "The unique identifier of the payer to retrieve"
        }
      },
      required: ["payerGuid"]
    }
  },
  {
    name: "get_payer_insurance_plans",
    description: "Retrieve all insurance plans for a specific payer.",
    inputSchema: {
      type: "object",
      properties: {
        payerGuid: {
          type: "string",
          format: "uuid",
          description: "The unique identifier of the payer whose insurance plans to retrieve"
        },
        restrictToPracticePreferredList: {
          type: "boolean",
          description: "Whether to restrict the results to insurance plans that have been added to the practice's preferred list of plans",
          default: false
        }
      },
      required: ["payerGuid"]
    }
  },
  {
    name: "get_payer_insurance_plan",
    description: "Retrieve a specific insurance plan from a payer.",
    inputSchema: {
      type: "object",
      properties: {
        payerGuid: {
          type: "string",
          format: "uuid",
          description: "The unique identifier of the payer"
        },
        planGuid: {
          type: "string",
          format: "uuid",
          description: "The unique identifier of the insurance plan to retrieve"
        }
      },
      required: ["payerGuid", "planGuid"]
    }
  },
  {
    name: "get_patient_insurance_plans",
    description: "Retrieve insurance plans for a specific patient.",
    inputSchema: {
      type: "object",
      properties: {
        patientPracticeGuid: {
          type: "string",
          format: "uuid",
          description: "The unique identifier of the patient"
        },
        coverageType: {
          type: "string",
          description: "Filter by coverage type (e.g., 'Medical', 'Dental', 'Other')"
        },
        planType: {
          type: "string",
          description: "Filter by plan type (e.g., 'PPO', 'HMO', 'Medicare')"
        },
        orderOfBenefits: {
          type: "string",
          enum: ["Primary", "Secondary", "Tertiary", "Unknown/None"],
          description: "Filter by order of benefits"
        },
        activeOnly: {
          type: "boolean",
          description: "Filter to retrieve only active insurance plans",
          default: false
        }
      },
      required: ["patientPracticeGuid"]
    }
  },
  {
    name: "get_patient_insurance_plan",
    description: "Retrieve a specific insurance plan for a patient.",
    inputSchema: {
      type: "object",
      properties: {
        patientPracticeGuid: {
          type: "string",
          format: "uuid",
          description: "The unique identifier of the patient"
        },
        patientInsurancePlanGuid: {
          type: "string",
          format: "uuid",
          description: "The unique identifier of the patient insurance plan to retrieve"
        }
      },
      required: ["patientPracticeGuid", "patientInsurancePlanGuid"]
    }
  },
  {
    name: "create_patient_insurance_plan",
    description: "Create a new insurance plan for a patient.",
    inputSchema: {
      type: "object",
      properties: {
        patientPracticeGuid: {
          type: "string",
          format: "uuid",
          description: "The unique identifier of the patient"
        },
        relationshipToInsured: {
          type: "string",
          enum: ["Self", "Spouse", "Child", "Other"],
          description: "Relationship between the patient and the primary policyholder"
        },
        insuredId: {
          type: "string",
          description: "Unique identifier assigned to the patient by the insurance provider"
        },
        groupNumber: {
          type: "string",
          description: "Unique identifier to link patient to a specific coverage group"
        },
        orderOfBenefits: {
          type: "string",
          enum: ["Primary", "Secondary", "Tertiary", "Unknown/None"],
          description: "Sequence in which multiple insurance plans pay claims"
        },
        coverageStartDate: {
          type: "string",
          format: "date-time",
          description: "When the patient's health insurance policy becomes active (ISO 8601 format)"
        },
        coverageEndDate: {
          type: "string",
          format: "date-time",
          description: "When the patient's health insurance policy expires (ISO 8601 format)"
        },
        nameOfEmployer: {
          type: "string",
          description: "Name of the organization providing health insurance coverage"
        },
        coPayType: {
          type: "string",
          enum: ["Fixed", "Percentage"],
          description: "Type of copay (Fixed amount or Percentage)"
        },
        baseCopay: {
          type: "number",
          description: "Initial amount a patient must pay before insurance covers the remaining cost"
        },
        comments: {
          type: "string",
          description: "Additional notes about the insurance plan"
        },
        isActive: {
          type: "boolean",
          description: "Whether the insurance plan is active",
          default: true
        },
        claimNumber: {
          type: "string",
          description: "Claim number for the insurance plan"
        },
        insurancePlan: {
          type: "object",
          properties: {
            planGuid: {
              type: "string",
              format: "uuid",
              description: "The unique identifier of the insurance plan"
            },
            payerGuid: {
              type: "string",
              format: "uuid",
              description: "The unique identifier of the payer"
            },
            coverageType: {
              type: "string",
              description: "The type of coverage (e.g., 'Medical', 'Dental')"
            },
            planType: {
              type: "string",
              description: "The type of plan (e.g., 'PPO', 'HMO')"
            }
          },
          required: ["planGuid", "payerGuid", "coverageType", "planType"]
        },
        employerContact: {
          type: "object",
          properties: {
            firstName: {
              type: "string",
              description: "First name of the employer contact"
            },
            lastName: {
              type: "string",
              description: "Last name of the employer contact"
            },
            middleInitial: {
              type: "string",
              description: "Middle initial of the employer contact"
            },
            address: {
              type: "object",
              description: "Address of the employer contact",
              properties: {
                streetAddress1: {
                  type: "string",
                  description: "Street address line 1"
                },
                streetAddress2: {
                  type: "string",
                  description: "Street address line 2"
                },
                city: {
                  type: "string",
                  description: "City"
                },
                state: {
                  type: "string",
                  description: "Two-letter US state code"
                },
                postalCode: {
                  type: "string",
                  description: "US ZIP code"
                }
              }
            },
            phoneNumber: {
              type: "string",
              description: "Phone number of the employer contact"
            },
            phoneExtension: {
              type: "string",
              description: "Phone extension of the employer contact"
            },
            faxNumber: {
              type: "string",
              description: "Fax number of the employer contact"
            },
            faxExtension: {
              type: "string",
              description: "Fax extension of the employer contact"
            },
            emailAddress: {
              type: "string",
              description: "Email address of the employer contact"
            }
          },
          required: ["firstName", "lastName"]
        },
        subscriber: {
          type: "object",
          properties: {
            firstName: {
              type: "string",
              description: "First name of the subscriber"
            },
            lastName: {
              type: "string",
              description: "Last name of the subscriber"
            },
            middleInitial: {
              type: "string",
              description: "Middle initial of the subscriber"
            },
            socialSecurityNumber: {
              type: "string",
              description: "Social security number of the subscriber (format: XXX-XX-XXXX)"
            },
            birthDate: {
              type: "string",
              format: "date",
              description: "Birth date of the subscriber (ISO 8601 format)"
            },
            sex: {
              type: "string",
              enum: ["Male", "Female", "Unknown"],
              description: "Sex of the subscriber"
            },
            address: {
              type: "object",
              description: "Address of the subscriber",
              properties: {
                streetAddress1: {
                  type: "string",
                  description: "Street address line 1"
                },
                streetAddress2: {
                  type: "string",
                  description: "Street address line 2"
                },
                city: {
                  type: "string",
                  description: "City"
                },
                state: {
                  type: "string",
                  description: "Two-letter US state code"
                },
                postalCode: {
                  type: "string",
                  description: "US ZIP code"
                }
              }
            },
            primaryPhoneNumber: {
              type: "string",
              description: "Primary phone number of the subscriber"
            },
            primaryPhoneExtension: {
              type: "string",
              description: "Primary phone extension of the subscriber"
            },
            secondaryPhoneNumber: {
              type: "string",
              description: "Secondary phone number of the subscriber"
            },
            secondaryPhoneExtension: {
              type: "string",
              description: "Secondary phone extension of the subscriber"
            }
          },
          required: ["firstName", "lastName", "sex"]
        }
      },
      required: ["patientPracticeGuid", "relationshipToInsured", "insuredId", "orderOfBenefits", "coverageStartDate", "coPayType", "baseCopay", "insurancePlan"]
    }
  }
]; 