import { createClient } from '@/lib/supabase/server'
import type { Message } from '@/types/comms'

/**
 * Fetches messages for a channel with cursor-based pagination.
 * Server-only function.
 */
export async function getChannelMessages(
  channelId: string,
  cursor?: string,
  limit: number = 50
): Promise<Message[]> {
  const supabase = await createClient()

  let query = supabase
    .from('comms_messages')
    .select(`
      *,
      comms_user_profiles(display_name, avatar_url)
    `)
    .eq('channel_id', channelId)
    .eq('is_deleted', false)
    .is('parent_id', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query

  if (error) throw error

  const messages = (data || []).map((msg: any) => {
    const { comms_user_profiles, ...rest } = msg
    return {
      ...rest,
      user_profile: comms_user_profiles
        ? {
            display_name: comms_user_profiles.display_name,
            avatar_url: comms_user_profiles.avatar_url,
          }
        : undefined,
    } as Message
  })

  return messages.reverse()
}
