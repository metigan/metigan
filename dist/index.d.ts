/**
 * Metigan - Email Sending Library
 * Main entry point
 */
export { default, Metigan } from './lib/metigan';
export { MetiganError } from './lib/errors';
export type { EmailOptions, EmailSuccessResponse, EmailErrorResponse, ApiKeyErrorResponse, EmailApiResponse, NodeAttachment, CustomAttachment, TemplateVariables, TemplateFunction } from './lib/types';
