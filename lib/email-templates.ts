/**
 * Email templates for authentication
 * This template is used with the Supabase Auth API
 */

/**
 * In React Native, we can't use Node.js fs module to read files at runtime
 * Instead, we'll use hardcoded template strings
 */

/**
 * OTP verification email template
 * This is the only template used for all authentication purposes including:
 * - Password reset
 * - Email verification
 * - Account confirmation
 * 
 * Note: We've removed all other templates to ensure only OTP is used for authentication
 */
// Define the OTP template
export const OTP_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your TaskMaster Verification Code</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1E293B;
      background-color: #F8FAFC;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .email-wrapper {
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #E2E8F0;
    }
    .email-header {
      background: linear-gradient(135deg, #4F46E5, #EC4899);
      padding: 30px 20px;
      text-align: center;
    }
    .logo-text {
      color: white;
      font-size: 28px;
      font-weight: bold;
      margin: 0;
    }
    .email-body {
      padding: 30px 40px;
    }
    .greeting {
      font-size: 22px;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 20px;
      color: #1E293B;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      color: #475569;
    }
    .otp-container {
      background-color: #F1F5F9;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 20px 0;
    }
    .otp-code {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 5px;
      color: #4F46E5;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-wrapper">
      <div class="email-header">
        <h1 class="logo-text">TaskMaster</h1>
      </div>
      <div class="email-body">
        <h2 class="greeting">Verification Code</h2>
        <p class="message">
          Use the verification code below to reset your password.
          If you didn't request this, you can safely ignore this email.
        </p>
        <div class="otp-container">
          <p style="font-size: 14px; color: #64748B; margin-bottom: 10px;">Your verification code is:</p>
          <p class="otp-code" style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; margin: 0;">{{ .Data.otp }}</p>
        </div>
        <p style="text-align: center; font-weight: bold; margin: 20px 0;">
          This code will expire in 2 minutes.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

// For compatibility with existing code, export the OTP template as all template types
export const RESET_PASSWORD_TEMPLATE = OTP_TEMPLATE;
export const CONFIRMATION_TEMPLATE = OTP_TEMPLATE;
export const MAGIC_LINK_TEMPLATE = OTP_TEMPLATE;