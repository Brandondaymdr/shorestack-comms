import React from 'react'

export interface AvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
}

export default function Avatar({ name, avatarUrl, size = 'md' }: AvatarProps) {
  const sizeClass = sizeMap[size]
  const initials = name.charAt(0).toUpperCase()

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover flex-shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-deep-ocean text-shore-sand flex items-center justify-center font-mono font-bold flex-shrink-0`}
    >
      {initials}
    </div>
  )
}
