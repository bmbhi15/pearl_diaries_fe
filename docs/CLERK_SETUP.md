# Clerk Setup

The app uses real Clerk auth (`@clerk/clerk-expo`): **Google OAuth only**.
Phone OTP was removed — see "Why phone auth was removed" below.

## If Google sign-in hangs after you tap "Allow"

This is almost always one specific thing: **the installed native app
doesn't know about the `pearldiaries://` URL scheme**, so when Google
redirects back, the OS has nothing to hand the browser session back to —
`WebBrowser.openAuthSessionAsync()`'s promise just sits there forever,
which looks exactly like "stuck, waiting for something."

`app.json`'s `"scheme": "pearldiaries"` only takes effect on a **native
rebuild** — reloading JS via Metro is not enough, because the scheme is
compiled into the Android manifest / iOS Info.plist as an intent filter.

**Fix: rebuild the native app after any change to `app.json`'s `scheme`
or plugins:**

```bash
npx expo prebuild --clean
npx expo run:android --device   # or run:ios
```

If you already had an `android/`/`ios/` folder from before the scheme was
added, that's the stale build — `--clean` regenerates it correctly.

## Dashboard configuration

Clerk Dashboard → **User & Authentication → Social connections → Google**
→ enable it. That's it for native OAuth — Clerk's Expo SDK generates the
redirect URL itself (`pearldiaries://sso-callback`, derived from
`app.json`'s scheme) and native app callbacks aren't subject to the same
exact-match allowlist that web redirect URLs are, so no manual URL entry
is required for the mobile app.

## Environment

`.env.local` (gitignored) needs:

```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

The **secret key** (`sk_test_...` / `sk_live_...`) is a server-side
credential and must never be placed in this repo or bundled into the app —
it belongs only in the backend's own environment once that service exists
(see `docs/BACKEND_API.md`).

## Why phone auth was removed

Clerk's phone verification needs an SMS provider (Clerk's built-in Twilio
integration or your own) configured per-country in the Dashboard — without
it, `signIn.create({ identifier: phone })` fails with "country not
supported." Rather than ship a broken control, phone sign-in was removed
from the UI entirely. To bring it back once SMS is configured:

Clerk Dashboard → **User & Authentication → Phone number** → enable, set
verification strategy to "Phone number verification code," and configure
the SMS provider for the countries you need. The client-side logic (try
`signIn.create`, fall back to `signUp.create` on
`form_identifier_not_found`, `phone_code` factor + OTP sheet) existed in
an earlier commit and is a reasonable starting point to restore.

## What's implemented vs. simulated

| Piece | Status |
|---|---|
| Google OAuth (`useSSO`) | Real Clerk call |
| Session persistence (`ClerkProvider` + `expo-secure-store` token cache) | Real — session survives app restarts |
| "Has this user finished onboarding" (name/DOB/college/gender/events) | **Locally cached** (AsyncStorage, keyed by Clerk user id) — swap for `docs/BACKEND_API.md` #1/#2 once the backend exists |

## Verifying it works

Typecheck and web bundle both pass, which confirms the Clerk API calls are
structurally correct against the installed SDK's types. That does **not**
confirm the live OAuth round-trip — a bundle/typecheck can't open a
browser or receive a deep link. The only real test is a native rebuild +
device run per the "hangs" section above.
