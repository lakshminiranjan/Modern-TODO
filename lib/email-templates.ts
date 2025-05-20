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
    /* Base styles */
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
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      border: 1px solid #E2E8F0;
    }
    
    .email-header {
      background: linear-gradient(135deg, #4F46E5, #EC4899);
      padding: 30px 20px;
      text-align: center;
    }
    
    .logo {
      margin-bottom: 15px;
    }
    
    .logo-text {
      color: white;
      font-size: 28px;
      font-weight: bold;
      margin: 0;
      letter-spacing: 0.5px;
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
    
    .otp-label {
      font-size: 14px;
      color: #64748B;
      margin-bottom: 10px;
    }
    
    .otp-code {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 5px;
      color: #4F46E5;
      margin: 0;
    }
    
    .instructions {
      text-align: center;
      font-weight: bold;
      font-size: 18px;
      margin: 30px 0 20px 0;
      color: #1E293B;
    }
    
    .expiry-note {
      font-size: 14px;
      color: #64748B;
      margin-bottom: 25px;
      padding: 10px 15px;
      background-color: #F1F5F9;
      border-radius: 8px;
      border-left: 4px solid #4F46E5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-wrapper">
      <!-- Header with logo -->
      <div class="email-header">
        <div class="logo">
          <h1 class="logo-text">TaskMaster</h1>
        </div>
      </div>
      
      <!-- Email content -->
      <div class="email-body">
        <h2 class="greeting">Verification Code</h2>
        
        <p class="message">
          We received a request to reset your password for your TaskMaster account. 
          Use the verification code below to complete the password reset process.
          If you didn't make this request, you can safely ignore this email.
        </p>
        
        <div class="otp-container">
          <p class="otp-label">Your verification code is:</p>
          <p class="otp-code" style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; margin: 0;">{{ .Token }}</p>
        </div>
        
        <p class="instructions">
          Enter this code in the app to reset your password
        </p>
        
        <div class="expiry-note">
          This verification code will expire in 2 minutes for security reasons.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// For compatibility with existing code, export the OTP template as all template types
export const RESET_PASSWORD_TEMPLATE = OTP_TEMPLATE;
export const CONFIRMATION_TEMPLATE = OTP_TEMPLATE;
export const MAGIC_LINK_TEMPLATE = OTP_TEMPLATE;