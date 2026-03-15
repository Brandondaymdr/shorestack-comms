import { createClient } from '@/lib/supabase/server'
import type { Channel, ChannelWithUnread, Workspace } from '@/types/comms'

export interface WorkspaceWithChannels {
  workspace: Workspace
  channels: ChannelWithUnread[]
}

/**
 * Fetches all workspaces the user belongs to, with their channels and unread counts.
 */
export async function getWorkspacesWithChannels(
  userId: string
): Promise<WorkspaceWithChannels[]> {
  const supabase = await createClient()

  // Step 1: Get workspace IDs for this user
  const { data: memberships, error: memError } = await supabase
    .from('comms_workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)

  if (memError) throw memError
  if (!memberships || memberships.length === 0) return []

  const workspaceIds = memberships.map((m) => m.workspace_id)

  // Step 2: Fetch those workspaces
  const { data: workspaces, error: wsError } = await supabase
    .from('comms_workspaces')
    .select('*')
    .in('id', workspaceIds)

  if (wsError) throw wsError
  if (!workspaces) return []

  // Step 3: For each workspace, fetch channels with unread counts
  const result = await Promise.all(
    workspaces.map(async (workspace) => {
      const { data: channels, error: chError } = await supabase
        .from('comms_channels')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('name', { ascending: true })

      if (chError) throw chError

      // Get read receipts for all channels in this workspace
      const channelIds = (channels || []).map((c) => c.id)
      const { data: receipts } = await supabase
        .from('comms_read_receipts')
        .select('channel_id, last_read')
        .eq('user_id', userId)
        .in('channel_id', channelIds)

      const receiptMap = new Map(
        (receipts || []).map((r) => [r.channel_id, r.last_read])
      )

      // Calculate unread counts
      const channelsWithUnread: ChannelWithUnread[] = await Promise.all(
        (channels || []).map(async (channel) => {
          const lastRead = receiptMap.get(channel.id)

          let query = supabase
            .from('comms_messages')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id)
            .eq('is_deleted', false)
            .is('parent_id', null)

          if (lastRead) {
            query = query.gt('created_at', lastRead)
          }

          const { count } = await query

          return {
            ...channel,
            unread_count: count || 0,
          } as ChannelWithUnread
        })
      )

      return {
        workspace: workspace as Workspace,
        channels: channelsWithUnread,
      }
    })
  )

  return result
}

/**
 * Fetches a single channel by ID.
 */
export async function getChannel(channelId: string): Promise<Channel | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comms_channels')
    .select('*')
    .eq('id', channelId)
    .single()

  if (error && error.code !== 'PGRST116') throw error

  return data || null
}
