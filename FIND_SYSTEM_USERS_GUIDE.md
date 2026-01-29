# How to Find System Users in Meta Business Settings

## 🔍 The Issue

You're currently in **People** section, which is for regular business users. **System Users** are in a **different section**.

## ✅ Correct Location

### Option 1: Direct Navigation (Easiest)

1. **Go to Business Settings directly:**
   ```
   https://business.facebook.com/settings/system-users
   ```

2. Or navigate manually:
   - In the left sidebar, look for **"System Users"** (not "Users")
   - It should be a separate section, usually below "Users" or in "Security" section

### Option 2: Step-by-Step Navigation

1. **From your current page:**
   - Look at the **left sidebar**
   - Scroll down past "Users", "Accounts", "Data Sources"
   - Look for **"System Users"** or **"Security"** section
   - Click on **"System Users"**

2. **Alternative path:**
   - Click on **"Settings"** icon (gear icon) at the bottom of left sidebar
   - Look for **"System Users"** in the menu

### Option 3: Search in Business Settings

1. Use the **search bar** at the top
2. Type: **"System Users"**
3. Click on the result

## 📍 What You Should See

When you're in the correct **System Users** section, you'll see:
- A list of existing System Users (if any)
- A **"+ Add"** or **"Create System User"** button
- Options to generate tokens

## 🎯 If You Still Can't Find It

### Check Your Permissions

System Users section might not be visible if:
- You don't have **Admin** or **System User Admin** permissions
- Your account doesn't have access to this feature

**Solution:**
- Ask someone with **Full Control** access (like Devanshu Pgare, Praful Raut, or Harshal Dongre from your People list) to:
  1. Go to System Users section
  2. Create a System User
  3. Generate a token with required permissions
  4. Share the token with you (securely)

### Alternative: Use Existing System User

If someone already created a System User:
1. Ask them to generate a new token
2. Get the token with these permissions:
   - `business_management`
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
3. Use that token in Embedded Signup Builder

## 🔗 Direct Links

**System Users:**
```
https://business.facebook.com/settings/system-users
```

**Create System User:**
```
https://business.facebook.com/settings/system-users?asset_id=YOUR_BUSINESS_ID
```

## 📝 Quick Steps Once You Find It

1. Click **"+ Add"** or **"Create System User"**
2. Give it a name (e.g., "WhatsApp Embedded Signup")
3. Click **"Create"**
4. Click **"Generate New Token"**
5. Select your app: **SOFT7** (1323859021659502)
6. Select permissions:
   - ✅ `business_management`
   - ✅ `whatsapp_business_management`
   - ✅ `whatsapp_business_messaging`
7. Click **"Generate Token"**
8. **Copy the token immediately** (you won't see it again!)
9. Go to **App Dashboard** → **Embedded Signup Builder**
10. Paste token in **"System User Token"** field
11. Click **"Save"**

## ⚠️ Important Notes

- **Token Security**: Never share the token publicly
- **Token Expiry**: System User tokens don't expire, but you can revoke them
- **Permissions**: Make sure all 3 permissions are selected
- **Business ID**: Make sure you're creating it for the correct business (01API by SOFT7 Technology)

## 🆘 Still Having Issues?

If you can't find System Users section:
1. Check if you're logged into the correct Business Manager account
2. Verify you have Admin permissions
3. Try accessing via direct link: `https://business.facebook.com/settings/system-users`
4. Contact someone with Full Control access to create it for you
