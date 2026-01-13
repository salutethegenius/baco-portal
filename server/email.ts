import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('AWS SES credentials not set - email functionality will be disabled');
}

const fromEmail = process.env.AWS_SES_FROM_EMAIL || 'noreply@baco-portal.com';
const appUrl = process.env.APP_URL || 'http://localhost:5000';

async function sendEmail(to: string, subject: string, htmlBody: string, textBody: string) {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn('AWS SES not configured - email not sent');
    return;
  }

  try {
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await sesClient.send(command);
  } catch (error: any) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error?.message || 'Unknown error'}`);
  }
}

export async function sendPasswordResetEmail(to: string, resetToken: string, userName?: string) {
  const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
  const name = userName || 'User';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #40E0D0; padding: 20px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #000; margin: 0;">BACO Portal</h1>
        </div>
        
        <h2 style="color: #333;">Password Reset Request</h2>
        
        <p>Hello ${name},</p>
        
        <p>We received a request to reset your password for your BACO Portal account.</p>
        
        <p>Click the button below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #40E0D0; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
        
        <p>This link will expire in 1 hour.</p>
        
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
          Bahamas Association of Compliance Officers<br>
          This is an automated message, please do not reply to this email.
        </p>
      </body>
    </html>
  `;

  const text = `
Hello ${name},

We received a request to reset your password for your BACO Portal account.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Bahamas Association of Compliance Officers
  `.trim();

  await sendEmail(to, 'Reset Your BACO Portal Password', html, text);
}

export async function sendRegistrationConfirmationEmail(to: string, userName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #40E0D0; padding: 20px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #000; margin: 0;">BACO Portal</h1>
        </div>
        
        <h2 style="color: #333;">Welcome to BACO Portal!</h2>
        
        <p>Hello ${userName},</p>
        
        <p>Thank you for registering with the Bahamas Association of Compliance Officers portal.</p>
        
        <p>Your account has been created and is currently pending approval. You will receive a notification once your membership has been activated.</p>
        
        <p>You can now:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Upload professional documents</li>
          <li>Browse upcoming events</li>
          <li>Access member resources</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}" style="background-color: #40E0D0; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Access Portal</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
          Bahamas Association of Compliance Officers<br>
          This is an automated message, please do not reply to this email.
        </p>
      </body>
    </html>
  `;

  const text = `
Hello ${userName},

Thank you for registering with the Bahamas Association of Compliance Officers portal.

Your account has been created and is currently pending approval. You will receive a notification once your membership has been activated.

Access your portal at: ${appUrl}

Bahamas Association of Compliance Officers
  `.trim();

  await sendEmail(to, 'Welcome to BACO Portal', html, text);
}

export async function sendEventRegistrationConfirmationEmail(
  to: string,
  event: { title: string; startDate: string; location?: string },
  registration: { firstName: string; lastName: string; registrationType?: string }
) {
  const eventDate = new Date(event.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #40E0D0; padding: 20px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #000; margin: 0;">BACO Portal</h1>
        </div>
        
        <h2 style="color: #333;">Event Registration Confirmed</h2>
        
        <p>Hello ${registration.firstName} ${registration.lastName},</p>
        
        <p>Your registration for <strong>${event.title}</strong> has been confirmed.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Date:</strong> ${eventDate}</p>
          ${event.location ? `<p><strong>Location:</strong> ${event.location}</p>` : ''}
          ${registration.registrationType ? `<p><strong>Registration Type:</strong> ${registration.registrationType.replace(/_/g, ' ')}</p>` : ''}
        </div>
        
        <p>We look forward to seeing you at the event!</p>
        
        <p>If you have any questions or need to make changes to your registration, please contact us.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
          Bahamas Association of Compliance Officers<br>
          This is an automated message, please do not reply to this email.
        </p>
      </body>
    </html>
  `;

  const text = `
Hello ${registration.firstName} ${registration.lastName},

Your registration for ${event.title} has been confirmed.

Event: ${event.title}
Date: ${eventDate}
${event.location ? `Location: ${event.location}` : ''}
${registration.registrationType ? `Registration Type: ${registration.registrationType.replace(/_/g, ' ')}` : ''}

We look forward to seeing you at the event!

Bahamas Association of Compliance Officers
  `.trim();

  await sendEmail(to, `Registration Confirmed: ${event.title}`, html, text);
}

export async function sendMembershipRenewalReminderEmail(
  to: string,
  user: { firstName: string; lastName: string },
  dueDate: Date
) {
  const dueDateStr = dueDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #40E0D0; padding: 20px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #000; margin: 0;">BACO Portal</h1>
        </div>
        
        <h2 style="color: #333;">Membership Renewal Reminder</h2>
        
        <p>Hello ${user.firstName} ${user.lastName},</p>
        
        <p>This is a reminder that your BACO membership renewal is due on <strong>${dueDateStr}</strong>.</p>
        
        <p>To maintain your active membership status and continue enjoying all the benefits of BACO membership, please renew your membership before the due date.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/checkout/membership" style="background-color: #40E0D0; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Renew Membership</a>
        </div>
        
        <p>If you have already renewed your membership, please disregard this reminder.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
          Bahamas Association of Compliance Officers<br>
          This is an automated message, please do not reply to this email.
        </p>
      </body>
    </html>
  `;

  const text = `
Hello ${user.firstName} ${user.lastName},

This is a reminder that your BACO membership renewal is due on ${dueDateStr}.

To maintain your active membership status and continue enjoying all the benefits of BACO membership, please renew your membership before the due date.

Renew your membership: ${appUrl}/checkout/membership

Bahamas Association of Compliance Officers
  `.trim();

  await sendEmail(to, 'BACO Membership Renewal Reminder', html, text);
}

export async function sendDocumentApprovalEmail(
  to: string,
  document: { fileName: string; category?: string }
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #40E0D0; padding: 20px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #000; margin: 0;">BACO Portal</h1>
        </div>
        
        <h2 style="color: #333;">Document Approved</h2>
        
        <p>Good news! Your document has been reviewed and approved.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Document:</strong> ${document.fileName}</p>
          ${document.category ? `<p><strong>Category:</strong> ${document.category}</p>` : ''}
        </div>
        
        <p>You can view all your documents in the portal.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/documents" style="background-color: #40E0D0; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Documents</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
          Bahamas Association of Compliance Officers<br>
          This is an automated message, please do not reply to this email.
        </p>
      </body>
    </html>
  `;

  const text = `
Good news! Your document has been reviewed and approved.

Document: ${document.fileName}
${document.category ? `Category: ${document.category}` : ''}

View your documents: ${appUrl}/documents

Bahamas Association of Compliance Officers
  `.trim();

  await sendEmail(to, 'Document Approved - BACO Portal', html, text);
}

export async function sendDocumentRejectionEmail(
  to: string,
  document: { fileName: string; category?: string },
  reason?: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #40E0D0; padding: 20px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #000; margin: 0;">BACO Portal</h1>
        </div>
        
        <h2 style="color: #333;">Document Review - Action Required</h2>
        
        <p>We have reviewed your uploaded document and unfortunately it was not approved at this time.</p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Document:</strong> ${document.fileName}</p>
          ${document.category ? `<p><strong>Category:</strong> ${document.category}</p>` : ''}
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        </div>
        
        <p>Please review the feedback above and upload a corrected version of your document.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/documents" style="background-color: #40E0D0; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Upload New Document</a>
        </div>
        
        <p>If you have any questions, please contact BACO administration.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
          Bahamas Association of Compliance Officers<br>
          This is an automated message, please do not reply to this email.
        </p>
      </body>
    </html>
  `;

  const text = `
We have reviewed your uploaded document and unfortunately it was not approved at this time.

Document: ${document.fileName}
${document.category ? `Category: ${document.category}` : ''}
${reason ? `Reason: ${reason}` : ''}

Please review the feedback and upload a corrected version.

Upload new document: ${appUrl}/documents

Bahamas Association of Compliance Officers
  `.trim();

  await sendEmail(to, 'Document Review - Action Required - BACO Portal', html, text);
}
