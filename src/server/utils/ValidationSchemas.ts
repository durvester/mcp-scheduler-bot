import { z } from 'zod';

// Common validation schemas
export const UuidSchema = z.string().uuid('Invalid UUID format');
export const EmailSchema = z.string().email('Invalid email format');
export const PhoneSchema = z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits').or(z.string().regex(/^\+?1?[- .]?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}$/, 'Phone number format invalid').transform(phone => phone.replace(/\D/g, '').slice(-10)));
export const DateSchema = z.string().regex(/^\d{1,2}\/\d{1,2}\/\d{4}$/, 'Date must be in M/D/YYYY or MM/DD/YYYY format').or(z.string().regex(/^\d{4}-\d{1,2}-\d{1,2}$/, 'Date must be in YYYY-M-D or YYYY-MM-DD format').transform(date => { const d = new Date(date); return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`; }));
export const StateCodeSchema = z.string().regex(/^[A-Za-z]{2}$/, 'State must be a valid 2-letter US state code').transform(state => state.toUpperCase());
export const ZipCodeSchema = z.string().regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be 5 digits or 5+4 format');
export const SsnSchema = z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, 'SSN must be in XXX-XX-XXXX or XXXXXXXXX format').transform(ssn => ssn.replace(/\D/g, '').replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3'));

// Patient search validation
export const PatientSearchSchema = z.object({
  Sex: z.enum(['male', 'female', 'unknown']).optional(),
  FirstName: z.string().min(1).optional(),
  LastName: z.string().min(1).optional(),
  MiddleName: z.string().optional(),
  SocialSecurityNumber: SsnSchema.optional(),
  BirthDate: DateSchema.optional(),
  PatientRecordNumber: z.string().optional(),
  PatientPracticeGuid: UuidSchema.optional(),
  IsActive: z.boolean().optional(),
  PracticeGuid: UuidSchema.optional(),
  onlyActive: z.boolean().optional().default(true)
}).refine(
  (data) => {
    // At least one search parameter (other than sex and onlyActive) must be provided
    const searchFields = ['FirstName', 'LastName', 'BirthDate', 'SocialSecurityNumber', 
                         'PatientRecordNumber', 'PatientPracticeGuid', 'PracticeGuid'];
    return searchFields.some(field => data[field as keyof typeof data]);
  },
  {
    message: 'At least one search parameter must be provided (FirstName, LastName, BirthDate, SSN, PatientRecordNumber, PatientPracticeGuid, or PracticeGuid)'
  }
);

// Patient profile validation
export const PatientProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  sex: z.enum(['male', 'female', 'unknown'], { 
    errorMap: () => ({ message: 'Sex must be one of: male, female, unknown' }) 
  }),
  birthDate: DateSchema,
  middleName: z.string().optional(),
  patientRecordNumber: z.string().optional(),
  practiceGuid: UuidSchema.optional(),
  isActive: z.boolean().optional(),
  nickname: z.string().optional(),
  suffix: z.string().optional(),
  prefix: z.string().optional(),
  isMultipleBirth: z.boolean().optional(),
  birthSequence: z.number().int().positive().optional(),
  deathDate: DateSchema.optional(),
  previousFirstName: z.string().optional(),
  previousMiddleName: z.string().optional(),
  previousLastName: z.string().optional(),
  comments: z.string().optional()
});

// Patient contact validation
export const PatientContactSchema = z.object({
  address: z.object({
    streetAddress1: z.string().min(1, 'Street address is required'),
    streetAddress2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: StateCodeSchema,
    postalCode: ZipCodeSchema,
    country: z.string().optional(),
    notes: z.string().optional(),
    effectiveStartDate: z.string().datetime().optional(),
    effectiveEndDate: z.string().datetime().optional()
  }),
  emailAddress: EmailSchema.optional(),
  mobilePhone: PhoneSchema.optional(),
  homePhone: PhoneSchema.optional(),
  officePhone: PhoneSchema.optional(),
  officePhoneExtension: z.string().optional(),
  doesNotHaveMobilePhone: z.boolean().optional(),
  doesNotHaveEmail: z.boolean().optional(),
  preferredMethodOfCommunication: z.string().optional()
}).refine(
  (data) => {
    // If doesNotHaveEmail is false or undefined, email must be provided
    if (!data.doesNotHaveEmail && !data.emailAddress) {
      return false;
    }
    // If doesNotHaveMobilePhone is false or undefined, mobile phone must be provided
    if (!data.doesNotHaveMobilePhone && !data.mobilePhone) {
      return false;
    }
    return true;
  },
  {
    message: 'Email address is required unless doesNotHaveEmail is true, and mobile phone is required unless doesNotHaveMobilePhone is true'
  }
);

// Demographics validation
export const DemographicsSchema = z.object({
  raceList: z.array(z.object({
    code: z.string(),
    codeSystem: z.string(),
    description: z.string().optional()
  })).optional(),
  ethnicityList: z.array(z.object({
    code: z.string(),
    codeSystem: z.string(),
    description: z.string().optional()
  })).optional(),
  preferredLanguage: z.object({
    code: z.string(),
    codeSystem: z.string(),
    description: z.string().optional()
  }).optional(),
  sexualOrientation: z.object({
    code: z.string(),
    codeSystem: z.string(),
    description: z.string().optional()
  }).optional(),
  genderIdentity: z.object({
    code: z.string(),
    codeSystem: z.string(),
    description: z.string().optional()
  }).optional()
});

// Patient create validation
export const PatientCreateSchema = z.object({
  profile: PatientProfileSchema,
  contact: PatientContactSchema,
  demographics: DemographicsSchema.optional(),
  socialSecurityNumber: SsnSchema.optional()
});

// Patient contact schema without refinement for partial updates
const PatientContactBaseSchema = z.object({
  address: z.object({
    streetAddress1: z.string().min(1, 'Street address is required'),
    streetAddress2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: StateCodeSchema,
    postalCode: ZipCodeSchema,
    country: z.string().optional(),
    notes: z.string().optional(),
    effectiveStartDate: z.string().datetime().optional(),
    effectiveEndDate: z.string().datetime().optional()
  }),
  emailAddress: EmailSchema.optional(),
  mobilePhone: PhoneSchema.optional(),
  homePhone: PhoneSchema.optional(),
  officePhone: PhoneSchema.optional(),
  officePhoneExtension: z.string().optional(),
  doesNotHaveMobilePhone: z.boolean().optional(),
  doesNotHaveEmail: z.boolean().optional(),
  preferredMethodOfCommunication: z.string().optional()
});

// Patient update validation (all fields optional except required identifiers)
export const PatientUpdateSchema = z.object({
  patientPracticeGuid: UuidSchema,
  profile: PatientProfileSchema.partial().optional(),
  contact: PatientContactBaseSchema.partial().optional(),
  demographics: DemographicsSchema.optional(),
  socialSecurityNumber: SsnSchema.optional()
}).refine(
  (data) => {
    // At least one field to update must be provided
    return data.profile || data.contact || data.demographics || data.socialSecurityNumber;
  },
  {
    message: 'At least one field to update must be provided'
  }
);

// Calendar event type validation
export const EventTypeSchema = z.object({
  eventTypeGuid: UuidSchema,
  eventTypeName: z.string().optional(),
  eventCategory: z.enum(['Appointment', 'BlockedTime'])
});

// Calendar event validation
export const CalendarEventCreateSchema = z.object({
  practiceGuid: UuidSchema,
  ehrUserGuid: UuidSchema.optional(),
  facilityGuid: UuidSchema.optional(),
  patientPracticeGuid: UuidSchema.optional(),
  chiefComplaint: z.string().optional(),
  eventType: EventTypeSchema,
  startDateTimeUtc: z.string().datetime(),
  startDateTimeFlt: z.string().datetime(),
  duration: z.string().regex(/^\d+:\d{2}:\d{2}$/, 'Duration must be in format H:MM:SS or HH:MM:SS'),
  appointmentConfirmation: z.object({
    appointmentConfirmed: z.boolean(),
    confirmationMethodCode: z.string().optional(),
    notes: z.string().optional()
  }).optional(),
  appointmentStatus: z.object({
    statusName: z.string(),
    reasonForNoShowOrCancellation: z.string().optional(),
    roomLocation: z.string().optional()
  }).optional()
});

export const CalendarEventUpdateSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  practiceGuid: UuidSchema.optional(),
  ehrUserGuid: UuidSchema.optional(),
  facilityGuid: UuidSchema.optional(),
  patientPracticeGuid: UuidSchema.optional(),
  chiefComplaint: z.string().optional(),
  eventType: EventTypeSchema.optional(),
  startDateTimeUtc: z.string().datetime().optional(),
  startDateTimeFlt: z.string().datetime().optional(),
  duration: z.string().regex(/^\d+:\d{2}:\d{2}$/, 'Duration must be in format H:MM:SS or HH:MM:SS').optional(),
  appointmentConfirmation: z.object({
    appointmentConfirmed: z.boolean(),
    confirmationMethodCode: z.string().optional(),
    notes: z.string().optional()
  }).optional(),
  appointmentStatus: z.object({
    statusName: z.string(),
    reasonForNoShowOrCancellation: z.string().optional(),
    roomLocation: z.string().optional()
  }).optional()
}).refine(
  (data) => {
    // At least one field to update must be provided
    const updateFields = Object.keys(data).filter(key => key !== 'eventId');
    return updateFields.some(key => data[key as keyof typeof data] !== undefined);
  },
  {
    message: 'At least one field to update must be provided'
  }
);

// Payer search validation
export const PayerSearchSchema = z.object({
  payerName: z.string().optional(),
  payerCode: z.string().optional(),
  pageNumber: z.number().int().min(1).max(200).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(50)
});

// Insurance plan validation
export const InsurancePlanCreateSchema = z.object({
  patientPracticeGuid: UuidSchema,
  relationshipToInsured: z.enum(['Self', 'Spouse', 'Child', 'Other']),
  insuredId: z.string().min(1, 'Insured ID is required'),
  groupNumber: z.string().optional(),
  orderOfBenefits: z.enum(['Primary', 'Secondary', 'Tertiary', 'Unknown/None']),
  coverageStartDate: z.string().datetime(),
  coverageEndDate: z.string().datetime().optional(),
  nameOfEmployer: z.string().optional(),
  coPayType: z.enum(['Fixed', 'Percentage']),
  baseCopay: z.number().min(0, 'Base copay must be non-negative'),
  comments: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  claimNumber: z.string().optional(),
  insurancePlan: z.object({
    planGuid: UuidSchema,
    payerGuid: UuidSchema,
    coverageType: z.string().min(1, 'Coverage type is required'),
    planType: z.string().min(1, 'Plan type is required')
  }),
  employerContact: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    middleInitial: z.string().optional(),
    address: z.object({
      streetAddress1: z.string().optional(),
      streetAddress2: z.string().optional(),
      city: z.string().optional(),
      state: StateCodeSchema.optional(),
      postalCode: ZipCodeSchema.optional()
    }).optional(),
    phoneNumber: PhoneSchema.optional(),
    phoneExtension: z.string().optional(),
    faxNumber: PhoneSchema.optional(),
    faxExtension: z.string().optional(),
    emailAddress: EmailSchema.optional()
  }).optional(),
  subscriber: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    middleInitial: z.string().optional(),
    socialSecurityNumber: SsnSchema.optional(),
    birthDate: z.string().date().optional(),
    sex: z.enum(['Male', 'Female', 'Unknown']),
    address: z.object({
      streetAddress1: z.string().optional(),
      streetAddress2: z.string().optional(),
      city: z.string().optional(),
      state: StateCodeSchema.optional(),
      postalCode: ZipCodeSchema.optional()
    }).optional(),
    primaryPhoneNumber: PhoneSchema.optional(),
    primaryPhoneExtension: z.string().optional(),
    secondaryPhoneNumber: PhoneSchema.optional(),
    secondaryPhoneExtension: z.string().optional()
  }).optional()
});

// Tool call validation
export const ToolCallRequestSchema = z.object({
  method: z.literal('tools/call'),
  params: z.object({
    name: z.string(),
    arguments: z.record(z.any()).optional()
  })
});

export const ToolListRequestSchema = z.object({
  method: z.literal('tools/list')
});