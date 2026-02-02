/**
 * Application Constants
 */

const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  AGENT: 'AGENT',
  STUDENT: 'STUDENT',
};

const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

const AGENT_APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

const APPLICATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  OFFER_ISSUED: 'offer_issued',
  OFFER_ACCEPTED: 'offer_accepted',
  FEE_PAID: 'fee_paid',
  ENROLLED: 'enrolled',
  REJECTED: 'rejected',
};

const COMMISSION_TYPE = {
  PERCENTAGE: 'percentage',
  FLAT: 'flat',
};

const COMMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PAID: 'paid',
};

const COMMISSION_PRIORITY = {
  AGENT_COURSE: 1,
  AGENT_UNIVERSITY: 2,
  COURSE_DEFAULT: 3,
  UNIVERSITY_DEFAULT: 4,
};

const PAYOUT_STATUS = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
};

const ENTITY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

const AGREEMENT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  EXPIRED: 'expired',
};

const DOCUMENT_TYPES = {
  PASSPORT: 'passport',
  ACADEMIC_TRANSCRIPT: 'academic_transcript',
  DEGREE_CERTIFICATE: 'degree_certificate',
  ENGLISH_PROFICIENCY: 'english_proficiency',
  CV: 'cv',
  SOP: 'sop',
  LOR: 'lor',
  OTHER: 'other',
};

const COURSE_LEVELS = {
  FOUNDATION: 'Foundation',
  UNDERGRADUATE: 'Undergraduate',
  POSTGRADUATE: 'Postgraduate',
  DIPLOMA: 'Diploma',
  CERTIFICATE: 'Certificate',
  PHD: 'PhD',
};

const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  STATUS_CHANGE: 'STATUS_CHANGE',
  UPLOAD: 'UPLOAD',
  DOWNLOAD: 'DOWNLOAD',
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
};

const EMAIL_TEMPLATES = {
  AGENT_REGISTRATION: 'agent_registration',
  AGENT_APPROVED: 'agent_approved',
  AGENT_REJECTED: 'agent_rejected',
  APPLICATION_SUBMITTED: 'application_submitted',
  APPLICATION_STATUS_UPDATE: 'application_status_update',
  PAYOUT_REQUESTED: 'payout_requested',
  PAYOUT_APPROVED: 'payout_approved',
  PAYOUT_PAID: 'payout_paid',
  PASSWORD_RESET: 'password_reset',
};

module.exports = {
  USER_ROLES,
  USER_STATUS,
  AGENT_APPROVAL_STATUS,
  APPLICATION_STATUS,
  COMMISSION_TYPE,
  COMMISSION_STATUS,
  COMMISSION_PRIORITY,
  PAYOUT_STATUS,
  ENTITY_STATUS,
  AGREEMENT_STATUS,
  DOCUMENT_TYPES,
  COURSE_LEVELS,
  AUDIT_ACTIONS,
  PAGINATION,
  FILE_UPLOAD,
  EMAIL_TEMPLATES,
};
