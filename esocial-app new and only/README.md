# E Social — local test build

This is everything built so far, merged into one Next.js project, so you can run it
on your own computer and click through the real flows (not the fake demo data).

## 1. Install
    npm install

## 2. Configure
Copy `.env.example` to `.env.local` and fill in every value:
- Firebase Admin credentials (Project settings -> Service accounts -> Generate new private key)
- SESSION_SECRET, ACCOUNT_KEY, RESET_SECRET — each: `openssl rand -hex 32`
- ADMIN_PASSWORD — your 5-tap admin password (escape `$` as `\$` in .env.local)
- GOOGLE_SCRIPT_URL — your OTP email sender
- SMM_API_URL / SMM_API_KEY — your boost provider
- FIVESIM_API_KEY / RUB_TO_NGN — your numbers provider

Firestore: set rules to deny all client access (server uses the Admin SDK and bypasses rules).
Add yourself as a `users/<your-email-lowercase>` document with `name`, `email`, `balance: 0`.

## 3. Run
    npm run dev

Open http://localhost:3000/login

## 4. What's NOT wired here yet
- Signup still needs to be moved onto this same Firestore/session pattern (it currently
  uses the client-side OTP demo from esocial.html, not these API routes). Until then,
  create your own test user directly in Firestore as above, then use /forgot-password
  to set a real password, then /login.
- Wallet funding is not built (Flutterwave) — use the admin "Credit a wallet" tool to
  add test naira to an account.
- Admin: tap the "E SOCIAL" logo 5 times on /login or /dashboard, enter ADMIN_PASSWORD.

## Folder map
- app/api/**        server routes (auth, accounts, boost, numbers, admin)
- app/**/page.jsx    the actual pages
- lib/**             Firebase, sessions, crypto, pricing, provider clients
- components/**      AdminTap (5-tap login), AdminNav
