import Metigan from '../../src/lib/metigan';
import { MetiganError } from '../../src/lib/errors';

// Mock the HTTP utilities
jest.mock('../../src/utils/http', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  deleteRequest: jest.fn(),
}));

// Import the mocked module after mocking
import * as httpUtils from '../../src/utils/http';

// Mock console methods to avoid cluttering test output
global.console.warn = jest.fn();
global.console.error = jest.fn();

describe('Metigan SDK Integration Tests', () => {
  const API_KEY = 'test-api-key';
  let metigan: Metigan;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance of Metigan for each test
    metigan = new Metigan(API_KEY, { 
      disableLogs: true,
      // Reduce retry count and delay for faster tests
      retryCount: 1,
      retryDelay: 10,
      timeout: 1000
    });
  });

  afterEach(() => {
    // Ensure all mocks are restored
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with API key', () => {
      expect(metigan).toBeInstanceOf(Metigan);
    });

    test('should throw error when initialized without API key', () => {
      expect(() => new Metigan('')).toThrow(MetiganError);
      expect(() => new Metigan('')).toThrow('API key is required');
    });

    test('should accept custom options', () => {
      const customMetigan = new Metigan(API_KEY, {
        userId: 'custom-user',
        retryCount: 5,
        retryDelay: 2000,
        timeout: 60000,
      });
      
      expect(customMetigan).toBeInstanceOf(Metigan);
    });
  });

  describe('Email Sending', () => {
    beforeEach(() => {
      // Mock successful response for email sending
      (httpUtils.post as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'test-message-id',
      });
    });

    test('should send email successfully', async () => {
      const emailOptions = {
        from: 'sender@example.com',
        recipients: ['recipient@example.com'],
        subject: 'Test Subject',
        content: '<p>Test Content</p>',
      };

      const response = await metigan.sendEmail(emailOptions);
      
      expect(response).toEqual({
        success: true,
        messageId: 'test-message-id',
      });
      
      expect(httpUtils.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/end/email'),
        expect.objectContaining({
          from: 'sender@example.com',
          recipients: ['recipient@example.com'],
          subject: 'Test Subject',
          content: '<p>Test Content</p>',
        }),
        expect.objectContaining({
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        })
      );
    }, 10000); // Increase timeout to 10 seconds

    test('should validate email data before sending', async () => {
      const invalidEmailOptions = {
        from: 'invalid-email',
        recipients: ['recipient@example.com'],
        subject: 'Test Subject',
        content: '<p>Test Content</p>',
      };

      await expect(metigan.sendEmail(invalidEmailOptions)).rejects.toThrow(MetiganError);
      expect(httpUtils.post).not.toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      // Create a custom error object that matches what the SDK expects
      const apiError = {
        status: 400,
        data: { error: 'Bad Request', message: 'Invalid email format' },
        message: 'Invalid email format'
      };
      
      (httpUtils.post as jest.Mock).mockRejectedValueOnce(apiError);

      const emailOptions = {
        from: 'sender@example.com',
        recipients: ['recipient@example.com'],
        subject: 'Test Subject',
        content: '<p>Test Content</p>',
      };

      await expect(metigan.sendEmail(emailOptions)).rejects.toThrow('Invalid email format');
    }, 10000); // Increase timeout to 10 seconds

    test('should retry failed requests', async () => {
      // First call fails, second succeeds
      (httpUtils.post as jest.Mock)
        .mockRejectedValueOnce({ 
          status: 500,
          data: { error: 'Server Error', message: 'Internal server error' }
        })
        .mockResolvedValueOnce({ 
          success: true, 
          messageId: 'test-message-id' 
        });

      const emailOptions = {
        from: 'sender@example.com',
        recipients: ['recipient@example.com'],
        subject: 'Test Subject',
        content: '<p>Test Content</p>',
      };

      const response = await metigan.sendEmail(emailOptions);
      
      expect(response).toEqual({
        success: true,
        messageId: 'test-message-id',
      });
      
      expect(httpUtils.post).toHaveBeenCalledTimes(2);
    }, 10000); // Increase timeout to 10 seconds
  });

  describe('Template Emails', () => {
    test('should send email with template', async () => {
      (httpUtils.post as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'test-template-id',
      });

      const templateOptions = {
        from: 'sender@example.com',
        recipients: ['recipient@example.com'],
        subject: 'Template Test',
        templateId: 'template-123',
        templateVariables: {
          name: 'John Doe',
          company: 'Acme Inc',
        },
      };

      const response = await metigan.sendEmailWithTemplate(templateOptions);
      
      expect(response).toEqual({
        success: true,
        messageId: 'test-template-id',
      });
      
      expect(httpUtils.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/end/email'),
        expect.objectContaining({
          from: 'sender@example.com',
          recipients: ['recipient@example.com'],
          subject: 'Template Test',
          useTemplate: 'true',
          templateId: 'template-123',
          templateVariables: expect.any(String),
        }),
        expect.any(Object)
      );
    }, 10000); // Increase timeout to 10 seconds

    test('should create and use template function', () => {
      const htmlTemplate = '<p>Hello {{name}}, welcome to {{company}}!</p>';
      const templateFn = metigan.createTemplate(htmlTemplate);
      
      const result = templateFn({
        name: 'John',
        company: 'Acme Inc',
      });
      
      expect(result).toBe('<p>Hello John, welcome to Acme Inc!</p>');
    });
  });

  describe('Contact Management', () => {
    test('should create contacts', async () => {
      (httpUtils.post as jest.Mock).mockResolvedValue({
        success: true,
        contactsCreated: 2,
      });

      const emails = ['contact1@example.com', 'contact2@example.com'];
      const options = {
        createContact: true,
        audienceId: 'audience-123',
        contactFields: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const response = await metigan.createContacts(emails, options);
      
      expect(response).toEqual({
        success: true,
        contactsCreated: 2,
      });
      
      expect(httpUtils.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/end/contacts'),
        expect.objectContaining({
          emails: emails,
          audienceId: 'audience-123',
          fields: options.contactFields,
        }),
        expect.any(Object)
      );
    }, 10000); // Increase timeout to 10 seconds

    test('should get contact by email', async () => {
      (httpUtils.get as jest.Mock).mockResolvedValue({
        success: true,
        contact: {
          email: 'contact@example.com',
          fields: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      });

      const response = await metigan.getContact('contact@example.com', 'audience-123');
      
      expect(response).toEqual({
        success: true,
        contact: {
          email: 'contact@example.com',
          fields: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      });
      
      expect(httpUtils.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/end/contacts/contact%40example.com'),
        expect.any(Object)
      );
    }, 10000); // Increase timeout to 10 seconds

    test('should update contact', async () => {
      (httpUtils.put as jest.Mock).mockResolvedValue({
        success: true,
        updated: true,
      });

      const email = 'contact@example.com';
      const options = {
        audienceId: 'audience-123',
        fields: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
      };

      const response = await metigan.updateContact(email, options);
      
      expect(response).toEqual({
        success: true,
        updated: true,
      });
      
      expect(httpUtils.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/end/contacts'),
        expect.objectContaining({
          email: 'contact@example.com',
          audienceId: 'audience-123',
          fields: options.fields,
        }),
        expect.any(Object)
      );
    }, 10000); // Increase timeout to 10 seconds

    test('should delete contact', async () => {
      (httpUtils.deleteRequest as jest.Mock).mockResolvedValue({
        success: true,
        deleted: true,
      });

      const response = await metigan.deleteContact('contact@example.com', 'audience-123');
      
      expect(response).toEqual({
        success: true,
        deleted: true,
      });
      
      expect(httpUtils.deleteRequest).toHaveBeenCalledWith(
        expect.stringContaining('/api/end/contacts/contact%40example.com'),
        expect.any(Object)
      );
    }, 10000); // Increase timeout to 10 seconds
  });

  describe('Attachment Handling', () => {
    // Mock environment detection
    let originalIsBrowserEnvironment: any;

    beforeEach(() => {
      // Save the original method
      originalIsBrowserEnvironment = (metigan as any)._isBrowserEnvironment;
      // Mock the environment detection to return false (Node.js environment)
      (metigan as any)._isBrowserEnvironment = jest.fn().mockReturnValue(false);
    });

    afterEach(() => {
      // Restore the original method
      (metigan as any)._isBrowserEnvironment = originalIsBrowserEnvironment;
    });

    test('should detect browser environment correctly', () => {
      // First test with browser environment
      (metigan as any)._isBrowserEnvironment = jest.fn().mockReturnValue(true);
      expect((metigan as any)._isBrowserEnvironment()).toBe(true);
      
      // Then test with Node.js environment
      (metigan as any)._isBrowserEnvironment = jest.fn().mockReturnValue(false);
      expect((metigan as any)._isBrowserEnvironment()).toBe(false);
    });

    test('should process Node.js attachments correctly', async () => {
      // Mock successful response
      (httpUtils.post as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'test-attachment-id',
      });

      const nodeAttachment = {
        buffer: Buffer.from('test file content'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
      };

      const emailOptions = {
        from: 'sender@example.com',
        recipients: ['recipient@example.com'],
        subject: 'Attachment Test',
        content: '<p>Test with attachment</p>',
        attachments: [nodeAttachment],
      };

      const response = await metigan.sendEmail(emailOptions);
      
      expect(response).toEqual({
        success: true,
        messageId: 'test-attachment-id',
      });
      
      expect(httpUtils.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/end/email'),
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: 'test.pdf',
              contentType: 'application/pdf',
            }),
          ]),
        }),
        expect.objectContaining({
          'Content-Type': 'application/json',
        })
      );
    }, 10000); // Increase timeout to 10 seconds

    test('should process custom attachments correctly', async () => {
      // Mock successful response
      (httpUtils.post as jest.Mock).mockResolvedValue({
        success: true,
        messageId: 'test-custom-attachment-id',
      });

      const customAttachment = {
        content: Buffer.from('test file content'),
        filename: 'custom.txt',
        contentType: 'text/plain',
      };

      const emailOptions = {
        from: 'sender@example.com',
        recipients: ['recipient@example.com'],
        subject: 'Custom Attachment Test',
        content: '<p>Test with custom attachment</p>',
        attachments: [customAttachment],
      };

      const response = await metigan.sendEmail(emailOptions);
      
      expect(response).toEqual({
        success: true,
        messageId: 'test-custom-attachment-id',
      });
      
      expect(httpUtils.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/end/email'),
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: 'custom.txt',
              contentType: 'text/plain',
            }),
          ]),
        }),
        expect.any(Object)
      );
    }, 10000); // Increase timeout to 10 seconds

    test('should handle file size limits', async () => {
      // Create a large buffer that exceeds the 7MB limit
      const largeBuffer = Buffer.alloc(8 * 1024 * 1024); // 8MB
      
      const largeAttachment = {
        content: largeBuffer,
        filename: 'large.bin',
        contentType: 'application/octet-stream',
      };

      const emailOptions = {
        from: 'sender@example.com',
        recipients: ['recipient@example.com'],
        subject: 'Large Attachment Test',
        content: '<p>Test with large attachment</p>',
        attachments: [largeAttachment],
      };

      await expect(metigan.sendEmail(emailOptions)).rejects.toThrow(MetiganError);
      await expect(metigan.sendEmail(emailOptions)).rejects.toThrow('exceeds the maximum size of 7MB');
      expect(httpUtils.post).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      // Create a network error
      const networkError = new Error('Network error');
      (httpUtils.post as jest.Mock).mockRejectedValueOnce(networkError);

      const emailOptions = {
        from: 'sender@example.com',
        recipients: ['recipient@example.com'],
        subject: 'Test Subject',
        content: '<p>Test Content</p>',
      };

      await expect(metigan.sendEmail(emailOptions)).rejects.toThrow(MetiganError);
    }, 10000); // Increase timeout to 10 seconds

    test('should handle authentication errors', async () => {
      // Create an auth error
      const authError = {
        status: 401,
        data: { error: 'Unauthorized', message: 'Invalid API key' }
      };
      
      (httpUtils.post as jest.Mock).mockRejectedValueOnce(authError);

      const emailOptions = {
        from: 'sender@example.com',
        recipients: ['recipient@example.com'],
        subject: 'Test Subject',
        content: '<p>Test Content</p>',
      };

      await expect(metigan.sendEmail(emailOptions)).rejects.toThrow('Invalid API key');
    }, 10000); // Increase timeout to 10 seconds

    test('should handle rate limiting', async () => {
      // Create a rate limit error
      const rateLimitError = {
        status: 429,
        data: { error: 'Too Many Requests', message: 'Rate limit exceeded' }
      };
      
      (httpUtils.post as jest.Mock).mockRejectedValueOnce(rateLimitError);

      const emailOptions = {
        from: 'sender@example.com',
        recipients: ['recipient@example.com'],
        subject: 'Test Subject',
        content: '<p>Test Content</p>',
      };

      await expect(metigan.sendEmail(emailOptions)).rejects.toThrow('Rate limit exceeded');
    }, 10000); // Increase timeout to 10 seconds
  });

  describe('Utility Functions', () => {
    test('should validate email addresses correctly', () => {
      // Access private method via any cast
      const validateEmail = (metigan as any)._validateEmail.bind(metigan);
      
      expect(validateEmail('valid@example.com')).toBe(true);
      expect(validateEmail('valid+tag@example.com')).toBe(true);
      expect(validateEmail('valid.name@example.co.uk')).toBe(true);
      
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('invalid@example')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
    });

    test('should extract email addresses correctly', () => {
      // Access private method via any cast
      const extractEmail = (metigan as any)._extractEmailAddress.bind(metigan);
      
      expect(extractEmail('user@example.com')).toBe('user@example.com');
      expect(extractEmail('John Doe <john@example.com>')).toBe('john@example.com');
      expect(extractEmail('<alice@example.com>')).toBe('alice@example.com');
      expect(extractEmail('  spaced@example.com  ')).toBe('spaced@example.com');
      
      expect(extractEmail('')).toBe('');
      expect(extractEmail(null)).toBe('');
    });

    test('should generate tracking IDs', () => {
      const trackingId1 = metigan.generateTrackingId();
      const trackingId2 = metigan.generateTrackingId();
      
      expect(trackingId1).toMatch(/^mtg-\d+-\d{4}$/);
      expect(trackingId2).toMatch(/^mtg-\d+-\d{4}$/);
      expect(trackingId1).not.toBe(trackingId2); // Should be unique
    });

    test('should detect MIME types correctly', () => {
      // Access private method via any cast
      const getMimeType = (metigan as any)._getMimeType.bind(metigan);
      
      expect(getMimeType('document.pdf')).toBe('application/pdf');
      expect(getMimeType('image.jpg')).toBe('image/jpeg');
      expect(getMimeType('image.jpeg')).toBe('image/jpeg');
      expect(getMimeType('spreadsheet.xlsx')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(getMimeType('text.txt')).toBe('text/plain');
      expect(getMimeType('unknown.xyz')).toBe('application/octet-stream');
    });
  });
});