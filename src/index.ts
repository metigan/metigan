/**
 * Metigan - Email Sending Library
 * Main entry point
 */

// Re-export main class and types
export { default } from "./lib/metigan";
export { Metigan } from "./lib/metigan";
export { MetiganError, ValidationError, ApiError, NetworkError, ContactError } from "./lib/errors";
export { ErrorCode, ErrorMessages, getErrorDetails } from "./lib/error-codes";
export type {
  EmailOptions,
  EmailSuccessResponse,
  EmailErrorResponse,
  ApiKeyErrorResponse,
  EmailApiResponse,
  ContactApiResponse,
  ContactCreationOptions,
  ContactQueryOptions,
  ContactUpdateOptions,
  ContactData,
  NodeAttachment,
  CustomAttachment,
  TemplateVariables,
  TemplateFunction,
  TemplateOptions,
  TemplateApiResponse,
  AudienceApiResponse,
  AudienceCreationOptions,
  AudienceUpdateOptions,
} from "./lib/types";