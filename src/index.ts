/**
 * Metigan - Email Sending Library
 * Main entry point
 */

// Re-export main class and types
export { default, Metigan } from './lib/metigan';
export { MetiganError } from './lib/errors';
export type {
  EmailOptions,
  EmailSuccessResponse,
  EmailErrorResponse,
  ApiKeyErrorResponse,
  EmailApiResponse,
  NodeAttachment,
  CustomAttachment,
  TemplateVariables,
  TemplateFunction
} from './lib/types';