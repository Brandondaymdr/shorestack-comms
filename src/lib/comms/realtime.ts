import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types/comms'

/**
 * Subscribes to new messages in a channel via Supabase Realtime.
 */
export function subscribeToChannel(
  channelId: string,
  onMessage: (message: Message) => void
): () => void {
  const supabase = createClient()

  const channel = supabase
    .channel(`comms:channel:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'comms_messages',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        const message = payload.new as Message
        onMessage(message)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Subscribes to reaction changes via Supabase Realtime.
 */
export function subscribeToReactions(
  channelId: string,
  onReaction: (payload: any) => void
): () => void {
  const supabase = createClient()

  const channel = supabase
    .channel(`comms:reactions:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comms_reactions',
      },
      (payload) => {
        onReaction(payload)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
