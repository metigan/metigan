# Metigan - Email Sending Library

![npm version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![license](https://img.shields.io/badge/license-MIT-green.svg)

A simple and robust library for sending emails through the Metigan API with support for browser and Node.js environments.

## Features

- 📧 Simple API for sending emails with HTML content
- 📎 File attachment support (up to 7MB per file)
- 🔄 Automatic retries with exponential backoff
- 📊 Built-in logging and monitoring
- 🌐 Works in both browser and Node.js environments
- ✅ Comprehensive email validation
- 👥 Support for CC, BCC, and Reply-To fields

## Installation

```bash
npm install metigan
# or
yarn add metigan
```

## Quick Start

```javascript
import Metigan from 'metigan';

// Initialize with your API key
const metigan = new Metigan('your-api-key');

// Send a basic email
try {
  const response = await metigan.sendEmail({
    from: 'sender@example.com',
    recipients: ['recipient@example.com'],
    subject: 'Hello from Metigan',
    content: '<h1>Hello World!</h1><p>This is a test email from Metigan.</p>'
  });
  
  console.log('Email sent successfully!', response);
} catch (error) {
  console.error('Failed to send email:', error.message);
}
```

## Advanced Usage

### With Attachments (Browser)

```javascript
// In a browser environment with file input
const fileInput = document.getElementById('fileInput');
const files = fileInput.files;

try {
  const response = await metigan.sendEmail({
    from: 'Your Name <sender@example.com>',
    recipients: ['recipient1@example.com', 'recipient2@example.com'],
    subject: 'Email with attachments',
    content: '<p>Please find the attached files.</p>',
    attachments: Array.from(files),
    cc: ['cc@example.com'],
    bcc: ['bcc@example.com'],
    replyTo: 'reply@example.com'
  });
  
  console.log('Email with attachments sent!', response);
} catch (error) {
  console.error('Error:', error.message);
}
```

### With Attachments (Node.js)

```javascript
import fs from 'fs';
import path from 'path';

// In Node.js environment
const filePath = path.resolve('./document.pdf');
const fileBuffer = fs.readFileSync(filePath);

try {
  const response = await metigan.sendEmail({
    from: 'sender@example.com',
    recipients: ['recipient@example.com'],
    subject: 'Document attached',
    content: '<p>Here is the document you requested.</p>',
    attachments: [{
      buffer: fileBuffer,
      originalname: 'document.pdf',
      mimetype: 'application/pdf'
    }]
  });
  
  console.log('Email with attachment sent!', response);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Custom Configuration

```javascript
const metigan = new Metigan('your-api-key', {
  userId: 'user-123', // User ID for logging
  disableLogs: false, // Enable or disable logging
  retryCount: 5, // Number of retry attempts
  retryDelay: 1000, // Base delay between retries in milliseconds
  timeout: 60000 // Request timeout in milliseconds
});
```

## API Reference

### `new Metigan(apiKey, options)`

Creates a new Metigan client instance.

| Parameter | Type | Description |
|-----------|------|-------------|
| `apiKey` | `string` | Your Metigan API key |
| `options` | `object` | Optional configuration |
| `options.userId` | `string` | User ID for logs (default: 'anonymous') |
| `options.disableLogs` | `boolean` | Disable logs (default: false) |
| `options.retryCount` | `number` | Number of retry attempts (default: 3) |
| `options.retryDelay` | `number` | Base delay between retries in ms (default: 1000) |
| `options.timeout` | `number` | Request timeout in ms (default: 30000) |

### `sendEmail(options)`

Sends an email with the provided options.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `object` | Email options |
| `options.from` | `string` | Sender email address (or "Name <email>") |
| `options.recipients` | `string[]` | Array of recipient email addresses |
| `options.subject` | `string` | Email subject |
| `options.content` | `string` | Email content (HTML supported) |
| `options.attachments` | `array` | Optional array of file attachments |
| `options.cc` | `string[]` | Optional array of CC recipients |
| `options.bcc` | `string[]` | Optional array of BCC recipients |
| `options.replyTo` | `string` | Optional reply-to address |

### `enableLogging()` and `disableLogging()`

Enable or disable logging during runtime.

## Attachment Types

The library supports different attachment formats depending on the environment:

### Browser

In the browser, use the native `File` object:

```javascript
attachments: [
  fileInput.files[0],
  // ... more File objects
]
```

### Node.js

In Node.js, use the `NodeAttachment` format:

```javascript
attachments: [{
  buffer: Buffer.from('...'),
  originalname: 'filename.ext',
  mimetype: 'application/octet-stream'
}]
```

### Custom Format

Or use the custom format that works in any environment:

```javascript
attachments: [{
  content: Buffer.from('...') || arrayBuffer || 'base64string',
  filename: 'filename.ext',
  contentType: 'application/octet-stream'
}]
```

## Error Handling

The library uses a custom `MetiganError` class that can be imported:

```javascript
import { Metigan, MetiganError } from 'metigan';

try {
  await metigan.sendEmail(options);
} catch (error) {
  if (error instanceof MetiganError) {
    // Handle Metigan-specific errors
    console.error('Metigan error:', error.message);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

## Response Format

A successful response will have this structure:

```javascript
{
  success: true,
  message: "Emails sent successfully",
  successfulEmails: [
    {
      success: true,
      recipient: "recipient@example.com",
      messageId: "message-id-123"
    }
  ],
  failedEmails: [], // Any failed recipients
  recipientCount: 1,
  hasAttachments: false,
  attachmentsCount: 0
}
```

## Limitations

- Maximum attachment size: 7MB per file
- HTML content is supported

## Support

For issues, feature requests, or questions, please open an issue on our GitHub repository or contact support@savanapoint.com.

## License

MIT