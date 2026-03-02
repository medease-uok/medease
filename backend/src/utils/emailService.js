const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Creates and returns a configured SMTP transporter.
 * Lazily created so the app starts even if SMTP is not yet configured.
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,   // true for port 465, false for 587 / 25
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

/**
 * Sends a login OTP verification email.
 *
 * @param {string} to        - Recipient email address
 * @param {string} firstName - Recipient first name (for personalisation)
 * @param {string} otp       - 6-digit OTP code
 */
async function sendLoginOtpEmail(to, firstName, otp) {
  const transporter = createTransporter();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>MedEase – Login Verification</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0"
                   style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

              <!-- Header -->
              <tr>
                <td style="background:#1a73e8;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:1px;">MedEase</h1>
                  <p style="margin:6px 0 0;color:#d0e4ff;font-size:13px;">Hospital Management System</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 16px;font-size:16px;color:#333;">Hi ${firstName},</p>
                  <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                    We received a login request for your MedEase account.
                    Use the verification code below to complete sign-in.
                    This code is valid for <strong>10 minutes</strong>.
                  </p>

                  <!-- OTP box -->
                  <div style="text-align:center;margin:32px 0;">
                    <span style="display:inline-block;background:#f0f7ff;border:2px dashed #1a73e8;
                                 border-radius:8px;padding:16px 48px;font-size:36px;font-weight:700;
                                 color:#1a73e8;letter-spacing:10px;">${otp}</span>
                  </div>

                  <p style="margin:0 0 8px;font-size:14px;color:#888;text-align:center;">
                    Never share this code with anyone.
                  </p>
                  <p style="font-size:13px;color:#bbb;text-align:center;">
                    If you did not attempt to log in, please ignore this email or contact support immediately.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #eee;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#aaa;">
                    &copy; ${new Date().getFullYear()} MedEase Hospital Management System.
                    All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Use SMTP_FROM as-is if provided (e.g. "MedEase <noreply@example.com>"),
  // otherwise fall back to a plain address.
  const from = config.smtp.from || `"MedEase" <${config.smtp.user}>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject: 'Your MedEase Login Verification Code',
    html,
    text: `Hi ${firstName},\n\nYour MedEase login verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not attempt to log in, ignore this email.`,
  });

  return info;
}

module.exports = { sendLoginOtpEmail };
