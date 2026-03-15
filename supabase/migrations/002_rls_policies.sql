-- ============================================
-- Shorestack Comms — RLS Policies
-- ============================================

-- User profiles
alter table comms_user_profiles enable row level security;

create policy "anyone can view profiles"
  on comms_user_profiles for select
  using (true);

create policy "users can update own profile"
  on comms_user_profiles for update
  using (auth.uid() = id);

create policy "users can insert own profile"
  on comms_user_profiles for insert
  with check (auth.uid() = id);

-- Workspaces
alter table comms_workspaces enable row level security;

create policy "workspace members can view workspaces"
  on comms_workspaces for select
  using (
    exists (
      select 1 from comms_workspace_members
      where workspace_id = comms_workspaces.id
        and user_id = auth.uid()
    )
  );

-- Workspace members
alter table comms_workspace_members enable row level security;

create policy "members can view workspace memberships"
  on comms_workspace_members for select
  using (
    exists (
      select 1 from comms_workspace_members wm
      where wm.workspace_id = comms_workspace_members.workspace_id
        and wm.user_id = auth.uid()
    )
  );

-- Channels
alter table comms_channels enable row level security;

create policy "workspace members can view channels"
  on comms_channels for select
  using (
    exists (
      select 1 from comms_workspace_members
      where workspace_id = comms_channels.workspace_id
        and user_id = auth.uid()
    )
  );

create policy "admins can create channels"
  on comms_channels for insert
  with check (
    exists (
      select 1 from comms_workspace_members
      where workspace_id = comms_channels.workspace_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

-- Messages
alter table comms_messages enable row level security;

create policy "channel members can view messages"
  on comms_messages for select
  using (
    channel_id is null or
    exists (
      select 1
      from comms_channels c
      join comms_workspace_members wm on wm.workspace_id = c.workspace_id
      where c.id = comms_messages.channel_id
        and wm.user_id = auth.uid()
    )
  );

create policy "authenticated users can insert messages"
  on comms_messages for insert
  with check (auth.uid() = user_id);

create policy "users can edit own messages"
  on comms_messages for update
  using (auth.uid() = user_id);

-- Reactions
alter table comms_reactions enable row level security;

create policy "anyone can view reactions"
  on comms_reactions for select
  using (true);

create policy "users can add reactions"
  on comms_reactions for insert
  with check (auth.uid() = user_id);

create policy "users can remove own reactions"
  on comms_reactions for delete
  using (auth.uid() = user_id);

-- Read receipts
alter table comms_read_receipts enable row level security;

create policy "users can view own read receipts"
  on comms_read_receipts for select
  using (auth.uid() = user_id);

create policy "users can upsert own read receipts"
  on comms_read_receipts for insert
  with check (auth.uid() = user_id);

create policy "users can update own read receipts"
  on comms_read_receipts for update
  using (auth.uid() = user_id);

-- Attachments
alter table comms_attachments enable row level security;

create policy "message viewers can see attachments"
  on comms_attachments for select
  using (true);

create policy "authenticated users can add attachments"
  on comms_attachments for insert
  with check (auth.uid() is not null);

-- DM tables
alter table comms_direct_conversations enable row level security;

create policy "participants can view their conversations"
  on comms_direct_conversations for select
  using (
    exists (
      select 1 from comms_dm_participants
      where conversation_id = comms_direct_conversations.id
        and user_id = auth.uid()
    )
  );

alter table comms_dm_participants enable row level security;

create policy "participants can view dm participants"
  on comms_dm_participants for select
  using (
    exists (
      select 1 from comms_dm_participants dp
      where dp.conversation_id = comms_dm_participants.conversation_id
        and dp.user_id = auth.uid()
    )
  );

-- ============================================
-- Enable Realtime on key tables
-- ============================================
alter publication supabase_realtime add table comms_messages;
alter publication supabase_realtime add table comms_reactions;
