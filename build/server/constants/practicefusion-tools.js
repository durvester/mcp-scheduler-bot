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
    }
];
