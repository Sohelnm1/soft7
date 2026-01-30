# Embedded Signup Flow – Implementation Context

This document describes how **WhatsApp Embedded Signup** is implemented in this Next.js project so you can reason about it or extend it (e.g. with ChatGPT).

---

## 1. What Embedded Signup Is

- **Meta’s Embedded Signup**: Lets business customers connect their WhatsApp Business Account (WABA) to your app via a Facebook/Meta OAuth-style flow (popup or redirect).
- **This project**: Uses Meta’s flow so that **new customers** can onboard themselves, get a **WhatsApp account** linked in the app, and receive **initial credits** (configurable). Existing **logged-in users** can also connect an extra WABA; the new account is linked to their user via `state`.

---

## 2. High-Level Flows

### 2.1 Customer-facing signup (new or logged-in)

1. User opens **`/signup/whatsapp`** (public page).
2. Page loads **app config** from `GET /api/whatsapp/embedded-signup/public-config` (appId, redirectUri, optional `state` if user is logged in).
3. Facebook SDK is loaded; the **XFBML widget** `fb-messenger-embedded-signup` is rendered with `data-app-id`, `data-redirect-uri`, and optional `data-state`.
4. User clicks the widget and completes Meta’s Embedded Signup in the browser.
5. Meta **redirects** the browser to **`/api/whatsapp/embedded-signup/callback?code=...&state=...`** (and sometimes `error=...` if user cancels).
6. **Callback** (see below) exchanges `code` for an access token, resolves WABA ID and phone number ID (from URL or Graph API), creates/updates a **WhatsAppAccount**, allocates **initial credits**, then redirects to **`/integrations/whatsapp?success=true&account_id=<id>`**.
7. On the integrations page, if URL has `success=true&account_id=...`, the frontend calls **`POST /api/whatsapp/accounts/claim`** so the account is “claimed” by the current user (relevant when the account was first created under a default user).

### 2.2 Admin / builder (Embedded Signup setup)

- **`/integrations/whatsapp`**: “Manage WhatsApp” list; buttons for **Embedded Signup** (link to `/signup/whatsapp`) and **Embedded Signup Setup** (link to `/integrations/whatsapp/embedded-signup`).
- **`/integrations/whatsapp/embedded-signup`**: Builder/setup page for admins: shows webhook URL, config, init button, and copy-paste snippet to embed the widget (points to `/signup/whatsapp`). Success/error toasts come from URL params (e.g. `?error=cancelled`).

---

## 3. Important: We Do NOT Receive Success Data (WABA ID, Phone Number ID) from Meta in the Redirect

When using the **redirect flow** (user is sent to our callback URL after completing Embedded Signup), **Meta does not include WABA ID or phone number ID in the redirect URL**.

- **What we actually receive in the callback URL:**
  - `code` – exchangeable authorization code (we exchange this for an access token).
  - `state` – optional; we use it to pass our own payload (e.g. `userId-timestamp` in base64).
  - `error` – only when the user cancels or Meta returns an error (e.g. `access_denied`).

- **What we do NOT receive in the redirect:**
  - `waba_id` (WhatsApp Business Account ID)
  - `phone_number_id` (business phone number ID)

  So the server-side callback **cannot** rely on these being in the query string. In practice they are **not** sent there by Meta when using the redirect.

- **How Meta documents delivery of WABA/phone:**
  In Meta's Implementation doc, the **code** is delivered via the **JavaScript response callback** (`response.authResponse.code`) to the **window** that spawned the flow. The **WABA ID and phone number ID** are delivered via a **message event** (postMessage) to that same window – i.e. on the **client**, in a different mechanism from the code. So when we use a **redirect**, the browser navigates away to our callback; the server only sees the redirect URL (with `code` and maybe `state`). The message event with WABA/phone is never received by our server.

- **How we work around it in this project:**
  1. **After exchanging the code for an access token**, we call the **Graph API** with that token to get WABA and phone number IDs: `fetchWabaAndPhoneFromToken(accessToken)` in `src/lib/whatsapp-meta.ts` requests `me?fields=owned_whatsapp_business_accounts{...}` (or `me/owned_whatsapp_business_accounts`) and uses the first WABA and its first phone number.
  2. We **never** save placeholder IDs (e.g. `embedded_${Date.now()}`). If we cannot resolve real WABA/phone from the URL or Graph API, we redirect with `error=waba_phone_not_found` instead of creating an account with fake IDs.
  3. **Optional/backup:** Meta can also send an **account_update** webhook with `embedded_signup_completed` containing `waba_id`, `phone_number_id`, `access_token`. We handle that in `/api/whatsapp/embedded-signup/webhook`; the main flow in this app relies on the callback + Graph API, not on the redirect including success data.

Keep this in mind when debugging or changing the flow: **success data (WABA ID, phone number ID) is not received from Meta in the OAuth redirect; we obtain it server-side via the access token and Graph API (and optionally from the webhook).**

---

## 4. Key Backend Routes

| Route                                         | Method   | Purpose                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/whatsapp/embedded-signup/public-config` | GET      | **Public.** Returns `appId`, `redirectUri`, optional `state` (if user logged in). Used by `/signup/whatsapp` to render the widget. AppId from env `META_APP_ID` or from an existing WhatsAppAccount.                                                                                                                                                  |
| `/api/whatsapp/embedded-signup/callback`      | GET      | **OAuth callback.** Receives `code`, `state`, optional `error` from Meta. Exchanges code for access token; resolves WABA ID and phone number ID (URL or Graph API); creates/updates WhatsAppAccount; allocates initial credits; redirects to integrations page with `success=true&account_id=<id>`.                                                   |
| `/api/whatsapp/embedded-signup/init`          | POST     | **Authenticated.** Optional; used by builder to get appId, redirectUri, state (e.g. for custom flows). Not required for the standard widget flow.                                                                                                                                                                                                     |
| `/api/whatsapp/embedded-signup/config`        | GET      | **Authenticated.** Returns app config for the builder UI (appId, businessId, redirectUri, webhook URL, etc.).                                                                                                                                                                                                                                         |
| `/api/whatsapp/embedded-signup/webhook`       | GET/POST | **Meta webhook.** GET for verification (`hub.mode`, `hub.verify_token`, `hub.challenge`). POST for events: when `object === "whatsapp_business_account"` and `change.field === "embedded_signup"`, handles `embedded_signup_completed` (can create/update account and allocate credits from webhook payload; used as alternative/backup to callback). |
| `/api/whatsapp/accounts/claim`                | POST     | **Authenticated.** Body: `accountId`. If the account’s `userId` is the default user (e.g. `DEFAULT_USER_ID`), reassigns the account to the current user so it appears in their list after redirect from signup.                                                                                                                                       |

---

## 5. OAuth Callback – Detailed Behavior

**File:** `src/app/api/whatsapp/embedded-signup/callback/route.ts`

- **Query params:** `code`, `state`, `error`, optional `waba_id`, `phone_number_id` (Meta often does _not_ send the latter two on redirect).
- **Error handling:** If `error` (e.g. `access_denied`), redirect to embedded-signup page with `?error=cancelled` (or the raw error). If no `code`, redirect with `?error=missing_params`.
- **State:** Base64-decoded; format `userId-timestamp`. Used to attach the new WABA to a specific user. If missing, `userId` falls back to `DEFAULT_USER_ID` (env).
- **Token exchange:**  
  `GET https://graph.facebook.com/v22.0/oauth/access_token?client_id=&client_secret=&redirect_uri=&code=`
- **WABA and phone number ID:**
  - If URL already has `waba_id` and `phone_number_id`, use them.
  - Otherwise call **`fetchWabaAndPhoneFromToken(accessToken)`** (in `src/lib/whatsapp-meta.ts`): requests `me?fields=owned_whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number}}` or `me/owned_whatsapp_business_accounts` to get the first WABA and its first phone number ID.
  - If still missing, optionally fetch phone display number from `GET /v22.0/{phoneNumberId}`.
  - If WABA or phone number ID cannot be resolved, redirect with `?error=waba_phone_not_found` (no placeholder IDs are stored).
- **Persistence:** `prisma.whatsAppAccount.upsert` by `userId_phoneNumberId`; stores real `wabaId`, `phoneNumberId`, `accessToken`, `phoneNumber`, `apiVersion`, `isActive`. Never uses fake IDs like `embedded_*`.
- **Credits:** If `EMBEDDED_SIGNUP_INITIAL_CREDITS` is set and > 0, increment `User.walletBalance` for `userId` and create a `WalletTransaction` (type TOPUP).

---

## 6. Public Config and State

**File:** `src/app/api/whatsapp/embedded-signup/public-config/route.ts`

- **AppId:** From an existing active `WhatsAppAccount.appId` or from `process.env.META_APP_ID` (so the signup page works even when no accounts exist yet).
- **Redirect URI:** `{baseUrl}/api/whatsapp/embedded-signup/callback`. Base URL from `NEXT_PUBLIC_APP_URL` or `x-forwarded-proto`/`host`.
- **State:** If the request has a logged-in user (JWT in cookie), state is `Base64(userId + "-" + timestamp)` so the callback can assign the new account to that user.

---

## 7. Customer Signup Page (Frontend)

**File:** `src/app/signup/whatsapp/page.tsx`

- Fetches `/api/whatsapp/embedded-signup/public-config` to get `appId`, `redirectUri`, `state`.
- Loads Facebook SDK (`connect.facebook.net/en_US/sdk.js`), initializes `FB.init` with `appId`, `xfbml: true`, `version: "v22.0"`.
- Renders a div that the SDK turns into the Embedded Signup button:  
  `fb-messenger-embedded-signup` with `data-app-id`, `data-redirect-uri`, and optional `data-state`.
- After SDK ready, calls `FB.XFBML.parse()` so the widget appears.
- Fallback: direct link to Meta OAuth dialog with same `redirect_uri` and scopes (`whatsapp_business_management`, `whatsapp_business_messaging`, `business_management`) for environments where the widget doesn’t show (e.g. localhost).

No server-side redirect is used for the _start_ of signup; the widget (or fallback link) sends the user to Meta, and Meta redirects back to the callback URL.

---

## 8. Claim Flow (Integrations Page)

**File:** `src/app/integrations/whatsapp/page.tsx` (and claim API)

- When the URL has `success=true` and `account_id`, the frontend calls `POST /api/whatsapp/accounts/claim` with that `account_id`.
- **Claim API** (`src/app/api/whatsapp/accounts/claim/route.ts`): If the account’s `userId` equals `DEFAULT_USER_ID`, updates the account’s `userId` to the current authenticated user so the newly created account shows under the logged-in user’s list.

---

## 9. Webhook (Alternative Path for WABA/Phone)

**File:** `src/app/api/whatsapp/embedded-signup/webhook/route.ts`

- Meta can send an **account_update** (or similar) with `field === "embedded_signup"` and event `embedded_signup_completed` containing `waba_id`, `phone_number_id`, `access_token`, and optionally `user_id`.
- The handler can create/update `WhatsAppAccount` and allocate credits. This is an alternative/backup to the OAuth callback; the main flow in this app relies on the callback + Graph API for WABA/phone when the redirect doesn’t include them.

---

## 10. Helper: WABA/Phone from Token

**File:** `src/lib/whatsapp-meta.ts`

- **`fetchWabaAndPhoneFromToken(accessToken)`**: Calls Graph API `me?fields=owned_whatsapp_business_accounts{...}` or `me/owned_whatsapp_business_accounts` to get the first WABA and its first phone number (id + display number). Returns `{ wabaId, phoneNumberId, phoneNumber }` or null.
- **`isPlaceholderMetaId(id)`**: Returns true if `id` looks like `embedded_*` (old placeholders). Used e.g. in Test Connection to repair accounts that were saved with placeholder IDs.

Test Connection (`/api/whatsapp/test` route) uses this to fix accounts that still have placeholder WABA IDs: it calls `fetchWabaAndPhoneFromToken(account.accessToken)` and updates the account’s `wabaId` (and optionally phone) so “Test Connection” works.

---

## 10. Database (Relevant Bits)

- **WhatsAppAccount:** `id`, `userId`, `wabaId`, `phoneNumberId`, `accessToken`, `phoneNumber`, `appId`, `appSecret`, `apiVersion`, `isActive`, etc. Unique on `(userId, phoneNumberId)`.
- **User:** has `walletBalance`; credited on successful embedded signup.
- **WalletTransaction:** records TOPUP for the initial credits.

---

## 11. Environment Variables (Embedded Signup)

- **META_APP_ID** – Meta app ID; used in public-config and token exchange.
- **META_APP_SECRET** – Used in callback for code exchange.
- **NEXT_PUBLIC_APP_URL** – Base URL for redirect URI and links (e.g. `https://yourdomain.com`).
- **DEFAULT_USER_ID** – User ID to attach new signups to when `state` is missing (e.g. `1`).
- **EMBEDDED_SIGNUP_INITIAL_CREDITS** – Credits to add to the user’s wallet after signup (e.g. `100`).
- **JWT_SECRET** – Used to read the auth cookie for public-config state and for claim/init.
- **WHATSAPP_WEBHOOK_VERIFY_TOKEN** – For Meta webhook GET verification.
- **META_APP_SECRET** (or APP_SECRET) – For webhook signature verification.

---

## 12. End-to-End Summary

1. **Customer** goes to `/signup/whatsapp` → gets appId/redirectUri/state from **public-config** → sees Embedded Signup widget (or direct link).
2. User completes Meta’s flow → **Meta redirects** to **callback** with `code` (and optionally state; rarely waba_id/phone_number_id in URL).
3. **Callback** exchanges code for **access token**, then gets **WABA ID** and **phone number ID** from URL or from **Graph API** via `fetchWabaAndPhoneFromToken`.
4. Callback **upserts WhatsAppAccount** (real IDs only), adds **initial credits** to the user, then redirects to **`/integrations/whatsapp?success=true&account_id=<id>`**.
5. **Integrations page** calls **claim** with that `account_id` so the account is assigned to the current user if it was created under the default user.
6. **Webhook** can also receive `embedded_signup_completed` and create/update the account and credits; **Test Connection** can repair old accounts that had placeholder IDs by refetching WABA/phone from the stored token.

This is the full context of how embedded signup is implemented and how it works in this project.
