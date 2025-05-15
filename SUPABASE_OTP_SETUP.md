# Supabase OTP Setup Guide

This guide explains how to configure Supabase to send OTP (One-Time Password) codes instead of reset links for password reset functionality.

## Problem

By default, Supabase sends a password reset link when `resetPasswordForEmail()` is called. However, our application is designed to use OTP codes for password reset.

## Solution

To make Supabase send OTP codes instead of reset links, follow these steps:

### 1. Update Email Templates in Supabase Dashboard

1. Log in to your Supabase Dashboard
2. Navigate to **Authentication** > **Email Templates**
3. Edit the **Reset Password** template
4. Make sure the template includes the `{{ .Data.otp }}` variable where you want the OTP code to appear
5. Remove or comment out the reset link button and URL in the template
6. Save the changes

Here's an example of how the OTP section should look in your template:

```html
<div style="background-color: #F1F5F9; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
  <p style="font-size: 14px; color: #64748B; margin-bottom: 10px;">Your verification code is:</p>
  <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; margin: 0;">{{ .Data.otp }}</p>
</div>

<p style="text-align: center; font-weight: bold; font-size: 18px; margin: 30px 0 20px 0; color: #1E293B;">
  Enter this code in the app to reset your password
</p>
```

### 2. Configure Authentication Settings

1. In the Supabase Dashboard, go to **Authentication** > **Providers**
2. Under **Email**, make sure:
   - **Confirm email** is set to **No** (this prevents Supabase from requiring email confirmation)
   - **Enable Email Confirmations** is disabled (this ensures OTP is sent instead of links)

### 3. Code Implementation

When calling `resetPasswordForEmail()`, make sure:

1. Do NOT include the `redirectTo` parameter
2. Include the OTP in the `data` parameter
3. Specify the type as "otp" in the data parameter

Example:

```javascript
const otp = generateOTP(); // Generate a 6-digit OTP
await supabase.auth.resetPasswordForEmail(email, {
  data: { 
    otp: otp,
    type: "otp"
  }
});
```

### 4. Testing

1. Request a password reset from your application
2. Check the email received - it should contain an OTP code, not a reset link
3. Enter the OTP in your application to verify it works

## Troubleshooting

If you're still receiving reset links instead of OTP codes:

1. **Check Supabase Dashboard Settings**: Ensure email confirmations are disabled
2. **Verify Email Template**: Make sure the template includes the `{{ .Data.otp }}` variable
3. **Check Code Implementation**: Ensure you're not including the `redirectTo` parameter
4. **Clear Browser Cache**: Sometimes cached settings can affect behavior
5. **Check Supabase Logs**: Look for any errors in the Supabase logs

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)