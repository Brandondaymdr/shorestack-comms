import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/comms'

/**
 * Fetches a single message with its user profile (used for realtime enrichment).
 * Browser-side function.
 */
export async function getMessageWithProfile(messageId: string): Promise<Message | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('comms_messages')
    .select(`
      *,
      comms_user_profiles(display_name, avatar_url)
    `)
    .eq('id', messageId)
    .single()

  if (error) return null

  const { comms_user_profiles, ...rest } = data as any
  return {
    ...rest,
    user_profile: comms_user_profiles
      ? {
          display_name: comms_user_profiles.display_name,
          avatar_url: comms_user_profiles.avatar_url,
        }
      : undefined,
  } as Message
}

/**
 * Inserts a new message into a channel using the browser client.
 */
export async function sendMessage(
  channelId: string,
  content: string
): Promise<Message> {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('comms_messages')
    .insert({
      channel_id: channelId,
      user_id: user.id,
      content,
    })
    .select(`
      *,
      comms_user_profiles(display_name, avatar_url)
    `)
    .single()

  if (error) throw error

  const { comms_user_profiles, ...rest } = data as any
  return {
    ...rest,
    user_profile: comms_user_profiles
      ? {
          display_name: comms_user_profiles.display_name,
          avatar_url: comms_user_profiles.avatar_url,
        }
      : undefined,
  } as Message
}

/**
 * Soft-deletes a message.
 */
export async function softDeleteMessage(messageId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('comms_messages')
    .update({
      is_deleted: true,
      content: '[deleted]',
    })
    .eq('id', messageId)

  if (error) throw error
}

/**
 * Updates or inserts a read receipt for the current user in a given channel.
 */
export async function updateReadReceipt(channelId: string): Promise<void> {
  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return

  const { error } = await supabase.from('comms_read_receipts').upsert(
    {
      user_id: user.id,
      channel_id: channelId,
      last_read: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,channel_id',
    }
  )

  if (error) console.error('Failed to update read receipt:', error)
}
