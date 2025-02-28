/**
 * Type definitions for Metigan library
 */

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
  }
  
  /**
   * Validation result interface
   */
  export interface ValidationResult {
    isValid: boolean;
    error?: string;
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
  }
  
  /**
   * API error response interfaces
   */
  export interface EmailErrorResponse {
    error: string;
    message: string;
  }
  
  /**
   * API key error response
   */
  export interface ApiKeyErrorResponse {
    error: string;
  }
  
  /**
   * Union type for all possible API responses
   */
  export type EmailApiResponse = EmailSuccessResponse | EmailErrorResponse | ApiKeyErrorResponse;
  
  /**
   * Template variables type
   */
  export type TemplateVariables = Record<string, string | number | boolean>;
  
  /**
   * Template function type
   */
  export type TemplateFunction = (variables?: TemplateVariables) => string;