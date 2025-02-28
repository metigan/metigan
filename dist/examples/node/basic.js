/**
 * Example usage of Metigan in Node.js
 */
import { Metigan } from 'metigan';
import fs from 'fs';
import path from 'path';

async function sendEmail() {
  try {
    // Initialize Metigan with your API key
    const emailClient = new Metigan('your-api-key');
    
    // Create a template
    const template = emailClient.createTemplate(`
    <!DOCTYPE html>
    <html>
    <body>
      <h1>Welcome, {{name}}!</h1>
      <p>Thank you for signing up to our service.</p>
      <p>Your account has been created and you can now login using the button below:</p>
      <a href="{{loginUrl}}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Login</a>
    </body>
    </html>
    `);
    
    // Apply variables to template
    const content = template({
      name: 'John Doe',
      loginUrl: 'https://example.com/login'
    });
    
    // Read a file to attach
    const pdfPath = path.join(__dirname, 'welcome.pdf');
    const attachment = {
      buffer: fs.readFileSync(pdfPath),
      originalname: 'welcome.pdf',
      mimetype: 'application/pdf'
    };
    
    // Send the email
    const response = await emailClient.sendEmail({
      from: 'Your Company <noreply@example.com>',
      recipients: ['user@example.com'],
      subject: 'Welcome to Our Service',
      content,
      attachments: [attachment],
      trackingId: 'welcome-email-001'
    });
    
    console.log('Email sent successfully!');
    console.log(`Successfully delivered to ${response.successfulEmails.length} recipients`);
    
    if (response.failedEmails.length > 0) {
      console.warn('Failed to deliver to some recipients:', response.failedEmails);
    }
  } catch (error) {
    console.error('Failed to send email:', error.message);
  }
}

sendEmail();