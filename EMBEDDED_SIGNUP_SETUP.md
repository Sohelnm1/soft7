# WhatsApp Embedded Signup Builder Setup Guide

## Overview

The WhatsApp Embedded Signup Builder allows you to onboard customers to the WhatsApp Business Platform directly from your website. When customers complete the signup flow, they are automatically added to your system with initial credits allocated.

## Features

✅ **Automatic Account Creation**: Customers can sign up directly from your website  
✅ **Automatic Credit Allocation**: Initial credits are automatically added to new customers  
✅ **Webhook Integration**: Real-time notifications when customers complete signup  
✅ **OAuth Flow**: Secure authentication using Meta's OAuth 2.0  
✅ **Production Ready**: Supports both development and production environments  

## Prerequisites

1. **Meta Business Account**: You need a verified Meta Business account
2. **Meta App**: Create a Meta App in the [Meta for Developers](https://developers.facebook.com/) dashboard
3. **Business Verification**: Your business must be verified (as shown in the dashboard)
4. **App Review**: Your app must pass Meta's review process

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Meta App Configuration (Required)
META_APP_ID=your_meta_app_id_here
META_APP_SECRET=your_meta_app_secret_here

# Webhook Configuration
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token_here

# Application URL (Required for OAuth callback)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
# For local development, use: http://localhost:3000

# Initial Credits Allocation (Optional)
EMBEDDED_SIGNUP_INITIAL_CREDITS=100
# This is the amount of credits automatically allocated when a customer signs up
# Default: 100 if not specified
```

## Setup Steps

### Step 1: Get Meta App Credentials

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Navigate to **My Apps** → Select your app
3. Go to **Settings** → **Basic**
4. Copy your **App ID** and **App Secret**
5. Add them to your `.env.local` file

### Step 2: Configure Webhook

1. Go to your Meta App Dashboard
2. Navigate to **WhatsApp** → **Configuration**
3. Click on **Webhook** section
4. Add webhook URL: `https://yourdomain.com/api/whatsapp/embedded-signup/webhook`
5. Set verify token to match `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in your `.env.local`
6. Subscribe to the following events:
   - `embedded_signup` (for signup completion events)

### Step 3: Configure OAuth Redirect URI

1. Go to **Settings** → **Basic** in your Meta App
2. Add **Valid OAuth Redirect URIs**:
   - `https://yourdomain.com/api/whatsapp/embedded-signup/callback`
   - For development: `http://localhost:3000/api/whatsapp/embedded-signup/callback`

### Step 4: Initialize Embedded Signup

1. Navigate to `/integrations/whatsapp/embedded-signup` in your application
2. Click **Initialize Configuration**
3. Copy the integration code provided
4. Add it to your website where you want the signup widget to appear

### Step 5: Add Integration Code to Your Website

Add the following code to your website HTML:

```html
<!-- Facebook SDK -->
<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId: 'YOUR_APP_ID',
      xfbml: true,
      version: 'v22.0'
    });
  };

  (function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s); js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
</script>

<!-- Embedded Signup Widget -->
<div 
  class="fb-messenger-embedded-signup"
  data-app-id="YOUR_APP_ID"
  data-redirect-uri="https://yourdomain.com/api/whatsapp/embedded-signup/callback"
  data-state="YOUR_STATE_TOKEN"
></div>
```

Replace:
- `YOUR_APP_ID` with your Meta App ID
- `https://yourdomain.com` with your actual domain
- `YOUR_STATE_TOKEN` with the state token from the Embedded Signup page

## How It Works

### 1. Customer Signup Flow

1. Customer visits your website and sees the Embedded Signup widget
2. Customer clicks to sign up and is redirected to Meta's signup flow
3. Customer completes the signup process
4. Meta redirects back to your callback URL with authorization code
5. Your server exchanges the code for an access token
6. WhatsApp account is automatically created in your system
7. Initial credits are allocated to the customer's wallet

### 2. Webhook Events

When a customer completes signup, Meta sends a webhook event to your server:
- Event type: `embedded_signup_completed`
- Contains: `waba_id`, `phone_number_id`, `access_token`
- Your server processes the event and creates/updates the WhatsApp account
- Credits are automatically allocated

### 3. Credit Allocation

When a customer signs up:
- Initial credits (default: 100) are added to their wallet balance
- A wallet transaction is recorded with type `TOPUP`
- The transaction is linked to the signup event for tracking

## API Endpoints

### GET `/api/whatsapp/embedded-signup/config`
Get the current Embedded Signup configuration.

**Response:**
```json
{
  "appId": "123456789",
  "businessId": "987654321",
  "redirectUri": "https://yourdomain.com/api/whatsapp/embedded-signup/callback",
  "state": "base64_encoded_state"
}
```

### POST `/api/whatsapp/embedded-signup/init`
Initialize the Embedded Signup configuration.

**Request Body:**
```json
{
  "appId": "123456789",
  "businessId": "987654321"
}
```

### GET `/api/whatsapp/embedded-signup/callback`
OAuth callback endpoint (called by Meta after signup).

**Query Parameters:**
- `code`: Authorization code from Meta
- `state`: State token for CSRF protection
- `waba_id`: WhatsApp Business Account ID (optional)
- `phone_number_id`: Phone Number ID (optional)

### POST `/api/whatsapp/embedded-signup/webhook`
Webhook endpoint for Meta events.

**Headers:**
- `x-hub-signature-256`: HMAC SHA256 signature

**Body:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "field": "embedded_signup",
          "value": {
            "event": "embedded_signup_completed",
            "waba_id": "...",
            "phone_number_id": "...",
            "access_token": "..."
          }
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Issue: "Missing App ID or Secret"
**Solution**: Make sure `META_APP_ID` and `META_APP_SECRET` are set in your `.env.local` file.

### Issue: "Invalid webhook signature"
**Solution**: Verify that `META_APP_SECRET` matches your Meta App Secret and that the webhook URL is correctly configured.

### Issue: "OAuth redirect URI mismatch"
**Solution**: Ensure the redirect URI in your Meta App settings matches exactly: `https://yourdomain.com/api/whatsapp/embedded-signup/callback`

### Issue: Credits not allocated
**Solution**: 
1. Check that `EMBEDDED_SIGNUP_INITIAL_CREDITS` is set (defaults to 100)
2. Verify the webhook is receiving events
3. Check server logs for errors

## Security Considerations

1. **State Token**: The state parameter is used for CSRF protection. Always validate it.
2. **Webhook Signature**: Always verify the webhook signature to ensure requests are from Meta.
3. **Access Tokens**: Store access tokens securely. They provide full access to the WhatsApp account.
4. **HTTPS**: Always use HTTPS in production for OAuth callbacks and webhooks.

## Testing

### Local Development

1. Use `http://localhost:3000` as your `NEXT_PUBLIC_APP_URL`
2. Add `http://localhost:3000/api/whatsapp/embedded-signup/callback` to Meta App redirect URIs
3. Use a tool like [ngrok](https://ngrok.com/) to expose your local server for webhook testing:
   ```bash
   ngrok http 3000
   ```
4. Use the ngrok URL for webhook configuration in Meta

### Production Testing

1. Ensure all environment variables are set correctly
2. Verify webhook URL is accessible from the internet
3. Test the signup flow end-to-end
4. Monitor webhook events in your server logs

## Support

For more information, refer to:
- [Meta Embedded Signup Documentation](https://developers.facebook.com/docs/whatsapp/embedded-signup)
- [Meta for Developers Dashboard](https://developers.facebook.com/)
