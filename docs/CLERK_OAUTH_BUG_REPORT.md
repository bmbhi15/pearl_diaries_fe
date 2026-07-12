# Bug Report: Clerk native Google SSO — final app redirect arrives with no query params

## Summary

`useSSO().startSSOFlow({ strategy: 'oauth_google' })` completes the full
Google consent flow successfully (user picks account, grants consent,
browser closes cleanly — `authSessionResult.type === 'success'`), but no
Clerk session is ever created and no user appears in the Clerk Dashboard.

Root cause, confirmed by two independent measurements agreeing: **the
redirect Clerk sends back to the app is missing the
`rotating_token_nonce` query parameter that `useSSO`'s internal
`signIn.reload({ rotatingTokenNonce })` call needs to complete the sign-in.**
This is not an app-side bug — the raw OS-level Android Intent itself
contains no query string, so there is nothing for the app to lose.

## Environment

- `@clerk/clerk-expo`: `2.19.31`
- `expo`: `~54.0.0`
- `react-native`: `0.81.5` (New Architecture)
- Platform: Android (physical device), custom Expo dev-client build
  (`expo prebuild` + `expo run:android`, not Expo Go)
- Google OAuth: **custom credentials** (Web application type, in the
  `pearl-diaries` Google Cloud project) — configured in Clerk Dashboard
  under SSO Connections → Google → custom credentials, replacing Clerk's
  default shared credentials
- Clerk Frontend API domain: `easy-goat-24.clerk.accounts.dev`
- `app.json` URL scheme: `pearldiaries`

## App-side configuration (confirmed correct)

**`app.json`**
```json
{ "expo": { "scheme": "pearldiaries", ... } }
```

**Compiled `AndroidManifest.xml`** (verified via `adb shell dumpsys package`
against the installed APK, not just the source tree):
```xml
<activity android:name=".MainActivity" android:launchMode="singleTask" ...>
  <intent-filter>
    <action android:name="android.intent.action.VIEW"/>
    <category android:name="android.intent.category.DEFAULT"/>
    <category android:name="android.intent.category.BROWSABLE"/>
    <data android:scheme="pearldiaries"/>
  </intent-filter>
</activity>
```
Confirmed live in Android's own Activity Resolver Table
(`adb shell dumpsys package com.pearldiaries.app`):
```
Schemes:
  pearldiaries:
    com.pearldiaries.app/.MainActivity filter ...
      Action: "android.intent.action.VIEW"
      Category: "android.intent.category.DEFAULT"
      Category: "android.intent.category.BROWSABLE"
      Scheme: "pearldiaries"
```

**`LoginScreen.tsx`** (relevant excerpt):
```tsx
const { startSSOFlow } = useSSO();

const handleGoogle = async () => {
  setGoogleLoading(true);
  try {
    // No explicit redirectUrl — letting useSSO derive its own default
    // (<scheme>://sso-callback) so there's no mismatch between what's
    // requested and what Clerk opens.
    const { createdSessionId, setActive, authSessionResult } = await startSSOFlow({
      strategy: 'oauth_google',
    });
    if (createdSessionId && setActive) {
      await setActive({ session: createdSessionId });
      return;
    }
    console.log('[Google SSO] no session created — authSessionResult:', authSessionResult);
    // ... surfaces a visible error unless authSessionResult.type is cancel/dismiss
  } catch (err) {
    console.log('[Google SSO] threw:', err);
  }
};
```

**`App.tsx`** — independent raw-URL listener, bypassing Clerk's SDK
entirely, added specifically to rule out an Expo-side parsing bug:
```tsx
useEffect(() => {
  const sub = Linking.addEventListener('url', (e) => {
    console.log('[RAW REDIRECT URL]', JSON.stringify(e.url));
  });
  return () => sub.remove();
}, []);
```

## Direct API-level test

Called the exact endpoint the app calls, directly, to inspect what Clerk
generates server-side for this sign-in attempt:

```bash
curl -s -X POST "https://easy-goat-24.clerk.accounts.dev/v1/client/sign_ins" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "strategy=oauth_google&redirect_url=pearldiaries://sso-callback"
```

Relevant part of the response:
```json
{
  "first_factor_verification": {
    "object": "verification_oauth",
    "status": "unverified",
    "strategy": "oauth_google",
    "external_verification_redirect_url": "https://accounts.google.com/o/oauth2/auth?access_type=offline&client_id=777341748289-vk1ni93698678gk6mp1en0k62ibmk11p.apps.googleusercontent.com&prompt=consent&redirect_uri=https%3A%2F%2Feasy-goat-24.clerk.accounts.dev%2Fv1%2Foauth_callback&response_type=code&scope=...&state=c4obrgqxgfnwz3s6o06y0n7s973pk11ok4tbapga"
  }
}
```

This confirms:
- The custom Google OAuth client **is** being used (`client_id` matches
  the `pearl-diaries` Google Cloud project, not Clerk's shared client)
- Google's redirect target is Clerk's own server
  (`https://easy-goat-24.clerk.accounts.dev/v1/oauth_callback`) — this is
  expected; Clerk mediates the exchange server-side
- Everything up through this point in the chain is configured correctly

The failure is isolated to the **next hop**: Clerk's server, after
completing the Google exchange at `/v1/oauth_callback`, redirecting the
browser to the app's custom scheme (`pearldiaries://sso-callback`).

## The actual failure — two independent captures agree

**Capture 1** — `expo-web-browser`'s own `openAuthSessionAsync` result,
read via Clerk's `useSSO`:
```
LOG  [Google SSO] no session created — authSessionResult: {"type": "success", "url": "pearldiaries://sso-callback"}
```

**Capture 2** — raw Android Intent data, read directly via React Native's
`Linking` module, entirely independent of Clerk's SDK or Expo's
WebBrowser module:
```
LOG  [RAW REDIRECT URL] "pearldiaries://sso-callback"
```

Both show the identical bare URL with **no query string at all** — no
`rotating_token_nonce`, no `state`, nothing. Since the raw OS-level
Intent (Capture 2) already contains no query parameters, the data was
never sent by Clerk's server in the first place — this cannot be an
Expo/React Native/app-side parsing or stripping bug, because there was
nothing for any client-side code to strip.

## Why this blocks sign-in

`useSSO`'s internal implementation (from the installed
`@clerk/clerk-expo@2.19.31` package) requires the nonce to complete the
session:
```js
const params = new URL(authSessionResult.url).searchParams;
const rotatingTokenNonce = params.get('rotating_token_nonce') ?? '';
await signIn.reload({ rotatingTokenNonce });
// with an empty nonce, this never advances firstFactorVerification to
// a completed state, so createdSessionId stays null
```

## What's confirmed NOT the cause

- ❌ Native URL scheme not registered — confirmed registered at both the
  manifest and live OS resolver-table level
- ❌ Stale native build — rebuilt and reinstalled multiple times,
  verified via fresh `dumpsys package` timestamps
- ❌ Shared vs. custom Google OAuth credentials — same symptom under both
- ❌ `useOAuth` vs `useSSO` — migrated from the deprecated `useOAuth` to
  `useSSO`, same symptom
- ❌ Explicit vs. default `redirectUrl` — same symptom either way
- ❌ Client-side URL parsing/stripping — ruled out by the two independent
  captures agreeing
- ❌ `pearldiaries://sso-callback` missing from Dashboard → SSO
  Connections → Native Applications → "Allowlist for mobile SSO
  redirect" — added it, retried, identical failure (same bare URL, same
  `type: 'success'`, same no-session result)
- ❌ Android app not registered under Dashboard → SSO Connections →
  Native Applications (package name `com.pearldiaries.app` + debug
  keystore SHA-256 fingerprint) — registered it, retried, identical
  failure

Every fix surfaced in the Clerk Dashboard UI has now been tried, each
verified with a fresh retry and fresh log capture. The symptom has not
changed once across any of these attempts.

## What's still unknown (needs Clerk-side investigation)

Why Clerk's server-side redirect to a custom native URL scheme isn't
appending the `rotating_token_nonce` (or any query params) when using
**custom** Google OAuth credentials, specifically on this instance
(`easy-goat-24.clerk.accounts.dev`). Next steps:
- Check Clerk Dashboard → Logs for this sign-in attempt's server-side
  detail
- Ask Clerk support whether this is a known issue with custom
  credentials + native (`pearldiaries://`) redirect URLs
