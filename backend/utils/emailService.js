const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = () => {
  console.log('[EMAIL] Creating transporter...');

  // For development, try to use Mailpit first, fallback to logging
  if (process.env.NODE_ENV !== 'production') {
    try {
      const config = {
        host: process.env.EMAIL_HOST || 'localhost',
        port: parseInt(process.env.EMAIL_PORT) || 1025,
        secure: false,
        debug: true,
        logger: true
      };

      console.log('[EMAIL] Development mode: trying Mailpit config:', {
        host: config.host,
        port: config.port,
        secure: config.secure
      });

      const transporter = nodemailer.createTransport(config);

      // Test connection immediately
      transporter.verify((error, success) => {
        if (error) {
          console.error('[EMAIL] Mailpit connection failed, falling back to console logging:', error.message);
          return null; // Return null to use console logging
        } else {
          console.log('[EMAIL] Mailpit connection successful!');
          return transporter;
        }
      });

      return transporter;
    } catch (error) {
      console.error('[EMAIL] Error creating Mailpit transporter, falling back to console logging:', error);
      return null;
    }
  }

  // Production configuration
  const config = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  console.log('[EMAIL] Production config:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    hasAuth: !!config.auth
  });

  const transporter = nodemailer.createTransport(config);

  transporter.verify((error, success) => {
    if (error) {
      console.error('[EMAIL] Production transporter verification failed:', error);
    } else {
      console.log('[EMAIL] Production transporter is ready');
    }
  });

  return transporter;
};

// Generate HTML email template
const generateEmailTemplate = (type, code) => {
  const subject = type === 'reset' ? 'Reset Password NESAVENT' : 'Verifikasi Email NESAVENT';
  const title = type === 'reset' ? 'Reset Password Anda' : 'Verifikasi Email Anda';
  const actionText = type === 'reset' ? 'mereset password' : 'memverifikasi email';

  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #2563eb;
              text-align: center;
              margin-bottom: 30px;
            }
            .code {
              font-size: 36px;
              font-weight: bold;
              color: #dc2626;
              letter-spacing: 8px;
              background: linear-gradient(135deg, #fef2f2, #fee2e2);
              padding: 25px;
              border-radius: 12px;
              margin: 30px 0;
              border: 3px dashed #dc2626;
              text-align: center;
              font-family: 'Courier New', monospace;
            }
            .warning {
              background: linear-gradient(135deg, #fef3c7, #fde68a);
              border: 2px solid #f59e0b;
              color: #92400e;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
              font-weight: 600;
            }
            .footer {
              font-size: 12px;
              color: #666;
              margin-top: 40px;
              text-align: center;
              border-top: 1px solid #eee;
              padding-top: 20px;
            }
            h1 {
              color: #1f2937;
              text-align: center;
              margin-bottom: 20px;
            }
            p {
              margin: 15px 0;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">NESAVENT</div>
            <h1>${title}</h1>
            <p>Halo!</p>
            <p>Gunakan kode berikut untuk ${actionText}:</p>

            <div class="code">${code}</div>

            <div class="warning">
              <strong>⚠️ PENTING:</strong><br>
              Kode ini akan kadaluarsa dalam 10 menit.<br>
              Jangan bagikan kode ini kepada siapapun.
            </div>

            <p>Jika Anda tidak meminta ${actionText} ini, abaikan email ini.</p>

            <p>Terima kasih,<br><strong>Tim NESAVENT</strong></p>

            <div class="footer">
              <p>Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
              <p>&copy; 2025 NESAVENT. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
};

// Send email function
const sendEmail = async (to, type, code) => {
  try {
    console.log(`[EMAIL] Starting email send process to: ${to}, type: ${type}, code: ${code}`);

    const transporter = createTransporter();

    // Development mode: just log the email
    if (!transporter) {
      console.log(`[EMAIL] 📧 DEVELOPMENT MODE - Email would be sent to: ${to}`);
      console.log(`[EMAIL] Subject: ${type === 'reset' ? 'Reset Password NESAVENT' : 'Verifikasi Email NESAVENT'}`);
      console.log(`[EMAIL] Code: ${code}`);
      console.log(`[EMAIL] To view the email content, check the generateEmailTemplate function`);
      console.log(`[EMAIL] ✅ Email logged successfully (development mode)`);

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
        response: 'Development mode - email logged to console'
      };
    }

    // Production mode: actually send email
    const template = generateEmailTemplate(type, code);

    const mailOptions = {
      from: `"NESAVENT" <${process.env.EMAIL_FROM || 'noreply@nesavent.com'}>`,
      to: to,
      subject: template.subject,
      html: template.html,
    };

    console.log(`[EMAIL] Mail options prepared:`, {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    console.log(`[EMAIL] Sending email...`);
    const info = await transporter.sendMail(mailOptions);

    console.log(`[EMAIL] ✅ Email sent successfully!`);
    console.log(`[EMAIL] Message ID: ${info.messageId}`);
    console.log(`[EMAIL] Response: ${info.response}`);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };

  } catch (error) {
    console.error(`[EMAIL] ❌ Email send failed:`, error);
    console.error(`[EMAIL] Error details:`, {
      message: error.message,
      code: error.code,
      command: error.command
    });

    // Don't throw error, just return failure status
    return {
      success: false,
      error: error.message
    };
  }
};

// Send verification code for email verification
const sendVerificationCode = async (email, code) => {
  console.log(`[EMAIL] Sending verification code to ${email}`);
  const result = await sendEmail(email, 'verification', code);

  if (!result.success) {
    throw new Error(`Failed to send verification email: ${result.error}`);
  }

  return result;
};

// Send password reset code
const sendPasswordResetCode = async (email, code) => {
  console.log(`[EMAIL] Sending password reset code to ${email}`);
  const result = await sendEmail(email, 'reset', code);

  if (!result.success) {
    throw new Error(`Failed to send password reset email: ${result.error}`);
  }

  return result;
};

module.exports = {
  sendVerificationCode,
  sendPasswordResetCode,
};