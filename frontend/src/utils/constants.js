// User Roles
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  AGENT: 'AGENT',
  STUDENT: 'STUDENT',
};

// Application Statuses
export const APPLICATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  OFFER_ISSUED: 'offer_issued',
  OFFER_ACCEPTED: 'offer_accepted',
  FEE_PAID: 'fee_paid',
  ENROLLED: 'enrolled',
  REJECTED: 'rejected',
};

// Application Status Labels
export const APPLICATION_STATUS_LABELS = {
  [APPLICATION_STATUS.DRAFT]: 'Draft',
  [APPLICATION_STATUS.SUBMITTED]: 'Submitted',
  [APPLICATION_STATUS.UNDER_REVIEW]: 'Under Review',
  [APPLICATION_STATUS.OFFER_ISSUED]: 'Offer Issued',
  [APPLICATION_STATUS.OFFER_ACCEPTED]: 'Offer Accepted',
  [APPLICATION_STATUS.FEE_PAID]: 'Fee Paid',
  [APPLICATION_STATUS.ENROLLED]: 'Enrolled',
  [APPLICATION_STATUS.REJECTED]: 'Rejected',
};

// Application Status Colors
export const APPLICATION_STATUS_COLORS = {
  [APPLICATION_STATUS.DRAFT]: 'bg-gray-100 text-gray-800',
  [APPLICATION_STATUS.SUBMITTED]: 'bg-blue-100 text-blue-800',
  [APPLICATION_STATUS.UNDER_REVIEW]: 'bg-amber-100 text-amber-800',
  [APPLICATION_STATUS.OFFER_ISSUED]: 'bg-purple-100 text-purple-800',
  [APPLICATION_STATUS.OFFER_ACCEPTED]: 'bg-green-100 text-green-800',
  [APPLICATION_STATUS.FEE_PAID]: 'bg-indigo-100 text-indigo-800',
  [APPLICATION_STATUS.ENROLLED]: 'bg-green-100 text-green-800',
  [APPLICATION_STATUS.REJECTED]: 'bg-red-100 text-red-800',
};

// Agent Status
export const AGENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Agent Status Labels
export const AGENT_STATUS_LABELS = {
  [AGENT_STATUS.PENDING]: 'Pending',
  [AGENT_STATUS.APPROVED]: 'Approved',
  [AGENT_STATUS.REJECTED]: 'Rejected',
};

// Agent Status Colors
export const AGENT_STATUS_COLORS = {
  [AGENT_STATUS.PENDING]: 'bg-amber-100 text-amber-800',
  [AGENT_STATUS.APPROVED]: 'bg-green-100 text-green-800',
  [AGENT_STATUS.REJECTED]: 'bg-red-100 text-red-800',
};

// Payout Status
export const PAYOUT_STATUS = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
};

// Payout Status Labels
export const PAYOUT_STATUS_LABELS = {
  [PAYOUT_STATUS.REQUESTED]: 'Requested',
  [PAYOUT_STATUS.APPROVED]: 'Approved',
  [PAYOUT_STATUS.REJECTED]: 'Rejected',
  [PAYOUT_STATUS.PAID]: 'Paid',
};

// Payout Status Colors
export const PAYOUT_STATUS_COLORS = {
  [PAYOUT_STATUS.REQUESTED]: 'bg-amber-100 text-amber-800',
  [PAYOUT_STATUS.APPROVED]: 'bg-green-100 text-green-800',
  [PAYOUT_STATUS.REJECTED]: 'bg-red-100 text-red-800',
  [PAYOUT_STATUS.PAID]: 'bg-blue-100 text-blue-800',
};

// Course Levels
export const COURSE_LEVELS = {
  FOUNDATION: 'Foundation',
  UNDERGRADUATE: 'Undergraduate',
  POSTGRADUATE: 'Postgraduate',
  DIPLOMA: 'Diploma',
  CERTIFICATE: 'Certificate',
  PHD: 'PhD',
};

// Course Level Labels
export const COURSE_LEVEL_LABELS = {
  [COURSE_LEVELS.FOUNDATION]: 'Foundation',
  [COURSE_LEVELS.UNDERGRADUATE]: 'Undergraduate',
  [COURSE_LEVELS.POSTGRADUATE]: 'Postgraduate',
  [COURSE_LEVELS.DIPLOMA]: 'Diploma',
  [COURSE_LEVELS.CERTIFICATE]: 'Certificate',
  [COURSE_LEVELS.PHD]: 'PhD',
};

// Commission Types
export const COMMISSION_TYPES = {
  PERCENTAGE: 'percentage',
  FLAT: 'flat',
};

// Commission Priority
export const COMMISSION_PRIORITY = {
  AGENT_COURSE: 1,
  AGENT_UNIVERSITY: 2,
  COURSE_DEFAULT: 3,
  UNIVERSITY_DEFAULT: 4,
};

// Entity Status
export const ENTITY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

// Document Types
export const DOCUMENT_TYPES = {
  PASSPORT: 'passport',
  ACADEMIC: 'academic',
  ENGLISH_TEST: 'english_test',
  FINANCIAL: 'financial',
  OTHER: 'other',
};

// Countries
export const COUNTRIES = [
  'USA',
  'UK',
  'Canada',
  'Australia',
  'New Zealand',
  'Germany',
  'France',
  'Ireland',
  'Netherlands',
  'Singapore',
  'Malaysia',
  'UAE',
  'Others',
];

export default {
  ROLES,
  APPLICATION_STATUS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  AGENT_STATUS,
  AGENT_STATUS_LABELS,
  AGENT_STATUS_COLORS,
  PAYOUT_STATUS,
  PAYOUT_STATUS_LABELS,
  PAYOUT_STATUS_COLORS,
  COURSE_LEVELS,
  COURSE_LEVEL_LABELS,
  COMMISSION_TYPES,
  COMMISSION_PRIORITY,
  ENTITY_STATUS,
  DOCUMENT_TYPES,
  COUNTRIES,
};

// Required Agent Documents
export const REQUIRED_AGENT_DOCUMENTS = [
  { key: 'idProof', label: 'ID Proof' },
  { key: 'companyLicence', label: 'Company Licence' },
  { key: 'agentPhoto', label: 'Agent Photo' },
  { key: 'companyPhoto', label: 'Company Photo' },
  { key: 'identityDocument', label: 'Identity Document' },
  { key: 'companyRegistration', label: 'Company Registration' },
  { key: 'resume', label: 'Resume / CV' }
];
// Required Student Documents
export const REQUIRED_STUDENT_DOCUMENTS = [
  { key: 'photo', label: 'Student Photo' },
  { key: 'idproof', label: 'Identity Proof' },
  { key: 'marksheet_10', label: '10th Marksheet' },
  { key: 'marksheet_12', label: '12th Marksheet' },
  { key: 'resume', label: 'Student Resume' },
  { key: 'degreecertificate', label: 'Degree Certificate' }
];
