### Metigan SDK



A powerful and flexible SDK for integrating with the Metigan email and audience management platform. Metigan SDK provides a simple interface for sending emails, managing contacts, and organizing audiences.

## Features

- 📧 **Email Sending**: Send transactional and marketing emails with ease
- 👥 **Contact Management**: Create, update, and manage contacts
- 🎯 **Audience Management**: Organize contacts into targeted audiences
- 📝 **Email Templates**: Use templates with variable substitution
- 📎 **Attachments**: Support for file attachments in various formats
- 🔄 **Retry Mechanism**: Built-in retry system for improved reliability
- 🔒 **Error Handling**: Comprehensive error handling and reporting


## Installation

```shellscript
# Using npm
npm install metigan

# Using yarn
yarn add metigan

# Using pnpm
pnpm add metigan
```

## Quick Start

```typescript
import Metigan from 'metigan';

// Initialize the SDK with your API key
const metigan = new Metigan('your_api_key');

// Send a simple email
async function sendWelcomeEmail() {
  try {
    const response = await metigan.sendEmail({
      from: 'your-company@example.com',
      recipients: ['new-user@example.com'],
      subject: 'Welcome to Our Service',
      content: '<h1>Welcome!</h1><p>Thank you for signing up.</p>',
    });
    
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

sendWelcomeEmail();
```

## Configuration

The Metigan SDK can be configured with various options:

```typescript
const metigan = new Metigan('your_api_key', {
 
  // User ID for logs (optional)
  userId: 'your-user-id',
  
  // Disable logs (optional)
  disableLogs: false,
  
  // Number of retry attempts for failed operations (optional, default: 3)
  retryCount: 5,
  
  // Base time between retry attempts in ms (optional, default: 1000)
  retryDelay: 2000,
  
  // Timeout for requests in ms (optional, default: 30000)
  timeout: 60000,
});
```

## Email Sending

### Basic Email

```typescript
await metigan.sendEmail({
  from: 'your-company@example.com',
  recipients: ['user@example.com', 'another-user@example.com'],
  subject: 'Important Update',
  content: '<h1>New Features Available</h1><p>Check out our latest updates...</p>',
});
```

### Email with Attachments

```typescript
// Browser environment (using File objects)
const file = new File(['file content'], 'document.pdf', { type: 'application/pdf' });

// Node.js environment
const nodeAttachment = {
  buffer: Buffer.from('file content'),
  originalname: 'document.pdf',
  mimetype: 'application/pdf',
};

// Custom attachment
const customAttachment = {
  content: 'file content as string or buffer',
  filename: 'document.pdf',
  contentType: 'application/pdf',
};

await metigan.sendEmail({
  from: 'your-company@example.com',
  recipients: ['user@example.com'],
  subject: 'Document Attached',
  content: '<p>Please find the attached document.</p>',
  attachments: [file], // or [nodeAttachment] or [customAttachment]
});
```

### Email with Tracking

```typescript
const trackingId = metigan.generateTrackingId();

await metigan.sendEmail({
  from: 'your-company@example.com',
  recipients: ['user@example.com'],
  subject: 'Trackable Email',
  content: '<p>This email will be tracked.</p>',
  trackingId: trackingId,
});
```

### Email with Template

```typescript
await metigan.sendEmailWithTemplate({
  from: 'your-company@example.com',
  recipients: ['user@example.com'],
  subject: 'Welcome to Our Service',
  templateId: 'welcome-template-id',
});
```



## Contact Management

### Creating Contacts

```typescript
await metigan.createContacts(
  ['user@example.com', 'another-user@example.com'],
  {
    createContact: true,
    audienceId: 'your-audience-id'
  }
);
```

### Getting Contact Details

```typescript
const contactDetails = await metigan.getContact('user@example.com', 'your-audience-id');
console.log('Contact details:', contactDetails);
```

### Listing Contacts

```typescript
const contacts = await metigan.listContacts({
  audienceId: 'your-audience-id',
  page: 1,
  limit: 50,
  filters: {
    company: 'Acme Inc',
  },
});

console.log(`Found ${contacts.contacts.length} contacts`);
```

### Updating a Contact

```typescript
await metigan.updateContact('user@example.com', {
  audienceId: 'your-audience-id'
});
```

### Deleting a Contact

```typescript
await metigan.deleteContact('contact-id', 'your-audience-id');
```

## Audience Management

### Creating an Audience

```typescript
const newAudience = await metigan.createAudience({
  name: 'Newsletter Subscribers',
  description: 'People who subscribed to our monthly newsletter',
});

console.log('New audience ID:', newAudience.audience.id);
```

### Getting All Audiences

```typescript
const audiences = await metigan.getAudiences();
console.log(`Found ${audiences.audiences.length} audiences`);
```

### Getting Audience Details

```typescript
const audienceDetails = await metigan.getAudience('audience-id');
console.log('Audience details:', audienceDetails);
```

### Updating an Audience

```typescript
await metigan.updateAudience('audience-id', {
  name: 'VIP Newsletter Subscribers',
  description: 'Premium subscribers to our newsletter',
});
```

### Deleting an Audience

```typescript
await metigan.deleteAudience('audience-id');
```

## Combined Operations

### Send Email and Create Contacts

```typescript
await metigan.sendEmailAndCreateContacts({
  from: 'your-company@example.com',
  recipients: ['new-user@example.com'],
  subject: 'Welcome to Our Service',
  content: '<h1>Welcome!</h1><p>Thank you for signing up.</p>',
  contactOptions: {
    createContact: true,
    audienceId: 'your-audience-id'
  },
});
```

### Send Template Email and Create Contacts

```typescript
await metigan.sendTemplateAndCreateContacts({
  from: 'your-company@example.com',
  recipients: ['new-user@example.com'],
  subject: 'Welcome to Our Service',
  templateId: 'welcome-template-id',
  contactOptions: {
    createContact: true,
    audienceId: 'your-audience-id'
  },
});
```

## Error Handling

The Metigan SDK provides comprehensive error handling with specific error types:

```typescript
import { MetiganError, ValidationError, ApiError, NetworkError, ContactError } from 'metigan';
import { ErrorCode } from 'metigan';

try {
  await metigan.sendEmail({
    // Email options
  });
} catch (error) {
  if (error instanceof MetiganError) {
    console.error(`Error code: ${error.code}, Message: ${error.message}`);
    
    // Handle specific error types
    if (error instanceof ValidationError) {
      console.error('Validation failed');
    } else if (error instanceof ApiError) {
      console.error(`API error with status: ${error.status}`);
    } else if (error instanceof NetworkError) {
      console.error('Network connectivity issue');
    } else if (error instanceof ContactError) {
      console.error('Contact operation failed');
    }
    
    // Handle specific error codes
    switch (error.code) {
      case ErrorCode.INVALID_API_KEY:
        console.error('Invalid API key. Please check your credentials.');
        break;
      case ErrorCode.MISSING_REQUIRED_FIELD:
        console.error('Missing required field in request.');
        break;
      case ErrorCode.INVALID_EMAIL_FORMAT:
        console.error('Invalid email format.');
        break;
      // Handle other error codes
    }
  } else {
    console.error('Unknown error:', error);
  }
}
```

## API Reference

### Core Methods

| Method | Description
|-----|-----
| `sendEmail(options)` | Sends an email with the specified options
| `sendEmailWithTemplate(options)` | Sends an email using a template
| `generateTrackingId()` | Generates a unique tracking ID for email analytics


### Contact Methods

| Method | Description
|-----|-----
| `createContacts(emails, options)` | Creates contacts in the specified audience
| `getContact(email, audienceId)` | Gets a contact by email
| `listContacts(options)` | Lists contacts in an audience
| `updateContact(email, options)` | Updates a contact
| `deleteContact(contactId, audienceId)` | Deletes a contact


### Audience Methods

| Method | Description
|-----|-----
| `createAudience(options)` | Creates a new audience
| `getAudiences()` | Gets all audiences
| `getAudience(id)` | Gets an audience by ID
| `updateAudience(id, options)` | Updates an audience
| `deleteAudience(id)` | Deletes an audience


### Combined Methods

| Method | Description
|-----|-----
| `sendEmailAndCreateContacts(options)` | Sends an email and creates contacts in one operation
| `sendTemplateAndCreateContacts(options)` | Sends a template email and creates contacts in one operation


### Utility Methods

| Method | Description
|-----|-----
| `enableLogging()` | Enables logging
| `disableLogging()` | Disables logging


## TypeScript Support

The Metigan SDK is written in TypeScript and provides comprehensive type definitions for all methods and options.

```typescript
import type {
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
} from 'metigan';
```

## Browser Compatibility

The Metigan SDK is designed to work in both Node.js and browser environments. In browser environments, it uses the native `FormData` and `File` APIs for handling attachments.

## Development

### Building the SDK

```shellscript
# Install dependencies
npm install

# Build the SDK
npm run build

# Run tests
npm test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact [support@metigan.com](mailto:support@metigan.com) or open an issue on GitHub.

---

Made with ❤️ by the Metigan Team