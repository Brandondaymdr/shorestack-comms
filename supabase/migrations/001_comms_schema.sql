-- ============================================
-- Shorestack Comms — Schema Migration
-- ============================================

-- User profiles (display names + avatars)
create table comms_user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Workspaces (business entities)
create table comms_workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  entity_tag  text,
  created_at  timestamptz default now(),
  constraint valid_slug check (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$')
);

-- Workspace membership
create table comms_workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references comms_workspaces(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  role         text default 'member' check (role in ('admin', 'member')),
  joined_at    timestamptz default now(),
  unique(workspace_id, user_id)
);

-- Channels
create table comms_channels (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references comms_workspaces(id) on delete cascade,
  name         text not null,
  description  text,
  is_private   boolean default false,
  created_by   uuid references auth.users(id),
  created_at   timestamptz default now(),
  unique(workspace_id, name),
  constraint valid_channel_name check (name ~ '^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$')
);

-- Direct conversations (Phase 2, but create now for FK integrity)
create table comms_direct_conversations (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

create table comms_dm_participants (
  conversation_id uuid references comms_direct_conversations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete cascade,
  primary key (conversation_id, user_id)
);

-- Messages
create table comms_messages (
  id           uuid primary key default gen_random_uuid(),
  channel_id   uuid references comms_channels(id) on delete cascade,
  dm_id        uuid references comms_direct_conversations(id) on delete cascade,
  parent_id    uuid references comms_messages(id),
  user_id      uuid references auth.users(id) on delete set null,
  content      text not null,
  edited_at    timestamptz,
  is_deleted   boolean default false,
  context_ref  jsonb,
  created_at   timestamptz default now(),
  check (
    (channel_id is not null and dm_id is null) or
    (channel_id is null and dm_id is not null)
  )
);

-- Reactions
create table comms_reactions (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid references comms_messages(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz default now(),
  unique(message_id, user_id, emoji)
);

-- Read receipts
create table comms_read_receipts (
  user_id    uuid references auth.users(id) on delete cascade,
  channel_id uuid references comms_channels(id) on delete cascade,
  last_read  timestamptz default now(),
  primary key (user_id, channel_id)
);

-- Attachments (Phase 3, but create now)
create table comms_attachments (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid references comms_messages(id) on delete cascade,
  storage_key text not null,
  filename    text not null,
  mime_type   text,
  size_bytes  bigint,
  created_at  timestamptz default now()
);

-- ============================================
-- Indexes
-- ============================================

-- Channel message feed (most frequent query)
create index idx_messages_channel_created
  on comms_messages (channel_id, created_at desc)
  where parent_id is null and not is_deleted;

-- Thread replies by parent
create index idx_messages_parent
  on comms_messages (parent_id, created_at asc)
  where parent_id is not null;

-- DM message feed
create index idx_messages_dm_created
  on comms_messages (dm_id, created_at desc)
  where dm_id is not null and parent_id is null;

-- Reactions by message
create index idx_reactions_message
  on comms_reactions (message_id);

-- Workspace membership (used by every RLS policy)
create index idx_workspace_members_user
  on comms_workspace_members (user_id, workspace_id);

-- Full-text search on message content
create index idx_messages_search
  on comms_messages using gin (to_tsvector('english', content));

-- Read receipts lookup
create index idx_read_receipts_user
  on comms_read_receipts (user_id);

-- Context reference lookups
create index idx_messages_context_ref
  on comms_messages using gin (context_ref)
  where context_ref is not null;
