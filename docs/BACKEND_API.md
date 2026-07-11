# Pearl Diaries — Backend API Requirements

Capabilities the backend must provide, described **by purpose** (not endpoint
shapes). Authentication itself (Google OAuth, phone OTP send/verify) is
handled by **Clerk** on the client — the backend's job is to **verify the
Clerk-issued JWT** on every call below and resolve it to a user.

Legend: 🔴 = minimum to run the current build · 🟡 = next tier before public
release · ⚪ = optional / future.

## 1. Identity & Profile

| # | Capability | Purpose |
|---|------------|---------|
| 1 | 🔴 **Register profile** | After first Clerk sign-in, create the user record (name, DOB, college, gender, top-5 excited events) tied to the Clerk identity. The spec's `registerProfile`. |
| 2 | 🔴 **Fetch own profile** | Restore the signed-in user's profile on app launch; the source of truth the local AsyncStorage cache syncs against. Also signals "profile incomplete → route to setup". |
| 3 | ⚪ **Update profile** | Edit details or re-pick excited events later. |
| 4 | ⚪ **Fetch another user's public profile** | Name, college, avatar, counts — when tapping an author on a reel/post. |

## 2. Feeds

| # | Capability | Purpose |
|---|------------|---------|
| 5 | 🔴 **Reels feed (paginated)** | Ordered video posts for the vertical scroller. Each item must arrive *player-ready*: CDN video URL, **server-generated thumbnail URL** (the instant-display layer the player's crossfade depends on), duration, aspect ratio, author summary, like/comment/share counts, and *this viewer's* like state. Cursor pagination sized for the sliding-window preloader (client prefetches ~5 ahead). |
| 6 | 🔴 **Explore feed (paginated, filterable)** | Mixed carousels + videos for the grid, filterable by event tag (powers the filter chips). |
| 7 | ⚪ **Fetch single post** | Deep links, notifications, or opening a grid item into detail. |
| 8 | 🟡 **A user's posts (paginated)** | The profile grid and the "posts" count. |

## 3. Post Creation

| # | Capability | Purpose |
|---|------------|---------|
| 9 | 🔴 **Request media upload** | Hand the client a direct-to-storage (presigned) upload slot for video/images so large files never proxy through the API server. |
| 10 | 🔴 **Finalize/create post** | After upload: type (reel/carousel), caption, ordered media references, **event tags (≥1, enforced)**. Kicks off the server pipeline: transcode to fast-start/ABR renditions + extract the poster thumbnail. |
| 11 | 🟡 **Post processing status** | Lets the client show "processing…" and flip to live once transcode + thumbnail are done. |
| 12 | 🟡 **Delete own post** | Users must be able to remove their own content. |

## 4. Engagement

| # | Capability | Purpose |
|---|------------|---------|
| 13 | 🔴 **Like / unlike a post** | Idempotent toggle; returns the fresh count (client is optimistic, this reconciles). |
| 14 | 🟡 **List comments (paginated) + create comment** | Comment count on the rail + the comment sheet. |
| 15 | ⚪ **Record a share** | Increments the share count shown on the rail. |
| 16 | ⚪ **Record a view** | Watch signal for ranking the reels feed (standard for short-video apps). |

## 5. Festival Data

| # | Capability | Purpose |
|---|------------|---------|
| 17 | 🔴 **List events** | Canonical Pearl events catalogue (name, date, venue, artwork), replacing the hardcoded client list. Feeds the top-5 picker, the create-screen tag chips, and the explore filters. |

## 6. Social Graph *(only if the Followers/Following stats stay on Profile)*

| # | Capability | Purpose |
|---|------------|---------|
| 18 | ⚪ **Follow / unfollow + counts** | Powers the two stat tiles on Profile; otherwise drop them. |

## 7. Trust & Safety *(required for app-store review of any UGC app)*

| # | Capability | Purpose |
|---|------------|---------|
| 19 | 🟡 **Report post/user + block user** | Baseline moderation expected of user-generated-content apps. |

---

### Minimum viable set for the current build

**1, 2, 5, 6, 9, 10, 13, 17** — profile registration/fetch, both feeds,
the two-step upload, like toggle, and the events catalogue.

### Client integration points

- `src/utils/api.ts` — axios client with Clerk-token interceptor; endpoint
  stubs live here.
- `src/services/uploadService.ts` — the two-phase upload flow (request slot
  → direct upload → finalize). Currently simulated; swap the internals when
  capabilities **9–11** land.
