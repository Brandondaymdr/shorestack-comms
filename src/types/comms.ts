export interface UserProfile {
  id: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
  entity_tag: string | null
  created_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
}

export interface Channel {
  id: string
  workspace_id: string
  name: string
  description: string | null
  is_private: boolean
  created_by: string | null
  created_at: string
}

export interface ChannelWithUnread extends Channel {
  unread_count: number
  workspace_name?: string
  workspace_slug?: string
}

export interface ContextRef {
  type: 'books_transaction' | 'ops_task' | 'stock_item' | 'vault_entry'
  id: string
  label: string
  url: string
}

export interface Message {
  id: string
  channel_id: string | null
  dm_id: string | null
  parent_id: string | null
  user_id: string | null
  content: string
  edited_at: string | null
  is_deleted: boolean
  context_ref: ContextRef | null
  created_at: string
  // Joined fields
  user_profile?: UserProfile
  reply_count?: number
  reactions?: ReactionGroup[]
}

export interface ReactionGroup {
  emoji: string
  count: number
  user_ids: string[]
  current_user_reacted: boolean
}

export interface Reaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface ReadReceipt {
  user_id: string
  channel_id: string
  last_read: string
}

export interface DirectConversation {
  id: string
  created_at: string
  participants?: UserProfile[]
}

export interface Attachment {
  id: string
  message_id: string
  storage_key: string
  filename: string
  mime_type: string | null
  size_bytes: number | null
  created_at: string
}
