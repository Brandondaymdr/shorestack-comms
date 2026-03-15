# CLAUDE.md — Shorestack Comms

## Project Overview

**Shorestack Comms** is the internal messaging module for the Shorestack.io platform. It lives at `shorestack.io/comms` and provides lightweight, multi-entity team communication — channels, direct messages, and threaded replies — purpose-built for Brandon's multi-business environment (Days Management LLC, Crowded Barrel Whiskey Company, Cheersworthy.com).

This is NOT a Slack clone. It is a focused internal comms tool, context-aware of the Shorestack platform (e.g., linking messages to Books transactions, Ops tasks, or Stock items).

---

## Current State (as of 2026-03-14)

### What's Done (Phase 1 — MVP)

- [x] **Database**: All 10 tables created and live in Supabase (`comms_user_profiles`, `comms_workspaces`, `comms_workspace_members`, `comms_channels`, `comms_direct_conversations`, `comms_dm_participants`, `comms_messages`, `comms_reactions`, `comms_read_receipts`, `comms_attachments`)
- [x] **Indexes**: 8 performance indexes including partial indexes for feed queries and GIN for full-text search
- [x] **RLS**: 20 policies across all tables — workspace-scoped visibility, member-only access
- [x] **Realtime**: Enabled on `comms_messages` and `comms_reactions` tables via Supabase publication
- [x] **Seed data**: 3 workspaces (Days Mgmt, Crowded Barrel, Cheersworthy) + 10 channels seeded
- [x] **Auth user**: Brandon (brandon@daysllc.com) created as admin in all 3 workspaces, password: `shorestack2026!`, user ID: `0dd692da-9f23-46c3-a5b7-48a792678749`
- [x] **Login page**: Magic link auth via Supabase OTP at `/login`
- [x] **Middleware**: Auth protection on `/comms/*` routes, redirects to `/login`
- [x] **Comms layout**: Sidebar (260px, deep-ocean) + main content area
- [x] **Channel list**: Workspace-grouped channels with unread badges, active state highlighting
- [x] **Message feed**: Realtime subscription, date separators, author grouping (5-min window), auto-scroll
- [x] **Message input**: Textarea with auto-resize, Enter to send, Shift+Enter for newline
- [x] **Message display**: Linear log layout (not bubbles), avatar + name + monospaced timestamp
- [x] **Unread counts**: Calculated from `comms_read_receipts` vs latest message timestamps
- [x] **Soft delete**: `softDeleteMessage()` sets `is_deleted = true`, content to `[deleted]`
- [x] **Build passes**: `next build` compiles successfully with zero TypeScript errors

### What Needs Testing

- [ ] **End-to-end browser test**: Login → see channels → send messages → realtime updates
- [ ] The app has NOT been tested in a browser yet — build compiles but no live user testing
- [ ] Need to verify: Supabase Realtime actually delivers messages, RLS doesn't block expected queries, read receipts upsert correctly

### What Needs Doing Next

- [ ] **Initialize git repo** and push to GitHub: `https://github.com/Brandondaymdr/shorestack-comms`
- [ ] **Test locally**: `npm run dev` → `/login` → sign in → `/comms` → send messages
- [ ] **Phase 2**: DMs, threads, emoji reactions, user presence
- [ ] **Phase 3**: File attachments, context links, message search, pinned messages
- [ ] **Phase 4**: @mentions, global nav badge, push notifications

---

## Platform Context

| Item | Value |
|---|---|
| Platform | Shorestack.io |
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Supabase (Postgres) |
| Realtime | Supabase Realtime (WebSockets) |
| Auth | Supabase Auth (magic link + password) |
| Storage | Supabase Storage (file attachments — Phase 3) |
| Routing | `/comms` path prefix |
| Security | Row Level Security (RLS) |
| Supabase Project | `snasdxazhljmvoibnpes` (Micro tier, us-east-1) |
| GitHub | `https://github.com/Brandondaymdr/shorestack-comms` |

### Business Entities in Scope

- **Days Management LLC** — parent management company (workspace slug: `days-management`)
- **Crowded Barrel Whiskey Company** — distillery DSP-TX-20093 (slug: `crowded-barrel`)
- **Cheersworthy** — spirits e-commerce (slug: `cheersworthy`)

### Workspace UUIDs (deterministic, used in seed data)

```
Days Management:  a1000000-0000-0000-0000-000000000001
Crowded Barrel:   a1000000-0000-0000-0000-000000000002
Cheersworthy:     a1000000-0000-0000-0000-000000000003
```

---

## Design System

### Brand Colors (Shorestack)

```css
--deep-ocean:   #1B4965;   /* Primary — nav, headers, sidebar bg */
--shore-sand:   #F5F0E8;   /* Background */
--seafoam:      #5FA8A0;   /* Accent — active states, badges */
--driftwood:    #A68B6B;   /* Secondary text, borders */
--sunset-coral: #E07A5F;   /* Alerts, mentions, notifications, unread badges */
--deep-slate:   #2D3436;   /* Body text */
```

Tailwind tokens: `bg-deep-ocean`, `text-shore-sand`, `bg-seafoam`, `text-driftwood`, `bg-sunset-coral`, `text-deep-slate`, `bg-shore-sand`

### Aesthetic Direction

- Swiss/International Typographic Style — clean, grid-anchored, typographically precise
- No decorative excess. Utility-first, but refined.
- Tight spacing, clear information hierarchy
- Monospaced timestamps, clean channel names in lowercase
- Message bubbles are NOT used — use a linear log layout (IRC/Linear aesthetic, not iMessage)

### Typography

- **UI labels / channel names / timestamps**: `DM Mono` (`font-mono`) — lowercase, tracked
- **Body / message text**: `DM Sans` (`font-sans`) — legibility is primary in chat
- Both loaded via `next/font/google` in root layout

---

## File Structure (actual, current)

```
src/
  app/
    layout.tsx                    ← Root layout (DM Sans + DM Mono fonts, metadata)
    globals.css                   ← Tailwind + CSS custom properties + theme tokens
    page.tsx                      ← Default Next.js page (TODO: redirect to /comms)
    login/
      page.tsx                    ← Magic link login (client component)
    comms/
      layout.tsx                  ← Comms shell — server component, fetches workspaces, renders sidebar + {children}
      page.tsx                    ← Redirects to first channel
      channel/
        [channelId]/
          page.tsx                ← Channel view — server component, fetches channel + messages, renders header + MessageFeed + MessageInput
  components/
    comms/
      ChannelList.tsx             ← Client — sidebar channel nav, workspace groups, active state, unread badges
      EntityBadge.tsx             ← Workspace entity tag pill (e.g., "Crowded Barrel")
      MessageFeed.tsx             ← Client — realtime message feed with date separators, author grouping
      MessageInput.tsx            ← Client — composer with auto-resize, Enter to send
      MessageItem.tsx             ← Client — single message row with avatar, name, timestamp
    ui/
      Avatar.tsx                  ← User avatar (image or initials), sizes: sm/md/lg
      Badge.tsx                   ← Unread count pill (sunset-coral)
      Button.tsx                  ← primary/secondary/ghost variants, sm/md sizes
  lib/
    supabase/
      client.ts                   ← Browser Supabase client (createBrowserClient from @supabase/ssr)
      server.ts                   ← Server Supabase client (createServerClient with cookies())
      middleware.ts               ← Auth session refresh + /comms/* protection
    comms/
      channels.ts                 ← getWorkspacesWithChannels(userId), getChannel(channelId) — server-side
      messages.server.ts          ← getChannelMessages(channelId, cursor?, limit?) — server-side only
      messages.ts                 ← sendMessage, softDeleteMessage, updateReadReceipt, getMessageWithProfile — browser-side only
      realtime.ts                 ← subscribeToChannel, subscribeToReactions — browser-side
    utils/
      timestamps.ts               ← formatTimestamp (relative), formatMessageDate (date separators)
  middleware.ts                   ← Root Next.js middleware → calls updateSession()
  types/
    comms.ts                      ← All TypeScript interfaces

supabase/
  migrations/
    001_comms_schema.sql          ← 10 tables + constraints + 8 indexes (EXECUTED)
    002_rls_policies.sql          ← 20 RLS policies + Realtime publication (EXECUTED)
    003_seed_data.sql             ← 3 workspaces + 10 channels (EXECUTED)
```

### Important: Server vs Client Module Split

Messages helpers are split into two files to avoid importing `next/headers` in client components:
- `messages.server.ts` — imports from `@/lib/supabase/server`, used in server components only
- `messages.ts` — imports from `@/lib/supabase/client`, used in client components only

The channel page (`comms/channel/[channelId]/page.tsx`) imports from `messages.server.ts`.
Client components (MessageFeed, MessageInput) import from `messages.ts`.

---

## Authentication

### Auth Flow

1. User navigates to `/login`
2. Enters email → Supabase sends magic link via OTP
3. User clicks link → redirected to `/comms` (first channel)
4. Middleware on `/comms/*` routes checks for valid session; redirects to `/login` if unauthenticated

### Test User

```
Email:    brandon@daysllc.com
Password: shorestack2026!
User ID:  0dd692da-9f23-46c3-a5b7-48a792678749
Role:     admin in all 3 workspaces
```

The login page currently only supports magic link. To test with password, you can either:
- Add a password field to the login page, or
- Sign in via Supabase client directly: `supabase.auth.signInWithPassword({ email, password })`

### Invite Flow

Admins invite new users by:
1. Creating the user in Supabase Auth (via dashboard or admin API)
2. Creating their `comms_user_profiles` row
3. Adding them to `comms_workspace_members` for the appropriate workspaces

---

## Database Schema

### Tables (all prefixed `comms_`)

| Table | Purpose |
|---|---|
| `comms_user_profiles` | Display names + avatars, linked to `auth.users` |
| `comms_workspaces` | Business entities (Days Mgmt, Crowded Barrel, Cheersworthy) |
| `comms_workspace_members` | User ↔ workspace membership with role (admin/member) |
| `comms_channels` | Channels within workspaces, name uniqueness enforced |
| `comms_messages` | Channel + DM messages, threads via `parent_id`, soft delete |
| `comms_direct_conversations` | DM conversation containers (Phase 2) |
| `comms_dm_participants` | DM participant mapping (Phase 2) |
| `comms_reactions` | Emoji reactions on messages (Phase 2) |
| `comms_read_receipts` | Per-user, per-channel last-read timestamps |
| `comms_attachments` | File attachment metadata (Phase 3) |

### Key Constraints

- `comms_messages` has a CHECK: exactly one of `channel_id` or `dm_id` must be non-null
- `comms_channels` has a CHECK: name matches `^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$`
- `comms_workspaces` has a CHECK: slug matches `^[a-z0-9][a-z0-9-]*[a-z0-9]$`
- `comms_reactions` has UNIQUE on `(message_id, user_id, emoji)`

### Indexing Strategy

8 indexes including partial indexes:
- `idx_messages_channel_created` — main feed query (excludes deleted + threaded)
- `idx_messages_parent` — thread replies
- `idx_messages_dm_created` — DM feed
- `idx_reactions_message` — reactions by message
- `idx_workspace_members_user` — RLS policy joins
- `idx_messages_search` — GIN full-text search
- `idx_read_receipts_user` — read receipts
- `idx_messages_context_ref` — context reference lookups

---

## Supabase Realtime

Messages and reactions are published via Supabase Realtime:

```sql
alter publication supabase_realtime add table comms_messages;
alter publication supabase_realtime add table comms_reactions;
```

Client subscribes via `postgres_changes` filtered by `channel_id`. Realtime messages arrive without joins, so `getMessageWithProfile()` enriches them with user profile data client-side.

---

## Feature Phases

### Phase 1 — Core Messaging (MVP) ✅ BUILT

- [x] Schema migration + RLS + seed data
- [x] Workspace + channel setup (3 entities, 10 channels)
- [x] CommsLayout — sidebar + channel list
- [x] MessageFeed with Supabase Realtime subscription
- [x] MessageInput — text + send
- [x] Soft delete (`is_deleted = true`)
- [x] Unread count badges
- [ ] **Needs browser testing**

### Phase 2 — DMs + Threads

- [ ] Direct conversations between users
- [ ] Thread replies (parent_id) with slide-in ThreadPanel
- [ ] Emoji reactions
- [ ] User presence indicators

### Phase 3 — Attachments + Context Links

- [ ] File upload via Supabase Storage
- [ ] ContextLink cards — link messages to Books, Ops, Stock items
- [ ] Message search (Postgres full-text search)
- [ ] Pinned messages per channel

### Phase 4 — Notifications

- [ ] @mention parsing + highlight
- [ ] Unread badge in Shorestack global nav
- [ ] Browser push notifications (optional — Web Push API)

---

## Conventions

- All tables prefixed `comms_` to namespace within the shared Supabase project
- Soft deletes on messages (`is_deleted = true`) — never hard delete
- `context_ref` is always `jsonb | null` — no required shape at DB level
- Channel names always lowercase, hyphenated, no spaces (enforced by CHECK constraint)
- Workspace slugs are stable identifiers — do not rename after creation
- All Realtime subscriptions cleaned up on component unmount
- Server-only code goes in `.server.ts` files; browser-only in plain `.ts`
- All components use default exports
- Supabase joins on `comms_user_profiles` return nested objects that get transformed to `user_profile` in the message helpers

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://snasdxazhljmvoibnpes.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<in .env.local>
SUPABASE_SERVICE_ROLE_KEY=<in .env.local — migration scripts only, never expose client-side>
```

---

## Known Issues / Tech Debt

1. **Next.js 16 middleware deprecation**: Warning says to use "proxy" instead of "middleware". Works fine for now but should migrate eventually.
2. **No git repo initialized**: Need to `git init`, add `.gitignore`, and push to GitHub.
3. **Login only supports magic link**: The test user has a password set but the login page only has OTP flow. Add `signInWithPassword` option or a dev-only password login.
4. **No error boundaries**: Need React error boundaries for the comms components.
5. **Default Next.js homepage**: `src/app/page.tsx` is still the create-next-app boilerplate. Should redirect to `/comms` or show a landing page.

---

## Out of Scope (intentionally excluded)

- Video/audio calls
- Public channels or guest access
- Bots or webhook integrations (may revisit for n8n → Comms notifications in Phase 4)
- Mobile app — web-responsive only
- Email digest notifications (Phase 4 stretch)
