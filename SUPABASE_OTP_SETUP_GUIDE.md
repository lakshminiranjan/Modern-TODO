# Supabase OTP Setup Guide

This guide explains how to configure Supabase to send OTP (One-Time Password) codes instead of reset links for password reset functionality.

## Dashboard Configuration

### 1. Email Templates Configuration
1. Log in to your Supabase Dashboard
2. Navigate to **Authentication** > **Email Templates**
3. Click on the **Reset Password** template
4. Update the **Subject** to: `Your TaskMaster Verification Code`
5. Replace the HTML content with the following template:

```html
<!DOCTYPE html>
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
          <p class="otp-code">{{ .Data.otp }}</p>
        </div>
        <p style="text-align: center; font-weight: bold; margin: 20px 0;">
          This code will expire in 2 minutes.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
```

6. Click **Save**

### 2. Authentication Settings Configuration
1. In the Supabase Dashboard, navigate to **Authentication** > **Providers**
2. Under **Email**, click on the settings (gear icon)
3. Make these critical changes:
   - Set **Confirm Email** to **No**
   - Disable **Enable Email Confirmations** (toggle it off)
   - Set **Password Reset Link Lifespan** to **0** seconds
   - Make sure **Secure Email Change** is disabled
4. Click **Save**

## Troubleshooting

If you're still receiving reset links instead of OTP codes:

1. **Clear Browser Cache**: Try clearing your browser cache or using incognito mode
2. **Verify Template**: Make sure the template includes `{{ .Data.otp }}` exactly as shown
3. **Check Settings**: Double-check all settings in the Authentication > Providers section
4. **Test in Incognito**: Test the password reset flow in an incognito/private browser window
5. **Check Console Logs**: Look for any errors in your browser console during the reset process

## Important Notes

- The OTP code is generated on the client side and sent to Supabase
- Supabase will include this OTP in the email template where `{{ .Data.otp }}` is placed
- The OTP is valid for 2 minutes by default
- Setting the Password Reset Link Lifespan to 0 is critical to force OTP mode