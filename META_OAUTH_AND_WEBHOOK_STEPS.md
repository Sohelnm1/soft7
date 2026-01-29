# Step 3 & 4: Where to Find OAuth Redirect URI and Webhook Fields

These settings are **not** under "App settings > Basic". Here is exactly where they are.

---

## Step 3: Add OAuth Redirect URI

**It is not in "App settings > Basic".**

### Where it is

1. In the **left sidebar**, find **Products**.
2. Under Products, click **"Facebook Login for Business"** (expand it if it’s collapsed).
3. Click **"Settings"** under Facebook Login for Business.
4. On that page you’ll see **Client OAuth settings** and a field for **Valid OAuth Redirect URIs**.
5. Add this URI (one per line). Use the same domain as your app:
   ```
   https://officialapi.soft7.in/api/whatsapp/embedded-signup/callback
   ```
   If your app runs on a different domain (e.g. `https://soft7.wapsuite.in`), use that instead. No trailing slash.
6. Click **Save changes**.

**Summary:**  
**Products → Facebook Login for Business → Settings** → add the redirect URI there.

---

## Step 4: Subscribe to webhook field for Embedded Signup

**There is no field named `embedded_signup`.**

For Embedded Signup, Meta uses the **`account_update`** webhook. When a customer finishes signup, Meta sends an **`account_update`** event with **`event: "PARTNER_ADDED"`**.

### What to do in the dashboard

1. Go to **Webhooks** in the left sidebar (you’re already on the right product).
2. In **Webhook fields**, use the list you see (with **Version**, **Test**, **Subscribe**).
3. **Scroll down** in that list. The fields are in a long list; `account_update` is one of them.
4. Find the row for **`account_update`**.
5. Set **Version** to **v22.0** (or the version you use).
6. Turn **Subscribe** **ON** (blue) for `account_update`.
7. Click **Verify and save** at the top of the webhook section.

**Summary:**  
**Webhooks → Webhook fields** → scroll to **`account_update`** → Subscribe ON → **Verify and save**.

### Why there is no “embedded_signup” or “Add field”

- Meta does **not** expose a webhook field called `embedded_signup`.
- The list of fields (account_alerts, account_review_update, account_update, etc.) is **fixed**; there is no “Add field” button.
- For “embedded signup subscription”, you **subscribe to `account_update`**; that’s how you get notified when a customer completes Embedded Signup (`PARTNER_ADDED`).

---

## Checklist

- [ ] **Step 3:** **Products → Facebook Login for Business → Settings** → add  
      `https://officialapi.soft7.in/api/whatsapp/embedded-signup/callback` (or your app URL) → Save.
- [ ] **Step 4:** **Webhooks → Webhook fields** → scroll to **`account_update`** → Subscribe ON → **Verify and save**.

After this, OAuth redirect and Embedded Signup webhook notifications will be configured correctly.
