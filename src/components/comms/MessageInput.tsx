'use client'

import { useRef, useState } from 'react'
import { sendMessage } from '@/lib/comms/messages'
import Button from '@/components/ui/Button'

interface MessageInputProps {
  channelId: string
  channelName: string
}

export default function MessageInput({
  channelId,
  channelName,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = async () => {
    if (!content.trim() || isSending) return

    setIsSending(true)
    try {
      await sendMessage(channelId, content.trim())
      setContent('')

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)

    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    const newHeight = Math.min(textarea.scrollHeight, 5 * 24) // 5 rows max
    textarea.style.height = `${newHeight}px`
  }

  return (
    <div className="border-t border-driftwood/20 bg-white px-6 py-3">
      <div className="flex gap-2 items-end">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName}...`}
          className="flex-1 bg-transparent text-deep-slate text-sm resize-none outline-none placeholder-driftwood/40 font-sans max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-driftwood/30 scrollbar-track-transparent"
          rows={1}
          disabled={isSending}
        />

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!content.trim() || isSending}
          variant="primary"
          size="sm"
          className="flex-shrink-0"
        >
          {isSending ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  )
}
