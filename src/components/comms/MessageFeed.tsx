'use client'

import { useEffect, useRef, useState } from 'react'
import { subscribeToChannel } from '@/lib/comms/realtime'
import { updateReadReceipt, getMessageWithProfile } from '@/lib/comms/messages'
import { formatMessageDate } from '@/lib/utils/timestamps'
import MessageItem from './MessageItem'
import type { Message } from '@/types/comms'

export default function MessageFeed({
  channelId,
  initialMessages,
}: {
  channelId: string
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Scroll to bottom on mount
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  // Update read receipt on mount and channel change
  useEffect(() => {
    updateReadReceipt(channelId)
  }, [channelId])

  // Reset messages when channel changes
  useEffect(() => {
    setMessages(initialMessages)
  }, [channelId, initialMessages])

  // Subscribe to realtime updates
  useEffect(() => {
    const unsubscribe = subscribeToChannel(channelId, async (rawMessage: Message) => {
      // Enrich the realtime message with user profile
      const enriched = await getMessageWithProfile(rawMessage.id)
      const messageToAdd = enriched || rawMessage

      setMessages((prev) => {
        // Avoid duplicates (sendMessage already adds locally)
        if (prev.some((m) => m.id === messageToAdd.id)) return prev
        return [...prev, messageToAdd]
      })
      setTimeout(() => scrollToBottom(), 50)
    })

    return unsubscribe
  }, [channelId])

  // Group messages by date
  const groupedMessages: Array<{ date: string; messages: Message[] }> = []

  messages.forEach((msg) => {
    const date = formatMessageDate(msg.created_at)
    const lastGroup = groupedMessages[groupedMessages.length - 1]

    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(msg)
    } else {
      groupedMessages.push({ date, messages: [msg] })
    }
  })

  return (
    <div className="flex flex-col gap-2 px-6 py-4">
      {groupedMessages.length === 0 && (
        <div className="flex-1 flex items-center justify-center py-20">
          <p className="text-driftwood/50 font-mono text-sm">No messages yet. Start the conversation.</p>
        </div>
      )}

      {groupedMessages.map((group, groupIdx) => (
        <div key={`group-${groupIdx}`} className="flex flex-col gap-1">
          {/* Date Separator */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-driftwood/10" />
            <span className="text-xs font-mono text-driftwood/50">{group.date}</span>
            <div className="flex-1 h-px bg-driftwood/10" />
          </div>

          {/* Messages for this date */}
          {group.messages.map((msg, idx) => {
            const prevMsg = idx > 0 ? group.messages[idx - 1] : null
            const showAuthor =
              !prevMsg ||
              prevMsg.user_id !== msg.user_id ||
              (new Date(msg.created_at).getTime() -
                new Date(prevMsg.created_at).getTime()) >
                5 * 60 * 1000

            return (
              <MessageItem
                key={msg.id}
                message={msg}
                showAuthor={showAuthor}
              />
            )
          })}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
