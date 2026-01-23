# Razorpay Subscription Integration Guide

## Setup Instructions

### 1. Add Environment Variables

Add the following to your `.env.local` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here
```

Replace the values with your actual Razorpay credentials from the Razorpay dashboard.

### 2. Get Razorpay Credentials

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign in or create an account
3. Navigate to **Settings → API Keys**
4. Copy your **Key ID** and **Key Secret**
5. Generate a webhook secret in the webhook settings

### 3. Set Up Database Migration

Run Prisma migration to update the database schema with subscription fields:

```bash
npx prisma migrate dev --name add_subscription_support
```

This will:
- Add subscription fields to the User model
- Create a new Subscription model
- Update the database

### 4. Configure Webhook

In your Razorpay dashboard:

1. Go to **Settings → Webhooks**
2. Add a new webhook endpoint
3. Enter your endpoint: `https://yourdomain.com/api/subscription/webhook`
4. Select events: `payment.authorized`, `payment.completed`, `payment.failed`
5. Copy the webhook secret to your `.env.local`

### 5. Update Topbar Component

The subscription button in the topbar is already configured to:
- Open the subscription panel
- Navigate to `/subscription` page for payment

### 6. API Endpoints

The following endpoints are now available:

#### Create Order
- **POST** `/api/subscription/create-order`
- **Body**: `{ planType: "starter" | "professional" | "enterprise" }`
- **Returns**: Razorpay order details and key

#### Verify Payment
- **POST** `/api/subscription/verify`
- **Body**: `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }`
- **Returns**: Subscription confirmation

#### Webhook
- **POST** `/api/subscription/webhook`
- **Automatic**: Handles Razorpay payment webhooks

### 7. Subscription Plans

Three subscription plans are available:

1. **Starter** - ₹999/month
   - Up to 1,000 contacts
   - 5 campaigns/month
   - Basic analytics
   - Email support

2. **Professional** - ₹2,999/month (Recommended)
   - Up to 10,000 contacts
   - Unlimited campaigns
   - Advanced analytics
   - Priority support
   - Custom workflows

3. **Enterprise** - ₹9,999/month
   - Unlimited contacts
   - Unlimited campaigns
   - Real-time analytics
   - 24/7 support
   - All integrations

### 8. Database Fields

The User model now includes:

```prisma
isPremium: Boolean          // Is user a premium subscriber
subscriptionPlan: String    // Current plan type
subscriptionId: String      // Subscription record ID
subscriptionStart: DateTime // When subscription started
subscriptionEnd: DateTime   // When subscription expires
razorpayCustomerId: String  // Razorpay customer ID
```

### 9. Usage in Components

Check if user is premium:

```typescript
const isUserPremium = user.isPremium;
const currentPlan = user.subscriptionPlan;
const expiryDate = user.subscriptionEnd;
```

### 10. Testing

#### Test Razorpay Cards

Use these test card numbers:

- **Success**: `4111 1111 1111 1111`
- **Failed**: `4444 3333 2222 1111`
- **OTP Required**: `5123 4500 0000 0008`

Expiry: Any future date
CVV: Any 3 digits

#### Test Payment Flow

1. Go to `/subscription` page
2. Click "Subscribe" on any plan
3. Use test card credentials
4. Verify payment is processed
5. Check user.isPremium is updated

## Troubleshooting

### Payment not verified
- Check RAZORPAY_KEY_SECRET is correct
- Verify webhook signature is properly configured
- Check browser console for errors

### Signature verification failed
- Ensure RAZORPAY_KEY_SECRET is exactly correct
- Check webhook is sending correct payload
- Verify signature algorithm (SHA-256)

### User not marked premium
- Check subscription record is created
- Verify payment webhook is triggered
- Check database has subscription fields

## Security Notes

- Never commit `.env.local` to version control
- Use environment variables for all sensitive data
- Verify webhook signatures before processing
- Implement rate limiting on payment endpoints
- Use HTTPS for production

## Support

For Razorpay support, visit: https://razorpay.com/support
