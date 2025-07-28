/**
 * Practice Fusion OAuth2 Scopes
 * 
 * These scopes define the permissions required to access Practice Fusion APIs.
 * They should be provided by Practice Fusion Developer Support when obtaining API credentials.
 */

export const PRACTICE_FUSION_DEFAULT_SCOPES = [
  // Calendar API scopes
  "calendar:a_confirmation_v1",
  "calendar:a_events_v1", 
  "calendar:a_events_v2",
  "calendar:a_notes_v1",
  "calendar:a_status_v1",
  "calendar:d_events_v1",
  "calendar:r_events_v1",
  "calendar:r_events_v2", 
  "calendar:r_eventtypes_v1",
  "calendar:r_notes_v1",

  // Chart API scopes
  "chart:a_superbill_v2",
  "chart:a_vxu_v2",

  // Document API scopes
  "document:a_document_v2",
  "document:r_document_types_v2",
  "document:r_document_v2",
  "document:z_document_v2",

  // Encounter API scopes
  "encounter:a_diagnosis_v1",
  "encounter:a_notes_v1",
  "encounter:r_metadata_v1",
  "encounter:r_summary_v1",

  // User/Profile API scopes
  "me:r_erx_v2",
  "me:r_login_v2",
  "me:r_profile_v2",
  "user:r_login_v2",
  "user:r_profile_v2",

  // Patient API scopes
  "patient:a_contact_v4",
  "patient:a_demographics_v1",
  "patient:a_guarantor_v1",
  "patient:a_insurance_plan_v1",
  "patient:a_preferredPharmacy_v1",
  "patient:a_relatedPerson_v1",
  "patient:r_ccda_allergies_v2",
  "patient:r_ccda_assessmentAndPlan_v2",
  "patient:r_ccda_clinicalNotes_v2",
  "patient:r_ccda_demographics_v2",
  "patient:r_ccda_encounters_v2",
  "patient:r_ccda_functionalStatus_v2",
  "patient:r_ccda_goals_v2",
  "patient:r_ccda_healthConcerns_v2",
  "patient:r_ccda_immunizations_v2",
  "patient:r_ccda_medicalEquipment_v2",
  "patient:r_ccda_medications_v2",
  "patient:r_ccda_mentalStatus_v2",
  "patient:r_ccda_problems_v2",
  "patient:r_ccda_procedures_v2",
  "patient:r_ccda_reasonForReferral_v2",
  "patient:r_ccda_results_v2",
  "patient:r_ccda_socialHistory_v2",
  "patient:r_ccda_vitalSigns_v2",
  "patient:r_contact_v4",
  "patient:r_demographics_v2",
  "patient:r_diagnosis_v1",
  "patient:r_guarantor_v1",
  "patient:r_insurance_v3",
  "patient:r_insurance_plan_v1",
  "patient:r_preferredPharmacy_v1",
  "patient:r_profile_v4",
  "patient:r_relatedPerson_v1",
  "patient:r_search_v2",

  // Payer API scopes
  "payer:r_insurance_v1",
  "payer:r_insurance_plan_v1",

  // Practice API scopes
  "practice:r_facilities_v2"
].join(" ");

/**
 * Get the default scopes as a space-separated string
 */
export function getDefaultScopes(): string {
  return PRACTICE_FUSION_DEFAULT_SCOPES;
}