import nodemailer from 'nodemailer';

export interface SendEmailPayload {
  from: string;
  to: string;
  subject: string;
  body: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}

function sanitizeEnvValue(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/^["']|["']$/g, '');
}

function logSmtpConfigStatus(): void {
  const hasHost = !!process.env.ETHEREAL_HOST;
  const hasPort = !!process.env.ETHEREAL_PORT;
  const hasUser = !!process.env.ETHEREAL_USER;
  const hasPassword = !!process.env.ETHEREAL_PASSWORD;
  
  console.info('[SMTP] Configuration status:', { 
    host: hasHost, 
    port: hasPort, 
    user: hasUser, 
    password: hasPassword 
  });
}

// Log configuration on module load
logSmtpConfigStatus();

async function createSmtpTransport(payload: SendEmailPayload) {
  const host = payload.smtpHost || sanitizeEnvValue(process.env.ETHEREAL_HOST);
  const portEnv = sanitizeEnvValue(process.env.ETHEREAL_PORT);
  const port = payload.smtpPort || (portEnv ? Number(portEnv) : 587);
  const user = payload.smtpUser || sanitizeEnvValue(process.env.ETHEREAL_USER);
  const pass = payload.smtpPassword || sanitizeEnvValue(process.env.ETHEREAL_PASSWORD);

  const transportConfig = {
    host,
    port,
    secure: false,
    auth: { user, pass },
  };

  // Try configured credentials first
  if (host && port && user && pass) {
    const transport = nodemailer.createTransport(transportConfig);
    try {
      await transport.verify();
      console.info('[SMTP] Using configured credentials');
      return transport;
    } catch (error) {
      console.warn('[SMTP] Configured credentials failed, falling back to test account');
    }
  }

  // Fallback to Ethereal test account
  const testAccount = await nodemailer.createTestAccount();
  const fallbackTransport = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });

  await fallbackTransport.verify();
  console.info('[SMTP] Using Ethereal test account');
  return fallbackTransport;
}

export async function sendEmailViaSmtp(payload: SendEmailPayload): Promise<{ messageId: string }> {
  const transport = await createSmtpTransport(payload);

  const info = await transport.sendMail({
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    text: payload.body,
    html: payload.body.replace(/\n/g, '<br/>'),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.info('[SMTP] Preview URL: %s', previewUrl);
  }

  return { messageId: info.messageId };
}
