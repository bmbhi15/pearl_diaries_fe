# Clerk Setup

The app is wired to real Clerk auth (`@clerk/clerk-expo`): phone OTP and
Google OAuth. Two things need to be configured on the **Clerk Dashboard**
side — the code alone isn't enough for Google sign-in to complete.

## 1. Enable the sign-in methods

Clerk Dashboard → **User & Authentication**:
- **Phone number**: enable it as an identifier, with "Phone number
  verification code" as the verification strategy.
- **Social connections → Google**: enable it.

## 2. Register the OAuth redirect (Google only — phone OTP needs no setup)

The app uses Expo's URL scheme `pearldiaries://` (set in `app.json` as
`"scheme": "pearldiaries"`) as the OAuth callback target. In development,
`expo-auth-session`'s `makeRedirectUri()` resolves this to:

```
pearldiaries://oauth-callback
```

Add that exact URI to **Clerk Dashboard → SSO Connections → Google →
Authorized redirect URIs** (or the equivalent "Allowed redirect URLs" list
under your Clerk app's OAuth settings). Without this, Google will complete
the login but redirect back to a URL Clerk doesn't recognize, and the app
will hang on "Continue with Google."

If you later run this through Expo Go instead of a development build, the
redirect resolves to an `exp://` / `auth.expo.io` proxy URL instead — add
that variant too if you need Expo Go support (development builds, which is
what this project targets, don't need it).

## 3. Environment

`.env.local` (gitignored) needs:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

The **secret key** (`sk_test_...` / `sk_live_...`) is a server-side
credential and must never be placed in this repo or bundled into the app —
it belongs only in the backend's own environment once that service exists
(see `docs/BACKEND_API.md`).

## What's implemented vs. simulated

| Piece | Status |
|---|---|
| Google OAuth (`useOAuth`) | Real Clerk call |
| Phone sign-in/sign-up + OTP verify/resend (`useSignIn`/`useSignUp`) | Real Clerk call |
| Session persistence (`ClerkProvider` + `expo-secure-store` token cache) | Real — session survives app restarts |
| "Has this user finished onboarding" (name/DOB/college/gender/events) | **Locally cached** (AsyncStorage, keyed by Clerk user id) — swap for `docs/BACKEND_API.md` #1/#2 once the backend exists |

## Verifying it works

Typecheck and web bundle both pass (see repo history), which confirms the
Clerk API calls are structurally correct against the installed SDK's
types. It has **not** been exercised against live Clerk servers on a
device — do that by running:

```
npx expo run:android --device   # or run:ios
```

and completing both the phone-OTP and Google flows once the Dashboard
settings above are in place.
