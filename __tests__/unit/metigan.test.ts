import Metigan from "../../src/lib/metigan"
import { MetiganError } from "../../src/lib/errors"
import * as httpUtils from "../../src/utils/http"

// Mock the HTTP utilities
jest.mock("../../src/utils/http", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  deleteRequest: jest.fn(),
}))

describe("Metigan SDK Unit Tests", () => {
  const API_KEY = "test-api-key"
  let metigan: Metigan

  beforeEach(() => {
    jest.clearAllMocks()
    metigan = new Metigan(API_KEY, {
      disableLogs: true,
      retryCount: 1,
      retryDelay: 10,
    })
  })

  describe("Constructor", () => {
    test("should initialize with API key", () => {
      expect(metigan).toBeInstanceOf(Metigan)
    })

    test("should throw error when initialized without API key", () => {
      expect(() => new Metigan("")).toThrow(MetiganError)
      expect(() => new Metigan("")).toThrow("API key is required")
    })

    test("should use default options when not provided", () => {
      const defaultMetigan = new Metigan(API_KEY)
      expect(defaultMetigan).toBeInstanceOf(Metigan)
      // Access private properties for testing
      expect((defaultMetigan as any).retryCount).toBe(3) // Default retry count
      expect((defaultMetigan as any).retryDelay).toBe(1000) // Default retry delay
      expect((defaultMetigan as any).timeout).toBe(30000) // Default timeout
    })

    test("should accept custom options", () => {
      const customMetigan = new Metigan(API_KEY, {
        userId: "custom-user",
        retryCount: 5,
        retryDelay: 2000,
        timeout: 60000,
      })

      expect(customMetigan).toBeInstanceOf(Metigan)
      // Access private properties for testing
      expect((customMetigan as any).retryCount).toBe(5)
      expect((customMetigan as any).retryDelay).toBe(2000)
      expect((customMetigan as any).timeout).toBe(60000)
    })
  })

  describe("Logging Methods", () => {
    test("should enable logging", () => {
      // Create a spy on the logger's enable method
      const enableSpy = jest.spyOn((metigan as any).logger, "enable")

      metigan.enableLogging()

      expect(enableSpy).toHaveBeenCalled()
    })

    test("should disable logging", () => {
      // Create a spy on the logger's disable method
      const disableSpy = jest.spyOn((metigan as any).logger, "disable")

      metigan.disableLogging()

      expect(disableSpy).toHaveBeenCalled()
    })
  })

  describe("Email Validation", () => {
    test("should validate email addresses correctly", () => {
      // Access private method via any cast
      const validateEmail = (metigan as any)._validateEmail.bind(metigan)

      // Valid email formats
      expect(validateEmail("valid@example.com")).toBe(true)
      expect(validateEmail("valid+tag@example.com")).toBe(true)
      expect(validateEmail("valid.name@example.co.uk")).toBe(true)
      expect(validateEmail("valid-name@example.com")).toBe(true)
      expect(validateEmail("123@example.com")).toBe(true)

      // Invalid email formats
      expect(validateEmail("invalid")).toBe(false)
      expect(validateEmail("invalid@")).toBe(false)
      expect(validateEmail("@example.com")).toBe(false)
      expect(validateEmail("invalid@example")).toBe(false)
      expect(validateEmail("invalid@.com")).toBe(false)
      expect(validateEmail("invalid@example.")).toBe(false)
      expect(validateEmail("")).toBe(false)
      expect(validateEmail(null)).toBe(false)
      expect(validateEmail(undefined)).toBe(false)
    })

    test("should extract email addresses correctly", () => {
      // Access private method via any cast
      const extractEmail = (metigan as any)._extractEmailAddress.bind(metigan)

      // Simple email
      expect(extractEmail("user@example.com")).toBe("user@example.com")

      // Name + email format
      expect(extractEmail("John Doe <john@example.com>")).toBe("john@example.com")

      // Just angle brackets
      expect(extractEmail("<alice@example.com>")).toBe("alice@example.com")

      // With whitespace
      expect(extractEmail("  spaced@example.com  ")).toBe("spaced@example.com")

      // Empty or null inputs
      expect(extractEmail("")).toBe("")
      expect(extractEmail(null)).toBe("")
      expect(extractEmail(undefined)).toBe("")
    })

    test("should validate message data correctly", () => {
      // Access private method via any cast
      const validateMessageData = (metigan as any)._validateMessageData.bind(metigan)

      // Valid message data
      const validData = {
        from: "sender@example.com",
        recipients: ["recipient@example.com"],
        subject: "Test Subject",
        content: "<p>Test Content</p>",
      }

      expect(validateMessageData(validData).isValid).toBe(true)

      // Missing from
      expect(
        validateMessageData({
          ...validData,
          from: "",
        }).isValid,
      ).toBe(false)

      // Missing recipients
      expect(
        validateMessageData({
          ...validData,
          recipients: [],
        }).isValid,
      ).toBe(false)

      // Missing subject
      expect(
        validateMessageData({
          ...validData,
          subject: "",
        }).isValid,
      ).toBe(false)

      // Missing content
      expect(
        validateMessageData({
          ...validData,
          content: "",
        }).isValid,
      ).toBe(false)

      // Invalid from email
      expect(
        validateMessageData({
          ...validData,
          from: "invalid-email",
        }).isValid,
      ).toBe(false)

      // Invalid recipient email
      expect(
        validateMessageData({
          ...validData,
          recipients: ["invalid-email"],
        }).isValid,
      ).toBe(false)

      // Contact options without audienceId
      expect(
        validateMessageData({
          ...validData,
          contactOptions: {
            createContact: true,
          },
        }).isValid,
      ).toBe(false)

      // Valid contact options
      expect(
        validateMessageData({
          ...validData,
          contactOptions: {
            createContact: true,
            audienceId: "audience-123",
          },
        }).isValid,
      ).toBe(true)
    })
  })

  describe("Contact Validation", () => {
    test("should validate contact creation options", () => {
      // Access private method via any cast
      const validateContactOptions = (metigan as any)._validateContactOptions.bind(metigan)

      // Valid options
      const validOptions = {
        createContact: true,
        audienceId: "audience-123",
      }

      const validEmails = ["contact@example.com"]

      expect(validateContactOptions(validOptions, validEmails).isValid).toBe(true)

      // Missing createContact flag
      expect(
        validateContactOptions(
          {
            ...validOptions,
            createContact: false,
          },
          validEmails,
        ).isValid,
      ).toBe(false)

      // Missing audienceId
      expect(
        validateContactOptions(
          {
            ...validOptions,
            audienceId: "",
          },
          validEmails,
        ).isValid,
      ).toBe(false)

      // Empty emails array
      expect(validateContactOptions(validOptions, []).isValid).toBe(false)

      // Invalid email in array
      expect(validateContactOptions(validOptions, ["invalid-email"]).isValid).toBe(false)
    })

    test("should validate contact query options", () => {
      // Access private method via any cast
      const validateContactQueryOptions = (metigan as any)._validateContactQueryOptions.bind(metigan)

      // Valid options
      const validOptions = {
        audienceId: "audience-123",
      }

      expect(validateContactQueryOptions(validOptions).isValid).toBe(true)

      // Missing audienceId
      expect(
        validateContactQueryOptions({
          ...validOptions,
          audienceId: "",
        }).isValid,
      ).toBe(false)

      // Invalid page (negative)
      expect(
        validateContactQueryOptions({
          ...validOptions,
          page: -1,
        }).isValid,
      ).toBe(false)

      // Invalid page (zero)
      expect(
        validateContactQueryOptions({
          ...validOptions,
          page: 0,
        }).isValid,
      ).toBe(false)

      // Invalid page (non-number)
      expect(
        validateContactQueryOptions({
          ...validOptions,
          page: "one" as any,
        }).isValid,
      ).toBe(false)

      // Valid page
      expect(
        validateContactQueryOptions({
          ...validOptions,
          page: 1,
        }).isValid,
      ).toBe(true)

      // Invalid limit (negative)
      expect(
        validateContactQueryOptions({
          ...validOptions,
          limit: -1,
        }).isValid,
      ).toBe(false)

      // Invalid limit (zero)
      expect(
        validateContactQueryOptions({
          ...validOptions,
          limit: 0,
        }).isValid,
      ).toBe(false)

      // Valid limit
      expect(
        validateContactQueryOptions({
          ...validOptions,
          limit: 10,
        }).isValid,
      ).toBe(true)
    })

    test("should validate contact update options", () => {
      // Access private method via any cast
      const validateContactUpdateOptions = (metigan as any)._validateContactUpdateOptions.bind(metigan)

      // Valid email and options
      const validEmail = "contact@example.com"
      const validOptions = {
        audienceId: "audience-123",
        fields: {
          firstName: "John",
        },
      }

      expect(validateContactUpdateOptions(validEmail, validOptions).isValid).toBe(true)

      // Invalid email
      expect(validateContactUpdateOptions("invalid-email", validOptions).isValid).toBe(false)

      // Missing audienceId
      expect(
        validateContactUpdateOptions(validEmail, {
          ...validOptions,
          audienceId: "",
        }).isValid,
      ).toBe(false)

      // Missing fields
      expect(
        validateContactUpdateOptions(validEmail, {
          ...validOptions,
          fields: {},
        }).isValid,
      ).toBe(false)
    })
  })

  describe("MIME Type Detection", () => {
    test("should detect MIME types correctly", () => {
      // Access private method via any cast
      const getMimeType = (metigan as any)._getMimeType.bind(metigan)

      // Common document types
      expect(getMimeType("document.pdf")).toBe("application/pdf")
      expect(getMimeType("document.doc")).toBe("application/msword")
      expect(getMimeType("document.docx")).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      )

      // Spreadsheet types
      expect(getMimeType("spreadsheet.xls")).toBe("application/vnd.ms-excel")
      expect(getMimeType("spreadsheet.xlsx")).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

      // Presentation types
      expect(getMimeType("presentation.ppt")).toBe("application/vnd.ms-powerpoint")
      expect(getMimeType("presentation.pptx")).toBe(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      )

      // Image types
      expect(getMimeType("image.jpg")).toBe("image/jpeg")
      expect(getMimeType("image.jpeg")).toBe("image/jpeg")
      expect(getMimeType("image.png")).toBe("image/png")
      expect(getMimeType("image.gif")).toBe("image/gif")
      expect(getMimeType("image.svg")).toBe("image/svg+xml")

      // Text types
      expect(getMimeType("file.txt")).toBe("text/plain")
      expect(getMimeType("file.html")).toBe("text/html")
      expect(getMimeType("file.css")).toBe("text/css")
      expect(getMimeType("file.js")).toBe("application/javascript")
      expect(getMimeType("file.json")).toBe("application/json")
      expect(getMimeType("file.xml")).toBe("application/xml")
      expect(getMimeType("file.csv")).toBe("text/csv")

      // Archive types
      expect(getMimeType("archive.zip")).toBe("application/zip")
      expect(getMimeType("archive.rar")).toBe("application/x-rar-compressed")
      expect(getMimeType("archive.tar")).toBe("application/x-tar")

      // Media types
      expect(getMimeType("audio.mp3")).toBe("audio/mpeg")
      expect(getMimeType("video.mp4")).toBe("video/mp4")
      expect(getMimeType("audio.wav")).toBe("audio/wav")
      expect(getMimeType("video.avi")).toBe("video/x-msvideo")

      // Unknown type
      expect(getMimeType("unknown.xyz")).toBe("application/octet-stream")

      // No extension
      expect(getMimeType("noextension")).toBe("application/octet-stream")
    })
  })

  describe("Environment Detection", () => {
    test("should detect browser environment correctly", () => {
      // Save original globals
      const originalWindow = global.window
      const originalFormData = global.FormData
      const originalFile = global.File

      try {
        // Mock browser environment
        // Use type assertions to avoid TypeScript errors
        global.window = {} as Window & typeof globalThis
        global.FormData = (() => {}) as unknown as typeof FormData
        global.File = (() => {}) as unknown as typeof File

        expect((metigan as any)._isBrowserEnvironment()).toBe(true)

        // Mock Node.js environment
        global.window = undefined as any
        global.FormData = undefined as any
        global.File = undefined as any

        expect((metigan as any)._isBrowserEnvironment()).toBe(false)

        // Partial browser environment (missing FormData)
        global.window = {} as Window & typeof globalThis
        global.FormData = undefined as any
        global.File = (() => {}) as unknown as typeof File

        expect((metigan as any)._isBrowserEnvironment()).toBe(false)

        // Partial browser environment (missing File)
        global.window = {} as Window & typeof globalThis
        global.FormData = (() => {}) as unknown as typeof FormData
        global.File = undefined as any

        expect((metigan as any)._isBrowserEnvironment()).toBe(false)
      } finally {
        // Restore original globals
        global.window = originalWindow
        global.FormData = originalFormData
        global.File = originalFile
      }
    })
  })

  describe("Template Functions", () => {
    test("should create template function", () => {
      const htmlTemplate = "<p>Hello {{name}}, welcome to {{company}}!</p>"
      const templateFn = metigan.createTemplate(htmlTemplate)

      expect(typeof templateFn).toBe("function")
    })

    test("should throw error for empty template", () => {
      expect(() => metigan.createTemplate("")).toThrow(MetiganError)
      expect(() => metigan.createTemplate("")).toThrow("Template content is required")
    })

    test("should replace variables in template", () => {
      const htmlTemplate = "<p>Hello {{name}}, welcome to {{company}}!</p>"
      const templateFn = metigan.createTemplate(htmlTemplate)

      const result = templateFn({
        name: "John",
        company: "Acme Inc",
      })

      expect(result).toBe("<p>Hello John, welcome to Acme Inc!</p>")
    })

    test("should handle missing variables", () => {
      const htmlTemplate = "<p>Hello {{name}}, welcome to {{company}}!</p>"
      const templateFn = metigan.createTemplate(htmlTemplate)

      // Missing company variable
      const result = templateFn({
        name: "John",
      })

      expect(result).toBe("<p>Hello John, welcome to {{company}}!</p>")
    })

    test("should handle whitespace in variable names", () => {
      const htmlTemplate = "<p>Hello {{ name }}, welcome to {{  company  }}!</p>"
      const templateFn = metigan.createTemplate(htmlTemplate)

      const result = templateFn({
        name: "John",
        company: "Acme Inc",
      })

      expect(result).toBe("<p>Hello John, welcome to Acme Inc!</p>")
    })

    test("should return original template when no variables provided", () => {
      const htmlTemplate = "<p>Hello {{name}}, welcome to {{company}}!</p>"
      const templateFn = metigan.createTemplate(htmlTemplate)

      const result = templateFn()

      expect(result).toBe(htmlTemplate)
    })
  })

  describe("Tracking ID Generation", () => {
    test("should generate tracking IDs", () => {
      const trackingId = metigan.generateTrackingId()

      expect(trackingId).toMatch(/^mtg-\d+-\d{4}$/)
    })

    test("should generate unique tracking IDs", () => {
      const trackingId1 = metigan.generateTrackingId()
      const trackingId2 = metigan.generateTrackingId()

      expect(trackingId1).not.toBe(trackingId2)
    })
  })

  describe("Attachment Processing", () => {
    test("should handle empty attachments array", async () => {
      // Access private method via any cast
      const processAttachments = (metigan as any)._processAttachments.bind(metigan)

      const result = await processAttachments([])

      expect(result).toEqual([])
    })

    test("should throw error for invalid attachment format", async () => {
      // Access private method via any cast
      const processAttachments = (metigan as any)._processAttachments.bind(metigan)

      // Invalid attachment (missing required properties)
      const invalidAttachment = { foo: "bar" }

      await expect(processAttachments([invalidAttachment])).rejects.toThrow(MetiganError)
      await expect(processAttachments([invalidAttachment])).rejects.toThrow("Invalid attachment format")
    })

    test("should throw error for oversized attachments", async () => {
      // Access private method via any cast
      const processAttachments = (metigan as any)._processAttachments.bind(metigan)

      // Mock _isBrowserEnvironment to return false (Node.js environment)
      jest.spyOn(metigan as any, "_isBrowserEnvironment").mockReturnValue(false)

      // Create a large buffer that exceeds the 7MB limit
      const largeBuffer = Buffer.alloc(8 * 1024 * 1024) // 8MB

      // NodeAttachment format
      const largeNodeAttachment = {
        buffer: largeBuffer,
        originalname: "large.bin",
        mimetype: "application/octet-stream",
      }

      await expect(processAttachments([largeNodeAttachment])).rejects.toThrow(MetiganError)
      await expect(processAttachments([largeNodeAttachment])).rejects.toThrow("exceeds the maximum size of 7MB")

      // CustomAttachment format
      const largeCustomAttachment = {
        content: largeBuffer,
        filename: "large.bin",
        contentType: "application/octet-stream",
      }

      await expect(processAttachments([largeCustomAttachment])).rejects.toThrow(MetiganError)
      await expect(processAttachments([largeCustomAttachment])).rejects.toThrow("exceeds the maximum size of 7MB")
    })

    test("should process Node.js attachments correctly", async () => {
      // Access private method via any cast
      const processAttachments = (metigan as any)._processAttachments.bind(metigan)

      // Mock _isBrowserEnvironment to return false (Node.js environment)
      jest.spyOn(metigan as any, "_isBrowserEnvironment").mockReturnValue(false)

      const nodeAttachment = {
        buffer: Buffer.from("test file content"),
        originalname: "test.pdf",
        mimetype: "application/pdf",
      }

      const result = await processAttachments([nodeAttachment])

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        filename: "test.pdf",
        content: expect.any(Buffer),
        contentType: "application/pdf",
        encoding: "base64",
        disposition: "attachment",
      })
    })

    test("should process custom attachments correctly", async () => {
      // Access private method via any cast
      const processAttachments = (metigan as any)._processAttachments.bind(metigan)

      // Mock _isBrowserEnvironment to return false (Node.js environment)
      jest.spyOn(metigan as any, "_isBrowserEnvironment").mockReturnValue(false)

      // String content
      const stringAttachment = {
        content: "test file content",
        filename: "test.txt",
        contentType: "text/plain",
      }

      const result1 = await processAttachments([stringAttachment])

      expect(result1).toHaveLength(1)
      expect(result1[0]).toEqual({
        filename: "test.txt",
        content: "test file content",
        contentType: "text/plain",
        encoding: "base64",
        disposition: "attachment",
      })

      // Buffer content
      const bufferAttachment = {
        content: Buffer.from("test file content"),
        filename: "test.bin",
        contentType: "application/octet-stream",
      }

      const result2 = await processAttachments([bufferAttachment])

      expect(result2).toHaveLength(1)
      expect(result2[0]).toEqual({
        filename: "test.bin",
        content: expect.any(Buffer),
        contentType: "application/octet-stream",
        encoding: "base64",
        disposition: "attachment",
      })

      // Uint8Array content
      const uint8Attachment = {
        content: new Uint8Array(Buffer.from("test file content")),
        filename: "test.bin",
        contentType: "application/octet-stream",
      }

      const result3 = await processAttachments([uint8Attachment])

      expect(result3).toHaveLength(1)
      expect(result3[0]).toEqual({
        filename: "test.bin",
        content: expect.any(Uint8Array),
        contentType: "application/octet-stream",
        encoding: "base64",
        disposition: "attachment",
      })
    })

    test("should use default MIME type when not provided", async () => {
      // Access private method via any cast
      const processAttachments = (metigan as any)._processAttachments.bind(metigan)

      // Mock _isBrowserEnvironment to return false (Node.js environment)
      jest.spyOn(metigan as any, "_isBrowserEnvironment").mockReturnValue(false)

      // Mock _getMimeType to verify it's called
      const getMimeTypeSpy = jest.spyOn(metigan as any, "_getMimeType")

      const nodeAttachment = {
        buffer: Buffer.from("test file content"),
        originalname: "test.pdf",
        // No mimetype provided
      }

      await processAttachments([nodeAttachment])

      expect(getMimeTypeSpy).toHaveBeenCalledWith("test.pdf")
    })
  })

  describe("HTTP Request Handling", () => {
    test("should make HTTP requests with retry", async () => {
      // Access private method via any cast
      const makeRequestWithRetry = (metigan as any)._makeRequestWithRetry.bind(metigan)

      // Mock HTTP utilities
      ;(httpUtils.post as jest.Mock).mockResolvedValue({ success: true })

      const result = await makeRequestWithRetry(
        "https://example.com/api",
        { data: "test" },
        { "Content-Type": "application/json" },
        "POST",
      )

      expect(result).toEqual({ success: true })
      expect(httpUtils.post).toHaveBeenCalledWith(
        "https://example.com/api",
        { data: "test" },
        { "Content-Type": "application/json" },
      )
    })

    test("should retry failed requests", async () => {
      // Access private method via any cast
      const makeRequestWithRetry = (metigan as any)._makeRequestWithRetry.bind(metigan)

      // First call fails, second succeeds
      ;(httpUtils.post as jest.Mock).mockRejectedValueOnce({ status: 500 }).mockResolvedValueOnce({ success: true })

      const result = await makeRequestWithRetry(
        "https://example.com/api",
        { data: "test" },
        { "Content-Type": "application/json" },
        "POST",
      )

      expect(result).toEqual({ success: true })
      expect(httpUtils.post).toHaveBeenCalledTimes(2)
    })

    test("should support different HTTP methods", async () => {
      // Access private method via any cast
      const makeRequestWithRetry = (metigan as any)._makeRequestWithRetry.bind(metigan)

      // Mock HTTP utilities
      ;(httpUtils.get as jest.Mock).mockResolvedValue({ success: true, method: "GET" })
      ;(httpUtils.post as jest.Mock).mockResolvedValue({ success: true, method: "POST" })
      ;(httpUtils.put as jest.Mock).mockResolvedValue({ success: true, method: "PUT" })
      ;(httpUtils.deleteRequest as jest.Mock).mockResolvedValue({ success: true, method: "DELETE" })

      // Test GET
      const getResult = await makeRequestWithRetry(
        "https://example.com/api",
        null,
        { "Content-Type": "application/json" },
        "GET",
      )

      expect(getResult).toEqual({ success: true, method: "GET" })
      expect(httpUtils.get).toHaveBeenCalled()

      // Test POST
      const postResult = await makeRequestWithRetry(
        "https://example.com/api",
        { data: "test" },
        { "Content-Type": "application/json" },
        "POST",
      )

      expect(postResult).toEqual({ success: true, method: "POST" })
      expect(httpUtils.post).toHaveBeenCalled()

      // Test PUT
      const putResult = await makeRequestWithRetry(
        "https://example.com/api",
        { data: "test" },
        { "Content-Type": "application/json" },
        "PUT",
      )

      expect(putResult).toEqual({ success: true, method: "PUT" })
      expect(httpUtils.put).toHaveBeenCalled()

      // Test DELETE
      const deleteResult = await makeRequestWithRetry(
        "https://example.com/api",
        null,
        { "Content-Type": "application/json" },
        "DELETE",
      )

      expect(deleteResult).toEqual({ success: true, method: "DELETE" })
      expect(httpUtils.deleteRequest).toHaveBeenCalled()
    })

    test("should throw error after max retries", async () => {
      // Access private method via any cast
      const makeRequestWithRetry = (metigan as any)._makeRequestWithRetry.bind(metigan)

      // All calls fail
      const error = { status: 500, message: "Server error" }
      ;(httpUtils.post as jest.Mock).mockRejectedValue(error)

      await expect(
        makeRequestWithRetry(
          "https://example.com/api",
          { data: "test" },
          { "Content-Type": "application/json" },
          "POST",
        ),
      ).rejects.toEqual(error)

      // Should have tried retryCount + 1 times (initial + retries)
      expect(httpUtils.post).toHaveBeenCalledTimes((metigan as any).retryCount)
    })
  })

  describe("Email Sending", () => {
    beforeEach(() => {
      // Mock successful response for email sending
      ;(httpUtils.post as jest.Mock).mockResolvedValue({
        success: true,
        messageId: "test-message-id",
      })

      // Mock environment detection to return false (Node.js environment)
      jest.spyOn(metigan as any, "_isBrowserEnvironment").mockReturnValue(false)
    })

    test("should send email successfully", async () => {
      const emailOptions = {
        from: "sender@example.com",
        recipients: ["recipient@example.com"],
        subject: "Test Subject",
        content: "<p>Test Content</p>",
      }

      const response = await metigan.sendEmail(emailOptions)

      expect(response).toEqual({
        success: true,
        messageId: "test-message-id",
      })

      expect(httpUtils.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/end/email"),
        expect.objectContaining({
          from: "sender@example.com",
          recipients: ["recipient@example.com"],
          subject: "Test Subject",
          content: "<p>Test Content</p>",
        }),
        expect.objectContaining({
          "x-api-key": API_KEY,
          "Content-Type": "application/json",
        }),
      )
    })

    test("should validate email data before sending", async () => {
      const invalidEmailOptions = {
        from: "invalid-email",
        recipients: ["recipient@example.com"],
        subject: "Test Subject",
        content: "<p>Test Content</p>",
      }

      await expect(metigan.sendEmail(invalidEmailOptions)).rejects.toThrow(MetiganError)
      expect(httpUtils.post).not.toHaveBeenCalled()
    })

    test("should handle API errors gracefully", async () => {
      // Create a custom error object that matches what the SDK expects
      const apiError = {
        status: 400,
        data: { error: "Bad Request", message: "Invalid email format" },
        message: "Invalid email format",
      }
      ;(httpUtils.post as jest.Mock).mockRejectedValueOnce(apiError)

      const emailOptions = {
        from: "sender@example.com",
        recipients: ["recipient@example.com"],
        subject: "Test Subject",
        content: "<p>Test Content</p>",
      }

      await expect(metigan.sendEmail(emailOptions)).rejects.toThrow("Invalid email format")
    })

    test("should retry failed requests", async () => {
      // First call fails, second succeeds
      ;(httpUtils.post as jest.Mock)
        .mockRejectedValueOnce({
          status: 500,
          data: { error: "Server Error", message: "Internal server error" },
        })
        .mockResolvedValueOnce({
          success: true,
          messageId: "test-message-id",
        })

      const emailOptions = {
        from: "sender@example.com",
        recipients: ["recipient@example.com"],
        subject: "Test Subject",
        content: "<p>Test Content</p>",
      }

      const response = await metigan.sendEmail(emailOptions)

      expect(response).toEqual({
        success: true,
        messageId: "test-message-id",
      })

      expect(httpUtils.post).toHaveBeenCalledTimes(2)
    })

    test("should send email with attachments", async () => {
      const attachment = {
        content: Buffer.from("test file content"),
        filename: "test.pdf",
        contentType: "application/pdf",
      }

      const emailOptions = {
        from: "sender@example.com",
        recipients: ["recipient@example.com"],
        subject: "Test Subject",
        content: "<p>Test Content</p>",
        attachments: [attachment],
      }

      const response = await metigan.sendEmail(emailOptions)

      expect(response).toEqual({
        success: true,
        messageId: "test-message-id",
      })

      expect(httpUtils.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/end/email"),
        expect.objectContaining({
          attachments: expect.arrayContaining([
            expect.objectContaining({
              filename: "test.pdf",
              contentType: "application/pdf",
            }),
          ]),
        }),
        expect.any(Object),
      )
    })
  })

  describe("Template Emails", () => {
    test("should send email with template", async () => {
      ;(httpUtils.post as jest.Mock).mockResolvedValue({
        success: true,
        messageId: "test-template-id",
      })

      const templateOptions = {
        from: "sender@example.com",
        recipients: ["recipient@example.com"],
        subject: "Template Test",
        templateId: "template-123",
        templateVariables: {
          name: "John Doe",
          company: "Acme Inc",
        },
      }

      const response = await metigan.sendEmailWithTemplate(templateOptions)

      expect(response).toEqual({
        success: true,
        messageId: "test-template-id",
      })

      expect(httpUtils.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/end/email"),
        expect.objectContaining({
          from: "sender@example.com",
          recipients: ["recipient@example.com"],
          subject: "Template Test",
          useTemplate: "true",
          templateId: "template-123",
          templateVariables: expect.any(String),
        }),
        expect.any(Object),
      )
    })
  })

  describe("Contact Management", () => {
    test("should create contacts", async () => {
      ;(httpUtils.post as jest.Mock).mockResolvedValue({
        success: true,
        contactsCreated: 2,
      })

      const emails = ["contact1@example.com", "contact2@example.com"]
      const options = {
        createContact: true,
        audienceId: "audience-123",
        contactFields: {
          firstName: "John",
          lastName: "Doe",
        },
      }

      const response = await metigan.createContacts(emails, options)

      expect(response).toEqual({
        success: true,
        contactsCreated: 2,
      })

      expect(httpUtils.post).toHaveBeenCalledWith(
        expect.stringContaining("/api/end/contacts"),
        expect.objectContaining({
          emails: emails,
          audienceId: "audience-123",
          fields: options.contactFields,
        }),
        expect.any(Object),
      )
    })

    test("should get contact by email", async () => {
      ;(httpUtils.get as jest.Mock).mockResolvedValue({
        success: true,
        contact: {
          email: "contact@example.com",
          fields: {
            firstName: "John",
            lastName: "Doe",
          },
        },
      })

      const response = await metigan.getContact("contact@example.com", "audience-123")

      expect(response).toEqual({
        success: true,
        contact: {
          email: "contact@example.com",
          fields: {
            firstName: "John",
            lastName: "Doe",
          },
        },
      })

      expect(httpUtils.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/end/contacts/contact%40example.com"),
        expect.any(Object),
      )
    })

    test("should update contact", async () => {
      ;(httpUtils.put as jest.Mock).mockResolvedValue({
        success: true,
        updated: true,
      })

      const email = "contact@example.com"
      const options = {
        audienceId: "audience-123",
        fields: {
          firstName: "Jane",
          lastName: "Smith",
        },
      }

      const response = await metigan.updateContact(email, options)

      expect(response).toEqual({
        success: true,
        updated: true,
      })

      expect(httpUtils.put).toHaveBeenCalledWith(
        expect.stringContaining("/api/end/contacts"),
        expect.objectContaining({
          email: "contact@example.com",
          audienceId: "audience-123",
          fields: options.fields,
        }),
        expect.any(Object),
      )
    })

    test("should delete contact", async () => {
      ;(httpUtils.deleteRequest as jest.Mock).mockResolvedValue({
        success: true,
        deleted: true,
      })

      const response = await metigan.deleteContact("contact@example.com", "audience-123")

      expect(response).toEqual({
        success: true,
        deleted: true,
      })

      expect(httpUtils.deleteRequest).toHaveBeenCalledWith(
        expect.stringContaining("/api/end/contacts/contact%40example.com"),
        expect.any(Object),
      )
    })
  })

  describe("Error Handling", () => {
    test("should handle network errors", async () => {
      // Create a network error
      const networkError = new Error("Network error")
      ;(httpUtils.post as jest.Mock).mockRejectedValueOnce(networkError)

      const emailOptions = {
        from: "sender@example.com",
        recipients: ["recipient@example.com"],
        subject: "Test Subject",
        content: "<p>Test Content</p>",
      }

      await expect(metigan.sendEmail(emailOptions)).rejects.toThrow(MetiganError)
    })

    test("should handle authentication errors", async () => {
      // Create an auth error
      const authError = {
        status: 401,
        data: { error: "Unauthorized", message: "Invalid API key" },
      }
      ;(httpUtils.post as jest.Mock).mockRejectedValueOnce(authError)

      const emailOptions = {
        from: "sender@example.com",
        recipients: ["recipient@example.com"],
        subject: "Test Subject",
        content: "<p>Test Content</p>",
      }

      await expect(metigan.sendEmail(emailOptions)).rejects.toThrow("Invalid API key")
    })

    test("should handle rate limiting", async () => {
      // Create a rate limit error
      const rateLimitError = {
        status: 429,
        data: { error: "Too Many Requests", message: "Rate limit exceeded" },
      }
      ;(httpUtils.post as jest.Mock).mockRejectedValueOnce(rateLimitError)

      const emailOptions = {
        from: "sender@example.com",
        recipients: ["recipient@example.com"],
        subject: "Test Subject",
        content: "<p>Test Content</p>",
      }

      await expect(metigan.sendEmail(emailOptions)).rejects.toThrow("Rate limit exceeded")
    })
  })
})
