/**
 * Metigan - Email Sending Library
 * A simple library for sending emails through the Metigan API
 * @version 1.1.0
 */

// Import dependencies in a way that doesn't expose them in stack traces
import * as http from '../utils/http';
import axios from 'axios';

// Private constants
const API_URL = 'https://metigan-emails-api.savanapoint.com/api/end/email';
const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB in bytes
const LOG_API_URL = 'https://metigan-emails-api.savanapoint.com/api/logs'; // URL da API de logs

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
];

// Valid user agents
const VALID_USER_AGENTS = ['SDK', 'Webhook', 'SMTP'];

/**
 * Logger para monitoramento da biblioteca Metigan
 */
class MetiganLogger {
  private apiKey: string;
  private userId: string;
  private disabled: boolean = false;
  private retryCount: number = 3; // Número de tentativas em caso de falha
  private retryDelay: number = 500; // Delay entre tentativas (ms)
  private pendingLogs: Array<{endpoint: string, status: number, method: string}> = [];
  private isBatchProcessing: boolean = false;
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(apiKey: string, userId: string) {
    this.apiKey = apiKey;
    this.userId = userId;
  }

  /**
   * Desativa o logger
   */
  disable(): void {
    this.disabled = true;
    this.clearPendingLogs();
  }

  /**
   * Ativa o logger
   */
  enable(): void {
    this.disabled = false;
  }

  /**
   * Limpa logs pendentes
   */
  private clearPendingLogs(): void {
    this.pendingLogs = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  /**
   * Validar e formatar status code para garantir compatibilidade com a API
   * @param status - Código de status HTTP
   * @returns Status code válido e seu label
   * @private
   */
  private _validateStatus(status: number): { code: string, label: string } {
    // Converter para string e verificar se está na lista de status válidos
    const statusStr = status.toString();
    const validStatus = STATUS_OPTIONS.find(option => option.value === statusStr);
    
    if (validStatus) {
      return { 
        code: statusStr, 
        label: validStatus.label 
      };
    } else {
      // Se não for um status válido, retorna 500 como padrão
      const defaultStatus = STATUS_OPTIONS.find(option => option.value === "500");
      return { 
        code: "500", 
        label: defaultStatus ? defaultStatus.label : "500 - Internal Server Error" 
      };
    }
  }

  /**
   * Determinar o userAgent apropriado
   * @returns UserAgent string
   */
  private _getUserAgent(): string {
    // No nosso caso, sempre usamos SDK
    return 'SDK';
  }

  /**
   * Tenta realizar requisição com retentativas
   * @param url - URL da requisição
   * @param data - Dados para enviar
   * @param headers - Cabeçalhos da requisição
   */
  private async _makeRequestWithRetry(url: string, data: any, headers: any): Promise<any> {
    let lastError;
    
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        return await axios.post(url, data, { headers, timeout: 5000 }); // Timeout de 5 segundos
      } catch (err: any) {
        lastError = err;
        
        // Se o erro for 403 (Forbidden), verifica se é problema de autenticação
        if (err.response && err.response.status === 403) {
          // Se for última tentativa, registra o erro silenciosamente
          if (attempt === this.retryCount - 1) {
            console.warn('Erro de autenticação ao registrar logs. Verifique sua API key.');
            return; // Encerra as tentativas
          }
        }
        
        // Se for erro de rede ou timeout, tenta novamente com mais urgência
        if (!err.response || err.code === 'ECONNABORTED') {
          if (attempt === this.retryCount - 1) {
            console.warn('Erro de conexão ao registrar logs. Verifique sua conectividade.');
            return;
          }
        }
        
        // Aguarda antes de tentar novamente (exceto na última tentativa)
        if (attempt < this.retryCount - 1) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1))); // Backoff exponencial
        }
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam
    throw lastError;
  }

  /**
   * Processa o lote de logs pendentes
   */
  private async processBatch(): Promise<void> {
    if (this.disabled || this.pendingLogs.length === 0 || this.isBatchProcessing) {
      return;
    }

    this.isBatchProcessing = true;
    this.batchTimeout = null;

    try {
      // Copiar logs pendentes e limpar a fila
      const logBatch = [...this.pendingLogs];
      this.pendingLogs = [];

      // Obter userAgent apropriado
      const userAgent = this._getUserAgent();

      // Preparar lote de logs para envio
      const batchData = logBatch.map(log => {
        const validatedStatus = this._validateStatus(log.status);
        return {
          userId: this.userId,
          endpoint: log.endpoint,
          status: validatedStatus.code,
          statusLabel: validatedStatus.label,
          method: log.method,
          userAgent,
          timestamp: new Date().toISOString()
        };
      });

      // Enviar lote
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'User-Agent': userAgent
      };

      await this._makeRequestWithRetry(LOG_API_URL, { logs: batchData }, headers)
        .catch(err => {
          console.warn('Aviso ao processar lote de logs:', err.message || 'Erro desconhecido');
        });
    } catch (error: any) {
      console.warn('Erro ao processar lote de logs:', error.message || 'Erro desconhecido');
    } finally {
      this.isBatchProcessing = false;
      
      // Verificar se novos logs foram adicionados durante o processamento
      if (this.pendingLogs.length > 0) {
        this.scheduleBatchProcessing();
      }
    }
  }

  /**
   * Agenda o processamento do lote de logs
   */
  private scheduleBatchProcessing(): void {
    if (!this.batchTimeout && !this.disabled) {
      this.batchTimeout = setTimeout(() => this.processBatch(), 1000); // Processa a cada 1 segundo
    }
  }

  /**
   * Registra uma operação para ser enviada em lote para a API de logs
   */
  async log(endpoint: string, status: number, method: string): Promise<void> {
    if (this.disabled) return;

    // Adicionar log à fila
    this.pendingLogs.push({ endpoint, status, method });
    
    // Agendar processamento em lote se necessário
    this.scheduleBatchProcessing();
  }
}

/**
 * Custom error class for Metigan-specific errors
 */
export class MetiganError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MetiganError';
    
    // This prevents the implementation details from showing in the stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

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
interface ProcessedAttachment {
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
  /** Optional CC recipients */
  cc?: string[];
  /** Optional BCC recipients */
  bcc?: string[];
  /** Optional reply-to address */
  replyTo?: string;
}

/**
 * Validation result interface
 */
interface ValidationResult {
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

/**
 * Metigan client options
 */
export interface MetiganOptions {
  /** ID do usuário para logs */
  userId?: string;
  /** Desabilitar logs */
  disableLogs?: boolean;
  /** Número de tentativas para operações que falham */
  retryCount?: number;
  /** Tempo base entre tentativas (ms) */
  retryDelay?: number;
  /** Timeout para requisições (ms) */
  timeout?: number;
}

/**
 * Metigan client for sending emails
 */
export class Metigan {
  private apiKey: string;
  private logger: MetiganLogger;
  private timeout: number;
  private retryCount: number;
  private retryDelay: number;

  /**
   * Create a new Metigan client
   * @param apiKey - Your API key
   * @param options - Client options
   */
  constructor(apiKey: string, options: MetiganOptions = {}) {
    if (!apiKey) {
      throw new MetiganError('API key is required');
    }
    this.apiKey = apiKey;
    
    // Opções avançadas
    this.timeout = options.timeout || 30000; // 30 segundos padrão
    this.retryCount = options.retryCount || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    // Inicializa o logger
    const userId = options.userId || 'anonymous';
    this.logger = new MetiganLogger(apiKey, userId);
    
    // Desativa logs se solicitado
    if (options.disableLogs) {
      this.logger.disable();
    }
  }

  /**
   * Enables logging
   */
  enableLogging(): void {
    this.logger.enable();
  }

  /**
   * Disables logging
   */
  disableLogging(): void {
    this.logger.disable();
  }

  /**
   * Validates an email address format
   * @param email - The email to validate
   * @returns True if email is valid
   * @private
   */
  private _validateEmail(email: string): boolean {
    // More comprehensive email validation
    if (!email || typeof email !== 'string') return false;
    
    // Simple email validation - check for @ and at least one dot after it
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    if (parts[0].length === 0) return false;
    
    // Verificar parte do domínio
    const domainParts = parts[1].split('.');
    if (domainParts.length < 2) return false;
    if (domainParts.some(part => part.length === 0)) return false;
    
    return true;
  }

  /**
   * Extracts email address from a format like "Name <email@example.com>"
   * @param from - The from field which might include a name
   * @returns The extracted email address
   * @private
   */
  private _extractEmailAddress(from: string): string {
    if (!from) return '';
    
    // Handle case with angle brackets
    const angleMatch = from.match(/<([^>]+)>/);
    if (angleMatch) {
      return angleMatch[1].trim();
    }
    
    // If no angle brackets, assume it's just an email
    return from.trim();
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
      return { isValid: false, error: 'Sender email (from) is required' };
    }
    
    if (!messageData.recipients || !Array.isArray(messageData.recipients) || messageData.recipients.length === 0) {
      return { isValid: false, error: 'Recipients must be a non-empty array' };
    }
    
    if (!messageData.subject) {
      return { isValid: false, error: 'Subject is required' };
    }
    
    if (!messageData.content) {
      return { isValid: false, error: 'Content is required' };
    }

    // Validate sender email format
    const fromEmail = this._extractEmailAddress(messageData.from);
    if (!fromEmail || !this._validateEmail(fromEmail)) {
      return { isValid: false, error: `Invalid sender email format: ${fromEmail}` };
    }

    // Validate recipient email formats
    for (const recipient of messageData.recipients) {
      const recipientEmail = this._extractEmailAddress(recipient);
      if (!recipientEmail || !this._validateEmail(recipientEmail)) {
        return { isValid: false, error: `Invalid recipient email format: ${recipientEmail}` };
      }
    }
    
    // Validate CC emails if provided
    if (messageData.cc && Array.isArray(messageData.cc)) {
      for (const cc of messageData.cc) {
        const ccEmail = this._extractEmailAddress(cc);
        if (!ccEmail || !this._validateEmail(ccEmail)) {
          return { isValid: false, error: `Invalid CC email format: ${ccEmail}` };
        }
      }
    }
    
    // Validate BCC emails if provided
    if (messageData.bcc && Array.isArray(messageData.bcc)) {
      for (const bcc of messageData.bcc) {
        const bccEmail = this._extractEmailAddress(bcc);
        if (!bccEmail || !this._validateEmail(bccEmail)) {
          return { isValid: false, error: `Invalid BCC email format: ${bccEmail}` };
        }
      }
    }
    
    // Validate reply-to if provided
    if (messageData.replyTo) {
      const replyToEmail = this._extractEmailAddress(messageData.replyTo);
      if (!replyToEmail || !this._validateEmail(replyToEmail)) {
        return { isValid: false, error: `Invalid reply-to email format: ${replyToEmail}` };
      }
    }

    return { isValid: true };
  }

  /**
   * Process attachments for the email
   * @param attachments - Array of files or file-like objects
   * @returns Processed attachments
   * @private
   */
  private async _processAttachments(
    attachments: Array<File | NodeAttachment | CustomAttachment>
  ): Promise<ProcessedAttachment[]> {
    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return [];
    }

    const processedAttachments: ProcessedAttachment[] = [];

    for (const file of attachments) {
      let buffer: ArrayBuffer | Buffer | Uint8Array | string;
      let filename: string;
      let mimetype: string;

      // Handle File objects (browser)
      if (typeof File !== 'undefined' && file instanceof File) {
        if (file.size > MAX_FILE_SIZE) {
          throw new MetiganError(`File ${file.name} exceeds the maximum size of 7MB`);
        }
        
        buffer = await file.arrayBuffer();
        filename = file.name;
        mimetype = file.type || this._getMimeType(file.name);
      } 
      // Handle Buffer objects (Node.js)
      else if ('buffer' in file && 'originalname' in file) {
        const nodeFile = file as NodeAttachment;
        
        if (nodeFile.buffer.length > MAX_FILE_SIZE) {
          throw new MetiganError(`File ${nodeFile.originalname} exceeds the maximum size of 7MB`);
        }
        
        buffer = nodeFile.buffer;
        filename = nodeFile.originalname;
        mimetype = nodeFile.mimetype || this._getMimeType(nodeFile.originalname);
      }
      // Handle custom objects
      else if ('content' in file && 'filename' in file) {
        const customFile = file as CustomAttachment;
        
        // Check size for different types of content
        let contentSize = 0;
        if (customFile.content instanceof ArrayBuffer) {
          contentSize = customFile.content.byteLength;
        } else if (customFile.content instanceof Buffer || customFile.content instanceof Uint8Array) {
          contentSize = customFile.content.length;
        } else if (typeof customFile.content === 'string') {
          contentSize = Buffer.from(customFile.content).length;
        }
        
        if (contentSize > MAX_FILE_SIZE) {
          throw new MetiganError(`File ${customFile.filename} exceeds the maximum size of 7MB`);
        }
        
        buffer = customFile.content;
        filename = customFile.filename;
        mimetype = customFile.contentType || this._getMimeType(customFile.filename);
      } else {
        throw new MetiganError('Invalid attachment format');
      }

      // Convert buffer to base64 if needed
      let content: any = buffer;
      
      // In browser environments, convert to base64
      if (typeof window !== 'undefined') {
        if (buffer instanceof ArrayBuffer) {
          const uint8Array = new Uint8Array(buffer);
          const binary = Array.from(uint8Array).map(b => String.fromCharCode(b)).join('');
          content = btoa(binary);
        } else if (buffer instanceof Uint8Array) {
          const binary = Array.from(buffer).map(b => String.fromCharCode(b)).join('');
          content = btoa(binary);
        }
      }

      processedAttachments.push({
        filename,
        content,
        contentType: mimetype,
        encoding: 'base64',
        disposition: 'attachment'
      });
    }

    return processedAttachments;
  }
  
  /**
   * Get MIME type based on file extension
   * @param filename - Nome do arquivo
   * @returns MIME type
   * @private
   */
  private _getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    
    // Mapeamento básico de extensões para MIME types
    const mimeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'xml': 'application/xml',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      'tar': 'application/x-tar',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'wav': 'audio/wav',
      'avi': 'video/x-msvideo',
      'csv': 'text/csv'
    };
    
    return ext && mimeMap[ext] ? mimeMap[ext] : 'application/octet-stream';
  }
  
  /**
   * Tenta fazer uma requisição HTTP com sistema de retry
   * @param url - URL da requisição
   * @param data - Dados para enviar
   * @param headers - Cabeçalhos da requisição
   * @param method - Método HTTP
   * @private
   */
  private async _makeRequestWithRetry<T>(
    url: string, 
    data: any, 
    headers: Record<string, string>,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<T> {
    let lastError;
    
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        if (method === 'GET') {
          return await http.get<T>(url, headers);
        } else {
          return await http.post<T>(url, data, headers);
        }
      } catch (error: any) {
        lastError = error;
        
        // Se for erro de autenticação (401/403), podemos tentar novamente um número limitado de vezes
        if (error.status === 401 || error.status === 403) {
          console.warn(`Tentativa ${attempt + 1}/${this.retryCount}: Erro de autenticação (${error.status})`);
        }
        
        // Se for erro de servidor (5xx), tenta novamente após espera
        else if (error.status >= 500) {
          console.warn(`Tentativa ${attempt + 1}/${this.retryCount}: Erro de servidor (${error.status})`);
        }
        
        // Se for erro de rede, também tentamos novamente
        else if (!error.status) {
          console.warn(`Tentativa ${attempt + 1}/${this.retryCount}: Erro de rede ou timeout`);
        }
        
        // Se não for último retry, espera antes de tentar novamente
        if (attempt < this.retryCount - 1) {
          // Backoff exponencial com jitter
          const delay = this.retryDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // Na última tentativa, propaga o erro
          throw error;
        }
      }
    }
    
    // Nunca deveria chegar aqui, mas por segurança
    throw lastError;
  }

  /**
   * Send an email
   * @param options - Email options
   * @returns Response from the API
   */
  async sendEmail(options: EmailOptions): Promise<EmailApiResponse> {
    // Início do monitoramento
    const startTime = Date.now();
    let statusCode = 500; // Status padrão para erro
    
    try {
      // Validate message data
      const validation = this._validateMessageData(options);
      if (!validation.isValid) {
        throw new MetiganError(validation.error || 'Invalid email data');
      }
      
     
      
      // Process attachments if present
      let formData: any;
      let headers: Record<string, string> = {
        'x-api-key': this.apiKey,
        'User-Agent': 'SDK'
      };
      
      if (options.attachments && options.attachments.length > 0) {
        // If we're in a browser environment
        if (typeof FormData !== 'undefined') {
          formData = new FormData();
          formData.append('from', options.from);
          formData.append('recipients', JSON.stringify(options.recipients));
          formData.append('subject', options.subject);
          formData.append('content', options.content);
          
          
          // Adicionar CC se fornecido
          if (options.cc && options.cc.length > 0) {
            formData.append('cc', JSON.stringify(options.cc));
          }
          
          // Adicionar BCC se fornecido
          if (options.bcc && options.bcc.length > 0) {
            formData.append('bcc', JSON.stringify(options.bcc));
          }
          
          // Adicionar reply-to se fornecido
          if (options.replyTo) {
            formData.append('replyTo', options.replyTo);
          }
          
          // Append files directly for browser
          for (const file of options.attachments) {
            if (file instanceof File) {
              formData.append('files', file);
            } else {
              throw new MetiganError('In browser environments, attachments must be File objects');
            }
          }
        } 
        // Node.js environment
        else {
          const processedAttachments = await this._processAttachments(options.attachments);
          
          formData = {
            from: options.from,
            recipients: options.recipients,
            subject: options.subject,
            content: options.content,
            attachments: processedAttachments
          };
          
          // Adicionar CC se fornecido
          if (options.cc && options.cc.length > 0) {
            formData.cc = options.cc;
          }
          
          // Adicionar BCC se fornecido
          if (options.bcc && options.bcc.length > 0) {
            formData.bcc = options.bcc;
          }
          
          // Adicionar reply-to se fornecido
          if (options.replyTo) {
            formData.replyTo = options.replyTo;
          }
          
          headers['Content-Type'] = 'application/json';
        }
      } 
      // No attachments
      else {
        formData = {
          from: options.from,
          recipients: options.recipients,
          subject: options.subject,
          content: options.content,
        };
        
        // Adicionar CC se fornecido
        if (options.cc && options.cc.length > 0) {
          formData.cc = options.cc;
        }
        
        // Adicionar BCC se fornecido
        if (options.bcc && options.bcc.length > 0) {
          formData.bcc = options.bcc;
        }
        
        // Adicionar reply-to se fornecido
        if (options.replyTo) {
          formData.replyTo = options.replyTo;
        }
        
        headers['Content-Type'] = 'application/json';
      }
      
      // Make the API request with retry
      try {
        const response = await this._makeRequestWithRetry<EmailApiResponse>(API_URL, formData, headers);
        statusCode = 200; // Sucesso
        
        // Log da operação bem-sucedida
        await this.logger.log(
          `/email/send`, 
          statusCode, 
          'POST'
        );
        
        return response;
      } catch (httpError: any) {
        // Captura o status code do erro
        if (httpError.status) {
          statusCode = httpError.status;
        }
        
        // Log da operação com erro
        await this.logger.log(
          `/email/send`, 
          statusCode, 
          'POST'
        );
        
        // Handle HTTP errors without exposing implementation details
        if (httpError.status) {
          if (httpError.data && httpError.data.error) {
            throw new MetiganError(httpError.data.message || httpError.data.error);
          } else {
            throw new MetiganError(`Request failed with status ${httpError.status}`);
          }
        }
        throw new MetiganError('Failed to connect to the email service');
      }
    } catch (error: unknown) {
      // Log da operação com erro
      await this.logger.log(
        `/email/send/error`, 
        statusCode, 
        'POST'
      );
      
      // Rethrow MetiganErrors directly
      if (error instanceof MetiganError) {
        throw error;
      }
      
      // Wrap other errors
      throw new MetiganError('An unexpected error occurred while sending email');
    }
  }/**
   * Generates a unique tracking ID for email analytics
   * @returns A unique tracking ID string
   * @private
   */
  private _generateTrackingId(): string {
    // Generate a timestamp-based tracking ID with random component
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `mtg-${timestamp}-${random}`;
  }
}
// Default export
export default Metigan;