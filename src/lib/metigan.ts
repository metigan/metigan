/**
 * Metigan - Email Sending Library
 * A simple library for sending emails through the Metigan API
 * @version 1.5.1
 */

// Import dependencies in a way that doesn't expose them in stack traces
import * as httpUtils from "../utils/http"
import axios from "axios"
import type {
  EmailOptions,
  EmailApiResponse,
  ValidationResult,
  ProcessedAttachment,
  NodeAttachment,
  CustomAttachment,
  TemplateVariables,
  TemplateFunction,
  ContactApiResponse,
  ContactCreationOptions,
  ContactQueryOptions,
  ContactUpdateOptions,
  TemplateOptions,
  AudienceCreationOptions,
  AudienceUpdateOptions,
  AudienceApiResponse,
} from "./types"
import { MetiganError } from "./errors"
import { ErrorCode } from "./error-codes"

// Private constants
const MAX_FILE_SIZE = 7 * 1024 * 1024 // 7MB in bytes
const LOG_API_URL = "https://metigan-emails-api.savanapoint.com/api/logs" // URL of the logs API

// Status options constants
const STATUS_OPTIONS = [
  { value: "200", label: "200 - Ok" },
  { value: "201", label: "201 - Created" },
  { value: "400", label: "400 - Bad Request" },
  { value: "401", label: "401 - Unauthorized" },
  { value: "403", label: "403 - Forbidden" },
  { value: "404", label: "404 - Not Found" },
  { value: "422", label: "422 - Unprocessable Content" },
  { value: "429", label: "429 - Too Many Requests" },
  { value: "451", label: "451 - Unavailable For Legal Reasons" },
  { value: "500", label: "500 - Internal Server Error" },
]

// Valid user agents

/**
 * Logger for monitoring the Metigan library
 */
class MetiganLogger {
  private apiKey: string
  private userId: string
  private disabled = false
  private retryCount = 3 // Number of retry attempts in case of failure
  private retryDelay = 500 // Delay between retry attempts (ms)
  private pendingLogs: Array<{ endpoint: string; status: number; method: string }> = []
  private isBatchProcessing = false
  private batchTimeout: NodeJS.Timeout | null = null

  constructor(apiKey: string, userId: string) {
    this.apiKey = apiKey
    this.userId = userId
  }

  /**
   * Disables the logger
   */
  disable(): void {
    this.disabled = true
    this.clearPendingLogs()
  }

  /**
   * Enables the logger
   */
  enable(): void {
    this.disabled = false
  }

  /**
   * Clears pending logs
   */
  private clearPendingLogs(): void {
    this.pendingLogs = []
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
  }

  /**
   * Validates and formats status code to ensure API compatibility
   * @param status - HTTP status code
   * @returns Valid status code and its label
   * @private
   */
  private _validateStatus(status: number): { code: string; label: string } {
    // Convert to string and check if it's in the list of valid statuses
    const statusStr = status.toString()
    const validStatus = STATUS_OPTIONS.find((option) => option.value === statusStr)

    if (validStatus) {
      return {
        code: statusStr,
        label: validStatus.label,
      }
    } else {
      // If not a valid status, return 500 as default
      const defaultStatus = STATUS_OPTIONS.find((option) => option.value === "500")
      return {
        code: "500",
        label: defaultStatus ? defaultStatus.label : "500 - Internal Server Error",
      }
    }
  }

  /**
   * Determine the appropriate userAgent
   * @returns UserAgent string
   */
  private _getUserAgent(): string {
    // In our case, we always use SDK
    return "SDK"
  }

    /**
   * Attempts to make a request with retries
   * @param url - Request URL
   * @param data - Data to send
   * @param headers - Request headers
   */
  private async _makeRequestWithRetry(url: string, data: any, headers: any): Promise<any> {
    // Ensure authentication headers are properly set
    headers = {
      ...headers,
      "x-api-key": this.apiKey,
      "Authorization": `Bearer ${this.apiKey}`
    }

    let lastError

    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        return await axios.post(url, data, { headers, timeout: 5000 }) // 5 second timeout
      } catch (err: any) {
        lastError = err

        // If the error is 403 (Forbidden), check if it's an authentication problem
        if (err.response && err.response.status === 403) {
          // If it's the last attempt, log the error silently
          if (attempt === this.retryCount - 1) {
            console.warn("Authentication error when logging. Please check your API key.")
            return // End the attempts
          }
        }

        // If it's a network error or timeout, try again with more urgency
        if (!err.response || err.code === "ECONNABORTED") {
          if (attempt === this.retryCount - 1) {
            console.warn("Connection error when logging. Please check your connectivity.")
            return
          }
        }

        // Wait before trying again (except on the last attempt)
        if (attempt < this.retryCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay * (attempt + 1))) // Exponential backoff
        }
      }
    }

    // If we got here, all attempts failed
    throw lastError
  }
  /**
   * Processes the batch of pending logs
   */
  private async processBatch(): Promise<void> {
    if (this.disabled || this.pendingLogs.length === 0 || this.isBatchProcessing) {
      return
    }

    this.isBatchProcessing = true
    this.batchTimeout = null

    try {
      // Copy pending logs and clear the queue
      const logBatch = [...this.pendingLogs]
      this.pendingLogs = []

      // Get appropriate userAgent
      const userAgent = this._getUserAgent()

      // Prepare log batch for sending
      const batchData = logBatch.map((log) => {
        const validatedStatus = this._validateStatus(log.status)
        return {
          userId: this.userId,
          endpoint: log.endpoint,
          status: validatedStatus.code,
          statusLabel: validatedStatus.label,
          method: log.method,
          userAgent,
          timestamp: new Date().toISOString(),
        }
      })

      // Send batch
      const headers = {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "Authorization": `Bearer ${this.apiKey}`,
        "User-Agent": userAgent,
      }

      await this._makeRequestWithRetry(LOG_API_URL, { logs: batchData }, headers).catch((err) => {
        console.warn("Warning when processing log batch:", err.message || "Unknown error")
      })
    } catch (error: any) {
      console.warn("Error processing log batch:", error.message || "Unknown error")
    } finally {
      this.isBatchProcessing = false

      // Check if new logs were added during processing
      if (this.pendingLogs.length > 0) {
        this.scheduleBatchProcessing()
      }
    }
  }

  /**
   * Schedules the processing of the log batch
   */
  private scheduleBatchProcessing(): void {
    if (!this.batchTimeout && !this.disabled) {
      this.batchTimeout = setTimeout(() => this.processBatch(), 1000) // Process every 1 second
    }
  }

  /**
   * Records an operation to be sent in batch to the logs API
   */
  async log(endpoint: string, status: number, method: string): Promise<void> {
    if (this.disabled) return

    // Add log to the queue
    this.pendingLogs.push({ endpoint, status, method })

    // Schedule batch processing if necessary
    this.scheduleBatchProcessing()
  }
}

/**
 * Metigan client options
 */
export interface MetiganOptions {
  /** User ID for logs */
  userId?: string
  /** Disable logs */
  disableLogs?: boolean
  /** Number of retry attempts for failed operations */
  retryCount?: number
  /** Base time between retry attempts (ms) */
  retryDelay?: number
  /** Timeout for requests (ms) */
  timeout?: number
  /** Base URL for API (optional, defaults to localhost) */
  baseUrl?: string
}

/**
 * Metigan client for sending emails
 */
export class Metigan {
  private apiKey: string
  private logger: MetiganLogger
  private timeout: number
  private retryCount: number
  private retryDelay: number
  private baseApiUrl: string
  private baseContactApiUrl: string
  private baseAudienceApiUrl: string
  private baseLogApiUrl: string

  /**
   * Create a new Metigan client
   * @param apiKey - Your API key
   * @param options - Client options
   */
  constructor(apiKey: string, options: MetiganOptions = {}) {
    if (!apiKey) {
      throw new MetiganError("API key is required", ErrorCode.INVALID_API_KEY)
    }
    this.apiKey = apiKey

    // Set base URLs
    const baseUrl = options.baseUrl || "https://metigan-emails-api.savanapoint.com"
    this.baseApiUrl = `${baseUrl}/api/end/email`
    this.baseContactApiUrl = `${baseUrl}/api/end/contacts`
    this.baseAudienceApiUrl = `${baseUrl}/api/end/audiences`
    this.baseLogApiUrl = `${baseUrl}/api/logs`

    // Advanced options
    this.timeout = options.timeout || 30000 // 30 seconds default
    this.retryCount = options.retryCount || 3
    this.retryDelay = options.retryDelay || 1000

    // Initialize the logger
    const userId = options.userId || "anonymous"
    this.logger = new MetiganLogger(apiKey, userId)

    // Disable logs if requested
    if (options.disableLogs) {
      this.logger.disable()
    }
  }

  /**
   * Enables logging
   */
  enableLogging(): void {
    this.logger.enable()
  }

  /**
   * Disables logging
   */
  disableLogging(): void {
    this.logger.disable()
  }

  /**
   * Validates an email address format
   * @param email - The email to validate
   * @returns True if email is valid
   * @private
   */
  private _validateEmail(email: string): boolean {
    // More comprehensive email validation
    if (!email || typeof email !== "string") return false

    // Simple email validation - check for @ and at least one dot after it
    const parts = email.split("@")
    if (parts.length !== 2) return false
    if (parts[0].length === 0) return false

    // Check domain part
    const domainParts = parts[1].split(".")
    if (domainParts.length < 2) return false
    if (domainParts.some((part) => part.length === 0)) return false

    return true
  }

  /**
   * Extracts email address from a format like "Name <email@example.com>"
   * @param from - The from field which might include a name
   * @returns The extracted email address
   * @private
   */
  private _extractEmailAddress(from: string): string {
    if (!from) return ""

    // Handle case with angle brackets
    const angleMatch = from.match(/<([^>]+)>/)
    if (angleMatch) {
      return angleMatch[1].trim()
    }

    // If no angle brackets, assume it's just an email
    return from.trim()
  }

  /**
   * Validates email message data
   * @param messageData - The email message data
   * @returns Validation result with status and error message
   * @private
   */
  private _validateMessageData(messageData: EmailOptions): ValidationResult {
    // Check required fields
    if (!messageData.from) {
      return { isValid: false, error: "Sender email (from) is required", code: ErrorCode.MISSING_REQUIRED_FIELD }
    }

    if (!messageData.recipients || !Array.isArray(messageData.recipients) || messageData.recipients.length === 0) {
      return { isValid: false, error: "Recipients must be a non-empty array", code: ErrorCode.MISSING_REQUIRED_FIELD }
    }

    if (!messageData.subject) {
      return { isValid: false, error: "Subject is required", code: ErrorCode.MISSING_REQUIRED_FIELD }
    }

    if (!messageData.content) {
      return { isValid: false, error: "Content is required", code: ErrorCode.MISSING_REQUIRED_FIELD }
    }

    // Validate sender email format
    const fromEmail = this._extractEmailAddress(messageData.from)
    if (!fromEmail || !this._validateEmail(fromEmail)) {
      return { isValid: false, error: `Invalid sender email format: ${fromEmail}`, code: ErrorCode.INVALID_EMAIL_FORMAT }
    }

    // Validate recipient email formats
    for (const recipient of messageData.recipients) {
      const recipientEmail = this._extractEmailAddress(recipient)
      if (!recipientEmail || !this._validateEmail(recipientEmail)) {
        return { isValid: false, error: `Invalid recipient email format: ${recipientEmail}`, code: ErrorCode.INVALID_RECIPIENT }
      }
    }

    // Validate contact creation options if provided
    if (messageData.contactOptions?.createContact) {
      if (!messageData.contactOptions.audienceId) {
        return { isValid: false, error: "audienceId is required when createContact is true", code: ErrorCode.INVALID_AUDIENCE_ID }
      }
    }

    return { isValid: true }
  }

  /**
   * Validates contact creation options
   * @param options - Contact creation options
   * @param emails - List of emails to create contacts for
   * @returns Validation result with status and error message
   * @private
   */
  private _validateContactOptions(options: ContactCreationOptions, emails: string[]): ValidationResult {
    if (!options.createContact) {
      return { isValid: false, error: "createContact must be true", code: ErrorCode.MISSING_REQUIRED_FIELD }
    }

    if (!options.audienceId) {
      return { isValid: false, error: "audienceId is required for contact creation", code: ErrorCode.INVALID_AUDIENCE_ID }
    }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return { isValid: false, error: "At least one email is required for contact creation", code: ErrorCode.MISSING_REQUIRED_FIELD }
    }

    // Validate email formats
    for (const email of emails) {
      if (!this._validateEmail(email)) {
        return { isValid: false, error: `Invalid email format: ${email}`, code: ErrorCode.INVALID_EMAIL_FORMAT }
      }
    }

    return { isValid: true }
  }

  /**
   * Validates contact query options
   * @param options - Contact query options
   * @returns Validation result with status and error message
   * @private
   */
  private _validateContactQueryOptions(options: ContactQueryOptions): ValidationResult {
    if (!options.audienceId) {
      return { isValid: false, error: "audienceId is required for contact queries", code: ErrorCode.INVALID_AUDIENCE_ID }
    }

    if (options.page !== undefined && (typeof options.page !== "number" || options.page < 1)) {
      return { isValid: false, error: "page must be a positive number", code: ErrorCode.MISSING_REQUIRED_FIELD }
    }

    if (options.limit !== undefined && (typeof options.limit !== "number" || options.limit < 1)) {
      return { isValid: false, error: "limit must be a positive number", code: ErrorCode.MISSING_REQUIRED_FIELD }
    }

    return { isValid: true }
  }

  /**
   * Validates contact update options
   * @param email - Email address of the contact to update
   * @param options - Contact update options
   * @returns Validation result with status and error message
   * @private
   */
  private _validateContactUpdateOptions(email: string, options: ContactUpdateOptions): ValidationResult {
    if (!email || !this._validateEmail(email)) {
      return { isValid: false, error: `Invalid email format: ${email}`, code: ErrorCode.INVALID_EMAIL_FORMAT }
    }

    if (!options.audienceId) {
      return { isValid: false, error: "audienceId is required for contact updates", code: ErrorCode.INVALID_AUDIENCE_ID }
    }

    if (!options.fields || Object.keys(options.fields).length === 0) {
      return { isValid: false, error: "At least one field must be provided for update", code: ErrorCode.MISSING_REQUIRED_FIELD }
    }

    return { isValid: true }
  }

  /**
   * Validates audience creation options
   * @param options - Audience creation options
   * @returns Validation result with status and error message
   * @private
   */
  private _validateAudienceCreationOptions(options: AudienceCreationOptions): ValidationResult {
    if (!options.name) {
      return { isValid: false, error: "name is required for audience creation", code: ErrorCode.MISSING_REQUIRED_FIELD }
    }

    return { isValid: true }
  }

  /**
   * Validates audience update options
   * @param id - Audience ID
   * @param options - Audience update options
   * @returns Validation result with status and error message
   * @private
   */
  private _validateAudienceUpdateOptions(id: string, options: AudienceUpdateOptions): ValidationResult {
    if (!id) {
      return { isValid: false, error: "Audience ID is required", code: ErrorCode.MISSING_REQUIRED_FIELD }
    }
    
    if (!options.name) {
      return { isValid: false, error: "name is required for audience update", code: ErrorCode.MISSING_REQUIRED_FIELD }
    }

    return { isValid: true }
  }

  /**
   * Detect if we're in a browser environment
   * @returns True if in browser environment
   * @private
   */
  private _isBrowserEnvironment(): boolean {
    return typeof window !== 'undefined' && typeof FormData !== 'undefined' && typeof File !== 'undefined';
  }

  /**
   * Process attachments for the email
   * @param attachments - Array of files or file-like objects
   * @returns Processed attachments
   * @private
   */
  private async _processAttachments(
    attachments: Array<File | NodeAttachment | CustomAttachment>,
  ): Promise<ProcessedAttachment[]> {
    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return []
    }

    const processedAttachments: ProcessedAttachment[] = []
    const isBrowser = this._isBrowserEnvironment();

    for (const file of attachments) {
      let buffer: ArrayBuffer | Buffer | Uint8Array | string
      let filename: string
      let mimetype: string

      // Handle File objects (browser)
      if (isBrowser && typeof File !== "undefined" && file instanceof File) {
        if (file.size > MAX_FILE_SIZE) {
          throw new MetiganError(`File ${file.name} exceeds the maximum size of 7MB`, ErrorCode.ATTACHMENT_TOO_LARGE)
        }

        buffer = await file.arrayBuffer()
        filename = file.name
        mimetype = file.type || this._getMimeType(file.name)
      }
      // Handle Buffer objects (Node.js)
      else if ("buffer" in file && "originalname" in file) {
        const nodeFile = file as NodeAttachment

        if (nodeFile.buffer.length > MAX_FILE_SIZE) {
          throw new MetiganError(`File ${nodeFile.originalname} exceeds the maximum size of 7MB`, ErrorCode.ATTACHMENT_TOO_LARGE)
        }

        buffer = nodeFile.buffer
        filename = nodeFile.originalname
        mimetype = nodeFile.mimetype || this._getMimeType(nodeFile.originalname)
      }
      // Handle custom objects
      else if ("content" in file && "filename" in file) {
        const customFile = file as CustomAttachment

        // Check size for different types of content
        let contentSize = 0
        if (customFile.content instanceof ArrayBuffer) {
          contentSize = customFile.content.byteLength
        } else if (customFile.content instanceof Buffer || customFile.content instanceof Uint8Array) {
          contentSize = customFile.content.length
        } else if (typeof customFile.content === "string") {
          contentSize = Buffer.from(customFile.content).length
        }

        if (contentSize > MAX_FILE_SIZE) {
          throw new MetiganError(`File ${customFile.filename} exceeds the maximum size of 7MB`, ErrorCode.ATTACHMENT_TOO_LARGE)
        }

        buffer = customFile.content
        filename = customFile.filename
        mimetype = customFile.contentType || this._getMimeType(customFile.filename)
      } else {
        throw new MetiganError("Invalid attachment format. Please use a valid File, NodeAttachment, or CustomAttachment format.", ErrorCode.INVALID_ATTACHMENT)
      }

      // Convert buffer to base64 if needed
      let content: any = buffer

      // In browser environments, convert to base64
      if (isBrowser) {
        if (buffer instanceof ArrayBuffer) {
          const uint8Array = new Uint8Array(buffer)
          const binary = Array.from(uint8Array)
            .map((b) => String.fromCharCode(b))
            .join("")
          content = btoa(binary)
        } else if (buffer instanceof Uint8Array) {
          const binary = Array.from(buffer)
            .map((b) => String.fromCharCode(b))
            .join("")
          content = btoa(binary)
        }
      }

      processedAttachments.push({
        filename,
        content,
        contentType: mimetype,
        encoding: "base64",
        disposition: "attachment",
      })
    }

    return processedAttachments
  }

  /**
   * Get MIME type based on file extension
   * @param filename - File name
   * @returns MIME type
   * @private
   */
  private _getMimeType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase()

    // Basic mapping of extensions to MIME types
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      svg: "image/svg+xml",
      txt: "text/plain",
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
      xml: "application/xml",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      tar: "application/x-tar",
      mp3: "audio/mpeg",
      mp4: "video/mp4",
      wav: "audio/wav",
      avi: "video/x-msvideo",
      csv: "text/csv",
    }

    return ext && mimeMap[ext] ? mimeMap[ext] : "application/octet-stream"
  }

  /**
   * Prepares authentication headers for API requests
   * @returns Headers object with authentication
   * @private
   */
  private _prepareAuthHeaders(): Record<string, string> {
    return {
      "x-api-key": this.apiKey,
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "SDK",
    }
  }

  /**
   * Attempts to make an HTTP request with retry system
   * @param url - Request URL
   * @param data - Data to send
   * @param headers - Request headers
   * @param method - HTTP method
   * @private
   */
  private async _makeRequestWithRetry<T>(
    url: string,
    data: any,
    headers: Record<string, string>,
    method: "GET" | "POST" | "PUT" | "DELETE" = "POST",
  ): Promise<T> {
    // Ensure authentication headers are properly set
    headers = {
      ...headers,
      "x-api-key": this.apiKey,
      "Authorization": `Bearer ${this.apiKey}`
    }

    let lastError

    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        switch (method) {
          case "GET":
            return await httpUtils.get<T>(url, headers)
          case "POST":
            return await httpUtils.post<T>(url, data, headers)
          case "PUT":
            return await httpUtils.put<T>(url, data, headers)
          case "DELETE":
            return await httpUtils.deleteRequest<T>(url, headers)
          default:
            return await httpUtils.post<T>(url, data, headers)
        }
      } catch (error: any) {
        lastError = error

        // If it's an authentication error (401/403), we can retry a limited number of times
        if (error.status === 401 || error.status === 403) {
          console.warn(`Attempt ${attempt + 1}/${this.retryCount}: Authentication error (${error.status})`)
        }

        // If it's a server error (5xx), try again after waiting
        else if (error.status >= 500) {
          console.warn(`Attempt ${attempt + 1}/${this.retryCount}: Server error (${error.status})`)
        }

        // If it's a network error, we also try again
        else if (!error.status) {
          console.warn(`Attempt ${attempt + 1}/${this.retryCount}: Network error or timeout`)
        }

        // If it's not the last retry, wait before trying again
        if (attempt < this.retryCount - 1) {
          // Exponential backoff with jitter
          const delay = this.retryDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5)
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else {
          // On the last attempt, propagate the error
          throw error
        }
      }
    }

    // Should never get here, but for safety
    throw lastError
  }

  /**
   * Creates contacts in the specified audience
   * @param emails - List of email addresses to create contacts for
   * @param options - Contact creation options
   * @returns Response from the API
   */
  async createContacts(emails: string[], options: ContactCreationOptions): Promise<ContactApiResponse> {
    // Start monitoring
    let statusCode = 500 // Default error status

    try {
      // Validate contact options
      const validation = this._validateContactOptions(options, emails)
      if (!validation.isValid) {
        throw new MetiganError(validation.error || "Invalid contact creation data", validation.code)
      }

      // Prepare request data
      const requestData = {
        emails: emails.map((email) => this._extractEmailAddress(email)),
        audienceId: options.audienceId,
        fields: options.contactFields || {},
      }

      // Prepare headers
      const headers = this._prepareAuthHeaders()

      // Make the API request with retry
      try {
        const response = await this._makeRequestWithRetry<ContactApiResponse>(
          this.baseContactApiUrl, 
          requestData, 
          headers
        )
        statusCode = 200 // Success

        // Log successful operation
        await this.logger.log(`/contacts/create`, statusCode, "POST")

        return response
      } catch (httpError: any) {
        // Capture error status code
        if (httpError.status) {
          statusCode = httpError.status
        }

        // Log operation with error
        await this.logger.log(`/contacts/create`, statusCode, "POST")

        // Handle HTTP errors without exposing implementation details
        if (httpError.status) {
          if (httpError.data && httpError.data.error) {
            throw new MetiganError(httpError.data.message || httpError.data.error, ErrorCode.API_REQUEST_FAILED)
          } else {
            throw new MetiganError(`Request failed with status ${httpError.status}`, ErrorCode.API_REQUEST_FAILED)
          }
        }
        throw new MetiganError("Failed to connect to the contact service", ErrorCode.NETWORK_ERROR)
      }
    } catch (error: unknown) {
      // Log operation with error
      await this.logger.log(`/contacts/create/error`, statusCode, "POST")

      // Rethrow MetiganErrors directly
      if (error instanceof MetiganError) {
        throw error
      }

      // Wrap other errors
      throw new MetiganError("An unexpected error occurred while creating contacts", ErrorCode.UNEXPECTED_ERROR)
    }
  }

  /**
   * Get a contact by email
   * @param email - Email address of the contact
   * @param audienceId - Audience ID from Metigan dashboard
   * @returns Response from the API
   */
  async getContact(email: string, audienceId: string): Promise<ContactApiResponse> {
    let statusCode = 500 // Default error status

    try {
      // Validate email
      if (!email || !this._validateEmail(email)) {
        throw new MetiganError(`Invalid email format: ${email}`, ErrorCode.INVALID_EMAIL_FORMAT)
      }

      // Validate audienceId
      if (!audienceId) {
        throw new MetiganError("audienceId is required", ErrorCode.INVALID_AUDIENCE_ID)
      }

      // Prepare URL with query parameters
      const url = `${this.baseContactApiUrl}/${encodeURIComponent(email)}?audienceId=${encodeURIComponent(audienceId)}`

      // Prepare headers
      const headers = this._prepareAuthHeaders()

      // Make the API request with retry
      try {
        const response = await this._makeRequestWithRetry<ContactApiResponse>(url, null, headers, "GET")
        statusCode = 200 // Success

        // Log successful operation
        await this.logger.log(`/contact/get`, statusCode, "GET")

        return response
      } catch (httpError: any) {
        // Capture error status code
        if (httpError.status) {
          statusCode = httpError.status
        }

        // Log operation with error
        await this.logger.log(`/contact/get`, statusCode, "GET")

        // Handle HTTP errors without exposing implementation details
        if (httpError.status === 404) {
          throw new MetiganError(`Contact not found: ${email}`, ErrorCode.CONTACT_NOT_FOUND)
        } else if (httpError.status) {
          if (httpError.data && httpError.data.error) {
            throw new MetiganError(httpError.data.message || httpError.data.error, ErrorCode.API_REQUEST_FAILED)
          } else {
            throw new MetiganError(`Request failed with status ${httpError.status}`, ErrorCode.API_REQUEST_FAILED)
          }
        }
        throw new MetiganError("Failed to connect to the contact service", ErrorCode.NETWORK_ERROR)
      }
    } catch (error: unknown) {
      // Log operation with error
      await this.logger.log(`/contact/get/error`, statusCode, "GET")

      // Rethrow MetiganErrors directly
      if (error instanceof MetiganError) {
        throw error
      }

      // Wrap other errors
      throw new MetiganError("An unexpected error occurred while getting contact", ErrorCode.UNEXPECTED_ERROR)
    }
  }

  /**
   * List contacts in an audience
   * @param options - Contact query options
   * @returns Response from the API
   */
  async listContacts(options: ContactQueryOptions): Promise<ContactApiResponse> {
    let statusCode = 500 // Default error status

    try {
      // Validate options
      const validation = this._validateContactQueryOptions(options)
      if (!validation.isValid) {
        throw new MetiganError(validation.error || "Invalid contact query options", validation.code)
      }

      // Build query parameters
      const queryParams = new URLSearchParams()
      queryParams.append("audienceId", options.audienceId)

      if (options.page !== undefined) {
        queryParams.append("page", options.page.toString())
      }

      if (options.limit !== undefined) {
        queryParams.append("limit", options.limit.toString())
      }

      if (options.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          queryParams.append(`filter[${key}]`, String(value))
        }
      }

      // Prepare URL with query parameters
      const url = `${this.baseContactApiUrl}?${queryParams.toString()}`

      // Prepare headers
      const headers = this._prepareAuthHeaders()

      // Make the API request with retry
      try {
        const response = await this._makeRequestWithRetry<ContactApiResponse>(url, null, headers, "GET")
        statusCode = 200 // Success

        // Log successful operation
        await this.logger.log(`/contact/list`, statusCode, "GET")

        return response
      } catch (httpError: any) {
        // Capture error status code
        if (httpError.status) {
          statusCode = httpError.status
        }

        // Log operation with error
        await this.logger.log(`/contact/list`, statusCode, "GET")

        // Handle HTTP errors without exposing implementation details
        if (httpError.status) {
          if (httpError.data && httpError.data.error) {
            throw new MetiganError(httpError.data.message || httpError.data.error, ErrorCode.API_REQUEST_FAILED)
          } else {
            throw new MetiganError(`Request failed with status ${httpError.status}`, ErrorCode.API_REQUEST_FAILED)
          }
        }
        throw new MetiganError("Failed to connect to the contact service", ErrorCode.NETWORK_ERROR)
      }
    } catch (error: unknown) {
      // Log operation with error
      await this.logger.log(`/contact/list/error`, statusCode, "GET")

      // Rethrow MetiganErrors directly
      if (error instanceof MetiganError) {
        throw error
      }

      // Wrap other errors
      throw new MetiganError("An unexpected error occurred while listing contacts", ErrorCode.UNEXPECTED_ERROR)
    }
  }

  /**
   * Update a contact
   * @param email - Email address of the contact to update
   * @param options - Contact update options
   * @returns Response from the API
   */
  async updateContact(email: string, options: ContactUpdateOptions): Promise<ContactApiResponse> {
    let statusCode = 500 // Default error status

    try {
      // Validate options
      const validation = this._validateContactUpdateOptions(email, options)
      if (!validation.isValid) {
        throw new MetiganError(validation.error || "Invalid contact update options", validation.code)
      }

      // Prepare request data
      const requestData = {
        email: this._extractEmailAddress(email),
        audienceId: options.audienceId,
        fields: options.fields,
      }

      // Prepare headers
      const headers = this._prepareAuthHeaders()

      // Make the API request with retry
      try {
        const response = await this._makeRequestWithRetry<ContactApiResponse>(
          this.baseContactApiUrl,
          requestData,
          headers,
          "PUT",
        )
        statusCode = 200 // Success

        // Log successful operation
        await this.logger.log(`/contact/update`, statusCode, "PUT")

        return response
      } catch (httpError: any) {
        // Capture error status code
        if (httpError.status) {
          statusCode = httpError.status
        }

        // Log operation with error
        await this.logger.log(`/contact/update`, statusCode, "PUT")

        // Handle HTTP errors without exposing implementation details
        if (httpError.status === 404) {
          throw new MetiganError(`Contact not found: ${email}`, ErrorCode.CONTACT_NOT_FOUND)
        } else if (httpError.status) {
          if (httpError.data && httpError.data.error) {
            throw new MetiganError(httpError.data.message || httpError.data.error, ErrorCode.API_REQUEST_FAILED)
          } else {
            throw new MetiganError(`Request failed with status ${httpError.status}`, ErrorCode.API_REQUEST_FAILED)
          }
        }
        throw new MetiganError("Failed to connect to the contact service", ErrorCode.NETWORK_ERROR)
      }
    } catch (error: unknown) {
      // Log operation with error
      await this.logger.log(`/contact/update/error`, statusCode, "PUT")

      // Rethrow MetiganErrors directly
      if (error instanceof MetiganError) {
        throw error
      }

      // Wrap other errors
      throw new MetiganError("An unexpected error occurred while updating contact", ErrorCode.UNEXPECTED_ERROR)
    }
  }

  /**
 * Delete a contact
 * @param contactId - ID of the contact to delete
 * @param audienceId - Audience ID from Metigan dashboard
 * @returns Response from the API
 */
  async deleteContact(contactId: string, audienceId: string): Promise<ContactApiResponse> {
    let statusCode = 500 // Default error status
  
    try {
      // Validate email
      if (!contactId) {
        throw new MetiganError(`Invalid email format: ${contactId}`, ErrorCode.INVALID_EMAIL_FORMAT)
      }
  
      // Validate audienceId
      if (!audienceId) {
        throw new MetiganError("audienceId is required", ErrorCode.INVALID_AUDIENCE_ID)
      }
  
      // Prepare URL with path parameters to match the route structure
      const url = `${this.baseContactApiUrl}/${encodeURIComponent(contactId)}/${encodeURIComponent(audienceId)}`
  
      // Prepare headers
      const headers = this._prepareAuthHeaders()
  
      try {
        // Make the API request with retry
        const response = await this._makeRequestWithRetry<ContactApiResponse>(url, null, headers, "DELETE")
        statusCode = 200 // Success
  
        // Log successful operation
        await this.logger.log(`/contact/delete`, statusCode, "DELETE")
  
        return response
      } catch (httpError: any) {
        // Capture error status code
        statusCode = httpError.status || 500
        
        // Log operation with error
        await this.logger.log(`/contact/delete`, statusCode, "DELETE")
  
        // Handle HTTP errors
        if (httpError.status === 404) {
          throw new MetiganError(`Contact not found: ${contactId}`, ErrorCode.CONTACT_NOT_FOUND)
        } else if (httpError.status) {
          const errorMessage = httpError.data?.message || httpError.data?.error || `Request failed with status ${httpError.status}`
          throw new MetiganError(errorMessage, ErrorCode.API_REQUEST_FAILED)
        }
        throw new MetiganError("Failed to connect to the contact service", ErrorCode.NETWORK_ERROR)
      }
    } catch (error: unknown) {
      // Log operation with error
      await this.logger.log(`/contact/delete/error`, statusCode, "DELETE")
  
      // Rethrow MetiganErrors directly
      if (error instanceof MetiganError) {
        throw error
      }
  
      // Wrap other errors
      throw new MetiganError("An unexpected error occurred while deleting contact", ErrorCode.UNEXPECTED_ERROR)
    }
  }

  /**
   * Create a new audience
   * @param options - Audience creation options
   * @returns Response from the API
   */
  async createAudience(options: AudienceCreationOptions): Promise<AudienceApiResponse> {
    let statusCode = 500 // Default error status

    try {
      // Validate options
      const validation = this._validateAudienceCreationOptions(options)
      if (!validation.isValid) {
        throw new MetiganError(validation.error || "Invalid audience creation options", validation.code)
      }

      // Prepare request data
      const requestData = {
        name: options.name,
        description: options.description || "",
      }

      // Prepare headers
      const headers = this._prepareAuthHeaders()

      // Make the API request with retry
      try {
        const response = await this._makeRequestWithRetry<AudienceApiResponse>(
          this.baseAudienceApiUrl,
          requestData,
          headers,
          "POST"
        )
        statusCode = 201 // Created

        // Log successful operation
        await this.logger.log(`/audiences/create`, statusCode, "POST")

        return response
      } catch (httpError: any) {
        // Capture error status code
        if (httpError.status) {
          statusCode = httpError.status
        }

        // Log operation with error
        await this.logger.log(`/audiences/create`, statusCode, "POST")

        // Handle HTTP errors without exposing implementation details
        if (httpError.status === 409) {
          throw new MetiganError("Audience with this name already exists", ErrorCode.API_REQUEST_FAILED)
        } else if (httpError.status) {
          if (httpError.data && httpError.data.error) {
            throw new MetiganError(httpError.data.message || httpError.data.error, ErrorCode.API_REQUEST_FAILED)
          } else {
            throw new MetiganError(`Request failed with status ${httpError.status}`, ErrorCode.API_REQUEST_FAILED)
          }
        }
        throw new MetiganError("Failed to connect to the audience service", ErrorCode.NETWORK_ERROR)
      }
    } catch (error: unknown) {
      // Log operation with error
      await this.logger.log(`/audiences/create/error`, statusCode, "POST")

      // Rethrow MetiganErrors directly
      if (error instanceof MetiganError) {
        throw error
      }

      // Wrap other errors
      throw new MetiganError("An unexpected error occurred while creating audience", ErrorCode.UNEXPECTED_ERROR)
    }
  }

  /**
   * Get all audiences
   * @returns Response from the API
   */
  async getAudiences(): Promise<AudienceApiResponse> {
    let statusCode = 500 // Default error status

    try {
      // Prepare headers
      const headers = this._prepareAuthHeaders()

      // Make the API request with retry
      try {
        const response = await this._makeRequestWithRetry<AudienceApiResponse>(
          this.baseAudienceApiUrl,
          null,
          headers,
          "GET"
        )
        statusCode = 200 // Success

        // Log successful operation
        await this.logger.log(`/audiences/list`, statusCode, "GET")

        return response
      } catch (httpError: any) {
        // Capture error status code
        if (httpError.status) {
          statusCode = httpError.status
        }

        // Log operation with error
        await this.logger.log(`/audiences/list`, statusCode, "GET")

        // Handle HTTP errors without exposing implementation details
        if (httpError.status) {
          if (httpError.data && httpError.data.error) {
            throw new MetiganError(httpError.data.message || httpError.data.error, ErrorCode.API_REQUEST_FAILED)
          } else {
            throw new MetiganError(`Request failed with status ${httpError.status}`, ErrorCode.API_REQUEST_FAILED)
          }
        }
        throw new MetiganError("Failed to connect to the audience service", ErrorCode.NETWORK_ERROR)
      }
    } catch (error: unknown) {
      // Log operation with error
      await this.logger.log(`/audiences/list/error`, statusCode, "GET")

      // Rethrow MetiganErrors directly
      if (error instanceof MetiganError) {
        throw error
      }

      // Wrap other errors
      throw new MetiganError("An unexpected error occurred while listing audiences", ErrorCode.UNEXPECTED_ERROR)
    }
  }

  /**
   * Get an audience by ID
   * @param id - Audience ID
   * @returns Response from the API
   */
  async getAudience(id: string): Promise<AudienceApiResponse> {
    let statusCode = 500 // Default error status

    try {
      // Validate ID
      if (!id) {
        throw new MetiganError("Audience ID is required", ErrorCode.MISSING_REQUIRED_FIELD)
      }

      // Prepare URL
      const url = `${this.baseAudienceApiUrl}/${encodeURIComponent(id)}`

      // Prepare headers
      const headers = this._prepareAuthHeaders()

      // Make the API request with retry
      try {
        const response = await this._makeRequestWithRetry<AudienceApiResponse>(
          url,
          null,
          headers,
          "GET"
        )
        statusCode = 200 // Success

        // Log successful operation
        await this.logger.log(`/audiences/get`, statusCode, "GET")

        return response
      } catch (httpError: any) {
        // Capture error status code
        if (httpError.status) {
          statusCode = httpError.status
        }

        // Log operation with error
        await this.logger.log(`/audiences/get`, statusCode, "GET")

        // Handle HTTP errors without exposing implementation details
        if (httpError.status === 404) {
          throw new MetiganError(`Audience not found: ${id}`, ErrorCode.API_REQUEST_FAILED)
        } else if (httpError.status) {
          if (httpError.data && httpError.data.error) {
            throw new MetiganError(httpError.data.message || httpError.data.error, ErrorCode.API_REQUEST_FAILED)
          } else {
            throw new MetiganError(`Request failed with status ${httpError.status}`, ErrorCode.API_REQUEST_FAILED)
          }
        }
        throw new MetiganError("Failed to connect to the audience service", ErrorCode.NETWORK_ERROR)
      }
    } catch (error: unknown) {
      // Log operation with error
      await this.logger.log(`/audiences/get/error`, statusCode, "GET")

      // Rethrow MetiganErrors directly
      if (error instanceof MetiganError) {
        throw error
      }

      // Wrap other errors
      throw new MetiganError("An unexpected error occurred while getting audience", ErrorCode.UNEXPECTED_ERROR)
    }
  }

  /**
   * Update an audience
   * @param id - Audience ID
   * @param options - Audience update options
   * @returns Response from the API
   */
  async updateAudience(id: string, options: AudienceUpdateOptions): Promise<AudienceApiResponse> {
    let statusCode = 500 // Default error status

    try {
      // Validate options
      const validation = this._validateAudienceUpdateOptions(id, options)
      if (!validation.isValid) {
        throw new MetiganError(validation.error || "Invalid audience update options", validation.code)
      }

      // Prepare URL
      const url = `${this.baseAudienceApiUrl}/${encodeURIComponent(id)}`

      // Prepare request data
      const requestData = {
        name: options.name,
        description: options.description || "",
      }

      // Prepare headers
      const headers = this._prepareAuthHeaders()

      // Make the API request with retry
      try {
        const response = await this._makeRequestWithRetry<AudienceApiResponse>(
          url,
          requestData,
          headers,
          "PUT"
        )
        statusCode = 200 // Success

        // Log successful operation
        await this.logger.log(`/audiences/update`, statusCode, "PUT")

        return response
      } catch (httpError: any) {
        // Capture error status code
        if (httpError.status) {
          statusCode = httpError.status
        }

        // Log operation with error
        await this.logger.log(`/audiences/update`, statusCode, "PUT")

        // Handle HTTP errors without exposing implementation details
        if (httpError.status === 404) {
          throw new MetiganError(`Audience not found: ${id}`, ErrorCode.API_REQUEST_FAILED)
        } else if (httpError.status) {
          if (httpError.data && httpError.data.error) {
            throw new MetiganError(httpError.data.message || httpError.data.error, ErrorCode.API_REQUEST_FAILED)
          } else {
            throw new MetiganError(`Request failed with status ${httpError.status}`, ErrorCode.API_REQUEST_FAILED)
          }
        }
        throw new MetiganError("Failed to connect to the audience service", ErrorCode.NETWORK_ERROR)
      }
    } catch (error: unknown) {
      // Log operation with error
      await this.logger.log(`/audiences/update/error`, statusCode, "PUT")

      // Rethrow MetiganErrors directly
      if (error instanceof MetiganError) {
        throw error
      }

      // Wrap other errors
      throw new MetiganError("An unexpected error occurred while updating audience", ErrorCode.UNEXPECTED_ERROR)
    }
  }

  /**
   * Delete an audience
   * @param id - Audience ID
   * @returns Response from the API
   */
  async deleteAudience(id: string): Promise<AudienceApiResponse> {
    let statusCode = 500 // Default error status

    try {
      // Validate ID
      if (!id) {
        throw new MetiganError("Audience ID is required", ErrorCode.MISSING_REQUIRED_FIELD)
      }

      // Prepare URL
      const url = `${this.baseAudienceApiUrl}/${encodeURIComponent(id)}`

      // Prepare headers
      const headers = this._prepareAuthHeaders()

      // Make the API request with retry
      try {
        const response = await this._makeRequestWithRetry<AudienceApiResponse>(
          url,
          null,
          headers,
          "DELETE"
        )
        statusCode = 200 // Success

        // Log successful operation
        await this.logger.log(`/audiences/delete`, statusCode, "DELETE")

        return response
      } catch (httpError: any) {
        // Capture error status code
        if (httpError.status) {
          statusCode = httpError.status
        }

        // Log operation with error
        await this.logger.log(`/audiences/delete`, statusCode, "DELETE")

        // Handle HTTP errors without exposing implementation details
        if (httpError.status === 404) {
          throw new MetiganError(`Audience not found: ${id}`, ErrorCode.API_REQUEST_FAILED)
        } else if (httpError.status) {
          if (httpError.data && httpError.data.error) {
            throw new MetiganError(httpError.data.message || httpError.data.error, ErrorCode.API_REQUEST_FAILED)
          } else {
            throw new MetiganError(`Request failed with status ${httpError.status}`, ErrorCode.API_REQUEST_FAILED)
          }
        }
        throw new MetiganError("Failed to connect to the audience service", ErrorCode.NETWORK_ERROR)
      }
    } catch (error: unknown) {
      // Log operation with error
      await this.logger.log(`/audiences/delete/error`, statusCode, "DELETE")

      // Rethrow MetiganErrors directly
      if (error instanceof MetiganError) {
        throw error
      }

      // Wrap other errors
      throw new MetiganError("An unexpected error occurred while deleting audience", ErrorCode.UNEXPECTED_ERROR)
    }
  }

  /**
   * Send an email
   * @param options - Email options
   * @returns Response from the API
   */
  async sendEmail(options: EmailOptions): Promise<EmailApiResponse> {
    let statusCode = 500 // Default error status

    try {
      // Validate message data
      const validation = this._validateMessageData(options)
      if (!validation.isValid) {
        throw new MetiganError(validation.error || "Invalid email data", validation.code)
      }

      // Process attachments if present
      let formData: any
      const headers = this._prepareAuthHeaders()

      if (options.attachments && options.attachments.length > 0) {
        // Check if we're in a browser environment with proper File API support
        if (this._isBrowserEnvironment()) {
          formData = new FormData()
          formData.append("from", options.from)
          formData.append("recipients", JSON.stringify(options.recipients))
          formData.append("subject", options.subject)
          formData.append("content", options.content)

          // Add contact creation options if provided
          if (options.contactOptions?.createContact) {
            formData.append("createContact", "true")
            formData.append("audienceId", options.contactOptions.audienceId || "")

            if (options.contactOptions.contactFields) {
              formData.append("contactFields", JSON.stringify(options.contactOptions.contactFields))
            }
          }

          // Append tracking ID if provided
          if (options.trackingId) {
            formData.append("trackingId", options.trackingId)
          }

          // Append files directly for browser
          for (const file of options.attachments) {
            if (file instanceof File) {
              formData.append("files", file)
            } else {
              throw new MetiganError("In browser environments, attachments must be File objects", ErrorCode.INVALID_ATTACHMENT)
            }
          }
        }
        // Node.js environment or other non-browser environment
        else {
          const processedAttachments = await this._processAttachments(options.attachments)

          formData = {
            from: options.from,
            recipients: options.recipients,
            subject: options.subject,
            content: options.content,
            attachments: processedAttachments,
          }

          // Add contact creation options if provided
          if (options.contactOptions?.createContact) {
            formData.createContact = true
            formData.audienceId = options.contactOptions.audienceId || ""

            if (options.contactOptions.contactFields) {
              formData.contactFields = options.contactOptions.contactFields
            }
          }

          // Add tracking ID if provided
          if (options.trackingId) {
            formData.trackingId = options.trackingId
          }
        }
      }
      // No attachments
      else {
        formData = {
          from: options.from,
          recipients: options.recipients,
          subject: options.subject,
          content: options.content,
        }

        // Add contact creation options if provided
        if (options.contactOptions?.createContact) {
          formData.createContact = true
          formData.audienceId = options.contactOptions.audienceId || ""

          if (options.contactOptions.contactFields) {
            formData.contactFields = options.contactOptions.contactFields
          }
        }

        // Add tracking ID if provided
        if (options.trackingId) {
          formData.trackingId = options.trackingId
        }
      }

      // Make the API request with retry
      try {
        const response = await this._makeRequestWithRetry<EmailApiResponse>(this.baseApiUrl, formData, headers)
        statusCode = 200 // Success

        // Log successful operation
        await this.logger.log(`/email/send`, statusCode, "POST")

        // If contact creation was requested, check if it was successful
        if (options.contactOptions?.createContact && response.success && !("contactsCreated" in response)) {
          console.warn("Contact creation was requested but not confirmed in the response")
        }

        return response
      } catch (httpError: any) {
        // Capture error status code
        if (httpError.status) {
          statusCode = httpError.status
        }

        // Log operation with error
        await this.logger.log(`/email/send`, statusCode, "POST")

        // Handle HTTP errors without exposing implementation details
        if (httpError.status) {
          if (httpError.data && httpError.data.error) {
            throw new MetiganError(httpError.data.message || httpError.data.error, ErrorCode.EMAIL_SEND_FAILED)
          } else {
            throw new MetiganError(`Request failed with status ${httpError.status}`, ErrorCode.EMAIL_SEND_FAILED)
          }
        }
        throw new MetiganError("Failed to connect to the email service", ErrorCode.NETWORK_ERROR)
      }
    } catch (error: unknown) {
      // Log operation with error
      await this.logger.log(`/email/send/error`, statusCode, "POST")

      // Rethrow MetiganErrors directly
      if (error instanceof MetiganError) {
        throw error
      }

      // Wrap other errors
      throw new MetiganError("An unexpected error occurred while sending email", ErrorCode.UNEXPECTED_ERROR)
    }
  }

  /**
   * Send an email and create contacts in one operation
   * @param options - Email options with contact creation settings
   * @returns Response from the API
   */
  async sendEmailAndCreateContacts(options: EmailOptions): Promise<EmailApiResponse> {
    // First, ensure we have the required contact options
    if (!options.contactOptions) {
      options.contactOptions = {
        createContact: true,
        audienceId: "",
        contactFields: {},
      }
    } else {
      options.contactOptions.createContact = true
    }

    // Validate that we have an audienceId
    if (!options.contactOptions.audienceId) {
      throw new MetiganError("audienceId is required when creating contacts", ErrorCode.INVALID_AUDIENCE_ID)
    }

    try {
      // Extract emails from recipients
      const emails = options.recipients.map((recipient) => this._extractEmailAddress(recipient))

      // First create the contacts
      await this.createContacts(emails, {
        createContact: true,
        audienceId: options.contactOptions.audienceId,
        contactFields: options.contactOptions.contactFields || {},
      })

      // Then send the email
      return await this.sendEmail(options)
    } catch (error) {
      // If contact creation fails, we should still try to send the email
      if (error instanceof MetiganError && error.message.includes("already exists")) {
        console.warn("Some contacts already exist, continuing with email send")
        return await this.sendEmail(options)
      }
      throw error
    }
  }

  /**
   * Send an email using a template
   * @param options - Template options including templateId
   * @returns Response from the API
   */
  async sendEmailWithTemplate(options: TemplateOptions): Promise<EmailApiResponse> {
    let statusCode = 500 // Default error status

    try {
      // Validate required fields
      if (!options.from) {
        throw new MetiganError("Sender email (from) is required", ErrorCode.MISSING_REQUIRED_FIELD)
      }

      if (!options.recipients || !Array.isArray(options.recipients) || options.recipients.length === 0) {
        throw new MetiganError("Recipients must be a non-empty array", ErrorCode.MISSING_REQUIRED_FIELD)
      }

      if (!options.subject) {
        throw new MetiganError("Subject is required", ErrorCode.MISSING_REQUIRED_FIELD)
      }

      if (!options.templateId) {
        throw new MetiganError("Template ID is required", ErrorCode.MISSING_REQUIRED_FIELD)
      }

      // Validate sender email format
      const fromEmail = this._extractEmailAddress(options.from)
      if (!fromEmail || !this._validateEmail(fromEmail)) {
        throw new MetiganError(`Invalid sender email format: ${fromEmail}`, ErrorCode.INVALID_EMAIL_FORMAT)
      }

      // Validate recipient email formats
      for (const recipient of options.recipients) {
        const recipientEmail = this._extractEmailAddress(recipient)
        if (!recipientEmail || !this._validateEmail(recipientEmail)) {
          throw new MetiganError(`Invalid recipient email format: ${recipientEmail}`, ErrorCode.INVALID_RECIPIENT)
        }
      }

      // Process attachments if present
      let formData: any
      const headers = this._prepareAuthHeaders()

      // Prepare the request data
      formData = {
        from: options.from,
        recipients: options.recipients,
        subject: options.subject,
        useTemplate: "true",
        templateId: options.templateId,
      }

      // Add template variables if provided
      if (options.templateVariables) {
        formData.templateVariables = JSON.stringify(options.templateVariables)
      }

      // Add contact creation options if provided
      if (options.contactOptions?.createContact) {
        formData.createContact = true
        formData.audienceId = options.contactOptions.audienceId || ""

        if (options.contactOptions.contactFields) {
          formData.contactFields = options.contactOptions.contactFields
        }
      }

      // Add tracking ID if provided
      if (options.trackingId) {
        formData.trackingId = options.trackingId
      }

      // Process attachments if present
      if (options.attachments && options.attachments.length > 0) {
        // Check if we're in a browser environment with proper File API support
        if (this._isBrowserEnvironment()) {
          const browserFormData = new FormData()

          // Add all fields to the form data
          for (const [key, value] of Object.entries(formData)) {
            if (typeof value === "object" && value !== null) {
              browserFormData.append(key, JSON.stringify(value))
            } else {
              browserFormData.append(key, String(value))
            }
          }

          // Append files directly for browser
          for (const file of options.attachments) {
            if (file instanceof File) {
              browserFormData.append("files", file)
            } else {
              throw new MetiganError("In browser environments, attachments must be File objects", ErrorCode.INVALID_ATTACHMENT)
            }
          }

          formData = browserFormData
        }
        // Node.js environment or other non-browser environment
        else {
          const processedAttachments = await this._processAttachments(options.attachments)
          formData.attachments = processedAttachments
        }
      }

      // Make the API request with retry
      try {
        const response = await this._makeRequestWithRetry<EmailApiResponse>(this.baseApiUrl, formData, headers)
        statusCode = 200 // Success

        // Log successful operation
        await this.logger.log(`/email/send-template`, statusCode, "POST")

        // If contact creation was requested, check if it was successful
        if (options.contactOptions?.createContact && response.success && !("contactsCreated" in response)) {
          console.warn("Contact creation was requested but not confirmed in the response")
        }

        return response
      } catch (httpError: any) {
        // Capture error status code
        if (httpError.status) {
          statusCode = httpError.status
        }

        // Log operation with error
        await this.logger.log(`/email/send-template`, statusCode, "POST")

        // Handle HTTP errors without exposing implementation details
        if (httpError.status) {
          if (httpError.data && httpError.data.error) {
            throw new MetiganError(httpError.data.message || httpError.data.error, ErrorCode.EMAIL_SEND_FAILED)
          } else {
            throw new MetiganError(`Request failed with status ${httpError.status}`, ErrorCode.EMAIL_SEND_FAILED)
          }
        }
        throw new MetiganError("Failed to connect to the email service", ErrorCode.NETWORK_ERROR)
      }
    } catch (error: unknown) {
      // Log operation with error
      await this.logger.log(`/email/send-template/error`, statusCode, "POST")

      // Rethrow MetiganErrors directly
      if (error instanceof MetiganError) {
        throw error
      }

      // Wrap other errors
      throw new MetiganError("An unexpected error occurred while sending email with template", ErrorCode.UNEXPECTED_ERROR)
    }
  }

  /**
   * Send an email with template and create contacts in one operation
   * @param options - Template options with contact creation settings
   * @returns Response from the API
   */
  async sendTemplateAndCreateContacts(options: TemplateOptions): Promise<EmailApiResponse> {
    // First, ensure we have the required contact options
    if (!options.contactOptions) {
      options.contactOptions = {
        createContact: true,
        audienceId: "",
        contactFields: {},
      }
    } else {
      options.contactOptions.createContact = true
    }

    // Validate that we have an audienceId
    if (!options.contactOptions.audienceId) {
      throw new MetiganError("audienceId is required when creating contacts", ErrorCode.INVALID_AUDIENCE_ID)
    }

    try {
      // Extract emails from recipients
      const emails = options.recipients.map((recipient) => this._extractEmailAddress(recipient))

      // First create the contacts
      await this.createContacts(emails, {
        createContact: true,
        audienceId: options.contactOptions.audienceId,
        contactFields: options.contactOptions.contactFields || {},
      })

      // Then send the email with template
      return await this.sendEmailWithTemplate(options)
    } catch (error) {
      // If contact creation fails, we should still try to send the email
      if (error instanceof MetiganError && error.message.includes("already exists")) {
        console.warn("Some contacts already exist, continuing with email send")
        return await this.sendEmailWithTemplate(options)
      }
      throw error
    }
  }

  /**
   * Create an email template with placeholders
   * @param htmlContent - HTML content with {{placeholders}}
   * @returns Template function that accepts variables
   */
  createTemplate(htmlContent: string): TemplateFunction {
    if (!htmlContent) {
      throw new MetiganError("Template content is required", ErrorCode.MISSING_REQUIRED_FIELD)
    }

    return (variables?: TemplateVariables): string => {
      if (!variables) {
        return htmlContent
      }

      let result = htmlContent

      // Replace all {{variable}} placeholders with their values
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, "g")
        result = result.replace(placeholder, String(value))
      }

      return result
    }
  }

  /**
   * Generates a unique tracking ID for email analytics
   * @returns A unique tracking ID string
   */
  generateTrackingId(): string {
    // Generate a timestamp-based tracking ID with random component
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
    return `mtg-${timestamp}-${random}`
  }
}

// Default export
export default Metigan