/**
 * Type definitions for Metigan library
 */

import { ErrorCode } from "./error-codes";

/**
 * Interface for email attachment in Node.js environment
 */
export interface NodeAttachment {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

/**
 * Interface for email attachment in any environment
 */
export interface CustomAttachment {
  content: Buffer | ArrayBuffer | Uint8Array | string;
  filename: string;
  contentType: string;
}

/**
 * Processed attachment interface for internal use
 */
export interface ProcessedAttachment {
  filename: string;
  content: any;
  contentType: string;
  encoding: string;
  disposition: string;
}

/**
 * Contact data interface
 */
export interface ContactData {
  /** Email address of the contact (required) */
  email: string;
  /** Additional fields for the contact */
  fields?: Record<string, string | number | boolean>;
}

/**
 * Contact creation options interface
 */
export interface ContactCreationOptions {
  /** Whether to create a contact in the audience */
  createContact?: boolean;
  /** Audience ID from Metigan dashboard (required if createContact is true) */
  audienceId?: string;
  /** Optional additional contact fields */
  contactFields?: Record<string, string | number | boolean>;
}

/**
 * Contact query options interface
 */
export interface ContactQueryOptions {
  /** Audience ID from Metigan dashboard */
  audienceId: string;
  /** Page number for pagination (starts at 1) */
  page?: number;
  /** Number of contacts per page */
  limit?: number;
  /** Filter contacts by field values */
  filters?: Record<string, string | number | boolean>;
}

/**
 * Contact update options interface
 */
export interface ContactUpdateOptions {
  /** Audience ID from Metigan dashboard */
  audienceId: string;
  /** Fields to update */
  fields: Record<string, string | number | boolean>;
}

/**
 * Audience creation options interface
 */
export interface AudienceCreationOptions {
  /** Name of the audience (required) */
  name: string;
  /** Optional description for the audience */
  description?: string;
}

/**
 * Audience update options interface
 */
export interface AudienceUpdateOptions {
  /** Name of the audience (required) */
  name: string;
  /** Optional description for the audience */
  description?: string;
}

/**
 * Email options interface
 */
export interface EmailOptions {
  /** Sender email address (or Name <email>) */
  from: string;
  /** List of recipient email addresses */
  recipients: string[];
  /** Email subject */
  subject: string;
  /** Email content (HTML supported) */
  content: string;
  /** Optional file attachments */
  attachments?: Array<File | NodeAttachment | CustomAttachment>;
  /** Optional tracking ID for email analytics */
  trackingId?: string;
  /** Optional contact creation settings */
  contactOptions?: ContactCreationOptions;
}

/**
 * Template options interface
 */
export interface TemplateOptions extends Omit<EmailOptions, "content"> {
  /** Template ID to use instead of content */
  templateId: string;
  /** Optional template variables to replace placeholders */
  templateVariables?: Record<string, string | number | boolean>;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  code?: ErrorCode;
}

/**
 * API response interface for successful email
 */
export interface EmailSuccessResponse {
  success: true;
  message: string;
  successfulEmails: {
    success: true;
    recipient: string;
    messageId: string;
    trackingId: string;
  }[];
  failedEmails: {
    success: false;
    recipient: string;
    error: string;
  }[];
  recipientCount: number;
  hasAttachments: boolean;
  attachmentsCount: number;
  contactsCreated?: number;
}

/**
 * API response interface for successful contact creation
 */
export interface ContactSuccessResponse {
  success: true;
  message: string;
  contactsCreated: number;
  contacts: {
    email: string;
    audienceId: string;
    success: boolean;
    error?: string;
  }[];
}

/**
 * API response interface for successful contact retrieval
 */
export interface ContactGetResponse {
  success: true;
  message: string;
  contact?: {
    email: string;
    audienceId: string;
    fields: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  };
  contacts?: Array<{
    email: string;
    audienceId: string;
    fields: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * API response interface for successful contact update
 */
export interface ContactUpdateResponse {
  success: true;
  message: string;
  contact: {
    email: string;
    audienceId: string;
    updated: boolean;
    fields: Record<string, any>;
    updatedAt: string;
  };
}

/**
 * API response interface for successful contact deletion
 */
export interface ContactDeleteResponse {
  success: true;
  message: string;
  email: string;
  audienceId: string;
  deleted: boolean;
}

/**
 * API response interface for successful audience creation
 */
export interface AudienceCreateResponse {
  success: true;
  message: string;
  audience: {
    id: string;
    name: string;
    description?: string;
    userId: string;
    createdAt: string;
  };
}

/**
 * API response interface for successful audience retrieval
 */
export interface AudienceGetResponse {
  success: true;
  message: string;
  audience?: {
    id: string;
    name: string;
    description?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  };
  audiences?: Array<{
    id: string;
    name: string;
    description?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

/**
 * API response interface for successful audience update
 */
export interface AudienceUpdateResponse {
  success: true;
  message: string;
  audience: {
    id: string;
    name: string;
    description?: string;
    userId: string;
    updatedAt: string;
  };
}

/**
 * API response interface for successful audience deletion
 */
export interface AudienceDeleteResponse {
  success: true;
  message: string;
  id: string;
  deleted: boolean;
}

/**
 * API error response interfaces
 */
export interface EmailErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
}

/**
 * API key error response
 */
export interface ApiKeyErrorResponse {
  success: false;
  error: string;
  code?: string;
}

/**
 * Template API response interface
 */
export interface TemplateApiResponse {
  success: boolean;
  message: string;
  template?: {
    id: string;
    name: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Union type for all possible API responses
 */
export type EmailApiResponse = EmailSuccessResponse | EmailErrorResponse | ApiKeyErrorResponse;

/**
 * Union type for all possible contact API responses
 */
export type ContactApiResponse =
  | ContactSuccessResponse
  | ContactGetResponse
  | ContactUpdateResponse
  | ContactDeleteResponse
  | EmailErrorResponse
  | ApiKeyErrorResponse;

/**
 * Union type for all possible audience API responses
 */
export type AudienceApiResponse =
  | AudienceCreateResponse
  | AudienceGetResponse
  | AudienceUpdateResponse
  | AudienceDeleteResponse
  | EmailErrorResponse
  | ApiKeyErrorResponse;

/**
 * Template variables type
 */
export type TemplateVariables = Record<string, string | number | boolean>;

/**
 * Template function type
 */
export type TemplateFunction = (variables?: TemplateVariables) => string;