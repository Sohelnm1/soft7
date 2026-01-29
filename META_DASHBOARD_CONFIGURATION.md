# Meta App Dashboard Configuration Checklist

## ✅ Required Configurations for Embedded Signup

### 1. **System User Token** (Required)

**Location**: Embedded Signup Builder → Create a System User Token

**Steps**:
1. Go to **Business Settings** → **System Users**
2. Create a new System User (or use existing)
3. Generate a token with these permissions:
   - ✅ `business_management`
   - ✅ `whatsapp_business_management`
   - ✅ `whatsapp_business_messaging`
4. Copy the token
5. Go back to **Embedded Signup Builder** → **Create a System User Token**
6. Paste the token in the input field
7. Click **Save**

**⚠️ Important**: 
- Keep this token secure
- Do not share outside your organization
- This token is used for API operations

---

### 2. **OAuth Redirect URIs** (Required)

**Location**: Settings → Basic → Valid OAuth Redirect URIs

**Steps**:
1. Go to **Settings** → **Basic**
2. Scroll to **Valid OAuth Redirect URIs**
3. Add these URIs:
   ```
   https://soft7.wapsuite.in/api/whatsapp/embedded-signup/callback
   ```
4. Click **Save Changes**

**For Development** (if testing locally):
```
http://localhost:3000/api/whatsapp/embedded-signup/callback
```

---

### 3. **Webhook Configuration** (Already Done ✅)

**Location**: WhatsApp → Configuration → Webhook

**Current Setup**:
- ✅ Callback URL: `https://soft7.wapsuite.in/api/webhook/whatsapp`
- ✅ Verify Token: (Your configured token)

**Additional Step Needed**:
1. Go to **Webhook fields** section
2. Make sure these fields are subscribed:
   - ✅ `account_alerts` (already subscribed)
   - ✅ `account_review_update` (already subscribed)
   - ⚠️ **Add**: `embedded_signup` (NEW - Required for signup events)

**To Add `embedded_signup` Field**:
1. In Webhook fields table, look for `embedded_signup`
2. If not visible, click **Add Field** or **Subscribe to Fields**
3. Select `embedded_signup`
4. Choose API version: `v22.0`
5. Toggle **Subscribe** to ON
6. Click **Save**

---

### 4. **JavaScript SDK Setup** (Already Configured ✅)

**Location**: Embedded Signup Builder → JavaScript SDK

**Status**: ✅ Enabled
- This is automatically configured when you set up Facebook Login
- No additional action needed

---

### 5. **Pre-verified Phone Numbers** (Optional)

**Location**: Embedded Signup Builder → Pre-verified phone numbers

**When to Use**:
- Only needed if you want to pre-verify specific phone numbers
- For general customer signup, this is **NOT required**

**If Needed**:
1. Add your System User Token first (Step 1)
2. Go to **Pre-verified phone numbers**
3. Add phone numbers you want to pre-verify
4. These numbers will be available for customers to use

---

### 6. **App Review Status** (Check Status ✅)

**Location**: App Review → Dashboard

**Current Status**: ✅ Approved
- Business Verification: ✅ Complete
- App Review: ✅ Complete
- Integrity: ✅ Complete

**No Action Needed** - Your app is already approved for production use.

---

## 📋 Quick Configuration Checklist

Copy this checklist and check off as you complete:

- [ ] **Step 1**: Create System User Token with required permissions
- [ ] **Step 2**: Save System User Token in Embedded Signup Builder
- [ ] **Step 3**: Add OAuth Redirect URI to App Settings
- [ ] **Step 4**: Subscribe to `embedded_signup` webhook field
- [ ] **Step 5**: Verify webhook URL is correct: `https://soft7.wapsuite.in/api/webhook/whatsapp`
- [ ] **Step 6**: Test the signup flow

---

## 🔍 How to Verify Configuration

### Test System User Token:
1. Go to Embedded Signup Builder
2. Check if System User Token field shows a token (masked)
3. If empty, you need to add it (Step 1)

### Test OAuth Redirect:
1. Try accessing: `https://soft7.wapsuite.in/signup/whatsapp`
2. Click the signup widget
3. If redirect fails, check OAuth Redirect URI settings

### Test Webhook:
1. Complete a test signup
2. Check your server logs for webhook events
3. Verify `embedded_signup` events are received

---

## 🚨 Common Issues & Solutions

### Issue: "Invalid OAuth Redirect URI"
**Solution**: 
- Verify the exact URL in Meta Dashboard matches your callback URL
- No trailing slashes
- Must be HTTPS in production

### Issue: "System User Token Invalid"
**Solution**:
- Regenerate token in Business Settings
- Ensure all 3 permissions are granted
- Save token in Embedded Signup Builder

### Issue: "Webhook not receiving embedded_signup events"
**Solution**:
- Verify `embedded_signup` field is subscribed
- Check webhook URL is accessible
- Verify webhook signature validation

---

## 📞 Support Resources

- **Meta Documentation**: https://developers.facebook.com/docs/whatsapp/embedded-signup
- **Business Settings**: https://business.facebook.com/settings
- **App Dashboard**: https://developers.facebook.com/apps/1323859021659502

---

## ✅ Current Configuration Status

Based on your setup:

| Configuration | Status | Action Needed |
|--------------|--------|---------------|
| Webhook URL | ✅ Configured | None |
| Verify Token | ✅ Configured | None |
| OAuth Redirect | ⚠️ Check | Verify URI is added |
| System User Token | ⚠️ Check | Add if not present |
| embedded_signup Field | ⚠️ Check | Subscribe to field |
| App Review | ✅ Approved | None |
| Business Verification | ✅ Complete | None |

---

**Next Step**: Start with **Step 1** (System User Token) as it's required for the embedded signup to work properly.
