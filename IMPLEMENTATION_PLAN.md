# Shorestack Comms — Implementation Plan

## Current State

- **GitHub**: `Brandondaymdr/shorestack-comms` — empty repo, no commits
- **Supabase**: `comms` project (Micro, us-east-1) — healthy, no tables, no migrations
- **App type**: Standalone Next.js app (will integrate into Shorestack.io later)
- **Users**: 5–10 team members across 3 business entities
- **Auth**: Need login page + invite flow (no self-serve signup)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Next.js App (App Router)           │
│                                                     │
│  /login          → Auth page (email magic link)     │
│  /comms          → Redirect to first channel        │
│  /comms/channel/[id]  → Channel message view        │
│  /comms/dm/[id]       → DM view (Phase 2)          │
│                                                     │
│  ┌─────────────┬───────────────────────────────┐    │
│  │  Sidebar    │   Main Pane                   │    │
│  │             │                               │    │
│  │ Workspaces  │   Channel Header              │    │
│  │ ├ #general  │   ──────────────              │    │
│  │ ├ #ops      │   MessageFeed (realtime)      │    │
│  │ └ #sales    │   ├ MessageItem               │    │
│  │             │   ├ MessageItem               │    │
│  │ DMs         │   └ MessageItem               │    │
│  │ ├ Brandon   │                               │    │
│  │ └ Team      │   ──────────────              │    │
│  │             │   MessageInput (composer)      │    │
│  └─────────────┴───────────────────────────────┘    │
│                                                     │
│  Supabase Client (auth, realtime, storage)          │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│              Supabase (Postgres + Realtime)          │
│                                                     │
│  comms_workspaces          comms_read_receipts      │
│  comms_workspace_members   comms_reactions           │
│  comms_channels            comms_attachments         │
│  comms_messages            comms_direct_conversations│
│  comms_dm_participants                               │
│                                                     │
│  RLS policies on every table                        │
│  Realtime enabled on comms_messages + reactions     │
│  Storage bucket: comms-attachments                  │
└─────────────────────────────────────────────────────┘
```

---

## Phase 1 — Core Messaging (MVP)

**Goal**: Working channel-based messaging with realtime delivery, basic auth, and the Shorestack design system applied.

### Step 1.1 — Scaffold Next.js App

```bash
npx create-next-app@latest shorestack-comms \
  --typescript --tailwind --app --src-dir --eslint
```

Additional setup:
- Install `@supabase/supabase-js`, `@supabase/ssr`
- Add Shorestack brand colors to `tailwind.config.ts`
- Import DM Mono + DM Sans from Google Fonts in `layout.tsx`
- Create `lib/supabase/client.ts` (browser client) and `lib/supabase/server.ts` (server component client)
- Set up `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Initialize git, commit, push to `Brandondaymdr/shorestack-comms`

### Step 1.2 — Database Schema Migration + RLS

Run via Supabase SQL Editor (or Supabase CLI migration):

**Tables** (in dependency order):
1. `comms_workspaces` — with slug check constraint
2. `comms_workspace_members` — with unique(workspace_id, user_id)
3. `comms_channels` — with unique(workspace_id, name), name format check
4. `comms_messages` — with channel_id/dm_id mutual exclusion check constraint
5. `comms_direct_conversations` + `comms_dm_participants` (created now, used in Phase 2)
6. `comms_reactions` — with unique(message_id, user_id, emoji)
7. `comms_read_receipts` — composite primary key (user_id, channel_id)
8. `comms_attachments` (created now, used in Phase 3)

**RLS Policies**:
- Enable RLS on all tables
- Workspaces: members can view
- Channels: workspace members can view; admins can insert/update/delete
- Messages: workspace members can view; authenticated users insert own; users update own
- Read receipts: users can view/upsert own
- Reactions: workspace members can view; users insert/delete own

**Indexes** (from the skill's data-model-patterns reference):
- `idx_messages_channel_created` — partial index for top-level channel messages
- `idx_messages_parent` — for thread replies
- `idx_workspace_members_user` — used by every RLS policy
- `idx_messages_search` — GIN index on tsvector for full-text search
- `idx_read_receipts_user`

**Seed Data**:
- 3 workspaces: Days Management LLC, Crowded Barrel Whiskey Co., Cheersworthy
- `#general` channel in each workspace (via trigger or manual insert)
- Additional channels: `#distillery-ops`, `#ecommerce`, `#accounting`
- Add Brandon as admin member of all 3 workspaces

**Realtime**: Enable Realtime on `comms_messages` and `comms_reactions` tables.

### Step 1.3 — Auth (Login + Invite)

- **Login page** (`/login`): Email magic link via Supabase Auth (no passwords needed for a small team)
- **Auth middleware**: Protect `/comms/*` routes — redirect unauthenticated users to `/login`
- **Invite flow**: Admin sends a magic link invite. New users click the link, confirm email, and land in `/comms`
- **User profiles**: Create a `comms_user_profiles` table (or use Supabase Auth metadata) to store display name + avatar URL

### Step 1.4 — CommsLayout + ChannelList Sidebar

**CommsLayout** (`app/comms/layout.tsx`):
- Fixed sidebar (280px) + flexible main pane
- Sidebar: workspace sections → channel items with unread badges
- Design: deep-ocean (#1B4965) sidebar background, shore-sand (#F5F0E8) main pane
- Channel names in DM Mono, lowercase

**ChannelList** (`components/comms/ChannelList.tsx`):
- Query channels grouped by workspace via Supabase client
- Unread count per channel (join against read_receipts)
- Active channel highlighted with seafoam (#5FA8A0) accent
- Navigation via Next.js `<Link>` to `/comms/channel/[channelId]`

**`app/comms/page.tsx`**: Redirect to the first channel in the user's first workspace.

### Step 1.5 — MessageFeed + MessageInput with Realtime

**MessageFeed** (`components/comms/MessageFeed.tsx`):
- Fetch initial messages via Supabase query (50 most recent, cursor-based)
- Subscribe to `postgres_changes` INSERT/UPDATE events on `comms_messages` filtered by `channel_id`
- Auto-scroll to new messages
- Message grouping: consecutive messages from same user within 5 min show collapsed (no avatar repeat)
- Subscription cleanup on unmount

**MessageItem** (`components/comms/MessageItem.tsx`):
- Linear log layout (NOT chat bubbles)
- Avatar, username (DM Sans), timestamp (DM Mono, muted, right-aligned)
- Soft-deleted messages show "[This message was deleted]"
- Edited messages show "(edited)" indicator

**MessageInput** (`components/comms/MessageInput.tsx`):
- Text input with Shift+Enter for newline, Enter to send
- Insert message via Supabase client (`comms_messages` insert with `user_id = auth.uid()`)
- Disabled state while sending

### Step 1.6 — Unread Counts + Soft Delete

**Unread counts**:
- Upsert `comms_read_receipts` when user views a channel (debounced, on mount + scroll-to-bottom)
- Channel sidebar queries unread count per channel
- Bold channel name + seafoam badge for unread > 0

**Soft delete**:
- Message hover action: "Delete" (only for own messages)
- Sets `is_deleted = true` — message stays in DB, renders as deleted in feed
- Realtime UPDATE event reflects the soft delete for all viewers

**Deliverable**: By end of Phase 1, you have a working internal chat app with login, channels across 3 workspaces, realtime messaging, unread indicators, and the Shorestack visual identity.

---

## Phase 2 — DMs + Threads + Reactions + Presence

### Step 2.1 — Direct Messages

- **New DM flow**: Click "New Message" in sidebar → select user(s) → creates `comms_direct_conversations` + `comms_dm_participants`
- **DM sidebar section**: Below channels, sorted by most recent activity
- **DM page** (`app/comms/dm/[conversationId]/page.tsx`): Same MessageFeed/MessageInput components, but filtered by `dm_id` instead of `channel_id`
- **Find-or-create**: Before creating a new DM, check for existing conversation between same participants

### Step 2.2 — Threaded Replies

- **ThreadPanel** (`components/comms/ThreadPanel.tsx`): Slide-in panel from right side
- Click a message → opens thread panel showing parent + replies (queried by `parent_id`)
- Parent message in feed shows reply count + participant avatars
- Thread replies subscribe to Realtime filtered by `parent_id`
- "Also send to channel" checkbox (optional)

### Step 2.3 — Emoji Reactions

- Message hover → emoji shortlist bar (thumbsup, heart, fire, eyes, check, laugh)
- Toggle behavior: click to add, click again to remove (unique constraint handles dedup)
- Display grouped reactions below message: `[thumbsup 3] [heart 1]`
- Current user's reactions highlighted with seafoam border
- Realtime subscription on `comms_reactions` table

### Step 2.4 — User Presence

- Supabase Realtime Presence channel per workspace
- Track online/away/offline status
- Green dot = online, yellow = away (10 min inactivity), no dot = offline
- Away detection: mouse/keyboard idle timer + tab visibility API
- Show presence dots next to usernames in sidebar DM list and message items

---

## Phase 3 — Attachments + Context Links + Search

### Step 3.1 — File Attachments

- Create `comms-attachments` Supabase Storage bucket
- Attachment button in MessageInput → file picker
- Upload to storage, then insert `comms_attachments` row linked to message
- Render: images inline (with lightbox), other files as download cards
- 25MB per file limit (client + server enforcement)
- Storage path: `comms/{workspace_slug}/{channel_id}/{message_id}/{filename}`

### Step 3.2 — Context Links

- **ContextLink** component: Renders a small card below message body
- Linked entity types: `books_transaction`, `ops_task`, `stock_item`, `vault_entry`
- Attach via a "Link to..." action in the composer
- Stored as `context_ref` JSONB on the message: `{ type, id, label, url }`
- GIN index for querying messages by referenced entity

### Step 3.3 — Message Search

- Postgres full-text search on `comms_messages.content`
- Search UI: expandable search bar in channel header
- Results scoped to channels the user has access to (RLS handles this)
- Ranked by `ts_rank`, paginated, highlighting matched terms

### Step 3.4 — Pinned Messages

- `is_pinned` boolean on `comms_messages` (or separate `comms_pins` table)
- Pin/unpin action on message hover menu
- Pinned messages panel (similar to thread panel)

---

## Phase 4 — Notifications + @Mentions

### Step 4.1 — @Mention System

- Parse `@username` in composer → replace with `<@user_id>` before saving
- `comms_mentions` table: `(message_id, user_id)` for notification queries
- Render mentions as highlighted text (sunset-coral #E07A5F)
- @channel and @here keywords for broadcast mentions

### Step 4.2 — In-App Notification Badge

- Unread mention count in Shorestack global nav (when integrated)
- "Mentions" aggregation view: all messages where user was @mentioned
- Bold + sunset-coral dot on channels with unread mentions (distinct from regular unreads)

### Step 4.3 — Browser Push Notifications (Stretch)

- Service worker registration
- Web Push API for background notifications
- User preference: enable/disable per channel
- n8n integration possibility: external events → Comms notification

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS + Shorestack design tokens |
| Fonts | DM Mono (UI), DM Sans (body), via Google Fonts |
| Database | Supabase Postgres with RLS |
| Realtime | Supabase Realtime (postgres_changes + presence + broadcast) |
| Auth | Supabase Auth (magic link) |
| Storage | Supabase Storage (attachments) |
| Hosting | TBD (Vercel recommended for Next.js) |
| Repo | github.com/Brandondaymdr/shorestack-comms |

---

## File Structure (Final)

```
src/
  app/
    layout.tsx                    ← Root layout (fonts, providers)
    login/
      page.tsx                    ← Magic link login
    comms/
      layout.tsx                  ← CommsLayout (sidebar + main)
      page.tsx                    ← Redirect to first channel
      channel/
        [channelId]/
          page.tsx                ← Channel view
      dm/
        [conversationId]/
          page.tsx                ← DM view (Phase 2)
  components/
    comms/
      CommsLayout.tsx
      ChannelList.tsx
      MessageFeed.tsx
      MessageInput.tsx
      MessageItem.tsx
      ThreadPanel.tsx             ← Phase 2
      UserPresence.tsx            ← Phase 2
      EntityBadge.tsx
      ContextLink.tsx             ← Phase 3
      EmojiPicker.tsx             ← Phase 2
      SearchBar.tsx               ← Phase 3
    ui/
      Avatar.tsx
      Badge.tsx
      Button.tsx
  lib/
    supabase/
      client.ts                   ← Browser Supabase client
      server.ts                   ← Server component client
      middleware.ts               ← Auth middleware
    comms/
      realtime.ts                 ← Subscription helpers
      messages.ts                 ← Message CRUD
      channels.ts                 ← Channel CRUD
      presence.ts                 ← Presence tracking (Phase 2)
      search.ts                   ← Full-text search (Phase 3)
    utils/
      timestamps.ts               ← Relative time formatting
      mentions.ts                 ← @mention parsing (Phase 4)
  types/
    comms.ts                      ← TypeScript types for all entities
supabase/
  migrations/
    001_comms_schema.sql          ← Tables + constraints + indexes
    002_rls_policies.sql          ← All RLS policies
    003_seed_data.sql             ← Workspaces, channels, test users
```

---

## Build Order (Phase 1 — This Session)

1. **Scaffold** — create-next-app, install deps, Tailwind config, Supabase client setup
2. **Database** — Run migration SQL in Supabase, seed workspaces + channels
3. **Auth** — Login page, middleware, user profiles
4. **Layout** — CommsLayout shell, ChannelList sidebar with workspace grouping
5. **Messaging** — MessageFeed + MessageItem + MessageInput with Realtime subscriptions
6. **Polish** — Unread counts, soft delete, message grouping, design system
7. **Test** — Open in browser, send messages across tabs, verify realtime
